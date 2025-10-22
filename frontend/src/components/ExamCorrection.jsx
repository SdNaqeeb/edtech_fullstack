// ExamCorrection.jsx - Main Exam Correction Component
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './ExamCorrection.css';

const ExamCorrection = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  // Form state
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [rollNumberPattern, setRollNumberPattern] = useState('.*');
  const [maxWorkers, setMaxWorkers] = useState(5);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheets, setAnswerSheets] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Ready to process');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Teacher info
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    // Get teacher name from localStorage
    const fullName = localStorage.getItem('fullName');
    const username = localStorage.getItem('username');
    setTeacherName(fullName || username || '');
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    let redirectTimeout;

    return () => {
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, []);

  // Handle question paper file selection
  const handleQuestionPaperChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF)
      if (file.type !== 'application/pdf') {
        setError('Question paper must be a PDF file');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Question paper file size must be less than 10MB');
        return;
      }
      setQuestionPaper(file);
      setError(null);
    }
  };

  // Handle answer sheets file selection
  const handleAnswerSheetsChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    for (let file of files) {
      if (file.type !== 'application/pdf') {
        setError('Answer sheets must be PDF files');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each answer sheet file size must be less than 10MB');
        return;
      }
    }
    
    setAnswerSheets(files);
    setError(null);
  };

  // Remove question paper
  const handleRemoveQuestionPaper = () => {
    setQuestionPaper(null);
  };

  // Remove answer sheet
  const handleRemoveAnswerSheet = (index) => {
    const updatedSheets = answerSheets.filter((_, i) => i !== index);
    setAnswerSheets(updatedSheets);
  };

  // Clear all files
  const handleClearAllFiles = () => {
    setQuestionPaper(null);
    setAnswerSheets([]);
  };

  // Validate form
  const validateForm = () => {
    if (!examName.trim()) {
      setError('Exam name is required');
      return false;
    }
    if (!examType) {
      setError('Exam type is required');
      return false;
    }
    if (!className.trim()) {
      setError('Class name is required');
      return false;
    }
    if (!section.trim()) {
      setError('Section is required');
      return false;
    }
    if (!questionPaper) {
      setError('Question paper is required');
      return false;
    }
    if (answerSheets.length === 0) {
      setError('At least one answer sheet is required');
      return false;
    }
    return true;
  };

  // Submit exam correction
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setProcessingStatus('Uploading files...');
      setUploadProgress(0);

      // Create FormData
      const formData = new FormData();
      formData.append('exam_name', examName.trim());
      formData.append('exam_type', examType);
      formData.append('teacher_name', teacherName);
      formData.append('class_name', className.trim());
      formData.append('section', section.trim());
      formData.append('roll_number_pattern', rollNumberPattern);
      formData.append('max_workers', maxWorkers.toString());
      
      // Append question paper
      formData.append('question_paper', questionPaper);
      
      // Append answer sheets
      answerSheets.forEach((sheet) => {
        formData.append('answer_sheets', sheet);
      });

      // Make API call with progress tracking
      const response = await axiosInstance.post('api/exam-correction/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      console.log('Exam correction response:', response.data);
      
      setSuccess(true);
      setProcessingStatus('Processing exam in background...');
      
      // Show success message for 30 seconds, then redirect
      setTimeout(() => {
        navigate('/exam-analytics');
      }, 30000);

    } catch (error) {
      console.error('Error submitting exam correction:', error);
      setError(
        error.response?.data?.detail || 
        error.message || 
        'Failed to submit exam correction. Please try again.'
      );
      setProcessingStatus('Ready to process');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Reset form
  const handleReset = () => {
    setExamName('');
    setExamType('');
    setClassName('');
    setSection('');
    setRollNumberPattern('.*');
    setMaxWorkers(5);
    setQuestionPaper(null);
    setAnswerSheets([]);
    setError(null);
    setSuccess(false);
    setProcessingStatus('Ready to process');
  };

  return (
    <div className="exam-correction-container">
      <div className="exam-correction-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M9 15l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h1 className="header-title">📝 Exam Correction Hub</h1>
            <p className="header-subtitle">Upload question papers and answer sheets for automated grading</p>
          </div>
        </div>
            <button 
            className="view-analytics-btn"
            onClick={() => {
              // Call parent function to change tab
              if (window.handleExamAnalyticsView) {
                window.handleExamAnalyticsView();
              }
            }}
          >
            <span>📊</span>
            View Analytics
          </button>
      </div>

      <div className="exam-correction-content">
        <div className="main-form-section">
          <form onSubmit={handleSubmit} className="exam-form">
            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="alert alert-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Exam submitted successfully! Processing in background...</span>
              </div>
            )}

            {/* Exam Details Section */}
            <div className="form-section">
              <h2 className="section-title">Exam Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="examName">
                    Exam Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="examName"
                    className="form-input"
                    placeholder="e.g., Mathematics Midterm Exam"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="examType">
                    Exam Type <span className="required">*</span>
                  </label>
                  {/* <select
                    id="examType"
                    className="form-input"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select exam type</option>
                    <option value="MCQ">MCQ (Multiple Choice Questions)</option>
                    <option value="Subjective">Subjective</option>
                    <option value="Mixed">Mixed (MCQ + Subjective)</option>
                  </select> */}
                   <input
                    type="text"
                    id="examType"
                    className="form-input"
                    placeholder="e.g., Mathematics Midterm Exam"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="className">
                    Class Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="className"
                    className="form-input"
                    placeholder="e.g., 10"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="section">
                    Section <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="section"
                    className="form-input"
                    placeholder="e.g., A"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            {/* <div className="form-section">
              <h2 className="section-title">Advanced Settings</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rollNumberPattern">
                    Roll Number Pattern
                    <span className="help-text">
                      (Optional - Regex pattern for roll number extraction)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="rollNumberPattern"
                    className="form-input"
                    placeholder="e.g., 8MME-14,8MME-15,8MME-36"
                    value={rollNumberPattern}
                    onChange={(e) => setRollNumberPattern(e.target.value)}
                    disabled={loading}
                  />
                  <small className="field-description">
                    Enter expected roll number patterns (comma-separated)
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="maxWorkers">
                    Max Workers (Performance)
                  </label>
                  <input
                    type="number"
                    id="maxWorkers"
                    className="form-input"
                    min="1"
                    max="10"
                    value={maxWorkers}
                    onChange={(e) => setMaxWorkers(parseInt(e.target.value) || 5)}
                    disabled={loading}
                  />
                  <small className="field-description">
                    Number of parallel processing workers (1-10)
                  </small>
                </div>
              </div>
            </div> */}

            {/* File Upload Section */}
            <div className="form-section">
              <h2 className="section-title">Upload Files</h2>
              
              {/* Question Paper Upload */}
              <div className="file-upload-group">
                <label className="file-upload-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  Question Paper <span className="required">*</span>
                </label>
                
                <div className="file-upload-area">
                  {!questionPaper ? (
                    <label className="upload-box" htmlFor="questionPaperInput">
                      <div className="upload-icon">📄</div>
                      <div className="upload-text">
                        <strong>Choose File</strong>
                        <span>Upload PDF file</span>
                      </div>
                      <input
                        type="file"
                        id="questionPaperInput"
                        accept=".pdf"
                        onChange={handleQuestionPaperChange}
                        disabled={loading}
                        style={{ display: 'none' }}
                      />
                    </label>
                  ) : (
                    <div className="file-preview">
                      <div className="file-info">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                        </svg>
                        <div className="file-details">
                          <span className="file-name">{questionPaper.name}</span>
                          <span className="file-size">
                            {(questionPaper.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={handleRemoveQuestionPaper}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer Sheets Upload */}
              <div className="file-upload-group">
                <label className="file-upload-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                  Answer Sheets <span className="required">*</span>
                  {answerSheets.length > 0 && (
                    <span className="file-count">({answerSheets.length} file{answerSheets.length > 1 ? 's' : ''})</span>
                  )}
                </label>
                
                <div className="file-upload-area">
                  <label className="upload-box" htmlFor="answerSheetsInput">
                    <div className="upload-icon">📋</div>
                    <div className="upload-text">
                      <strong>Choose Files</strong>
                      <span>Upload multiple PDF files</span>
                    </div>
                    <input
                      type="file"
                      id="answerSheetsInput"
                      accept=".pdf"
                      multiple
                      onChange={handleAnswerSheetsChange}
                      disabled={loading}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {answerSheets.length > 0 && (
                    <div className="files-list">
                      {answerSheets.map((sheet, index) => (
                        <div key={index} className="file-preview">
                          <div className="file-info">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                            </svg>
                            <div className="file-details">
                              <span className="file-name">{sheet.name}</span>
                              <span className="file-size">
                                {(sheet.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => handleRemoveAnswerSheet(index)}
                            disabled={loading}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(questionPaper || answerSheets.length > 0) && (
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={handleClearAllFiles}
                  disabled={loading}
                >
                  🗑 Clear All Files
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {loading && uploadProgress > 0 && (
              <div className="upload-progress-section">
                <div className="progress-info">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Start Correction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Processing Status Sidebar */}
        <div className="status-sidebar">
          <div className="status-card">
            <h3 className="status-title">Processing Status</h3>
            <div className={`status-indicator ${loading ? 'processing' : success ? 'success' : 'ready'}`}>
              <div className="status-icon">
                {loading ? '⏳' : success ? '✅' : '📊'}
              </div>
              <span className="status-text">{processingStatus}</span>
            </div>

            {loading && (
              <div className="status-details">
                <p>Your exam is being processed. This may take a few minutes depending on the number of answer sheets.</p>
              </div>
            )}

            {success && (
              <div className="status-details success">
                <p>✓ Files uploaded successfully</p>
                <p>✓ Processing started in background</p>
                <p>✓ You'll be redirected to analytics...</p>
              </div>
            )}
          </div>

          <div className="info-card">
            <h3 className="info-title">ℹ Instructions</h3>
            <ul className="info-list">
              <li>Upload the question paper as a single PDF file</li>
              <li>Upload all student answer sheets as PDF files</li>
              <li>Ensure roll numbers are clearly visible</li>
              <li>Processing time depends on number of sheets</li>
              <li>You'll receive notification when complete</li>
            </ul>
          </div>

          <div className="stats-card">
            <h3 className="stats-title">Current Submission</h3>
            <div className="stat-item">
              <span className="stat-label">Question Paper:</span>
              <span className="stat-value">
                {questionPaper ? '✓ Uploaded' : '○ Not uploaded'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Answer Sheets:</span>
              <span className="stat-value">
                {answerSheets.length} file{answerSheets.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Class:</span>
              <span className="stat-value">
                {className && section ? `${className}-${section}` : 'Not set'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCorrection;