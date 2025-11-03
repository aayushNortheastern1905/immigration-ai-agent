import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Upload, FileText, ArrowLeft } from 'lucide-react';
import UploadDropZone from '../components/documents/UploadDropZone';
import ProcessingStatus from '../components/documents/ProcessingStatus';
import ExtractedDataView from '../components/documents/ExtractedDataView';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentService, { Document, DocumentStatus, ExtractedData, ExtractedField } from '../services/documentService';

interface UserData {
  user_id: string;
  email: string;
  full_name: string;
  visa_type: string;
}

type UploadState = 
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; fileName: string }
  | { status: 'processing'; documentId: string; fileName: string }
  | { status: 'success'; documentId: string; data: ExtractedData }
  | { status: 'needs_verification'; documentId: string; data: ExtractedData }
  | { status: 'failed'; error: string };

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      loadDocuments();
    }
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FIXED FUNCTION - Added upload_fields parameter
  // ============================================
  const handleFileSelect = async (file: File) => {
    try {
      setUploadState({ status: 'uploading', progress: 0, fileName: file.name });

      // Step 1: Get presigned upload URL with fields
      const uploadData = await DocumentService.requestUploadUrl(
        file.name,
        file.type,
        'i20'
      );

      console.log('🔍 Got upload data:', uploadData);

      // Step 2: Upload to S3 using presigned POST with fields
      await DocumentService.uploadToS3(
        file, 
        uploadData.upload_url,
        uploadData.upload_fields,  // ← ADDED THIS PARAMETER
        (progress: number) => {
          setUploadState({ status: 'uploading', progress, fileName: file.name });
        }
      );

      console.log('✅ Upload to S3 complete');

      // Step 3: Start polling for processing status
      setUploadState({ 
        status: 'processing', 
        documentId: uploadData.document_id,
        fileName: file.name 
      });

      console.log('🔍 Starting to poll document status...');

      const result = await DocumentService.pollDocumentStatus(uploadData.document_id);

      console.log('🔍 Final processing result:', result);

      // Step 4: Handle result
      if (result.status === 'completed' && result.extracted_data) {
        const needsVerification = Object.values(result.extracted_data).some(
          (field: ExtractedField) => field.confidence < 0.70
        );

        if (needsVerification) {
          setUploadState({
            status: 'needs_verification',
            documentId: uploadData.document_id,
            data: result.extracted_data,
          });
        } else {
          setUploadState({
            status: 'success',
            documentId: uploadData.document_id,
            data: result.extracted_data,
          });
        }
      } else if (result.status === 'failed') {
        setUploadState({
          status: 'failed',
          error: result.error_message || 'Processing failed',
        });
      }

      // Reload documents list
      await loadDocuments();
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      setUploadState({
        status: 'failed',
        error: error.message || 'Upload failed',
      });
    }
  };

  const handleSaveCorrections = async (corrections: Partial<Record<keyof ExtractedData, string>>) => {
    if (uploadState.status !== 'needs_verification' && uploadState.status !== 'success') return;

    try {
      await DocumentService.submitCorrections(uploadState.documentId, corrections);
      setUploadState({ status: 'idle' });
      await loadDocuments();
    } catch (error: any) {
      console.error('Error saving corrections:', error);
    }
  };

  const handleViewDocument = (documentId: string) => {
    alert(`View document: ${documentId}\n\nDetail view coming soon!`);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await DocumentService.deleteDocument(documentId);
      await loadDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDone = () => {
    setUploadState({ status: 'idle' });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('is_first_login');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-12">
              <div 
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-bold cursor-pointer"
              >
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DocuPal
                </span>
              </div>
              <div className="hidden md:flex gap-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </button>
                <button className="text-slate-600 hover:text-blue-600 transition-colors">
                  Policies
                </button>
                <button className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-1">
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
              <div className="flex items-center gap-3">
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
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            📄 Documents
          </h1>
          <p className="text-lg text-slate-600">
            Upload and manage your immigration documents
          </p>
        </div>

        {uploadState.status !== 'idle' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
              <ProcessingStatus
                status={uploadState.status}
                progress={uploadState.status === 'uploading' ? uploadState.progress : undefined}
                fileName={uploadState.fileName}
              />
            )}

            {(uploadState.status === 'success' || uploadState.status === 'needs_verification') && (
              <div className="space-y-6">
                <ExtractedDataView
                  data={uploadState.data}
                  onSave={handleSaveCorrections}
                  isEditable={true}
                  showConfidence={true}
                />

                <div className="flex justify-center">
                  <button
                    onClick={handleDone}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/50 transition-all transform hover:scale-105"
                  >
                    Done - View All Documents
                  </button>
                </div>
              </div>
            )}

            {uploadState.status === 'failed' && (
              <ProcessingStatus
                status="failed"
                message={uploadState.error}
              />
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Upload className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      Upload Your First Document
                    </h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Start by uploading your I-20 form. Our AI will extract all the data automatically.
                    </p>

                    <UploadDropZone onFileSelect={handleFileSelect} />

                    <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">💡 Tip:</span> Make sure your document is clear and readable for best results
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <UploadDropZone onFileSelect={handleFileSelect} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Your Documents ({documents.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.document_id}
                        document={doc}
                        onView={handleViewDocument}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;