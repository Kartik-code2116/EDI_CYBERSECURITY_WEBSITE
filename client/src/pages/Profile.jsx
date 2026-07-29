import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../services/reportService';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, icon, children }) => (
  <div className="glass-card p-6 space-y-5">
    <h3 className="text-white font-semibold flex items-center gap-2 text-lg border-b border-white/5 pb-4">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: '', email: '', darkMode: true, notifications: { email: true, browser: true } });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProfile().then(res => {
      const u = res.data.user;
      setProfile({ name: u.name, email: u.email, darkMode: u.darkMode, notifications: u.notifications });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({ name: profile.name, darkMode: profile.darkMode, notifications: profile.notifications });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    setChangingPass(true);
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">👤 <span className="text-gradient-cyber">Profile</span></h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <div className="glass-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #7c3aed)' }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-lg">{profile.name || user?.name}</p>
          <p className="text-gray-500 text-sm">{profile.email || user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit Profile */}
      <Section title="Edit Profile" icon="✏️">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Full Name" value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
          <Input label="Email Address" value={profile.email} disabled
            className="opacity-50 cursor-not-allowed" />
          <Button type="submit" loading={saving}>💾 Save Changes</Button>
        </form>
      </Section>

      {/* Settings */}
      <Section title="Preferences" icon="⚙️">
        <div className="space-y-4">
          {[
            { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark cybersecurity theme' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
              <div onClick={() => setProfile({ ...profile, [key]: !profile[key] })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${profile[key] ? 'bg-cyber-cyan' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile[key] ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>
          ))}
          <div className="pt-2">
            <p className="text-white text-sm font-medium mb-3">Notifications</p>
            {[
              { key: 'email', label: 'Email Notifications' },
              { key: 'browser', label: 'Browser Notifications' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer mb-3">
                <p className="text-gray-400 text-sm">{label}</p>
                <div onClick={() => setProfile({ ...profile, notifications: { ...profile.notifications, [key]: !profile.notifications[key] } })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${profile.notifications[key] ? 'bg-cyber-cyan' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${profile.notifications[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </label>
            ))}
          </div>
          <Button onClick={handleSave} loading={saving} size="sm">Save Preferences</Button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon="🔒">
        <form onSubmit={handleChangePass} className="space-y-4">
          <Input label="Current Password" type="password" value={passwords.currentPassword}
            onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} placeholder="••••••••" />
          <Input label="New Password" type="password" value={passwords.newPassword}
            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="Min. 8 characters" />
          <Input label="Confirm New Password" type="password" value={passwords.confirm}
            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Repeat new password" />
          <Button type="submit" loading={changingPass} variant="outline">🔐 Change Password</Button>
        </form>
      </Section>

      {/* Danger Zone */}
      <div className="glass-card p-6 border border-cyber-red/20">
        <h3 className="text-cyber-red font-semibold flex items-center gap-2 mb-3">⚠️ Danger Zone</h3>
        <p className="text-gray-500 text-sm mb-4">Once you delete your account, all data is permanently removed.</p>
        <Button onClick={handleDelete} loading={deleting} variant="danger">🗑️ Delete Account</Button>
      </div>
    </div>
  );
}
