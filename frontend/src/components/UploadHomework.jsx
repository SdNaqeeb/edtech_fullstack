import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './UploadHomework.css';

const UploadHomework = () => {
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState(null); // <-- single select
  const [pdfFile, setPdfFile] = useState(null);
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
      setHomeworkList(response.data.homework_codes);
      console.log('homework-list data', response.data.homework_codes);
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
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      event.target.value = null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedHomeworkId) {
      setError('Please select one homework');
      return;
    }

    if (!pdfFile) {
      setError('Please select a PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      // keep API compatible: send array with a single id
      formData.append('homework_code', selectedHomeworkId.trim());
      formData.append('pdf_response', pdfFile);

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
        setPdfFile(null);
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
            Homework uploaded successfully!
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
            <h3 className="section-title">Upload PDF File</h3>

            <div className="file-upload-container">
              <label htmlFor="pdf-upload" className="file-upload-label">
                <div className="file-upload-icon">📄</div>
                <span className="file-upload-text">
                  {pdfFile ? pdfFile.name : 'Choose PDF file'}
                </span>
                {pdfFile && <span className="file-size">({formatFileSize(pdfFile.size)})</span>}
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
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
            disabled={loading || !selectedHomeworkId || !pdfFile}
            className="submit-button"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Uploading...
              </>
            ) : (
              <>
                <span>📤</span>
                Upload Homework
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadHomework;
