import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Business,
  Login as LoginIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Particles from "react-tsparticles";

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(credentials);
    if (result.success) {
      navigate('/upload');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background */}
      <Particles
        options={{
          background: { color: 'transparent' },
          particles: {
            color: { value: '#ffffff' },
            move: { enable: true, speed: 1, direction: 'none' },
            number: { value: 50 },
            opacity: { value: 0.1 },
            shape: { type: 'circle' },
            size: { value: 3 }
          }
        }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <MotionBox
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          textAlign="center"
          mb={4}
        >
          <Business sx={{ fontSize: 80, color: 'white', mb: 2 }} />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              mb: 1
            }}
          >
            ContractPro
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 300
            }}
          >
            Enterprise Contract Management System
          </Typography>
        </MotionBox>

        <MotionCard
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          elevation={24}
          sx={{
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Box textAlign="center" mb={4}>
              <LoginIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
              <Typography variant="h4" component="h2" fontWeight={600} gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please sign in to your account
              </Typography>
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

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleChange}
                required
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8, #6a419a)',
                  }
                }}
              >
                {loading ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CircularProgress size={24} color="inherit" />
                  </motion.div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>

            <Paper
              elevation={1}
              sx={{
                mt: 3,
                p: 2,
                textAlign: 'center',
                bgcolor: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Secure enterprise-grade authentication
              </Typography>
            </Paper>
          </CardContent>
        </MotionCard>
      </Container>
    </Box>
  );
};

export default Login;
