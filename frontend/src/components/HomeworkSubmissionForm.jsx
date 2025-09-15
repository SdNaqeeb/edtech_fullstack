
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { AuthContext } from './AuthContext';
import CameraCapture from './CameraCapture';
import './HomeworkSubmissionForm.css';
import MarkdownWithMath from './MarkdownWithMath';

const HomeworkSubmissionForm = () => {
  const [submissionType, setSubmissionType] = useState("text");
  const [textResponse, setTextResponse] = useState("");
  const [imageFiles, setImageFiles] = useState([]); // Changed from single file to array
  const [imageSourceType, setImageSourceType] = useState("upload"); // "upload" or "camera"
  const [assignment, setAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Add upload progress
  const location = useLocation();
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Get homework details from location state (passed from notification)
        const homeworkDetails = location.state?.homeworkDetails;
        console.log("from location.state :",homeworkDetails)
        // Get homework code from either state or URL query parameters
        // const homeworkCode = location.state?.homeworkCode || new URLSearchParams(location.search).get('code');
        const homeworkCode=homeworkDetails.homework_code;
        console.log("Homework_Code", homeworkCode)
        if (!homeworkCode) {
          setError("No homework code provided");
          return;
        }
        
        // If homework details are passed directly, use them
        if (homeworkDetails) {
          console.log("Using homework details from navigation state:", homeworkDetails);
          setAssignment(homeworkDetails);
         }
        //  else {
        //   // Otherwise fetch the details using the homework code
        //   console.log("Fetching homework details for code:", homeworkCode);
        //   const response = await axiosInstance.get(`/homework/${homeworkCode}/`);
        //   setAssignment(response.data);
        // }
      } catch (error) {
        // setError(error.response?.data?.message || "Failed to fetch assignment details");
        console.error("Error fetching assignment:", error);
      }
    };
    
    fetchAssignment();
  }, [location]);

  // Handle multiple image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file size before accepting
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024); // 5MB limit

    if (oversizedFiles.length > 0) {
      setError(
        `Some files exceed the 5MB size limit. Please select smaller images.`
      );
      return;
    }

    setImageFiles(prevImages => [...prevImages, ...files]);
    setError(null); // Clear previous errors
  };

  // Handle captured image from camera
  const handleCapturedImage = (capturedImageBlob) => {
    // Convert blob to File object
    const file = new File([capturedImageBlob], `homework-response-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setImageFiles(prevImages => [...prevImages, file]);
    setError(null);
  };

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Cancel/Remove specific image
  const handleCancelImage = (index) => {
    const updatedImages = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedImages);
  };

  // Clear all images
  const handleClearAllImages = () => {
    setImageFiles([]);
  };

  // Check if user is loaded
  if (!username) {
    return (
      <div className="submission-form-container">
        <div className="submission-card">
          <div className="loading-state">
            <div>Please log in to submit homework</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if assignment is loaded
  if (!assignment) {
    return (
      <div className="submission-form-container">
        <div className="submission-card">
          <div className="loading-state">
            {error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div>Loading assignment details...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    if (submissionType === "text" && !textResponse.trim()) {
      setError("Please provide a text response");
      setIsSubmitting(false);
      return;
    }
    if (submissionType === "image" && imageFiles.length === 0) {
      setError("Please upload or capture at least one image");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('homework_code', assignment.homework_code);
      formData.append('student_id', username);
      formData.append('submission_type', submissionType);

      if (submissionType === "text") {
        formData.append('text_response', textResponse.trim());
      } else if (imageFiles.length > 0) {
        // Append multiple image files
        imageFiles.forEach((file, index) => {
          formData.append('image_response', file);
        });
      }

      // Submit the homework with progress tracking
      console.log(formData);
      
      let response;
      if (submissionType === "image" && imageFiles.length > 0) {
        // Use custom upload method with progress tracking for images
        response = await axiosInstance.uploadFile(
          '/homework-submission/',
          formData,
          handleUploadProgress
        );
      } else {
        // Regular request for text submissions
        response = await axiosInstance.post('/homework-submission/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSuccess("Homework submitted successfully!");
      setTextResponse("");
      setImageFiles([]);
      setUploadProgress(0);

      // Redirect to student dashboard after submission
      setTimeout(() => {
        navigate('/student-dash', {
          state: {
            message: 'Homework submitted successfully!',
            type: 'success'
          }
        });

        // setTimeout(() => {
        //   window.location.reload();
        // }, 100);
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit homework");
      console.error("Error submitting homework:", error);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if assignment is overdue
  const isOverdue = assignment.due_date ? (new Date() > new Date(assignment.due_date)) : false;

  return (
    <div className="submission-form-container">
      <div className="submission-card">
        <div className="card-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="card-title">Submit Homework</h2>
            <p className="card-description">Submit your response for the assignment</p>
          </div>
        </div>

        <div className="card-content">
          {/* Assignment Details */}
          <div className="assignment-details">
            <h3 className="assignment-title">{assignment.title || 'Untitled Homework'}</h3>
            
              {assignment.questions && assignment.questions.map((question, index) => {
    return (  
      <div key={index} className="assignment-question">
        <h4 className="question-title">Question {index + 1}</h4>
        <div className="question-text"><MarkdownWithMath content={question.question} /></div>
  
        {question.image && (
          <img 
            src={question.image} 
            alt={`Question ${index + 1}`} 
            className="question-image"
          />
        )}
      </div>
    );
  })}
            <div className="assignment-meta">
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
                {assignment.due_date && (
                  <> at {new Date(assignment.due_date).toLocaleTimeString()}</>
                )}
              </div>
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Student: {username}
              </div>
            </div>
            {isOverdue && (
              <div className="overdue-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                This assignment is overdue
              </div>
            )}
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="submission-form">
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
            
            <div className="form-group">
              <label className="form-label">Response Type</label>
              <div className="type-buttons">
                <button
                  type="button"
                  className={`type-btn ${submissionType === "text" ? 'active' : ''}`}
                  onClick={() => {
                    setSubmissionType("text");
                    setImageFiles([]); // Clear images when switching to text
                  }}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  Text Response
                </button>
                <button
                  type="button"
                  className={`type-btn ${submissionType === "image" ? 'active' : ''}`}
                  onClick={() => {
                    setSubmissionType("image");
                    setTextResponse(""); // Clear text when switching to image
                  }}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="12" cy="8" r="3"/>
                    <polyline points="16,21 16,14 8,14 8,21"/>
                  </svg>
                  Image Response
                </button>
              </div>
            </div>

            {submissionType === "text" ? (
              <div className="form-group">
                <label htmlFor="text-response" className="form-label">Your Response</label>
                <textarea
                  id="text-response"
                  className="form-textarea"
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  placeholder="Write your homework response here..."
                  rows="8"
                  required
                  disabled={isSubmitting}
                />
                <p className="character-count">{textResponse.length} characters</p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Image Source</label>
                  <div className="type-buttons">
                    <button
                      type="button"
                      className={`type-btn ${imageSourceType === "upload" ? 'active' : ''}`}
                      onClick={() => setImageSourceType("upload")}
                      disabled={isSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Images
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${imageSourceType === "camera" ? 'active' : ''}`}
                      onClick={() => setImageSourceType("camera")}
                      disabled={isSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Take Photos
                    </button>
                  </div>
                </div>

                {imageSourceType === "upload" ? (
                  <div className="form-group">
                    <label htmlFor="image-response" className="form-label">Upload Your Response Images</label>
                    <input
                      id="image-response"
                      type="file"
                      className="form-input file-input"
                      accept="image/*"
                      multiple // Enable multiple file selection
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                    <p className="form-text-muted">
                      Maximum file size: 5MB per image. You can select multiple images.
                    </p>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Capture Your Response Images</label>
                    <div className="camera-capture-container">
                      <CameraCapture
                        onImageCapture={handleCapturedImage}
                        videoConstraints={{ 
                          facingMode: { ideal: "environment" },
                          // For text documents, use higher resolution
                          width: { ideal: 4096 },
                          height: { ideal: 3072 },
                          // Additional constraints for clarity
                          focusMode: { ideal: "continuous" },
                          exposureMode: { ideal: "continuous" }
                        }}
                      />
                      <p className="form-text-muted">
                        Click "Capture" to take photos of your homework response. You can capture multiple images.
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isSubmitting && uploadProgress > 0 && (
                  <div className="upload-progress">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {uploadProgress}%
                      </div>
                    </div>
                    <p className="progress-text">
                      Uploading images... Please don't close this page.
                    </p>
                  </div>
                )}

                {/* Image Previews */}
                {imageFiles.length > 0 && (
                  <div className="uploaded-images">
                    <div className="images-header">
                      <h6>Uploaded Images ({imageFiles.length})</h6>
                      <button
                        type="button"
                        className="clear-all-btn"
                        onClick={handleClearAllImages}
                        disabled={isSubmitting}
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="images-grid">
                      {imageFiles.map((image, index) => (
                        <div key={index} className="image-preview-container">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="preview-image"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleCancelImage(index)}
                            disabled={isSubmitting}
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                          <div className="image-info">
                            <span className="image-name">{image.name}</span>
                            <span className="image-size">
                              {(image.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || (submissionType === "image" && imageFiles.length === 0) || (submissionType === "text" && !textResponse.trim())}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Homework'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmissionForm; 