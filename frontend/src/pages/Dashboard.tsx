import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, FileText, Calendar, Upload, Filter, ChevronDown, ChevronUp, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://xzxx5l4658.execute-api.us-east-1.amazonaws.com/Prod';

interface UserData {
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
  const [user, setUser] = useState<UserData | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  const [selectedVisaType, setSelectedVisaType] = useState<string>('All');
  const [selectedImpact, setSelectedImpact] = useState<string>('All');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const firstLogin = localStorage.getItem('is_first_login');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsFirstLogin(firstLogin === 'true');
      fetchPolicies(parsedUser.visa_type);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedVisaType, selectedImpact, policies]);

  const fetchPolicies = async (visaType: string) => {
    try {
      const response = await fetch(`${API_URL}/api/policies?visa_type=${visaType}&limit=20`);
      const data = await response.json();
      
      if (data.success && data.data.policies) {
        setPolicies(data.data.policies);
        setFilteredPolicies(data.data.policies);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...policies];
    
    if (selectedVisaType !== 'All') {
      filtered = filtered.filter(p => 
        p.affected_visas.some(v => v.toLowerCase().includes(selectedVisaType.toLowerCase()))
      );
    }
    
    if (selectedImpact !== 'All') {
      filtered = filtered.filter(p => 
        p.impact_level.toLowerCase() === selectedImpact.toLowerCase()
      );
    }
    
    setFilteredPolicies(filtered);
  };

  const toggleCard = (policyId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedCards(newExpanded);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('is_first_login');
    navigate('/login');
  };

  const getImpactStyles = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower === 'high') {
      return {
        badge: 'bg-red-50 text-red-700 border-red-200',
        icon: <AlertCircle className="w-4 h-4" />
      };
    } else if (levelLower === 'medium') {
      return {
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: <TrendingUp className="w-4 h-4" />
      };
    } else {
      return {
        badge: 'bg-green-50 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-4 h-4" />
      };
    }
  };

  const visaTypes = ['All', 'F-1', 'OPT', 'H-1B'];
  const impactLevels = ['All', 'High', 'Medium', 'Low'];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-12">
              <div className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/dashboard')}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocuPal
                </span>
              </div>
              <div className="hidden md:flex gap-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
                >
                  Dashboard
                </button>
                <button className="text-slate-600 hover:text-blue-600 transition-colors">
                  Policies
                </button>
                <button 
                  onClick={() => navigate('/documents')}
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Documents
                </button>
                <button className="text-slate-600 hover:text-blue-600 transition-colors">
                  Forms
                </button>
                <button className="text-slate-600 hover:text-blue-600 transition-colors">
                  Deadlines
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-2 rounded-xl transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.full_name.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-500">{user.visa_type}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5 text-slate-600 hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          {isFirstLogin ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white">
              <div className="relative z-10">
                <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                  ✨ Welcome to DocuPal
                </div>
                <h1 className="text-5xl font-bold mb-4">
                  Hey {user.full_name}! 👋
                </h1>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                  We're monitoring immigration policies 24/7 so you never miss a critical update.
                  Let's get started!
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/documents')}
                    className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-2xl hover:shadow-white/20 transition-all transform hover:scale-105"
                  >
                    Upload Your I-20
                  </button>
                  <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30">
                    Take a Tour
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">
                Welcome back, {user.full_name}! 👋
              </h1>
              <p className="text-lg text-slate-600">
                Here's what's new in your immigration journey
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                +3 new
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{policies.length}</div>
            <div className="text-sm text-slate-600">Policy Updates</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                1 urgent
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">2</div>
            <div className="text-sm text-slate-600">Upcoming Deadlines</div>
          </div>

          <div 
            onClick={() => {
              console.log('DOCUMENTS CLICKED!');
              navigate('/documents');
            }}
            className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Upload Now →
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">0</div>
            <div className="text-sm text-slate-600">Documents</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                Ready
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">0</div>
            <div className="text-sm text-slate-600">Forms Generated</div>
          </div>
        </div>

        {/* Policy Updates Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                📰 Recent Policy Updates
              </h2>
              <p className="text-slate-600">
                Stay informed about immigration changes that affect you
              </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
              View All
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Filter by:</span>
            </div>
            
            <div className="flex gap-2">
              {visaTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedVisaType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedVisaType === type
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex gap-2">
              {impactLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedImpact(level)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedImpact === level
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-medium">Loading policies...</p>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No policies found</h3>
              <p className="text-slate-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPolicies.map((policy) => {
                const isExpanded = expandedCards.has(policy.policy_id);
                const impactStyles = getImpactStyles(policy.impact_level);
                
                return (
                  <div
                    key={policy.policy_id}
                    className="border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${impactStyles.badge}`}>
                            {impactStyles.icon}
                            {policy.impact_level} Impact
                          </span>
                          <div className="flex gap-2">
                            {policy.affected_visas.map((visa) => (
                              <span
                                key={visa}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                              >
                                {visa}
                              </span>
                            ))}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {policy.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-4">
                      {isExpanded ? policy.summary : `${policy.summary.slice(0, 150)}...`}
                    </p>

                    {isExpanded && policy.action_items && policy.action_items.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-slate-900">Action Items:</span>
                        </div>
                        <ul className="space-y-3">
                          {policy.action_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                              <span className="text-slate-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(policy.published_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleCard(policy.policy_id)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50 rounded-lg transition-all"
                      >
                        {isExpanded ? (
                          <>
                            Show Less
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Read More
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;