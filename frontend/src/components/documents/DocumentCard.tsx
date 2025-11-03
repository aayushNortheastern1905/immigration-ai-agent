import React from 'react';
import { FileText, Calendar, CheckCircle2, AlertCircle, Loader2, Eye, Trash2 } from 'lucide-react';
import { Document } from '../../services/documentService';

interface DocumentCardProps {
  document: Document;
  onView?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
}) => {
  // Status configurations
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Processed',
          bg: 'bg-green-50',
          textColor: 'text-green-700',
          border: 'border-green-200',
          iconColor: 'text-green-600',
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Processing',
          bg: 'bg-blue-50',
          textColor: 'text-blue-700',
          border: 'border-blue-200',
          iconColor: 'text-blue-600',
        };
      case 'needs_verification':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Needs Review',
          bg: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          border: 'border-yellow-200',
          iconColor: 'text-yellow-600',
        };
      case 'failed':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Failed',
          bg: 'bg-red-50',
          textColor: 'text-red-700',
          border: 'border-red-200',
          iconColor: 'text-red-600',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4" />,
          text: 'Uploaded',
          bg: 'bg-slate-50',
          textColor: 'text-slate-700',
          border: 'border-slate-200',
          iconColor: 'text-slate-600',
        };
    }
  };

  const statusConfig = getStatusConfig(document.status);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get document type label
  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'i20': 'I-20 Form',
      'i797': 'I-797 Notice',
      'ead': 'EAD Card',
      'passport': 'Passport',
    };
    return labels[type] || 'Document';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Document Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
              {document.file_name}
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {getDocTypeLabel(document.document_type)}
            </p>

            {/* Status & Date */}
            <div className="flex flex-wrap items-center gap-3">
              <span className={`
                inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border
                ${statusConfig.bg} ${statusConfig.textColor} ${statusConfig.border}
              `}>
                {statusConfig.icon}
                {statusConfig.text}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(document.uploaded_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Data Preview (if available) */}
      {document.status === 'completed' && document.extracted_data && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Name:</span>
              <span className="ml-2 font-medium text-slate-900">
                {document.extracted_data.full_name.value}
              </span>
            </div>
            <div>
              <span className="text-slate-500">SEVIS:</span>
              <span className="ml-2 font-medium text-slate-900">
                {document.extracted_data.sevis_id.value}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {document.status === 'completed' && onView && (
          <button
            onClick={() => onView(document.document_id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
        
        {document.status === 'needs_verification' && onView && (
          <button
            onClick={() => onView(document.document_id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-200 transition-all"
          >
            <AlertCircle className="w-4 h-4" />
            Review Now
          </button>
        )}

        {document.status === 'failed' && (
          <button className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-colors">
            Retry Upload
          </button>
        )}

        {onDelete && document.status !== 'processing' && (
          <button
            onClick={() => onDelete(document.document_id)}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;