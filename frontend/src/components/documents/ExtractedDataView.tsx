import React, { useState } from 'react';
import { Edit2, Save, X, User, Hash, Calendar, GraduationCap, Building2, CheckCircle2 } from 'lucide-react';
import ConfidenceIndicator from './ConfidenceIndicator';
import { ExtractedData, ExtractedField } from '../../services/documentService';

interface ExtractedDataViewProps {
  data: ExtractedData;
  onSave?: (corrections: Partial<Record<keyof ExtractedData, string>>) => void;
  isEditable?: boolean;
  showConfidence?: boolean;
}

const ExtractedDataView: React.FC<ExtractedDataViewProps> = ({
  data,
  onSave,
  isEditable = true,
  showConfidence = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Check if any field needs verification (confidence < 0.70)
  const needsVerification = Object.values(data).some(
    (field: ExtractedField) => field.confidence < 0.70
  );

  // Field configurations
  const fields = [
    {
      key: 'full_name' as keyof ExtractedData,
      label: 'Full Name',
      icon: <User className="w-5 h-5 text-slate-500" />,
      placeholder: 'John Doe',
    },
    {
      key: 'sevis_id' as keyof ExtractedData,
      label: 'SEVIS ID',
      icon: <Hash className="w-5 h-5 text-slate-500" />,
      placeholder: 'N0012345678',
    },
    {
      key: 'program_end_date' as keyof ExtractedData,
      label: 'Program End Date',
      icon: <Calendar className="w-5 h-5 text-slate-500" />,
      placeholder: 'YYYY-MM-DD',
      type: 'date',
    },
    {
      key: 'school_name' as keyof ExtractedData,
      label: 'School/University',
      icon: <Building2 className="w-5 h-5 text-slate-500" />,
      placeholder: 'Northeastern University',
    },
    {
      key: 'degree_level' as keyof ExtractedData,
      label: 'Degree Level',
      icon: <GraduationCap className="w-5 h-5 text-slate-500" />,
      placeholder: "Master's",
    },
  ];

  const handleEdit = () => {
    setIsEditing(true);
    const initial: Record<string, string> = {};
    Object.keys(data).forEach(key => {
      initial[key] = data[key as keyof ExtractedData].value;
    });
    setEditedData(initial);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaveLoading(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              📊 Extracted Information
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              AI-powered data extraction from your document
            </p>
          </div>
          {isEditable && !isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Verification Alert */}
      {needsVerification && !isEditing && (
        <div className="mx-6 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">
            ⚠️
          </div>
          <div className="flex-1">
            <p className="font-semibold text-yellow-800 text-sm">
              Some fields need verification
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              AI confidence is low for some fields. Please review and correct if needed.
            </p>
          </div>
        </div>
      )}

      {/* Data Fields */}
      <div className="p-6 space-y-4">
        {fields.map((field) => {
          const fieldData = data[field.key];
          if (!fieldData) return null;

          const currentValue = isEditing 
            ? editedData[field.key as string] || fieldData.value 
            : fieldData.value;

          return (
            <div key={field.key as string} className="space-y-2">
              {/* Label with Confidence */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                {showConfidence && !isEditing && (
                  <ConfidenceIndicator 
                    confidence={fieldData.confidence} 
                    showLabel={false}
                    size="sm"
                  />
                )}
              </div>

              {/* Input Field */}
              {isEditing ? (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    {field.icon}
                  </div>
                  <input
                    type={field.type || 'text'}
                    value={currentValue}
                    onChange={(e) => handleFieldChange(field.key as string, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              ) : (
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border
                  ${fieldData.confidence >= 0.90 
                    ? 'bg-green-50 border-green-200' 
                    : fieldData.confidence >= 0.70 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-red-50 border-red-200'
                  }
                `}>
                  <div className="text-slate-400">
                    {field.icon}
                  </div>
                  <span className={`
                    flex-1 font-medium
                    ${fieldData.confidence >= 0.90 
                      ? 'text-slate-900' 
                      : fieldData.confidence >= 0.70 
                      ? 'text-yellow-900' 
                      : 'text-red-900'
                    }
                  `}>
                    {currentValue || 'Not detected'}
                  </span>
                  {fieldData.confidence >= 0.90 && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Mode Actions */}
      {isEditing && (
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saveLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={saveLoading}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {!isEditing && !needsVerification && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                All fields extracted with high confidence
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Data is ready to use for form filling
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractedDataView;