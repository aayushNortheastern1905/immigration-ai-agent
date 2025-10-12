import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navbar */}
      <nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-white">
          Immigration<span className="text-blue-400">AI</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-white hover:text-blue-400 transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/50"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mb-6">
          <span className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
            AI-Powered Immigration Assistant
          </span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Never Miss an
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Immigration Deadline
          </span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Automate your F-1, OPT, and H-1B visa paperwork with AI. 
          Get policy updates, document processing, and deadline reminders—all in one place.
        </p>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
          >
            Get Started Free →
          </button>
          <button 
            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
          >
            Watch Demo
          </button>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-gray-400 text-sm">
          Trusted by international students at 50+ universities
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-Time Policy Updates</h3>
            <p className="text-gray-400">
              AI monitors USCIS daily and alerts you about policy changes that affect your visa status.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Document Processing</h3>
            <p className="text-gray-400">
              Upload your I-20 or EAD card. AI extracts all data automatically—no manual typing.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-pink-500/50 transition-all hover:shadow-lg hover:shadow-pink-500/10">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Deadline Management</h3>
            <p className="text-gray-400">
              Never miss OPT application windows or visa extensions. Get timely reminders and action items.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm p-12 rounded-3xl border border-blue-500/20">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to simplify your immigration journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of international students who trust ImmigrationAI
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
          >
            Get Started Free →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400">
        <p>© 2025 ImmigrationAI. Built with ❤️ for international students.</p>
      </footer>
    </div>
  );
};

export default Landing;