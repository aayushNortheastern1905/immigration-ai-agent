import React, { useState, useCallback } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

interface UploadDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

const UploadDropZone: React.FC<UploadDropZoneProps> = ({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(t => t.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `Only ${accept} files are supported`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelection = useCallback((file: File) => {
    setError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect, accept, maxSizeMB]);

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      {!selectedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center
            transition-all duration-300 cursor-pointer
            ${isDragging
              ? 'border-blue-500 bg-blue-50 scale-105'
              : disabled
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
              : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
            }
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {/* Upload Icon */}
          <div className={`
            w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${isDragging
              ? 'bg-blue-600 scale-110'
              : 'bg-gradient-to-br from-blue-100 to-purple-100'
            }
          `}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-blue-600'}`} />
          </div>

          {/* Text */}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-slate-900">
              {isDragging ? 'Drop your file here' : 'Upload Your I-20 Document'}
            </p>
            <p className="text-sm text-slate-600">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-slate-500 mt-4">
              Supported formats: PDF, JPG, PNG • Max size: {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        /* Selected File Preview */
        <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <File className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-600">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={disabled}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-600 hover:text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">Upload Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDropZone;