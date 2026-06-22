import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { Modal, Spinner } from '../ui';
import { AlertCircle, Lock, Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommitteeLoginModal({ open, onClose, targetRole }) {
  const navigate = useNavigate();
  const { committeeLogin, loading, user } = useAuthStore();
  
  // modes: 'login', 'forgot_request', 'forgot_reset', 'forgot_success'
  const [mode, setMode] = useState('login');
  
  const [form, setForm] = useState({ username: '', password: '' });
  const [resetForm, setResetForm] = useState({ username: '', otp: '', newPassword: '' });
  
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Clear form on open
  useEffect(() => {
    if (open) {
      setMode('login');
      setForm({ username: '', password: '' });
      setResetForm({ username: '', otp: '', newPassword: '' });
      setError('');
    }
  }, [open]);

  const getTitle = () => {
    if (mode !== 'login') return 'Password Reset';
    if (targetRole === 'imc') return 'IMC Dashboard Login';
    if (targetRole === 'head_management') return 'Management Dashboard Login';
    if (targetRole === 'system_admin') return 'System Office Login';
    return 'Admin Login';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('All fields are required.');
      return;
    }

    const result = await committeeLogin({ ...form, targetRole });
    if (result.success) {
      onClose();
      // Navigate to role-specific portal URL
      if (targetRole === 'imc') navigate('/imc/dashboard');
      else if (targetRole === 'head_management') navigate('/management/dashboard');
      else if (targetRole === 'system_admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!resetForm.username.trim()) {
      setError('Username is required.');
      return;
    }
    
    setIsRequesting(true);
    setError('');
    try {
      await authApi.forgotPassword({ username: resetForm.username, targetRole });
      toast.success('OTP sent to your registered email.');
      setMode('forgot_reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!resetForm.otp.trim() || !resetForm.newPassword.trim()) {
      setError('OTP and new password are required.');
      return;
    }
    
    setIsRequesting(true);
    setError('');
    try {
      await authApi.resetPassword({
        username: resetForm.username,
        targetRole,
        otp: resetForm.otp,
        newPassword: resetForm.newPassword
      });
      setMode('forgot_success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={getTitle()} size="sm">
      {/* ── LOGIN MODE ── */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Lock className="text-slate-600" size={20} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}



          <div>
            <label className="field-label field-required">Shared Username</label>
            <input
              value={form.username}
              onChange={e => { setForm({ ...form, username: e.target.value }); setError(''); }}
              placeholder="Generic Username"
              className="input"
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="field-label field-required">Shared Password</label>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                placeholder="Generic Password"
                className="input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="text-right mt-1">
              <button 
                type="button" 
                onClick={() => { setMode('forgot_request'); setError(''); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn w-full h-11 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm"
            >
              {loading ? <Spinner size={16} className="text-white mr-2" /> : null}
              {loading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </div>
        </form>
      )}

      {/* ── FORGOT PASSWORD: REQUEST OTP ── */}
      {mode === 'forgot_request' && (
        <form onSubmit={handleForgotRequest} className="space-y-4 pt-2">
          <button 
            type="button" 
            onClick={() => setMode('login')}
            className="flex items-center text-xs text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to login
          </button>
          
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail className="text-blue-600" size={20} />
            </div>
          </div>
          
          <p className="text-sm text-center text-slate-600 mb-4">
            Enter your Username. If you have permissions for this role, we will email you an OTP to reset the password.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="field-label field-required">Shared Username</label>
            <input
              value={resetForm.username}
              onChange={e => { setResetForm({ ...resetForm, username: e.target.value }); setError(''); }}
              placeholder="e.g. admin"
              className="input"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isRequesting}
              className="btn w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isRequesting ? <Spinner size={16} className="text-white mr-2" /> : null}
              {isRequesting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        </form>
      )}

      {/* ── FORGOT PASSWORD: RESET USING OTP ── */}
      {mode === 'forgot_reset' && (
        <form onSubmit={handleForgotReset} className="space-y-4 pt-2">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <KeyRound className="text-blue-600" size={20} />
            </div>
          </div>
          
          <p className="text-sm text-center text-slate-600 mb-4">
            Check your email for the 6-digit verification code.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="field-label field-required">6-Digit OTP</label>
            <input
              value={resetForm.otp}
              onChange={e => { setResetForm({ ...resetForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }); setError(''); }}
              placeholder="000000"
              className="input text-center text-lg tracking-[0.25em]"
            />
          </div>

          <div>
            <label className="field-label field-required">New Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={resetForm.newPassword}
                onChange={e => { setResetForm({ ...resetForm, newPassword: e.target.value }); setError(''); }}
                placeholder="Enter new password"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isRequesting}
              className="btn w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isRequesting ? <Spinner size={16} className="text-white mr-2" /> : null}
              {isRequesting ? 'Updating...' : 'Set New Password'}
            </button>
          </div>
        </form>
      )}

      {/* ── FORGOT PASSWORD: SUCCESS ── */}
      {mode === 'forgot_success' && (
        <div className="py-6 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="text-green-500 w-16 h-16" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Password Updated!</h3>
            <p className="text-slate-500 text-sm mt-1">
              Your new role password has been set successfully. You can now log in.
            </p>
          </div>
          <button 
            onClick={() => setMode('login')}
            className="btn w-full bg-slate-100 hover:bg-slate-200 text-slate-800"
          >
            Back to Login
          </button>
        </div>
      )}
    </Modal>
  );
}
