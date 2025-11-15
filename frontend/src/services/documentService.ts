import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => {
  const user = localStorage.getItem('user');
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  const userData = JSON.parse(user);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userData.user_id}`,
    'X-User-Email': userData.email,
  };
};

export interface ExtractedField {
  value: string;
  confidence: number;
}

export interface ExtractedData {
  full_name: ExtractedField;
  sevis_id: ExtractedField;
  program_end_date: ExtractedField;
  school_name: ExtractedField;
  degree_level: ExtractedField;
  opt_eligible: ExtractedField;
}

export interface DocumentStatus {
  document_id: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'needs_verification';
  extracted_data?: ExtractedData;
  error_message?: string;
  processed_at?: string;
}

export interface UploadUrlResponse {
  document_id: string;
  upload_url: string;
  upload_fields: Record<string, string>; 
}

export interface Document {
  document_id: string;
  document_type: string;
  file_name: string;
  status: string;
  uploaded_at: string;
  extracted_data?: ExtractedData;
}

class DocumentService {
  private static readonly MAX_POLL_ATTEMPTS = 30;
  private static readonly POLL_INTERVAL = 2000;

  static async requestUploadUrl(
    fileName: string,
    fileType: string,
    documentType: string = 'i20'
  ): Promise<UploadUrlResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/api/documents/upload`,
        {
          file_name: fileName,
          file_type: fileType,
          document_type: documentType,
        },
        {
          headers: getAuthHeaders(),
        }
      );
      
      console.log('Upload URL Response:', response.data);  
      return response.data.data;
    } catch (error: any) {
      console.error('Error requesting upload URL:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get upload URL');
    }
  }

  static async uploadToS3(
    file: File,
    uploadUrl: string,
    uploadFields: Record<string, string>,  
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log('Starting S3 upload...');
      console.log('Upload URL:', uploadUrl);
      console.log('Upload fields:', uploadFields);
      console.log('File:', file.name, file.type, file.size);

      const formData = new FormData();
      
      Object.keys(uploadFields).forEach(key => {
        formData.append(key, uploadFields[key]);
        console.log(`Field added: ${key}`);
      });
      
      formData.append('file', file);
      console.log('File added to FormData');

      await axios.post(uploadUrl, formData, {
        headers: {},
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
            console.log(`Upload progress: ${percent}%`);
          }
        },
      });
      
      console.log('S3 upload successful!');
    } catch (error: any) {
      console.error('Error uploading to S3:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error('Failed to upload file');
    }
  }

  static async pollDocumentStatus(
    documentId: string,
    onStatusUpdate?: (status: DocumentStatus) => void
  ): Promise<DocumentStatus> {
    let attempts = 0;

    while (attempts < this.MAX_POLL_ATTEMPTS) {
      try {
        const response = await axios.get(
          `${API_URL}/api/documents/${documentId}/status`,
          {
            headers: getAuthHeaders(),
          }
        );
        const status: DocumentStatus = response.data.data;

        if (onStatusUpdate) {
          onStatusUpdate(status);
        }

        if (['completed', 'failed', 'needs_verification'].includes(status.status)) {
          return status;
        }

        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
        attempts++;
      } catch (error: any) {
        console.error('Polling error:', error);
        if (attempts >= this.MAX_POLL_ATTEMPTS - 1) {
          throw new Error('Processing timeout');
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL));
      }
    }

    throw new Error('Processing took too long');
  }

  static async submitCorrections(
    documentId: string,
    corrections: Partial<Record<keyof ExtractedData, string>>
  ): Promise<void> {
    try {
      await axios.put(
        `${API_URL}/api/documents/${documentId}/verify`,
        { verified_data: corrections },
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (error: any) {
      console.error('Error submitting corrections:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to save corrections');
    }
  }

  static async getDocuments(): Promise<Document[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/documents`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data.documents || [];
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      
      if (error.response?.status === 403) {
        console.warn('Authentication issue - returning empty array for MVP');
        return [];
      }
      
      throw new Error(error.response?.data?.error?.message || 'Failed to load documents');
    }
  }

  static async getDocument(documentId: string): Promise<DocumentStatus> {
    try {
      const response = await axios.get(
        `${API_URL}/api/documents/${documentId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching document:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to load document');
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_URL}/api/documents/${documentId}`,
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (error: any) {
      console.error('Error deleting document:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete document');
    }
  }
}

export default DocumentService;