import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const Analysis = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { sessionId, filename } = location.state || {};
    const [analysis, setAnalysis] = useState(null);
    const [summary, setSummary] = useState(null);
    const [clauseSuggestion, setClauseSuggestion] = useState(null);
    const [riskAssessment, setRiskAssessment] = useState(null); // ✅ Add this
    const [loading, setLoading] = useState({
        verify: false,
        summarize: false,
        suggest: false
    });
    const [error, setError] = useState('');
    const [selectedClause, setSelectedClause] = useState('');
    const [riskyText, setRiskyText] = useState('');

  useEffect(() => {
        if (!sessionId) {
            navigate('/upload');
        }
        
        // ✅ Get risk assessment from location state
        if (location.state?.risk_assessment) {
            setRiskAssessment(location.state.risk_assessment);
        }
    }, [sessionId, navigate, location.state]);

  const handleVerifyContract = async () => {
    setLoading(prev => ({ ...prev, verify: true }));
    setError('');
    
    try {
      const response = await documentAPI.verifyContract(sessionId);
      setAnalysis(response.data.analysis);
    } catch (error) {
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(prev => ({ ...prev, verify: false }));
    }
  };

  const handleSummarizeContract = async () => {
    setLoading(prev => ({ ...prev, summarize: true }));
    setError('');
    
    try {
      const response = await documentAPI.summarizeContract(sessionId);
      setSummary(response.data.summary);
    } catch (error) {
      setError(error.response?.data?.error || 'Summarization failed');
    } finally {
      setLoading(prev => ({ ...prev, summarize: false }));
    }
  };

  const handleSuggestClause = async () => {
    if (!selectedClause) {
      setError('Please enter a clause name');
      return;
    }
    
    setLoading(prev => ({ ...prev, suggest: true }));
    setError('');
    
    try {
      const response = await documentAPI.suggestClause(sessionId, selectedClause, riskyText);
      setClauseSuggestion(response.data.suggestion);
    } catch (error) {
      setError(error.response?.data?.error || 'Suggestion failed');
    } finally {
      setLoading(prev => ({ ...prev, suggest: false }));
    }
  };

  const handleApproval = async (approved) => {
  try {
    console.log('=== SENDING APPROVAL ===');
    console.log('Approved:', approved);
    
    const response = await documentAPI.provideInput(sessionId, { approved });
    
    console.log('=== FULL APPROVAL RESPONSE ===');
    console.log('Full response:', response);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (!approved) {
      // User rejected - workflow terminated
      alert('Process terminated.');
      navigate('/upload');
      return;
    }

    // ✅ FIXED: Better handling of approval response
    if (approved && response.data.workflow_complete) {
      // Workflow completed immediately (edge case)
      const message = response.data.final_status === 'SUCCESS' 
        ? 'Process completed successfully!' 
        : 'Process completed with issues.';
      alert(message);
      navigate('/upload');
    } else if (approved && !response.data.workflow_complete) {
      // ✅ User approved - should proceed to meeting scheduling
      console.log('✅ User approved, proceeding to meeting scheduling...');
      navigate('/meeting', { 
        state: { 
          sessionId, 
          filename,
          approved: true  // Pass approval status
        } 
      });
    } else {
      // Unknown state
      console.log('⚠️ UNKNOWN STATE:', response.data);
      alert(response.data.message || 'Process continuing...');
    }

  } catch (error) {
    console.error('❌ Approval error:', error);
    setError(error.response?.data?.error || 'Approval failed');
  }
};





    return (
  <div className="analysis-container">
    <h2>Document Analysis</h2>
    <p><strong>File:</strong> {filename}</p>

    {/* Display AI Risk Assessment if available */}
    {riskAssessment && (
      <div className="risk-assessment-section">
        <h3>🔍 AI Risk Assessment</h3>
        <div className={`risk-level ${riskAssessment.risk_level.toLowerCase()}`}>
          <strong>Overall Risk Level:</strong> {riskAssessment.risk_level}
        </div>
        
        <div className="risk-stats">
          <div className="stat">
            <span className="label">Total Clauses Analyzed:</span>
            <span className="value">{riskAssessment.total_clauses_analyzed}</span>
          </div>
          <div className="stat">
            <span className="label">High Risk Clauses:</span>
            <span className="value high">{riskAssessment.high_risk_clauses}</span>
          </div>
          <div className="stat">
            <span className="label">Medium Risk Clauses:</span>
            <span className="value medium">{riskAssessment.medium_risk_clauses}</span>
          </div>
          <div className="stat">
            <span className="label">Low Risk Clauses:</span>
            <span className="value low">{riskAssessment.low_risk_clauses}</span>
          </div>
        </div>
        
        <div className="analysis-timestamp">
          <small>Analyzed: {new Date(riskAssessment.analyzed_at).toLocaleString()}</small>
        </div>
      </div>
    )}

    {/* Contract Analysis Tools */}
    <div className="analysis-tools">
      <div className="tool-buttons">
        <button 
          onClick={handleVerifyContract}
          disabled={loading.verify}
          className="tool-btn verify-btn"
        >
          {loading.verify ? 'Analyzing...' : 'Verify Contract'}
        </button>
        
        <button 
          onClick={handleSummarizeContract}
          disabled={loading.summarize}
          className="tool-btn summarize-btn"
        >
          {loading.summarize ? 'Summarizing...' : 'Summarize Contract'}
        </button>
      </div>
    </div>

    {/* Display Detailed Analysis */}
    {analysis && (
      <div className="analysis-detail">
        <h3>📋 Clause Analysis</h3>
        <div className="analysis-content">
          {analysis.map((clause, index) => (
            <div key={index} className={`clause-item ${clause.risk_level.toLowerCase()}`}>
              <h4>{clause.clause_name}</h4>
              <p><strong>Present:</strong> {clause.is_present ? 'Yes' : 'No'}</p>
              <p><strong>Risk Level:</strong> {clause.risk_level}</p>
              <p><strong>Confidence:</strong> {(clause.confidence_score * 100).toFixed(1)}%</p>
              <p><strong>Analysis:</strong> {clause.justification}</p>
              {clause.cited_text && (
                <div className="cited-text">
                  <strong>Cited Text:</strong>
                  <blockquote>{clause.cited_text}</blockquote>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Display Summary */}
    {summary && (
      <div className="summary-section">
        <h3>📝 Contract Summary</h3>
        <div className="summary-content">
          <p>{summary}</p>
        </div>
      </div>
    )}

    {/* Clause Suggestion Tool */}
    <div className="clause-suggestion">
      <h3>💡 Suggest Clause Improvement</h3>
      <div className="suggestion-form">
        <input
          type="text"
          placeholder="Enter clause name (e.g., 'Liability', 'Termination')"
          value={selectedClause}
          onChange={(e) => setSelectedClause(e.target.value)}
          className="clause-input"
        />
        <textarea
          placeholder="Enter risky clause text (optional)"
          value={riskyText}
          onChange={(e) => setRiskyText(e.target.value)}
          className="risky-text-input"
          rows={4}
        />
        <button 
          onClick={handleSuggestClause}
          disabled={loading.suggest || !selectedClause}
          className="suggest-btn"
        >
          {loading.suggest ? 'Generating...' : 'Get Suggestion'}
        </button>
      </div>
      
      {clauseSuggestion && (
        <div className="suggestion-result">
          <h4>📄 Suggested Clause:</h4>
          <div className="suggestion-content">
            <p><strong>Clause:</strong> {selectedClause}</p>
            <div className="suggestion-text">
              <p>{clauseSuggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Approval Section */}
    <div className="approval-section">
      <h3>✅ Document Approval</h3>
      <p>Based on the risk assessment above, do you want to proceed with this document?</p>
      
      <div className="approval-buttons">
        <button 
          onClick={() => handleApproval(true)}
          className="approve-btn"
        >
          ✅ Yes, Approve & Proceed
        </button>
        <button 
          onClick={() => handleApproval(false)}
          className="reject-btn"
        >
          ❌ No, Reject Document
        </button>
      </div>
      
      {error && <div className="error-message">⚠️ {error}</div>}
    </div>
  </div>
);

};

export default Analysis;
