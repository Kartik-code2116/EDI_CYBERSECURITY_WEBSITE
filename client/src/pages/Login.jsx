import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🛡️`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div className="text-5xl mb-4" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>🛡️</motion.div>
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to your security dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
          rightIcon={
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="text-gray-400 hover:text-cyber-cyan transition-colors text-xs font-medium">
              {showPass ? 'HIDE' : 'SHOW'}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-cyber-cyan hover:text-cyan-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading} className="h-12 text-base">
          🔐 Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyber-cyan hover:text-cyan-300 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </div>

      {/* Demo credentials */}
      <div className="mt-6 p-3 rounded-xl border border-cyber-cyan/10 bg-cyber-cyan/5">
        <p className="text-gray-500 text-xs text-center">Demo: admin@cybershield.ai / Admin123!</p>
      </div>
    </div>
  );
}
