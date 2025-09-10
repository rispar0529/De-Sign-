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
  const [riskAssessment, setRiskAssessment] = useState(null);
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
        alert('Process terminated.');
        navigate('/upload');
        return;
      }

      if (approved && response.data.workflow_complete) {
        const message = response.data.final_status === 'SUCCESS' 
          ? 'Process completed successfully!' 
          : 'Process completed with issues.';
        alert(message);
        navigate('/upload');
      } else if (approved && !response.data.workflow_complete) {
        console.log('✅ User approved, proceeding to meeting scheduling...');
        navigate('/meeting', {
          state: { sessionId, filename, approved: true }
        });
      } else {
        console.log('⚠️ UNKNOWN STATE:', response.data);
        alert(response.data.message || 'Process continuing...');
      }
    } catch (error) {
      console.error('❌ Approval error:', error);
      setError(error.response?.data?.error || 'Approval failed');
    }
  };

  // Helper function to safely render content (handles both strings and objects)
const renderContent = (content) => {
  if (!content) return null;

  // Handle primitive types
  if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
    return <span style={{ fontSize: '14px', color: '#212529' }}>{String(content)}</span>;
  }

  // Handle arrays
  if (Array.isArray(content)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {content.map((item, index) => (
          <div key={index}>
            {renderContent(item)}
          </div>
        ))}
      </div>
    );
  }

  // Handle objects (this is where the clause data will be processed)
  if (typeof content === 'object') {
    // Check if this looks like a clause object
    if (content.clause_name && content.hasOwnProperty('is_present') && content.risk_level) {
      return (
        <div style={{
          border: `2px solid ${
            content.risk_level === 'HIGH' ? '#dc3545' : 
            content.risk_level === 'MEDIUM' ? '#ffc107' : '#28a745'
          }`,
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          marginBottom: '16px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: content.risk_level === 'HIGH' ? '#dc3545' : 
                           content.risk_level === 'MEDIUM' ? '#ffc107' : '#28a745',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px'
          }}>
            {content.clause_name} - {content.risk_level} RISK
          </div>
          
          {/* Content */}
          <div style={{ padding: '16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div>
                <span style={{ fontWeight: '500', color: '#6c757d' }}>Present:</span>
                <span style={{ 
                  marginLeft: '8px', 
                  color: content.is_present ? '#28a745' : '#dc3545',
                  fontWeight: '500'
                }}>
                  {content.is_present ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#6c757d' }}>Confidence:</span>
                <span style={{ marginLeft: '8px', fontWeight: '500' }}>
                  {Math.round(content.confidence_score * 100)}%
                </span>
              </div>
            </div>
            
            {content.justification && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontWeight: '500', 
                  marginBottom: '4px', 
                  color: '#495057',
                  fontSize: '13px'
                }}>
                  Analysis:
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.5',
                  color: '#212529'
                }}>
                  {content.justification}
                </div>
              </div>
            )}

            {content.cited_text && (
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #ffeaa7',
                marginTop: '12px'
              }}>
                <div style={{ 
                  fontWeight: '500', 
                  marginBottom: '4px', 
                  color: '#856404',
                  fontSize: '13px'
                }}>
                  Cited Text:
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  lineHeight: '1.5',
                  color: '#856404',
                  fontStyle: 'italic'
                }}>
                  "{content.cited_text}"
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Regular object handling
    return (
      <div style={{ fontSize: '14px' }}>
        {Object.entries(content).map(([key, value]) => (
          <div key={key} style={{ 
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid #f1f3f4'
          }}>
            <span style={{ 
              fontWeight: '500', 
              color: '#495057',
              textTransform: 'capitalize',
              marginRight: '8px'
            }}>
              {key.replace(/_/g, ' ')}:
            </span>
            <span style={{ color: '#212529' }}>
              {renderContent(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return <span style={{ color: '#6c757d', fontStyle: 'italic' }}>{String(content)}</span>;
};

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ 
          color: 'white', 
          textAlign: 'center', 
          fontSize: '2.5rem',
          marginBottom: '2rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          📊 Contract Analysis Dashboard
        </h1>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem',
            border: '1px solid #ef5350',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Display AI Risk Assessment if available */}
        {riskAssessment && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: '#667eea', 
              fontSize: '1.8rem', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔍 AI Risk Assessment
            </h2>
            
            <div style={{
              backgroundColor: '#f8f9ff',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '2px solid #667eea'
            }}>
              <strong>📁 File:</strong> {filename}
            </div>

            {/* Render clauses safely */}
            {riskAssessment.clauses && Array.isArray(riskAssessment.clauses) && riskAssessment.clauses.map((clause, index) => (
              <div key={index} style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '1rem',
                borderLeft: `6px solid ${
                  clause.risk_level === 'HIGH' ? '#f44336' :
                  clause.risk_level === 'MEDIUM' ? '#ff9800' : '#4caf50'
                }`,
                backgroundColor: '#fafafa'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '1rem', 
                  marginBottom: '1rem' 
                }}>
                  <div>
                    <strong>✅ Present:</strong> 
                    <span style={{
                      backgroundColor: clause.is_present ? '#e8f5e8' : '#ffebee',
                      color: clause.is_present ? '#2e7d32' : '#c62828',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      marginLeft: '0.5rem'
                    }}>
                      {clause.is_present ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <strong>⚠️ Risk Level:</strong> 
                    <span style={{
                      backgroundColor: 
                        clause.risk_level === 'HIGH' ? '#ffebee' :
                        clause.risk_level === 'MEDIUM' ? '#fff3e0' : '#e8f5e8',
                      color: 
                        clause.risk_level === 'HIGH' ? '#c62828' :
                        clause.risk_level === 'MEDIUM' ? '#ef6c00' : '#2e7d32',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      marginLeft: '0.5rem'
                    }}>
                      {clause.risk_level}
                    </span>
                  </div>
                  
                  <div>
                    <strong>🎯 Confidence:</strong> {(clause.confidence_score * 100).toFixed(1)}%
                    <div style={{
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      height: '8px',
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        backgroundColor: '#667eea',
                        borderRadius: '4px',
                        height: '100%',
                        width: `${clause.confidence_score * 100}%`,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>
                </div>

                {clause.cited_text && (
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontStyle: 'italic',
                    borderLeft: '3px solid #667eea'
                  }}>
                    <strong>📝 Cited Text:</strong><br/>
                    "{clause.cited_text}"
                  </div>
                )}
                
                <div>
                  <strong>🔍 Analysis:</strong> {renderContent(clause.justification)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={handleVerifyContract}
            disabled={loading.verify}
            style={{
              backgroundColor: loading.verify ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading.verify ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {loading.verify ? '⏳ Verifying...' : '✅ Verify Contract'}
          </button>

          <button
            onClick={handleSummarizeContract}
            disabled={loading.summarize}
            style={{
              backgroundColor: loading.summarize ? '#ccc' : '#764ba2',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading.summarize ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {loading.summarize ? '⏳ Summarizing...' : '📋 Summarize Contract'}
          </button>
        </div>

        {/* Results Display - FIXED: Safe rendering of analysis */}
        {analysis && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              color: '#667eea', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ✅ Contract Verification Results
            </h3>
            <div style={{
              backgroundColor: '#f8f9ff',
              padding: '1.5rem',
              borderRadius: '8px',
              lineHeight: '1.6',
              border: '1px solid #e3f2fd'
            }}>
              {renderContent(analysis)}
            </div>
          </div>
        )}

        {/* Summary Display - FIXED: Safe rendering of summary */}
        {summary && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              color: '#764ba2', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Contract Summary
            </h3>
            <div style={{
              backgroundColor: '#f8f9ff',
              padding: '1.5rem',
              borderRadius: '8px',
              lineHeight: '1.6',
              border: '1px solid #e3f2fd'
            }}>
              {renderContent(summary)}
            </div>
          </div>
        )}

        {/* Clause Suggestion */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#667eea', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💡 Clause Suggestion
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1rem' 
          }}>
            <input
              type="text"
              placeholder="Enter clause name"
              value={selectedClause}
              onChange={(e) => setSelectedClause(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
            />
            <input
              type="text"
              placeholder="Risky text (optional)"
              value={riskyText}
              onChange={(e) => setRiskyText(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>
          
          <button
            onClick={handleSuggestClause}
            disabled={loading.suggest}
            style={{
              backgroundColor: loading.suggest ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading.suggest ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {loading.suggest ? '⏳ Generating...' : '💡 Suggest Clause'}
          </button>

          {/* Clause Suggestion Display - FIXED: Safe rendering */}
          {clauseSuggestion && (
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '1.5rem',
              borderRadius: '8px',
              marginTop: '1rem',
              border: '2px solid #4caf50'
            }}>
              <h4 style={{ 
                marginBottom: '0.5rem',
                color: '#2e7d32'
              }}>
                💡 Suggested Clause: {selectedClause}
              </h4>
              <div style={{ lineHeight: '1.6' }}>
                {renderContent(clauseSuggestion)}
              </div>
            </div>
          )}
        </div>

        {/* Approval Section */}
        {riskAssessment && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '2px solid #ff9800'
          }}>
            <h3 style={{ 
              color: '#ff9800', 
              marginBottom: '1rem', 
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              ⚠️ Document Review Decision
            </h3>
            <p style={{ 
              marginBottom: '2rem', 
              fontSize: '1.1rem', 
              color: '#666',
              lineHeight: '1.5'
            }}>
              Based on the risk assessment above, do you want to proceed with this document?
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleApproval(true)}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  minWidth: '150px'
                }}
              >
                ✅ Approve & Proceed
              </button>
              <button
                onClick={() => handleApproval(false)}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                  minWidth: '150px'
                }}
              >
                ❌ Reject Document
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
