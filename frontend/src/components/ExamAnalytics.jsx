import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import './ExamAnalytics.css';

// FIXED: Correct import for jsPDF with autoTable
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExamAnalytics = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  
  // State management
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [examStats, setExamStats] = useState(null);
  const [studentOwnResults, setStudentOwnResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [editingRow, setEditingRow] = useState(null);
  const [editedMarks, setEditedMarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(null);
  
  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherExams();
    } else if (role === 'student') {
      fetchStudentResults();
    }
  }, [role]);

  const fetchTeacherExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/exam-details/');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError(error.response?.status === 403 
        ? 'Access denied. Only teachers can view this page.' 
        : 'Failed to fetch exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExamResults = async (examId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/student-results/?exam_id=${examId}`);
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

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/student-results/');
      setStudentOwnResults(response.data.results || []);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setError('Failed to fetch your results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
    fetchExamResults(exam.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedExam(null);
    setStudentResults([]);
    setExamStats(null);
    setEditingRow(null);
    setUpdateSuccess(null);
  };

  const handleEditClick = (result) => {
    setEditingRow(result.student_result_id);
    setEditedMarks(result.total_marks_obtained.toString());
    setUpdateSuccess(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditedMarks('');
    setUpdateSuccess(null);
    setError(null);
  };

  const handleSaveMarks = async (studentResultId, maxMarks) => {
  const marksValue = Number(editedMarks);

  if (isNaN(marksValue)) {
    setError('Please enter a valid number for marks');
    return;
  }

  if (marksValue < 0) {
    setError('Marks cannot be negative');
    return;
  }

  if (marksValue > maxMarks) {
    setError(`Marks cannot exceed maximum marks (${maxMarks})`);
    return;
  }

  try {
    setIsUpdating(true);
    setError(null);

    const formData = new FormData();
    formData.append('student_result_id', studentResultId);
    formData.append('updated_marks', marksValue);

    console.log('Sending form data:');
    for (const pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    let response;
    try {
      response = await axiosInstance.post('/update-student-result/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('Trying without /api/ prefix...');
        response = await axiosInstance.post('/update-student-result/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        throw err;
      }
    }

    console.log('Update successful:', response.data);
    setUpdateSuccess('Successfully updated marks!');
    await fetchExamResults(selectedExam.id);
    setEditingRow(null);
    setEditedMarks('');
    setTimeout(() => setUpdateSuccess(null), 3000);

  } catch (error) {
    console.error('Error updating marks:', error);

    let errorMessage = 'Failed to update marks. ';
    if (error.response?.status === 404) {
      errorMessage += 'API endpoint not found. Contact administrator.';
    } else if (error.response?.status === 403) {
      errorMessage += 'Access denied. Only teachers can update marks.';
    } else if (error.response?.status === 500) {
      errorMessage += 'Server error. Check backend logs.';
    } else if (error.response?.data?.error) {
      errorMessage += error.response.data.error;
    } else {
      errorMessage += 'Please try again.';
    }

    setError(errorMessage);
  } finally {
    setIsUpdating(false);
  }
};


  // FIXED: PDF generation with correct autoTable usage
  const handleDownloadPDF = () => {
    try {
      setError(null);
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Exam Analytics Report', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Exam: ${selectedExam.name}`, 20, 35);
      doc.text(`Type: ${selectedExam.exam_type}`, 20, 42);
      doc.text(`Class: ${examStats?.classSection}`, 20, 49);
      doc.text(`Total Students: ${examStats?.totalStudents}`, 20, 56);
      doc.text(`Average: ${selectedExam.average_score.toFixed(2)}%`, 20, 63);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70);
      
      const tableData = studentResults.map((result, index) => [
        index + 1,
        `${result.student_fullname || 'N/A'}\nRoll: ${result.roll_number || 'N/A'}`,
        result.total_marks_obtained || 0,
        result.total_max_marks || 0,
        `${result.overall_percentage?.toFixed(2) || 0}%`,
        result.grade || 'N/A',
        result.strengths || 'N/A',
        result.areas_for_improvement || 'N/A'
      ]);
      
      // FIXED: Using autoTable function directly
      autoTable(doc, {
        startY: 80,
        head: [['#', 'Full Name', 'Marks', 'Max', '%', 'Grade', 'Strengths', 'Improvements']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 40, fontSize: 7 },
          7: { cellWidth: 40, fontSize: 7 }
        }
      });
      
      const filename = `${selectedExam.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      console.log('PDF generated successfully');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      setError(`PDF generation failed: ${error.message}`);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#10b981', 'A': '#16a34a', 'B+': '#3b82f6', 
      'B': '#2563eb', 'C': '#f59e0b', 'D': '#ef4444', 'F': '#dc2626'
    };
    return colors[grade] || '#6b7280';
  };

  const getPerformanceClass = (percentage) => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    if (percentage >= 40) return 'below-average';
    return 'poor';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleCreateExam = () => {
    if (window.handleExamCorrectionView) {
      window.handleExamCorrectionView();
    } else {
      navigate('/exam-correction');
    }
  };

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

  // Student View remains same as before...
  if (role === 'student') {
    return (
      <div className="exam-analytics-dashboard">
        {/* Student view JSX... */}
      </div>
    );
  }

  // Teacher List View
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
              <h1 className="exam-header-title">📊 Exam Analytics</h1>
              <p className="header-subtitle">View and analyze all your exam results</p>
            </div>
          </div>
          <button className="create-exam-btn" onClick={handleCreateExam}>
            <span>➕</span> Create New Exam
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
            <button className="btn btn-primary" onClick={handleCreateExam}>
              <span>➕</span> Create First Exam
            </button>
          </div>
        ) : (
          <div className="exams-grid">
            {exams.map((exam) => (
              <div key={exam.id} className="exam-card" onClick={() => handleExamSelect(exam)}>
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
                <button className="view-details-btn">View Details →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // FIXED: Teacher Details View - No horizontal scroll, removed Roll Number column
  if (role === 'teacher' && viewMode === 'details' && selectedExam) {
    return (
      <div className="exam-analytics-dashboard">
        <div className="exam-analytics-header">
          <div className="header-content">
            <button className="back-btn" onClick={handleBackToList}>← Back</button>
            <div>
              <h1 className="header-title">{selectedExam.name}</h1>
              <p className="header-subtitle">
                {examStats?.classSection} • {examStats?.totalStudents} Students • {selectedExam.exam_type}
              </p>
            </div>
          </div>
          <button 
            className="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={studentResults.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Download PDF</span>
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

        {updateSuccess && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{updateSuccess}</span>
          </div>
        )}

        {studentResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Results Available</h3>
            <p>Results are still being processed or no submissions were found.</p>
          </div>
        ) : (
          <div className="results-table-container-fixed">
            <table className="results-table-fixed">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th className="col-name">Full Name</th>
                  <th className="col-marks">Marks</th>
                  <th className="col-max">Max</th>
                  <th className="col-percentage">%</th>
                  <th className="col-grade">Grade</th>
                  <th className="col-strengths">Strengths</th>
                  <th className="col-improvements">Areas for Improvement</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((result, index) => (
                  <tr key={result.student_result_id} className="question-row">
                    <td className="col-number">{index + 1}</td>
                    <td className="col-name">
                      <div className="student-name-cell">
                        <strong className="student-fullname">{result.student_fullname || 'N/A'}</strong>
                        <div className="roll-subtitle">Roll: {result.roll_number || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="col-marks">
                      {editingRow === result.student_result_id ? (
                        <div className="edit-marks-cell">
                          <input
                            type="number"
                            className="edit-marks-input"
                            value={editedMarks}
                            onChange={(e) => setEditedMarks(e.target.value)}
                            min="0"
                            max={result.total_max_marks}
                            step="0.5"
                            disabled={isUpdating}
                          />
                        </div>
                      ) : (
                        <span>{result.total_marks_obtained || 0}</span>
                      )}
                    </td>
                    <td className="col-max">{result.total_max_marks || 0}</td>
                    <td className="col-percentage">
                      <span className={`percentage-badge ${getPerformanceClass(result.overall_percentage || 0)}`}>
                        {result.overall_percentage?.toFixed(2) || 0}%
                      </span>
                    </td>
                    <td className="col-grade">
                      <span className="grade-badge" style={{ backgroundColor: getGradeColor(result.grade) }}>
                        {result.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="col-strengths">
                      <div className="insights-text">{result.strengths || 'N/A'}</div>
                    </td>
                    <td className="col-improvements">
                      <div className="insights-text">{result.areas_for_improvement || 'N/A'}</div>
                    </td>
                    <td className="col-actions">
                      {editingRow === result.student_result_id ? (
                        <div className="edit-actions">
                          <button
                            className="save-btn"
                            onClick={() => handleSaveMarks(result.student_result_id, result.total_max_marks)}
                            disabled={isUpdating}
                            title="Save"
                          >
                            {isUpdating ? (
                              <span className="spinner-small"></span>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                          <button className="cancel-btn" onClick={handleCancelEdit} disabled={isUpdating} title="Cancel">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button className="edit-btn" onClick={() => handleEditClick(result)} title="Edit marks">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                    </td>
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