import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{sent ? '📧' : '🔑'}</div>
        <h1 className="text-2xl font-bold text-white">{sent ? 'Check Your Email' : 'Forgot Password'}</h1>
        <p className="text-gray-500 text-sm mt-2">
          {sent ? `We've sent a reset link to ${email}` : 'Enter your email to receive a password reset link'}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Email Address" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" fullWidth loading={loading} className="h-12">
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/20 text-cyber-green text-sm text-center">
            ✓ Password reset email sent successfully
          </div>
          <Button onClick={() => setSent(false)} variant="outline" fullWidth>Send Again</Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-gray-500 hover:text-cyber-cyan text-sm transition-colors">← Back to Login</Link>
      </div>
    </div>
  );
}
