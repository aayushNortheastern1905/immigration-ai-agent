import React from 'react';
import { Loader2, Upload, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface ProcessingStatusProps {
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'needs_verification';
  progress?: number;
  message?: string;
  fileName?: string;
}

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  showProgress: boolean;
  bgGradient: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  progress = 0,
  message,
  fileName,
}) => {
  const statusConfig: Record<string, StatusConfig> = {
    uploading: {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: 'Uploading to secure storage...',
      color: 'blue',
      showProgress: true,
      bgGradient: 'from-blue-500 to-purple-500',
    },
    processing: {
      icon: <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />,
      title: 'AI is processing your document...',
      subtitle: 'Extracting data with OCR and analyzing content',
      color: 'purple',
      showProgress: false,
      bgGradient: 'from-purple-500 to-pink-500',
    },
    completed: {
      icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
      title: 'Processing complete!',
      subtitle: 'Your document has been analyzed successfully',
      color: 'green',
      showProgress: false,
      bgGradient: 'from-green-500 to-emerald-500',
    },
    needs_verification: {
      icon: <CheckCircle2 className="w-8 h-8 text-yellow-600" />,
      title: 'Review needed',
      subtitle: 'Some fields need your verification',
      color: 'yellow',
      showProgress: false,
      bgGradient: 'from-yellow-500 to-orange-500',
    },
    failed: {
      icon: <XCircle className="w-8 h-8 text-red-600" />,
      title: 'Processing failed',
      subtitle: message || 'Unable to process document. Please try again.',
      color: 'red',
      showProgress: false,
      bgGradient: 'from-red-500 to-pink-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8">
      {/* Animated background gradient */}
      <div className="relative overflow-hidden mb-6">
        <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGradient} opacity-5 blur-xl`}></div>
        
        {/* Icon Container */}
        <div className="relative flex justify-center">
          <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center
            bg-gradient-to-br from-${config.color}-100 to-${config.color}-50
            ${status === 'processing' ? 'animate-pulse' : ''}
          `}>
            {status === 'processing' ? (
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            ) : (
              config.icon
            )}
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {config.title}
        </h3>
        {config.subtitle && (
          <p className="text-sm text-slate-600">
            {config.subtitle}
          </p>
        )}
        {fileName && (
          <p className="text-xs text-slate-500 font-medium mt-2">
            {fileName}
          </p>
        )}
      </div>

      {/* Upload Progress Bar */}
      {config.showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Upload Progress</span>
            <span className="font-semibold text-blue-600">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Processing Animation */}
      {status === 'processing' && (
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}

      {/* Processing Steps */}
      {status === 'processing' && (
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>OCR text extraction</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <span>AI data analysis</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
            <span>Validation and confidence scoring</span>
          </div>
        </div>
      )}

      {/* Retry Button */}
      {status === 'failed' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Success Checkmark */}
      {status === 'completed' && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Ready to review
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;