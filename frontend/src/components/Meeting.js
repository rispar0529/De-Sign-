import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const Meeting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, filename } = location.state || {};
  
  const [meetingDate, setMeetingDate] = useState('');
  const [emailAddress, setEmailAddress] = useState(''); // 🆕 Add email input
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
    
    if (!emailAddress) { // 🆕 Validate email input
      setError('Please enter an email address for notifications');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Scheduling meeting with:', { meetingDate, emailAddress });
      
      const response = await documentAPI.provideInput(sessionId, { 
        meeting_date: meetingDate,
        notification_email: emailAddress  // 🆕 Send email address
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
      console.error('Meeting scheduling error:', error);
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
      <div className="success-container">
        <h2>✅ Success!</h2>
        <p>Meeting scheduled successfully for {new Date(meetingDate).toLocaleDateString()} at {new Date(meetingDate).toLocaleTimeString()}</p>
        <p>📧 <strong>Confirmation email has been sent to {emailAddress}</strong></p>
        <p>Contract processing workflow completed.</p>
        <p>Redirecting to upload page...</p>
      </div>
    );
  }

  return (
    <div className="meeting-container">
      <h2>📅 Schedule Meeting</h2>
      <p><strong>File:</strong> {filename}</p>
      <p>Your contract has been approved. Please schedule a meeting to finalize the process.</p>
      
      {error && <div className="error-message">❌ {error}</div>}
      
      <div className="meeting-form">
        <label htmlFor="meetingDate">Select Meeting Date and Time:</label>
        <input
          type="datetime-local"
          id="meetingDate"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          required
        />
        
        {/* 🆕 Add email input field */}
        <label htmlFor="emailAddress">Email Address for Confirmation:</label>
        <input
          type="email"
          id="emailAddress"
          value={emailAddress}
          onChange={(e) => setEmailAddress(e.target.value)}
          placeholder="recipient@example.com"
          required
        />
        
        <div className="meeting-actions">
          <button 
            onClick={handleScheduleMeeting}
            disabled={loading || !meetingDate || !emailAddress}
            className="schedule-btn"
          >
            {loading ? 'Scheduling...' : 'Schedule Meeting & Send Email'}
          </button>
          
          <button 
            onClick={handleBackToUpload}
            className="back-btn"
          >
            Back to Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default Meeting;
