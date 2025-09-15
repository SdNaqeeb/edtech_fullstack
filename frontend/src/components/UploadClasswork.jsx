import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import "./UploadClasswork.css"

const UploadClasswork = () => {
  const [classworkList, setclassworkList] = useState([]);
  const [selectedclassworkId, setSelectedclassworkId] = useState(null); // <-- single select
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingclasswork, setFetchingclasswork] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchclassworkList();
  }, []);

  const fetchclassworkList = async () => {
    try {
      setFetchingclasswork(true);
      setError(null);
      const response = await axiosInstance.get('/classwork-list/');
      setclassworkList(response.data.homework_codes);
      console.log('classwork-list data', response.data.classwork_codes);
    } catch (error) {
      console.error('Error fetching classwork list:', error);
      setError('Failed to fetch classwork list. Please try again.');
    } finally {
      setFetchingclasswork(false);
    }
  };

  const handleclassworkSelect = (classworkId) => {
    setSelectedclassworkId(classworkId);
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

    if (!selectedclassworkId) {
      setError('Please select one classwork');
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
      formData.append('homework_code', selectedclassworkId.trim());
      formData.append('pdf_response', pdfFile);

      const response = await axiosInstance.post('auto-classwork-submission/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const percentCompleted = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(percentCompleted);
        },
      });
      

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setSelectedclassworkId(null);
        setPdfFile(null);
        setUploadProgress(0);
        const input = document.getElementById('pdf-upload');
        if (input) input.value = null;

        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error uploading classwork:', error);
      setError('Failed to upload classwork. Please try again.');
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
    // <div className="upload-classwork-container">
    //   <div className="upload-classwork-wrapper">
    //     <h2 className="upload-classwork-title">📑 Upload classwork PDF</h2>

    //     {error && (
    //       <div className="alert alert-error">
    //         <span className="alert-icon">❌</span>
    //         {error}
    //       </div>
    //     )}

    //     {success && (
    //       <div className="alert alert-success">
    //         <span className="alert-icon">✅</span>
    //         classwork uploaded successfully!
    //       </div>
    //     )}

    //     <form onSubmit={handleSubmit} className="upload-classwork-form">
    //       {/* classwork Selection Section */}
    //       <div className="form-section">
    //         <h3 className="section-title">Select classwork</h3>

    //         {fetchingclasswork ? (
    //           <div className="loading-spinner">
    //             <div className="spinner"></div>
    //             <span>Loading classwork list...</span>
    //           </div>
    //         ) : (
    //           <>
    //             <div className="classwork-list">
    //               {classworkList.length === 0 ? (
    //                 <div className="empty-state">
    //                   <p>No classwork available</p>
    //                 </div>
    //               ) : (
    //                 classworkList.map((classwork) => (
    //                   <div className="classwork-item" key={classwork}>
    //                     <label className="checkbox-label">
    //                       <input
    //                         type="radio"                         // <-- radio
    //                         name="classwork"                      // same name to group
    //                         checked={selectedclassworkId === classwork}
    //                         onChange={() => handleclassworkSelect(classwork)}
    //                         className="checkbox-input"
    //                       />
    //                       <div className="classwork-info">
    //                         <span className="classwork-title">
    //                           {classwork || `classwork #${classwork}`}
    //                         </span>
    //                       </div>
    //                     </label>
    //                   </div>
    //                 ))
    //               )}
    //             </div>

    //             <div className="selected-count">
    //               {selectedclassworkId ? '1 classwork selected' : '0 classwork selected'}
    //             </div>
    //           </>
    //         )}
    //       </div>

    //       {/* File Upload Section */}
    //       <div className="form-section">
    //         <h3 className="section-title">Upload PDF File</h3>

    //         <div className="file-upload-container">
    //           <label htmlFor="pdf-upload" className="file-upload-label">
    //             <div className="file-upload-icon">📄</div>
    //             <span className="file-upload-text">
    //               {pdfFile ? pdfFile.name : 'Choose PDF file'}
    //             </span>
    //             {pdfFile && <span className="file-size">({formatFileSize(pdfFile.size)})</span>}
    //           </label>
    //           <input
    //             id="pdf-upload"
    //             type="file"
    //             accept=".pdf"
    //             onChange={handleFileChange}
    //             className="file-input"
    //           />
    //         </div>
    //       </div>

    //       {/* Upload Progress */}
    //       {loading && uploadProgress > 0 && (
    //         <div className="upload-progress">
    //           <div className="progress-bar">
    //             <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
    //           </div>
    //           <span className="progress-text">{uploadProgress}%</span>
    //         </div>
    //       )}

    //       {/* Submit Button */}
    //       <button
    //         type="submit"
    //         disabled={loading || !selectedclassworkId || !pdfFile}
    //         className="submit-button"
    //       >
    //         {loading ? (
    //           <>
    //             <span className="spinner-small"></span>
    //             Uploading...
    //           </>
    //         ) : (
    //           <>
    //             <span>📤</span>
    //             Upload classwork
    //           </>
    //         )}
    //       </button>
    //     </form>
    //   </div>
    // </div>

  return (
    <>coming soon...</>
  );
};

export default UploadClasswork;
