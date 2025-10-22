// ExamAnalytics.jsx 
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import './ExamAnalytics.css';

// Add this CSS inline or in ExamAnalytics.css
const fullscreenStyle = `
  .exam-analytics-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    overflow-y: auto;
    padding: 2rem;
    z-index: 9999;
  }
`;

const ExamAnalytics = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  
  // State for teacher view
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [examStats, setExamStats] = useState(null);
  
  // State for student view
  const [studentOwnResults, setStudentOwnResults] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
  
  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherExams();
    } else if (role === 'student') {
      fetchStudentResults();
    }
  }, [role]);

  // Fetch all exams for teacher
  const fetchTeacherExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/exam-details/');
      console.log('Teacher exams:', response.data);
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Only teachers can view this page.');
      } else {
        setError('Failed to fetch exams. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch student results for a specific exam (teacher view)
  const fetchExamResults = async (examId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/student-results/?exam_id=${examId}`);
      console.log('Exam results:', response.data);
      setStudentResults(response.data.student_results || []);
      setExamStats({
        examName: response.data.exam,
        examType: response.data.exam_type,
        classSection: response.data.class_section,
        totalStudents: response.data.total_students
      });
      setViewMode('details');
    } catch (error) {
      console.error('Error fetching exam results:', error);
      setError('Failed to fetch exam results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's own results
  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/student-results/');
      console.log('Student results:', response.data);
      setStudentOwnResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setError('Failed to fetch your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle exam selection
  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    fetchExamResults(exam.id);
  };

  // Go back to exam list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedExam(null);
    setStudentResults([]);
    setExamStats(null);
  };

  // Get grade color
  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': '#10b981',
      'A': '#16a34a',
      'B+': '#3b82f6',
      'B': '#2563eb',
      'C': '#f59e0b',
      'D': '#ef4444',
      'F': '#dc2626'
    };
    return gradeColors[grade] || '#6b7280';
  };

  // Get performance class
  const getPerformanceClass = (percentage) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    if (percentage >= 40) return 'below-average';
    return 'poor';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ADD THIS AT TOP OF COMPONENT (after state declarations):
const handleCreateExam = () => {
  if (window.handleExamCorrectionView) {
    window.handleExamCorrectionView();
  } else {
    navigate('/exam-correction');
  }
};

  // Loading state
  if (loading && exams.length === 0 && studentOwnResults.length === 0) {
    return (
      <div className="exam-analytics-fullscreen">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading exam data...</p>
        </div>
      </div>
    );
  }

  // Student View
  if (role === 'student') {
    return (
      <div className="exam-analytics-dashboard">
        <div className="exam-analytics-header">
          <div className="header-content">
            <div className="header-icon student">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <div>
              <h1 className="header-title">📊 My Exam Results</h1>
              <p className="header-subtitle">View your exam performance and progress</p>
            </div>
          </div>
        </div>

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

        {studentOwnResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Results Available</h3>
            <p>You don't have any exam results yet.</p>
          </div>
        ) : (
          <div className="results-grid">
            {studentOwnResults.map((result, index) => (
              <div key={index} className="result-card">
                <div className="result-header">
                  <h3 className="result-exam-name">{result.exam_name}</h3>
                  <span 
                    className="result-grade"
                    style={{ background: getGradeColor(result.grade) }}
                  >
                    {result.grade}
                  </span>
                </div>
                
                <div className="result-info">
                  <div className="info-row">
                    <span className="info-label">Exam Type:</span>
                    <span className="info-value">{result.exam_type}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Class:</span>
                    <span className="info-value">{result.class_section}</span>
                  </div>
                </div>

                <div className="result-score">
                  <div className="score-circle">
                    <svg viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={getGradeColor(result.grade)}
                        strokeWidth="8"
                        strokeDasharray={`${result.overall_percentage * 2.827} 282.7`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="score-text">
                      <span className="score-percentage">{result.overall_percentage.toFixed(1)}%</span>
                      <span className="score-marks">{result.total_marks_obtained}/{result.total_max_marks}</span>
                    </div>
                  </div>
                </div>

                {result.strengths && (
                  <div className="result-insights">
                    <div className="insight-item strengths">
                      <strong>💪 Strengths:</strong>
                      <p>{result.strengths}</p>
                    </div>
                  </div>
                )}

                {result.areas_for_improvement && (
                  <div className="result-insights">
                    <div className="insight-item improvements">
                      <strong>📈 Areas to Improve:</strong>
                      <p>{result.areas_for_improvement}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Teacher View - Exam List
  if (role === 'teacher' && viewMode === 'list') {
    return (
      <div className="exam-analytics-dashboard">
        <div className="exam-analytics-header">
          <div className="header-content">
            <div className="header-icon teacher">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <h1 className="header-title">📊 Exam Analytics</h1>
              <p className="header-subtitle">View and analyze all your exam results</p>
            </div>
          </div>
          <button 
            className="create-exam-btn"
            onClick={handleCreateExam}
          >
            <span>➕</span>
            Create New Exam
          </button>
        </div>

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

        {exams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Exams Created Yet</h3>
            <p>Create your first exam to start grading and analyzing student performance.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/exam-correction')}
            >
              <span>➕</span>
              Create First Exam
            </button>
          </div>
        ) : (
          <div className="exams-grid">
            {exams.map((exam) => (
              <div 
                key={exam.id} 
                className="exam-card"
                onClick={() => handleExamSelect(exam)}
              >
                <div className="exam-card-header">
                  <h3 className="exam-name">{exam.name}</h3>
                  <span className={`exam-type-badge ${exam.exam_type.toLowerCase()}`}>
                    {exam.exam_type}
                  </span>
                </div>

                <div className="exam-info">
                  <div className="info-row">
                    <span className="info-label">Class:</span>
                    <span className="info-value">{exam.class_section}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Students:</span>
                    <span className="info-value">{exam.total_students}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Avg Score:</span>
                    <span className={`info-value ${getPerformanceClass(exam.average_score)}`}>
                      {exam.average_score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="exam-dates">
                  <div className="date-item">
                    <span className="date-label">Created:</span>
                    <span className="date-value">{formatDate(exam.created_at)}</span>
                  </div>
                  {exam.processed_at && (
                    <div className="date-item">
                      <span className="date-label">Processed:</span>
                      <span className="date-value">{formatDate(exam.processed_at)}</span>
                    </div>
                  )}
                </div>

                <button className="view-details-btn">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Teacher View - Exam Details
  if (role === 'teacher' && viewMode === 'details' && selectedExam) {
    return (
      <div className="exam-analytics-dashboard">
        <div className="exam-analytics-header">
          <div className="header-content">
            <button className="back-btn" onClick={handleBackToList}>
              ← Back
            </button>
            <div>
              <h1 className="header-title">{selectedExam.name}</h1>
              <p className="header-subtitle">
                {examStats?.classSection} • {examStats?.totalStudents} Students • {selectedExam.exam_type}
              </p>
            </div>
          </div>
        </div>

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

        {studentResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Results Available</h3>
            <p>No student results found for this exam.</p>
          </div>
        ) : (
          <div className="results-table-container">
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Roll Number</th>
                  <th>Marks Obtained</th>
                  <th>Max Marks</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Strengths</th>
                  <th>Areas for Improvement</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((result, index) => (
                  <tr key={result.student_id}>
                    <td>{index + 1}</td>
                    <td className="roll-number">{result.roll_number}</td>
                    <td>{result.total_marks_obtained}</td>
                    <td>{result.total_max_marks}</td>
                    <td>
                      <span className={`percentage-badge ${getPerformanceClass(result.overall_percentage)}`}>
                        {result.overall_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span 
                        className="grade-badge"
                        style={{ background: getGradeColor(result.grade) }}
                      >
                        {result.grade}
                      </span>
                    </td>
                    <td className="insights-cell">{result.strengths || 'N/A'}</td>
                    <td className="insights-cell">{result.areas_for_improvement || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ExamAnalytics;