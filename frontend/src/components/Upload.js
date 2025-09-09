import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    console.log('File selected:', e.target.files[0]?.name);
  };

  const handleUpload = async () => {
    if (!file) {
        setError('Please select a file');
        return;
    }
    
    console.log('Starting upload for file:', file.name);
    setUploading(true);
    setError('');
    
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication token missing. Please login again.');
            logout();
            navigate('/login');
            return;
        }
        
        const response = await documentAPI.upload(file);
        console.log('Upload response:', response.data);
        
        const { session_id } = response.data;
        if (!session_id) {
            setError('Invalid response from server - no session ID received');
            return;
        }
        
        navigate('/analysis', { 
            state: { 
                sessionId: session_id, 
                filename: file.name, 
                uploadSuccess: true 
            } 
        });

        if (response.data.session_id) {
        navigate('/analysis', { 
            state: { 
                sessionId: response.data.session_id, 
                filename: file.name,
                risk_assessment: response.data.risk_assessment  // ✅ Pass this
            } 
        });
    }
        
    } catch (error) {
        console.error('Upload error:', error);
        // Handle error cases...
        if (error.response) {
            const status = error.response.status;
            const errorMessage = error.response.data?.error || 'Upload failed';
            
            if (status === 401) {
                setError('Authentication failed. Please login again.');
                logout();
                navigate('/login');
            } else if (status === 413) {
                setError('File too large. Maximum size is 16MB.');
            } else if (status === 400) {
                setError(errorMessage);
            } else {
                setError(`Upload failed: ${errorMessage}`);
            }
        } else if (error.request) {
            setError('Cannot connect to server. Please check your connection.');
        } else {
            setError(`Upload failed: ${error.message}`);
        }
    } finally {
        setUploading(false);
    }
};


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2>Upload Contract Document</h2>
          {user && <p style={{ color: '#666', fontSize: '14px' }}>Logged in as: {user.email}</p>}
        </div>
        <button 
          onClick={handleLogout} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
        <input
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          style={{ marginBottom: '20px' }}
          disabled={uploading}
        />
        
        {file && (
          <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p><strong>Selected:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p><strong>Type:</strong> {file.type}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          style={{
            padding: '12px 24px',
            backgroundColor: uploading ? '#6c757d' : (!file ? '#dee2e6' : '#28a745'),
            color: uploading || !file ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading || !file ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: '#721c24', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Upload Guidelines:</h4>
        <ul style={{ textAlign: 'left' }}>
          <li>Supported formats: PDF, DOCX, JPG, PNG</li>
          <li>Maximum file size: 16MB</li>
          <li>Ensure the document is clearly readable</li>
          <li>For images, use high resolution for better text extraction</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;