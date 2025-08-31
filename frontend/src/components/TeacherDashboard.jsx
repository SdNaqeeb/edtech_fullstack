import React, { useState, useEffect, useContext } from 'react';
import './TeacherDashboard.css';
import axiosInstance from '../api/axiosInstance';
import CameraCapture from './CameraCapture';
import QuestionListModal from './QuestionListModal'; // Import the modal
import { AuthContext } from './AuthContext';

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

  const { username } = useContext(AuthContext);

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
        question_image: worksheet.question_image,// No base64 images in worksheet upload response
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
                  className={`btn-primary `}
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

      {/* Assignments List */}
      {/* <div className="dashboard-card assignments-list-card">
        <div className="card-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <h2 className="card-title">Your Assignments</h2>
            <p className="card-description">Manage your created assignments and view submissions</p>
          </div>
        </div>
        
        <div className="card-content">
          <div className="assignments-list">
            {mappedAssignments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <p>No assignments created yet</p>
              </div>
            ) : (
              mappedAssignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-header">
                    <h3 className="assignment-title">{assignment.title}</h3>
                    <div className="submission-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {getSubmissionCount(assignment.id)} submissions
                    </div>
                  </div>
                  {assignment.description && (
                    <p className="assignment-description">{assignment.description}</p>
                  )}
                  {assignment.imageUrl && (
                    <img
                      src={`data:image/jpeg;base64,${assignment.imageUrl}`}
                      alt="Assignment"
                      className="assignment-image"
                    />
                  )}
                  <div className="assignment-dates">
                    <span>Created: {assignment.createdAt.toLocaleDateString()}</span>
                    <span>Due: {assignment.dueDate.toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div> */}

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
    </div>
  );
};

export default TeacherDashboard;