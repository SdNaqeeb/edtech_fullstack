import React, { useState, useRef, useContext } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faPaperPlane,
  faTimes,
  faUpload,
  faComment,
  faComments,
  
} from "@fortawesome/free-solid-svg-icons";
import "./FeedbackBox.css";
import { useAlert } from './AlertBox';
import { AuthContext } from './AuthContext';
import axiosInstance from "../api/axiosInstance";

const FeedbackBox = () => {
  const { username } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const toggleFeedback = () => setIsOpen((o) => !o);

  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileButtonClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match("image.*")) {
      showAlert("Please upload an image file", "warning");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showAlert("Image must be ≤ 12MB", "warning");
      return;
    }
    
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() && !selectedFile) return;

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("message", feedbackText.trim());

      
      if (selectedFile) {
        formData.append("feedback_image", selectedFile, selectedFile.name);
      }

      // Submit to your backend endpoint
      await axiosInstance.post("feedback/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Success feedback
      showAlert("Thank you for your feedback! We appreciate your input.", "success");
      
      // Reset form
      setFeedbackText("");
      clearSelectedFile();
      setIsOpen(false);
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showAlert("Sorry, there was an error submitting your feedback. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertContainer />
      <div className="feedback-box-container">
      {/* Floating Feedback Toggle */}
      <button
        className={`feedback-toggle-btn ${isOpen ? "open" : ""}`}
        onClick={toggleFeedback}
        title={isOpen ? "Close feedback" : "Send feedback"}
      >
        <FontAwesomeIcon icon={isOpen ? faTimes : faComments} />
        {!isOpen && <span className="feedback-label">Feedback</span>}
      </button>

      {/* Feedback Window */}
      <div className={`feedback-box ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="feedback-header">
          <h5>💬 Send Feedback</h5>
          <button className="close-btn" onClick={toggleFeedback}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Feedback Form */}
        <div className="feedback-content">
          <Form onSubmit={submitFeedback}>
            <Form.Group className="mb-3">
              <Form.Label>Your feedback:</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Tell us about your experience, suggestions, or report an issue..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isSubmitting}
              />
            </Form.Group>

            {/* Image Preview */}
            {previewUrl && (
              <div className="feedback-image-preview">
                <img
                  src={previewUrl}
                  alt="Feedback attachment"
                  className="preview-image"
                />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={clearSelectedFile}
                  aria-label="Remove image"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <InputGroup>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={isSubmitting}
              />

              {/* Upload button */}
              <Button
                variant="outline-secondary"
                type="button"
                onClick={handleFileButtonClick}
                title="Attach image"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faUpload} />
              </Button>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting || (!feedbackText.trim() && !selectedFile)}
                title="Send feedback"
                className="flex-grow-1"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {isSubmitting ? " Sending..." : " Send Feedback"}
              </Button>
            </InputGroup>
          </Form>
        </div>
      </div>
    </div>
    </>
  );
};

export default FeedbackBox;