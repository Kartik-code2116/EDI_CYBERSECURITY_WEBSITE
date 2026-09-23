import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) { setError('Email is required.'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      // Always show a generic message — never reveal if the email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8">
      <div className="text-center mb-8">
        <motion.div
          className="text-5xl mb-4"
          animate={{ scale: sent ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          {sent ? '📧' : '🔑'}
        </motion.div>
        <h1 className="text-2xl font-bold text-white">
          {sent ? 'Check Your Email' : 'Forgot Password?'}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {sent
            ? `If an account exists for ${email}, we've sent a reset link to that address.`
            : `Enter your account email and we'll send you a reset link.`}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            error={error}
            autoComplete="email"
          />
          <Button type="submit" fullWidth loading={loading} className="h-12">
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/20 text-cyber-green text-sm text-center">
            ✓ If that email is registered, a reset link is on its way.
          </div>
          <p className="text-gray-500 text-xs text-center">
            Didn't receive it? Check your spam folder or{' '}
            <button
              onClick={() => setSent(false)}
              className="text-cyber-cyan hover:text-cyan-300 transition-colors underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-gray-500 hover:text-cyber-cyan text-sm transition-colors">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}
