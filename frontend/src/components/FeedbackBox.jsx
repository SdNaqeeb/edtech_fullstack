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
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
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
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
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

    // Validation: rating is required
    if (rating === 0) {
      showAlert("Please select a star rating", "warning");
      return;
    }

    // If rating is 1 or 2, text feedback is required
    if ((rating === 1 || rating === 2) && !feedbackText.trim()) {
      showAlert("Please provide text feedback for low ratings", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("message", feedbackText.trim());
      formData.append("rating", rating.toString());


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
      setRating(0);
      setHoveredStar(0);
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
            {/* Star Rating */}
            <Form.Group className="mb-3">
              <Form.Label>Rate your experience:</Form.Label>
              <div className="star-rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    disabled={isSubmitting}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <FontAwesomeIcon
                      icon={star <= (hoveredStar || rating) ? faStar : faStarRegular}
                      className="star-icon"
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="rating-message">
                  {rating <= 2 && "We're sorry to hear that. Please tell us how we can improve."}
                  {rating === 3 && "Thanks for your feedback! Let us know what we can do better."}
                  {rating >= 4 && "Great! We're glad you're enjoying it!"}
                </div>
              )}
            </Form.Group>

            {/* Conditional Feedback Text */}
            <div
              className={`feedback-textarea-wrapper ${
                rating === 0 ? 'hidden' : rating >= 3 ? 'optional' : 'required'
              }`}
            >
              <Form.Group className="mb-3">
                <Form.Label>
                  Your feedback{rating >= 3 ? ' (optional):' : ':'}
                  {rating >= 1 && rating <= 2 && (
                    <span className="required-indicator"> *</span>
                  )}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder={
                    rating <= 2
                      ? "Please tell us what went wrong and how we can improve..."
                      : "Tell us about your experience, suggestions, or report an issue..."
                  }
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={isSubmitting}
                  required={rating >= 1 && rating <= 2}
                />
              </Form.Group>
            </div>

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
                disabled={
                  isSubmitting ||
                  rating === 0 ||
                  ((rating === 1 || rating === 2) && !feedbackText.trim())
                }
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