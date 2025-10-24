import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://9uqxq6pvjj.execute-api.us-east-1.amazonaws.com/Prod';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Store user data and login info
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('is_first_login', data.data.is_first_login.toString());
      
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl" style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Back Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </button>

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
              Welcome back
            </h1>
            <p className="text-slate-600 text-lg">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Email */}
            <div className="transform transition-all hover:scale-[1.01]">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <span className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Don't have an account?{' '}
              <span 
                onClick={() => window.location.href = '/signup'}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors cursor-pointer"
              >
                Sign up for free
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Gradient with Stats */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite 2s' }}></div>
        </div>

        <div className="max-w-md text-white relative z-10">
          <div className="inline-block px-4 py-2 bg-blue-500/20 rounded-full text-sm font-medium border border-blue-500/30 mb-8">
            Trusted by 1000+ students
          </div>

          <h2 className="text-5xl font-bold mb-6">
            Your immigration journey, simplified
          </h2>
          
          <p className="text-xl text-gray-300 mb-12">
            Get back to what matters. Let AI handle your immigration paperwork.
          </p>
          
          {/* Stats Grid - Bento Style */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-blue-400">50+</div>
              </div>
              <div className="text-sm text-gray-300">Universities</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-purple-400">24/7</div>
              </div>
              <div className="text-sm text-gray-300">Monitoring</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-pink-400">100%</div>
              </div>
              <div className="text-sm text-gray-300">Automated</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-green-400">0</div>
              </div>
              <div className="text-sm text-gray-300">Missed Deadlines</div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <div>
                <p className="text-gray-300 mb-3 italic">
                  "DocuPal saved me 10+ hours on my OPT application. The AI extracted everything from my I-20 instantly!"
                </p>
                <div className="text-sm">
                  <div className="font-semibold">Priya Sharma</div>
                  <div className="text-gray-400">F-1 Student, Northeastern University</div>
                </div>
              </div>
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

export default Login;