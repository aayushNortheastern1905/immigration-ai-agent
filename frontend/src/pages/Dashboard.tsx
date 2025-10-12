import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

interface User {
  user_id: string;
  email: string;
  full_name: string;
  visa_type: string;
  login_count: number;
}

interface Policy {
  policy_id: string;
  title: string;
  summary: string;
  impact_level: string;
  affected_visas: string[];
  published_date: string;
  action_items?: string[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    const firstLogin = localStorage.getItem('is_first_login');
    
    if (userData) {
      setUser(JSON.parse(userData));
      setIsFirstLogin(firstLogin === 'true');
    }

    // Fetch policies
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user: User = JSON.parse(userData);
      const response = await fetch(
        `${API_URL}/api/policies?visa_type=${user.visa_type}&limit=10`
      );
      
      const data = await response.json();
      
      if (data.success && data.data.policies) {
        setPolicies(data.data.policies);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('is_first_login');
    navigate('/login');
  };

  const getImpactColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-slate-900">
              Immigration<span className="text-blue-600">AI</span>
            </div>
            <div className="hidden md:flex gap-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Documents
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Deadlines
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Forms
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
              <div className="text-xs text-gray-500">{user.visa_type}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          {isFirstLogin ? (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl">
              <h1 className="text-3xl font-bold mb-2">Welcome, {user.full_name}! 👋</h1>
              <p className="text-blue-100 text-lg">
                Great to have you here! We're monitoring immigration policies 24/7 to keep you informed.
              </p>
              <div className="mt-6 flex gap-4">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all">
                  Upload Your Documents
                </button>
                <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all">
                  Take a Tour
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.full_name}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's new since your last visit
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-600 mb-1">Policy Updates</div>
            <div className="text-3xl font-bold text-gray-900">{policies.length}</div>
            <div className="text-xs text-green-600 mt-2">↑ 3 new this week</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-600 mb-1">Upcoming Deadlines</div>
            <div className="text-3xl font-bold text-gray-900">2</div>
            <div className="text-xs text-yellow-600 mt-2">⚠️ 1 urgent</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-600 mb-1">Documents Uploaded</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-xs text-blue-600 mt-2">📄 Upload your I-20</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-600 mb-1">Forms Generated</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 mt-2">Ready when you are</div>
          </div>
        </div>

        {/* Policy Updates Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📰 Recent Immigration Policy Updates
            </h2>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading policy updates...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No policy updates available yet.</p>
              <p className="text-sm mt-2">We'll notify you when new policies are published.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.policy_id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {policy.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImpactColor(policy.impact_level)}`}>
                      {policy.impact_level} Impact
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    {policy.summary}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(policy.published_date).toLocaleDateString()}</span>
                      <span>
                        🎫 {policy.affected_visas.join(', ')}
                      </span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      Read More →
                    </button>
                  </div>

                  {policy.action_items && policy.action_items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Action Items:
                      </div>
                      <ul className="space-y-1">
                        {policy.action_items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;