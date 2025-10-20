import React, { useState } from 'react';
import { Mail, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://9uqxq6pvjj.execute-api.us-east-1.amazonaws.com/Prod';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    visa_type: 'F-1'
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasMinLength: false,
  });

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordStrength({
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordStrength).every(v => v === true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid()) {
      setError('Password does not meet requirements');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl" style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-3xl font-bold cursor-pointer" onClick={() => window.location.href = '/'}>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DocuPal
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Create your account
            </h1>
            <p className="text-slate-600 text-lg">
              Start automating your immigration paperwork today
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Full Name */}
            <div className="transform transition-all hover:scale-[1.01]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div className="transform transition-all hover:scale-[1.01]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="transform transition-all hover:scale-[1.01]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Create a strong password"
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className={passwordStrength.hasMinLength ? 'text-green-600' : 'text-slate-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength.hasUppercase ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-slate-500'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength.hasLowercase ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className={passwordStrength.hasLowercase ? 'text-green-600' : 'text-slate-500'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                    <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-slate-500'}>
                      One number
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Visa Type */}
            <div className="transform transition-all hover:scale-[1.01]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Visa Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.visa_type}
                onChange={(e) => setFormData({ ...formData, visa_type: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="F-1">F-1 Student</option>
                <option value="OPT">OPT (Optional Practical Training)</option>
                <option value="H-1B">H-1B Work Visa</option>
                <option value="L-1">L-1 Intracompany Transfer</option>
                <option value="O-1">O-1 Extraordinary Ability</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !isPasswordValid()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <span 
                onClick={() => window.location.href = '/login'}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors cursor-pointer"
              >
                Sign in
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Gradient Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite 2s' }}></div>
        </div>

        <div className="max-w-md text-white relative z-10">
          <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30 mb-8">
            🚀 Join 1000+ International Students
          </div>

          <h2 className="text-5xl font-bold mb-6">
            Your immigration journey starts here
          </h2>
          
          <p className="text-xl text-blue-100 mb-10">
            Automate your immigration paperwork and never miss a deadline again with AI-powered assistance.
          </p>

          {/* Feature List */}
          <div className="space-y-5">
            <div className="flex items-start gap-4 group">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mt-1 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-time policy updates</h3>
                <p className="text-blue-100 text-sm">Stay informed about immigration changes 24/7</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mt-1 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Smart document processing</h3>
                <p className="text-blue-100 text-sm">AI extracts data from your documents instantly</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mt-1 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Never miss deadlines</h3>
                <p className="text-blue-100 text-sm">Automated reminders for critical dates</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl font-bold mb-1">50+</div>
              <div className="text-sm text-blue-100">Universities</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl font-bold mb-1">24/7</div>
              <div className="text-sm text-blue-100">Monitoring</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl font-bold mb-1">98%</div>
              <div className="text-sm text-blue-100">Accuracy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
              <div className="text-4xl font-bold mb-1">0</div>
              <div className="text-sm text-blue-100">Missed Deadlines</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Signup;