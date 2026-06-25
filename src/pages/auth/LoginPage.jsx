import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, ChevronDown, Lock } from 'lucide-react';
import { Spinner } from '../../components/ui';
import CommitteeLoginModal from '../../components/auth/CommitteeLoginModal';

import jphBuildImg from '../../assets/JPHBUILD.webp';
import logoImg from '../../assets/logo.webp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ fullName: '', employeeId: '', dob: '' });
  const [error, setError] = useState('');

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminTargetRole, setAdminTargetRole] = useState('imc');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openAdminLogin = (role) => {
    setAdminTargetRole(role);
    setAdminModalOpen(true);
    setAdminMenuOpen(false);
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.employeeId.trim() || !form.dob) {
      setError('All fields are required.');
      return;
    }
    const result = await login(form);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Split: Hero Image */}
      <div className="hidden lg:flex lg:w-[70%] relative bg-green-900 overflow-hidden">
        <img
          src={jphBuildImg}
          alt="Jaiprakash Hospital Building"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
          <h2 className="text-5xl lg:text-7xl font-bold font-display mb-6 tracking-tight text-white drop-shadow-lg">
            WELCOME TO THE IMS
          </h2>
          <h2 className="text-3xl font-bold font-display mb-2 text-white/90">
            Jaiprakash Hospital & Research Centre
          </h2>
          <p className="text-green-50 text-lg italic">
            Quality Healthcare at Affordable Price
          </p>
        </div>
      </div>

      {/* Right Split: Login Form */}
      <div className="w-full lg:w-[30%] flex flex-col relative bg-white">

        {/* Admin Login Dropdown */}
        <div className="absolute top-6 right-6 z-50">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="text-sm font-semibold text-slate-700 hover:text-green-700 bg-white border border-slate-200 shadow-sm hover:border-green-300 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <Lock size={14} className="text-green-600" />
              Admin Login
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${adminMenuOpen ? 'rotate-180 text-green-600' : ''}`} />
            </button>
            <div className={`absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 transition-all transform origin-top-right ${adminMenuOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
              <div className="p-2 space-y-1">
                <button onClick={() => openAdminLogin('imc')} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors">
                  IMC Portal
                </button>
                <button onClick={() => openAdminLogin('head_management')} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors">
                  Management Portal
                </button>
                <button onClick={() => openAdminLogin('system_admin')} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors">
                  System Office Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Login Area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[420px]">
            {/* Header */}
            <div className="text-center mb-10">
              <img src={logoImg} alt="JPHRC Logo" className="h-20 mx-auto mb-6 drop-shadow-sm" />
              <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">
                EMPLOYEE LOGIN
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Incident Management System
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="As registered in hospital records"
                  className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500'} rounded-xl text-slate-900 outline-none transition-all focus:ring-2 focus:ring-opacity-20`}
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employee ID</label>
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. JPHRC0001"
                  className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500'} rounded-xl text-slate-900 outline-none transition-all focus:ring-2 focus:ring-opacity-20`}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                <div className="relative">
                  <input
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    placeholder="dd-mm-yyyy"
                    className={`w-full px-4 py-3 bg-slate-50 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:border-green-500 focus:ring-green-500'} rounded-xl text-slate-900 outline-none transition-all focus:ring-2 focus:ring-opacity-20`}
                    autoComplete="bday"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner size={18} className="text-white" /> : null}
                {loading ? 'Verifying…' : 'Sign In as Employee'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <CommitteeLoginModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        targetRole={adminTargetRole}
      />
    </div>
  );
}
