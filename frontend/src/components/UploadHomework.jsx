import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './UploadHomework.css';

const UploadHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(null); // <-- single select
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHomework, setFetchingHomework] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchHomeworkList();
  }, []);

  const fetchHomeworkList = async () => {
    try {
      setFetchingHomework(true);
      setError(null);
      const response = await axiosInstance.get('/homework-list/');

      // Handle both response formats
      let homeworkCodes = [];
      if (response.data.homework_codes) {
        // Check if it's an array of strings or objects
        if (Array.isArray(response.data.homework_codes)) {
          if (typeof response.data.homework_codes[0] === 'string') {
            // Old format: array of strings
            homeworkCodes = response.data.homework_codes;
          } else if (typeof response.data.homework_codes[0] === 'object') {
            // New format: array of objects
            homeworkCodes = response.data.homework_codes.map(item => item.homework_code);
          }
        }
      }

      setHomeworkList(homeworkCodes);
      console.log('homework-list data', homeworkCodes);
    } catch (error) {
      console.error('Error fetching homework list:', error);
      setError('Failed to fetch homework list. Please try again.');
    } finally {
      setFetchingHomework(false);
    }
  };

  const handleHomeworkSelect = (homeworkId) => {
    setSelectedHomeworkId(homeworkId);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) {
      return; // Don't clear existing files if no new files selected
    }

    // Validate all new files
    const validFiles = [];
    const errors = [];

    files.forEach((file, index) => {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        errors.push(`File ${index + 1} (${file.name}) is not a PDF file.`);
        return;
      }

      // Check file size (30MB = 30 * 1024 * 1024 bytes)
      const maxSize = 30 * 1024 * 1024; // 30MB in bytes
      if (file.size > maxSize) {
        errors.push(`File ${index + 1} (${file.name}) is larger than 30MB.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      event.target.value = null; // Reset the input
      return;
    }

    setError(null); // Clear any previous errors
    // Append new files to existing ones
    setPdfFiles(prevFiles => [...prevFiles, ...validFiles]);
    event.target.value = null; // Reset the input to allow selecting the same files again
  };

  // Remove individual file from selection
  const removePdfFile = (indexToRemove) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedHomeworkId) {
      setError('Please select one homework');
      return;
    }

    if (!pdfFiles || pdfFiles.length === 0) {
      setError('Please select at least one PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      // keep API compatible: send array with a single id
      formData.append('homework_code', selectedHomeworkId.trim());
      
      // Append multiple PDF files
      pdfFiles.forEach((pdf, index) => {
        formData.append('pdf_response', pdf);
      });

      const response = await axiosInstance.post('auto-homework-submission/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percentCompleted);
        },
      });
      

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setSelectedHomeworkId(null);
        setPdfFiles([]);
        setUploadProgress(0);
        const input = document.getElementById('pdf-upload');
        if (input) input.value = null;

        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error uploading homework:', error);
      setError('Failed to upload homework. Please try again.');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-homework-container">
      <div className="upload-homework-wrapper">
        <h2 className="upload-homework-title">📑 Upload Homework PDF</h2>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {pdfFiles.length} homework file(s) uploaded successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-homework-form">
          {/* Homework Selection Section */}
          <div className="form-section">
            <h3 className="section-title">Select Homework</h3>

            {fetchingHomework ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Loading homework list...</span>
              </div>
            ) : (
              <>
                <div className="homework-list">
                  {homeworkList.length === 0 ? (
                    <div className="empty-state">
                      <p>No homework available</p>
                    </div>
                  ) : (
                    homeworkList.map((homework) => (
                      <div className="homework-item" key={homework}>
                        <label className="checkbox-label">
                          <input
                            type="radio"                         // <-- radio
                            name="homework"                      // same name to group
                            checked={selectedHomeworkId === homework}
                            onChange={() => handleHomeworkSelect(homework)}
                            className="checkbox-input"
                          />
                          <div className="homework-info">
                            <span className="homework-title">
                              {homework || `Homework #${homework}`}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>

                <div className="selected-count">
                  {selectedHomeworkId ? '1 homework selected' : '0 homework selected'}
                </div>
              </>
            )}
          </div>

          {/* File Upload Section */}
          <div className="form-section">
            <h3 className="section-title">Upload PDF Files</h3>

            <div className="file-upload-container">
              <label htmlFor="pdf-upload" className="file-upload-label">
                <div className="file-upload-icon">📄</div>
                <span className="file-upload-text">
                  {pdfFiles.length > 0 ? `Choose ${pdfFiles.length} file(s)` : 'Choose PDF files'}
                </span>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                multiple
                className="file-input"
              />
            </div>

            {/* File Preview */}
            {pdfFiles.length > 0 && (
              <div className="file-preview-container">
                <div className="file-preview-header">
                  <span className="file-count">Selected {pdfFiles.length} file(s):</span>
                </div>
                <div className="file-list">
                  {pdfFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-icon">📄</span>
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePdfFile(index)}
                        className="remove-file-btn"
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedHomeworkId || pdfFiles.length === 0}
            className="submit-button"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Uploading {pdfFiles.length} file(s)...
              </>
            ) : (
              <>
                <span>📤</span>
                Upload {pdfFiles.length} Homework File(s)
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadHomework;
