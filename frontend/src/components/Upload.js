import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Person,
  Logout,
  CheckCircle,
  InsertDriveFile
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setError('');
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 16 * 1024 * 1024, // 16MB
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

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
      
      if (response.data.session_id) {
        navigate('/analysis', {
          state: {
            sessionId: response.data.session_id,
            filename: file.name,
            risk_assessment: response.data.risk_assessment
          }
        });
      }
    } catch (error) {
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)'
            }}
          >
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Box display="flex" alignItems="center">
                  <Description sx={{ fontSize: 40, color: '#667eea', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="h1" fontWeight={700}>
                      ContractPro Dashboard
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      Upload and analyze your contracts with AI-powered insights
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    icon={<Person />}
                    label={`Logged in as: ${user?.email}`}
                    color="primary"
                    variant="outlined"
                    sx={{ px: 2 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleLogout}
                    startIcon={<Logout />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        <Grid container spacing={4}>
          {/* Upload Section */}
          <Grid item xs={12} lg={8}>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              elevation={8}
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                height: 'fit-content'
              }}
            >
              <CardContent sx={{ p: 6 }}>
                <Box display="flex" alignItems="center" mb={4}>
                  <CloudUpload sx={{ fontSize: 48, color: '#667eea', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="h2" fontWeight={600}>
                      Document Upload
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Upload your contract for AI-powered analysis
                    </Typography>
                  </Box>
                </Box>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}

                {/* Dropzone */}
                <Paper
                  {...getRootProps()}
                  elevation={isDragActive ? 8 : 2}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: isDragActive ? '2px dashed #667eea' : '2px dashed #ccc',
                    bgcolor: isDragActive ? 'rgba(102, 126, 234, 0.05)' : 'grey.50',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.05)',
                      borderColor: '#667eea'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  <motion.div
                    animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CloudUpload sx={{ fontSize: 80, color: '#667eea', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your contract'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      or click to browse files
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supported formats: PDF, DOC, DOCX • Max size: 16MB
                    </Typography>
                  </motion.div>
                </Paper>

                {/* File Preview */}
                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          mt: 3,
                          p: 3,
                          borderRadius: 2,
                          background: 'linear-gradient(145deg, #f0f4ff 0%, #ffffff 100%)'
                        }}
                      >
                        <Box display="flex" alignItems="center" mb={2}>
                          <CheckCircle sx={{ color: '#4caf50', mr: 2 }} />
                          <Typography variant="h6" fontWeight={600}>
                            File Selected
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center">
                              <InsertDriveFile sx={{ color: '#667eea', mr: 1 }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Name
                                </Typography>
                                <Typography variant="body1" fontWeight={500}>
                                  {file.name}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Size
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatFileSize(file.size)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Type
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {file.type || 'Unknown'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Divider sx={{ my: 4 }} />

                {/* Upload Button */}
                <Box textAlign="center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    sx={{
                      py: 2,
                      px: 6,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a6fd8, #6a419a)',
                      },
                      '&:disabled': {
                        background: 'grey.300'
                      }
                    }}
                    startIcon={
                      uploading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <CloudUpload />
                      )
                    }
                  >
                    {uploading ? 'Processing...' : 'Upload & Analyze'}
                  </Button>
                  
                  {uploading && (
                    <MotionBox
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      sx={{ mt: 2 }}
                    >
                      <LinearProgress
                        sx={{
                          height: 8,
                          borderRadius: 1,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(45deg, #667eea, #764ba2)'
                          }
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Analyzing document with AI...
                      </Typography>
                    </MotionBox>
                  )}
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Info Panel */}
          <Grid item xs={12} lg={4}>
            <MotionCard
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              elevation={8}
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
                height: 'fit-content'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  📊 What We Analyze
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box mb={3}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    🔍 Risk Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-powered analysis of contract clauses and potential risks
                  </Typography>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    📋 Contract Verification
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comprehensive review of terms and conditions
                  </Typography>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    📝 Smart Summarization
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Key points extraction and executive summary
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="h6" color="primary" gutterBottom>
                    💡 Clause Suggestions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Intelligent recommendations for contract improvements
                  </Typography>
                </Box>

                <Paper
                  elevation={2}
                  sx={{
                    mt: 4,
                    p: 2,
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    borderRadius: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    🔒 Your documents are processed securely and never stored permanently
                  </Typography>
                </Paper>
              </CardContent>
            </MotionCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Upload;
