import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  Schedule,
  Email,
  CheckCircle,
  ArrowBack,
  CalendarMonth,
  Notifications
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Meeting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, filename } = location.state || {};
  
  const [meetingDate, setMeetingDate] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/upload');
    }
  }, [sessionId, navigate]);

  const handleScheduleMeeting = async () => {
    if (!meetingDate) {
      setError('Please select a meeting date and time');
      return;
    }
    if (!emailAddress) {
      setError('Please enter an email address for notifications');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await documentAPI.provideInput(sessionId, {
        meeting_date: meetingDate,
        notification_email: emailAddress
      });

      if (response.data.workflow_complete) {
        if (response.data.final_status === 'SUCCESS') {
          setSuccess(true);
          setTimeout(() => navigate('/upload'), 3000);
        } else {
          setError(`Meeting scheduling failed: ${response.data.error || response.data.message || 'Unknown error'}`);
        }
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setError('Meeting scheduling incomplete - workflow still processing');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Meeting scheduling failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToUpload = () => {
    navigate('/upload');
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)'
        }}
      >
        <Container maxWidth="md">
          <MotionCard
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            elevation={24}
            sx={{
              borderRadius: 4,
              textAlign: 'center',
              background: 'linear-gradient(145deg, #ffffff 0%, #f0fff0 100%)'
            }}
          >
            <CardContent sx={{ p: 6 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle sx={{ fontSize: 100, color: '#4caf50', mb: 3 }} />
              </motion.div>
              
              <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                Meeting Scheduled Successfully!
              </Typography>
              
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Meeting scheduled for {new Date(meetingDate).toLocaleDateString()} at {new Date(meetingDate).toLocaleTimeString()}
              </Typography>
              
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 4,
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Confirmation email has been sent to {emailAddress}
                </Typography>
              </Paper>
              
              <Typography variant="body1" sx={{ mb: 4 }}>
                Contract processing workflow completed.
              </Typography>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Redirecting to upload page...
                </Typography>
              </motion.div>
            </CardContent>
          </MotionCard>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              mb: 4,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Schedule Meeting
          </Typography>
        </motion.div>

        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          elevation={8}
          sx={{
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)'
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="center" mb={4}>
              <Schedule sx={{ fontSize: 48, color: '#667eea', mr: 2 }} />
              <Box textAlign="center">
                <Typography variant="h4" component="h2" fontWeight={600} gutterBottom>
                  Finalize Your Contract
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your contract has been approved. Please schedule a meeting to complete the process.
                </Typography>
              </Box>
            </Box>

            {/* File Info */}
            <Paper
              elevation={2}
              sx={{
                p: 3,
                mb: 4,
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" gutterBottom>
                <strong>File:</strong> {filename}
              </Typography>
              <Chip 
                label="Approved" 
                color="success" 
                icon={<CheckCircle />}
                sx={{ fontSize: '1rem', px: 2, py: 1 }}
              />
            </Paper>

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

            <Divider sx={{ mb: 4 }} />

            {/* Form */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarMonth sx={{ color: '#667eea', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Meeting Details
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meeting Date & Time"
                  type="datetime-local"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address for Notifications"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="your.email@company.com"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Email sx={{ color: '#667eea', mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="center" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={handleBackToUpload}
                    startIcon={<ArrowBack />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem'
                    }}
                  >
                    Back to Upload
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleScheduleMeeting}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      px: 6,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      background: 'linear-gradient(45deg, #667eea, #764ba2)'
                    }}
                    startIcon={loading ? <CircularProgress size={20} /> : <Schedule />}
                  >
                    {loading ? 'Scheduling...' : 'Schedule Meeting'}
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Info Box */}
            <Paper
              elevation={1}
              sx={{
                mt: 4,
                p: 3,
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                📧 A confirmation email will be sent to the provided address with meeting details
              </Typography>
            </Paper>
          </CardContent>
        </MotionCard>
      </Container>
    </Box>
  );
};

export default Meeting;
