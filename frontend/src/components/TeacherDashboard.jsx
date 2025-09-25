import React, { useState, useEffect, useContext } from 'react';
import './TeacherDashboard.css';
import axiosInstance from '../api/axiosInstance';
import CameraCapture from './CameraCapture';
import QuestionListModal from './QuestionListModal'; // Import the modal
import { AuthContext } from './AuthContext';
import MarkdownWithMath from './MarkdownWithMath';

// ViewQuestionsModal Component with Delete Functionality
const ViewQuestionsModal = ({ show, onHide, worksheetName, questions, loading }) => {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [localQuestions, setLocalQuestions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update local questions when props change
  useEffect(() => {
    setLocalQuestions(questions);
    setSelectedQuestionIds(new Set()); // Reset selections when questions change
  }, [questions]);

  if (!show) return null;

  // Toggle selection of a question
  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Select/Deselect all questions
  const toggleSelectAll = () => {
    if (selectedQuestionIds.size === localQuestions.length) {
      setSelectedQuestionIds(new Set());
    } else {
      const allIds = new Set(localQuestions.map(q => q.id));
      setSelectedQuestionIds(allIds);
    }
  };

  // Handle delete selected questions
  const handleDeleteSelected = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      const formData = new FormData();
      // Append each ID separately - this is what getlist() expects
      const idsArray = Array.from(selectedQuestionIds);
      idsArray.forEach(id => {
        formData.append("worksheet_question_ids", id);
      });
      
      // Use POST method as your backend expects POST, not DELETE
      const response = await axiosInstance.post('/worksheet-delete/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Remove deleted questions from local state
        const updatedQuestions = localQuestions.filter(
          q => !selectedQuestionIds.has(q.id)
        );
        setLocalQuestions(updatedQuestions);
        setSelectedQuestionIds(new Set());
        
        // Show success message
        alert(`Successfully deleted ${idsArray.length} question(s)`);
      } else {
        alert('Failed to delete questions. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting questions:', error);
      alert('An error occurred while deleting questions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;
    
    const questionCount = selectedQuestionIds.size;
    
    return (
      <div 
        className="delete-confirm-overlay" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div 
          className="delete-confirm-modal"
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            transform: 'scale(1)',
            animation: 'modalSlideIn 0.2s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              padding: '12px',
              marginRight: '12px'
            }}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#dc2626" 
                strokeWidth="2"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: '#111827'
            }}>
              Confirm Deletion
            </h3>
          </div>
          
          <p style={{
            margin: '0 0 20px 0',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Are you sure you want to delete {questionCount === 1 
              ? 'this question' 
              : `these ${questionCount} questions`}? This action cannot be undone.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#374151',
                fontWeight: '500',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                backgroundColor: isDeleting ? '#fca5a5' : '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              {isDeleting ? (
                <>
                  <span className="spinner" style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}></span>
                  Deleting...
                </>
              ) : (
                <>Delete {questionCount === 1 ? 'Question' : `${questionCount} Questions`}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="view-modal-overlay" onClick={onHide}>
      <div className="view-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="view-modal-header">
          <h2 className="view-modal-title">
            Worksheet Questions
            {worksheetName && <span className="worksheet-badge">{worksheetName}</span>}
          </h2>
          <button className="view-modal-close" onClick={onHide}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Action Bar */}
        {localQuestions.length > 0 && !loading && (
          <div className="view-modal-actions" style={{
            padding: '10px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={toggleSelectAll}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid',
                  borderColor: selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 ? '#3b82f6' : '#d1d5db',
                  borderRadius: '4px',
                  backgroundColor: selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 ? '#3b82f6' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}>
                  {selectedQuestionIds.size === localQuestions.length && localQuestions.length > 0 && (
                    <svg 
                      width="10" 
                      height="10" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#fff" 
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                Select All
              </button>
              
              {selectedQuestionIds.size > 0 && (
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {selectedQuestionIds.size} selected
                </span>
              )}
            </div>

            {selectedQuestionIds.size > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                style={{
                  padding: '6px 16px',
                  backgroundColor: isDeleting ? '#fca5a5' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Selected
              </button>
            )}
          </div>
        )}

        <div className="view-modal-body">
          {loading ? (
            <div className="view-modal-loading">
              <div className="spinner"></div>
              <p>Loading questions...</p>
            </div>
          ) : localQuestions.length === 0 ? (
            <div className="view-modal-empty">
              <p>No questions found for this worksheet.</p>
            </div>
          ) : (
            <div className="questions-grid">
              {localQuestions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`question-card ${selectedQuestionIds.has(question.id) ? 'selected' : ''}`}
                  onClick={() => toggleQuestionSelection(question.id)}
                  style={{
                    position: 'relative',
                    border: selectedQuestionIds.has(question.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: selectedQuestionIds.has(question.id) ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedQuestionIds.has(question.id)) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.backgroundColor = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedQuestionIds.has(question.id)) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid',
                      borderColor: selectedQuestionIds.has(question.id) ? '#3b82f6' : '#d1d5db',
                      borderRadius: '4px',
                      backgroundColor: selectedQuestionIds.has(question.id) ? '#3b82f6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      {selectedQuestionIds.has(question.id) && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#fff" 
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="question-header">
                    <span className="question">Question {index + 1}</span>
                  </div>
                  
                  <div className="question-content">
                    <div className="question-text">
                      <MarkdownWithMath content={question.question_text} />
                    </div>
                    
                    {question.question_image && (
                      <div className="question-image-container">
                        <img 
                          src={`data:image/jpeg;base64,${question.question_image}`}
                          alt={`Question ${index + 1} diagram`}
                          className="question-image"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="view-modal-footer">
          <div className="footer-info">
            Total Questions: {localQuestions.length}
            {selectedQuestionIds.size > 0 && (
              <span style={{ marginLeft: '15px', color: '#3b82f6' }}>
                | Selected: {selectedQuestionIds.size}
              </span>
            )}
          </div>
          <button className="btn-close-modal" onClick={onHide}>
            Close
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal />
      </div>
    </div>
  );
};

// Main TeacherDashboard Component
const TeacherDashboard = ({ user, assignments, submissions, onAssignmentSubmit }) => {
  const [homework_code, setHomeworkCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [worksheetFile, setWorksheetFile] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [submissionType, setSubmissionType] = useState("text");
  const [imageSourceType, setImageSourceType] = useState("upload"); // "upload" or "camera"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // New fields for worksheet upload - matching backend API structure
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [worksheetName, setWorksheetName] = useState('');

  // New state for question preview modal
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [worksheetUploadData, setWorksheetUploadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [worksheets, setWorksheets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [worksheetToDelete, setWorksheetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for viewing worksheet questions
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewWorksheetName, setViewWorksheetName] = useState('');
  const [viewQuestions, setViewQuestions] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const { username } = useContext(AuthContext);

  // Function to open view modal and fetch questions
  const openViewModal = async (worksheetName) => {
    setShowViewModal(true);
    setViewWorksheetName(worksheetName);
    setViewLoading(true);
    setViewQuestions([]);

    try {
      const response = await axiosInstance.get(`/worksheet-questions/?worksheet_name=${worksheetName}`);
      console.log('Fetched questions:', response.data.worksheet_questions);
      
      // Extract questions from the response
      if (response.data && response.data.worksheet_questions) {
        setViewQuestions(response.data.worksheet_questions);
      } else {
        setViewQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching worksheet questions:', error);
      setError('Failed to fetch worksheet questions');
      setViewQuestions([]);
    } finally {
      setViewLoading(false);
    }
  };

  // Function to close view modal
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewWorksheetName('');
    setViewQuestions([]);
  };

  // Fetch classes on component mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const classResponse = await axiosInstance.get("/classes/");
        const classesData = classResponse.data.data;
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes", error);
      }
    }
    fetchClasses();
  }, []);

  const openDeleteModal = (name) => {
    setWorksheetToDelete(name);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setWorksheetToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!worksheetToDelete) return;
    try {
      setIsDeleting(true);
      // API expects worksheet_name in array form
      const formData = new FormData();
      formData.append("worksheet_names", [worksheetToDelete]);
      await axiosInstance.post('/worksheet-delete/', formData);
      setWorksheets((prev) => prev.filter((w) => w.worksheet_name !== worksheetToDelete));
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting worksheet:', err);
      setError(err.message || 'Failed to delete worksheet');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch subjects when class is selected
  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          const subjectResponse = await axiosInstance.post("/subjects/", {
            class_id: selectedClass,
          });
          setSubjects(subjectResponse.data.data);
          // Reset dependent fields
          setSelectedSubject("");
          setChapters([]);
          setSelectedChapter("");
          setWorksheetName("");
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  // Fetch chapters when subject is selected
  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          const chapterResponse = await axiosInstance.post("/chapters/", {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });
          setChapters(chapterResponse.data.data);
          // Reset dependent fields
          setSelectedChapter("");
          setWorksheetName("");
        } catch (error) {
          console.error("Error fetching chapters:", error);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Auto-generate worksheet name when class, subject, and chapter are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedChapter && submissionType === 'worksheet') {
      const classData = classes.find(cls => cls.class_code === selectedClass);
      const subjectData = subjects.find(sub => sub.subject_code === selectedSubject);
      const chapterData = chapters.find(chap => chap.topic_code === selectedChapter);
      
      if (classData && subjectData && chapterData) {
        const generatedName = `${classData.class_name}_${subjectData.subject_name}_${chapterData.name}_Worksheet`;
        setWorksheetName(generatedName);
      }
    }
  }, [selectedClass, selectedSubject, selectedChapter, submissionType, classes, subjects, chapters]);

  // Function to display questions from the uploaded worksheet response
  const displayWorksheetQuestions = (uploadResponse) => {
    try {
      console.log("Processing worksheet upload response:", uploadResponse);
      
      // Extract questions from saved_worksheets array
      const savedWorksheets = uploadResponse.saved_worksheets || [];
      
      // Process questions to match QuestionListModal format
      const questionsWithImages = savedWorksheets.map((worksheet, index) => ({
        question: worksheet.question_text,
        question_image: worksheet.question_image,
        level: "Medium", // Default level since not provided
        id: worksheet.id,
        question_id: worksheet.question_id,
        worksheet_name: worksheet.worksheet_name,
        has_diagram: worksheet.has_diagram,
        index: index // Add index for selection tracking
      }));

      console.log("Processed questions for modal:", questionsWithImages);
      setQuestionList(questionsWithImages);
      setSelectedQuestions([]); // Reset selected questions
      setIsPreviewMode(true); // Set to preview mode
      setShowQuestionList(true);
    } catch (error) {
      console.error("Error processing worksheet questions:", error);
      setError("Failed to process worksheet questions for preview");
    }
  };

  // Separate function to handle worksheet upload
  const handleWorksheetUpload = async (preview = true) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess('');

      // Validation for worksheet assignments
      if (!selectedClass || !selectedSubject || !selectedChapter || !worksheetName.trim() || (!worksheetFile && preview)) {
        setError('Please fill in all worksheet fields and upload a worksheet file');
        return;
      }

      // Create FormData for worksheet upload to /worksheets/ endpoint
      const formData = new FormData();
      
      if (preview) {
        // First time upload - include file and set preview=true
        formData.append('file', worksheetFile); // Backend expects 'file' key
        formData.append('preview', 'true');
      } else {
        // Final submission - no file, set preview=false and include selected questions
        formData.append('preview', 'false');
        
        // Add selected questions data
        const selectedQuestionsData = selectedQuestions.map(questionData => ({
          id: questionData.id,
          question_id: questionData.question_id,
          question_text: questionData.question,
          worksheet_name: questionData.worksheet_name,
          has_diagram: questionData.has_diagram
        }));
        
        formData.append('selected_questions', JSON.stringify(selectedQuestionsData));
      }
      
      formData.append('class_code', selectedClass);
      formData.append('subject_code', selectedSubject);
      formData.append('topic_code', selectedChapter);
      formData.append('worksheet_name', worksheetName.trim());
      
      // Add due_date if provided
      if (dueDate) {
        formData.append('due_date', new Date(dueDate).toISOString());
      }

      // Store upload data for final submission
      if (preview) {
        setWorksheetUploadData({
          selectedClass,
          selectedSubject,
          selectedChapter,
          worksheetName: worksheetName.trim(),
          dueDate
        });
      }

      // Make API call to worksheets endpoint
      const response = await axiosInstance.post('/worksheets/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Worksheet upload response:', response.data);
      
      if (response.data.success) {
        if (preview) {
          setSuccess(`Successfully processed worksheet! Extracted ${response.data.total_questions} questions. Please select questions to include.`);
          
          // Display questions for selection without resetting form
          displayWorksheetQuestions(response.data);
        } else {
          setSuccess(`Successfully created worksheet assignment with ${selectedQuestions.length} selected questions!`);
          
          // Reset worksheet form after final submission
          setSelectedClass('');
          setSelectedSubject('');
          setSelectedChapter('');
          setWorksheetName('');
          setWorksheetFile(null);
          setDueDate('');
          setSelectedQuestions([]);
          setWorksheetUploadData(null);
          
          // Reset file input
          const worksheetInput = document.getElementById('worksheet-file');
          if (worksheetInput) worksheetInput.value = '';
          
          setShowQuestionList(false);
        }
        
        console.log('Worksheet processing response:', response.data);
      } else {
        setError(response.data.error || 'Failed to process worksheet');
      }

    } catch (error) {
      console.error('Error uploading worksheet:', error);
      setError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to upload and process worksheet'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');

    // Handle worksheet upload separately
    if (submissionType === 'worksheet') {
      await handleWorksheetUpload(true); // true = preview mode
      return;
    }

    setIsSubmitting(true);

    // Validation for non-worksheet assignments
    if (!homework_code.trim() || !title.trim() || !dueDate) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    // Validation for image assignments
    if (submissionType === 'image' && !imageFile) {
      setError('Please upload an image for image assignments');
      setIsSubmitting(false);
      return;
    }

    try {
      // Handle regular assignment creation (homework/classwork)
      let formData;
      if (submissionType === "image" && imageFile) {
        // Use FormData for image and other fields
        formData = new FormData();
        formData.append('homework_code', homework_code.trim());
        formData.append('title', title.trim());
        formData.append('teacherId', user.username);
        formData.append('classId', user.id);
        formData.append('due_date', new Date(dueDate).toISOString());
        formData.append('date_assigned', new Date().toISOString());
        formData.append('image', imageFile);
        // Optionally add description if needed
        if (description) formData.append('description', description);
      } else {
        // For text-only assignments, send JSON
        formData = {
          homework_code: homework_code.trim(),
          title: title.trim(),
          description: submissionType === "text" ? description : undefined,
          teacherId: user.username,
          classId: user.id,
          due_date: new Date(dueDate).toISOString(),
          date_assigned: new Date().toISOString(),
        };
      }

      // Send to backend through parent callback
      if (submissionType === "image" && imageFile) {
        await onAssignmentSubmit(formData, true); // true = isFormData
      } else {
        await onAssignmentSubmit(formData, false);
      }
      setSuccess('Assignment created successfully!');

      // Reset form
      setTitle("");
      setDescription("");
      setImageFile(null);
      setDueDate("");
      setSubmissionType("text");
      setHomeworkCode("");
      setImageSourceType("upload");

      // Reset file inputs
      const imageInput = document.getElementById('assignment-image');
      if (imageInput) imageInput.value = '';

    } catch (error) {
      setError(error.response?.data?.message || "Failed to create assignment");
      console.error("Error creating assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapturedImage = (capturedImageBlob) => {
    // Convert blob to File object
    const file = new File([capturedImageBlob], 'captured-image.jpg', { type: 'image/jpeg' });
    setImageFile(file);
  };

  const handleWorksheetFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'application/pdf' // .pdf
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid document file (.doc, .docx, or .pdf)');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file size (e.g., max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setWorksheetFile(file);
      setError(null); // Clear any previous errors
    }
  };

  // Handle question preview modal actions
  const handleQuestionClick = (question, index, image) => {
    // For teacher dashboard, we might just want to view the question
    // You can implement navigation to a preview/edit mode if needed
    console.log('Teacher viewing question:', { question, index, image });
  };

  const handleMultipleSelectSubmit = async (selectedQuestionsData) => {
    // Handle multiple selection for final worksheet submission
    console.log('Teacher selected questions:', selectedQuestionsData);
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);
    setIsPreviewMode(false);
    
    // Submit the final worksheet with selected questions
    await handleWorksheetUpload(false); // false = final submission mode
  };

  const getSubmissionCount = (assignmentId) => {
    return submissions.filter((s) => s.assignmentId === assignmentId).length;
  };

  const mappedAssignments = assignments.map((a, idx) => {
    const data = a.data || {};
    return {
      id: data.homework_code || idx, // fallback to idx if no code
      title: data.title,
      description: data.description,
      imageUrl: data.attachment, // or null
      createdAt: data.date_assigned ? new Date(data.date_assigned) : new Date(),
      dueDate: data.due_date ? new Date(data.due_date) : new Date(),
    };
  });

  useEffect(() => {
    async function fetchdata() {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/worksheetslist/");
        console.log(response.data);
        setWorksheets(response.data);
      } catch (error) {
        console.error("Error fetching worksheets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchdata();
  }, []);

  return (
    <div className="teacher-dashboard">
      {/* Assignment Creation Form */}
      <div className="dashboard-card create-assignment-card">
        <div className="card-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div>
            <h2 className="card-title">Create New Assignment</h2>
            <p className="card-description">Create a homework assignment for your students</p>
          </div>
        </div>
        
        <div className="card-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="assignment-form">
            {/* Assignment Type Selection - Always show first */}
            <div className="form-group">
              <label className="form-label">Assignment Type</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`btn-primary`}
                  onClick={() => setSubmissionType("worksheet")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Upload Worksheet
                </button>
              </div>
            </div>

            {/* Common fields for Text and Image assignment types only */}
            {submissionType !== 'worksheet' && (
              <>
                <div className="form-group">
                  <label htmlFor="homework_code" className="form-label">Homework Code</label>
                  <input
                    id="homework_code"
                    type="text"
                    className="form-input"
                    value={homework_code}
                    onChange={(e) => setHomeworkCode(e.target.value)}
                    placeholder="Enter homework code"
                    required
                  />
                </div>          
                
                <div className="form-group">
                  <label htmlFor="title" className="form-label">Assignment Title</label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="due-date" className="form-label">Due Date</label>
                  <input
                    id="due-date"
                    type="datetime-local"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {submissionType === "text" && (
              <div className="form-group">
                <label htmlFor="description" className="form-label">Assignment Description</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed assignment instructions"
                  rows="4"
                />
              </div>
            )}

            {submissionType === "image" && (
              <>
                <div className="form-group">
                  <label className="form-label">Image Source</label>
                  <div className="type-buttons">
                    <button
                      type="button"
                      className={`type-btn ${imageSourceType === "upload" ? 'active' : ''}`}
                      onClick={() => setImageSourceType("upload")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Image
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${imageSourceType === "camera" ? 'active' : ''}`}
                      onClick={() => setImageSourceType("camera")}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Take Photo
                    </button>
                  </div>
                </div>

                {imageSourceType === "upload" ? (
                  <div className="form-group">
                    <label htmlFor="assignment-image" className="form-label">Upload Assignment Image</label>
                    <input
                      id="assignment-image"
                      type="file"
                      className="form-input file-input"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <div className="image-preview">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Assignment preview"
                          className="preview-image"
                        />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => setImageFile(null)}
                          style={{
                            marginTop: '10px',
                            padding: '5px 10px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Capture Assignment Image</label>
                    <div style={{
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <CameraCapture onImageCapture={handleCapturedImage} />
                      {imageFile && (
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                          <p style={{ color: '#10b981', fontWeight: '500' }}>
                            ✓ Image captured successfully
                          </p>
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            style={{
                              marginTop: '5px',
                              padding: '5px 10px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Clear Captured Image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {submissionType === "worksheet" && (
              <>
                <div className="form-group">
                  <label htmlFor="due-date-worksheet" className="form-label">Due Date (Optional)</label>
                  <input
                    id="due-date-worksheet"
                    type="datetime-local"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <div className="form-help">
                    Due date is optional for worksheet processing
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="class-select" className="form-label">Class *</label>
                  <select
                    id="class-select"
                    className="form-input"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.class_code} value={cls.class_code}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject-select" className="form-label">Subject *</label>
                  <select
                    id="subject-select"
                    className="form-input"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    disabled={!selectedClass}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.subject_code} value={subject.subject_code}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="chapter-select" className="form-label">Topic/Chapter *</label>
                  <select
                    id="chapter-select"
                    className="form-input"
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    disabled={!selectedSubject}
                    required
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.topic_code} value={chapter.topic_code}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="worksheet-name" className="form-label">Worksheet Name *</label>
                  <input
                    id="worksheet-name"
                    type="text"
                    className="form-input"
                    value={worksheetName}
                    onChange={(e) => setWorksheetName(e.target.value)}
                    placeholder="Worksheet name will be auto-generated"
                    required
                  />
                  <div className="form-help">
                    Auto-generated format: ClassName_SubjectName_ChapterName_Worksheet
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="worksheet-file" className="form-label">Upload Worksheet File *</label>
                  <input
                    id="worksheet-file"
                    type="file"
                    className="form-input"
                    accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    onChange={handleWorksheetFileChange}
                    required
                  />
                  {worksheetFile && (
                    <div className="file-preview">
                      <div className="file-info">
                        <span className="file-name">📄 {worksheetFile.name}</span>
                        <span className="file-size">({(worksheetFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWorksheetFile(null);
                          const worksheetInput = document.getElementById('worksheet-file');
                          if (worksheetInput) worksheetInput.value = '';
                        }}
                        style={{
                          marginTop: '5px',
                          padding: '5px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                  <div className="form-help">
                    Supported formats: Word documents (.doc, .docx) and PDF files (Max: 10MB)
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                submissionType === 'worksheet' ? (
                  <>
                    <span className="loading-spinner"></span>
                    {isPreviewMode ? "Processing Worksheet..." : "Creating Assignment..."}
                  </>
                ) : (
                  "Creating..."
                )
              ) : (
                submissionType === 'worksheet' ? "📤 Process & Preview Worksheet" : "Create Assignment"
              )}
            </button>
          </form>
        </div>
      </div>
      
      <div className="dashboard-card worksheet-list-card">
        <h3 className="worksheet-list-title">Available Worksheets</h3>
        
        {loading ? (
          <div className="loading-container">
            <p>Loading worksheets...</p>
          </div>
        ) : worksheets.length === 0 ? (
          <div className="no-worksheets">
            <p>No worksheets available</p>
          </div>
        ) : (
          <div className="worksheet-list-container">
            <ul className="worksheet-list">
              {worksheets.map((worksheet, index) => (
                <li key={index} className="worksheet-item">
                  <span className="worksheet-number">{index + 1}.</span>
                  <span className="worksheet-name">{worksheet.worksheet_name}</span>
                  <button className="worksheet-action-btn" onClick={() => openViewModal(worksheet.worksheet_name)}>
                    View
                  </button>
                  <button className="worksheet-action-btn" onClick={() => openDeleteModal(worksheet.worksheet_name)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Question Preview Modal */}
      <QuestionListModal
        show={showQuestionList}
        onHide={() => {
          setShowQuestionList(false);
          setSelectedQuestions([]);
          setIsPreviewMode(true);
        }}
        questionList={questionList}
        onQuestionClick={handleQuestionClick}
        isMultipleSelect={isPreviewMode} // Enable multiple selection in preview mode
        onMultipleSelectSubmit={handleMultipleSelectSubmit}
      />

      {/* View Questions Modal */}
      <ViewQuestionsModal
        show={showViewModal}
        onHide={closeViewModal}
        worksheetName={viewWorksheetName}
        questions={viewQuestions}
        loading={viewLoading}
      />

      {showDeleteModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content1">
            <h4 className="modal-title">Confirm Deletion</h4>
            <p className="modal-text">Are you sure you want to delete "{worksheetToDelete}"?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
              <button className="btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;