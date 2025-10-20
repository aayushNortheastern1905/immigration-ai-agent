import React, { useState, useEffect } from 'react';
import { ArrowRight, FileText, Calendar, Upload, CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react';

// ============================================
// TYPEWRITER EFFECT HOOK
// ============================================
const useTypewriter = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
};

// ============================================
// ANIMATED COUNTER
// ============================================
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count}</span>;
};

// ============================================
// FLOATING SHAPES BACKGROUND
// ============================================
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float-slow"></div>
    </div>
  );
};

// ============================================
// 3D CARD COMPONENT
// ============================================
interface Card3DProps {
  children: React.ReactNode;
  delay?: number;
}

const Card3D: React.FC<Card3DProps> = ({ children, delay = 0 }) => {
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`);
  };

  const handleMouseLeave = () => {
    setTransform('');
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: transform ? 'none' : 'transform 0.5s ease',
      }}
      className="opacity-0 animate-fade-in-up"
      data-delay={delay}
    >
      {children}
    </div>
  );
};

// ============================================
// MAIN LANDING PAGE
// ============================================
const LandingPage = () => {
  const typewriterText = useTypewriter('Never Miss an Immigration Deadline', 80);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    window.location.href = '/signup';
  };

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white overflow-hidden">
      <FloatingShapes />
      
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocuPal
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSignIn}
              className="px-6 py-2 text-white hover:text-blue-400 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm text-blue-400 rounded-full text-sm font-medium border border-blue-500/30 mb-8">
            ✨ AI-Powered Immigration Assistant
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          <span className="block mb-2">{typewriterText}</span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            With AI Automation
          </span>
          <span className="inline-block w-1 h-20 bg-blue-500 ml-2 animate-blink"></span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto opacity-0 animate-fade-in-delayed">
          Automate your F-1, OPT, and H-1B visa paperwork with AI. Get policy updates, 
          document processing, and deadline reminders—all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 opacity-0 animate-fade-in-delayed-more">
          <button
            onClick={handleGetStarted}
            className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20">
            Watch Demo
          </button>
        </div>

        {/* Trust Badge with Animation */}
        <div className="flex items-center justify-center gap-8 text-gray-400 text-sm opacity-0 animate-fade-in-delayed-most">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Trusted by <AnimatedCounter end={1000} />+ students</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span><AnimatedCounter end={50} />+ universities</span>
          </div>
        </div>
      </section>

      {/* Features Section with 3D Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              navigate immigration
            </span>
          </h2>
          <p className="text-xl text-gray-400">
            AI-powered tools that work 24/7 so you don't have to
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card3D delay={0}>
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all h-full group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                Real-Time Policy Updates
              </h3>
              <p className="text-gray-400 leading-relaxed">
                AI monitors USCIS daily and alerts you about policy changes that affect your visa status. 
                Never miss a critical update again.
              </p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card3D>

          {/* Feature 2 */}
          <Card3D delay={200}>
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 transition-all h-full group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                Smart Document Processing
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Upload your I-20 or EAD card. AI extracts all data automatically—no manual typing. 
                Processing takes seconds, not hours.
              </p>
              <div className="mt-6 flex items-center gap-2 text-purple-400 font-semibold group-hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card3D>

          {/* Feature 3 */}
          <Card3D delay={400}>
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-pink-500/50 transition-all h-full group">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-pink-400 transition-colors">
                Deadline Management
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Never miss OPT application windows or visa extensions. Get timely reminders with 
                action items tailored to your visa type.
              </p>
              <div className="mt-6 flex items-center gap-2 text-pink-400 font-semibold group-hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Card3D>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Get started in
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> 3 simple steps</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-bold mb-3">Sign Up</h3>
            <p className="text-gray-400">
              Create your account in 30 seconds. Tell us your visa type and we'll customize everything for you.
            </p>
          </div>

          <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-bold mb-3">Upload Documents</h3>
            <p className="text-gray-400">
              Drop your I-20, EAD, or passport. Our AI extracts everything automatically—no typing needed.
            </p>
          </div>

          <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
            <p className="text-gray-400">
              Relax. We'll monitor policies 24/7 and remind you about deadlines. Focus on what matters.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                <AnimatedCounter end={98} />%
              </div>
              <div className="text-gray-400">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                <AnimatedCounter end={10} />hrs
              </div>
              <div className="text-gray-400">Time Saved Per User</div>
            </div>
            <div>
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-2">
                <AnimatedCounter end={24} />/7
              </div>
              <div className="text-gray-400">Policy Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-3xl border border-white/10 p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to simplify your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              immigration journey?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of international students who trust DocuPal
          </p>
          <button
            onClick={handleGetStarted}
            className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
          >
            Get Started Free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-gray-400">
        <p>© 2025 DocuPal. Built with ❤️ for international students.</p>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-up 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delayed-more {
          animation: fade-in-up 0.8s ease-out 1s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delayed-most {
          animation: fade-in-up 0.8s ease-out 1.5s forwards;
          opacity: 0;
        }
        
        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;