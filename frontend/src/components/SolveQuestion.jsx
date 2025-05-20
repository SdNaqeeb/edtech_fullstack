import React, { useState, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Spinner, Alert, Row, Col } from "react-bootstrap";
import axiosInstance from "../api/axiosInstance";
import "./SolveQuestion.css";
import QuestionListModal from "./QuestionListModal";
import { ProgressContext } from "../contexts/ProgressContext";
import { NotificationContext } from "../contexts/NotificationContext";
import { QuestContext } from "../contexts/QuestContext";
import { QUEST_TYPES } from "../models/QuestSystem";
import { useSoundFeedback } from "../hooks/useSoundFeedback";
import { useTimer } from "../contexts/TimerContext"; // Import the Timer context
import StudyTimer from "./StudyTimer"; // Import the StudyTimer component
import Tutorial from "./Tutorial";
import { useTutorial } from "../contexts/TutorialContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import "./StudyTimer.css"; // Import timer styles

function SolveQuestion() {
  const location = useLocation();
  const navigate = useNavigate();

  // Progress and Notification Contexts
  const { updateStudySession } = useContext(ProgressContext);
  const { addProgressNotification } = useContext(NotificationContext);
  const { updateQuestProgress } = useContext(QuestContext);
  const {
    shouldShowTutorialForPage,
    markPageCompleted,
    setCurrentPage,
    exitTutorialFlow,
    restartTutorialForPage,
  } = useTutorial();

  // Timer context
  const { 
    startTimer, 
    stopTimer, 
    isTimerActive 
  } = useTimer();

  // Sound feedback hook
  const { playQuestionSolvedSound, playAchievementSound } = useSoundFeedback();

  // State for tracking study session
  const [studyTime, setStudyTime] = useState(0);
  const [images, setImages] = useState([]);
  const [isSolveEnabled, setIsSolveEnabled] = useState(true);
  const [showQuestionListModal, setShowQuestionListModal] = useState(false);
  const [processingButton, setProcessingButton] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Extract data from location state
  const {
    question,
    index,
    questionList,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    selectedQuestions,
  } = location.state || {};
  const { questionNumber } = location.state || {};
  const questionId = location.state?.questionId || `question_${index}_${Date.now()}`;
  const question_image =
    location.state?.image || questionList?.[index]?.image || "";

  const [currentQuestion, setCurrentQuestion] = useState({
    question: question,
    questionNumber: questionNumber || (index !== undefined ? index + 1 : 1),
    image: question_image,
    id: questionId
  });

  // Start timer when component mounts
  useEffect(() => {
    if (currentQuestion.id) {
      startTimer(currentQuestion.id);
    }
    
    // Stop timer when component unmounts
    return () => {
      const timeSpent = stopTimer();
      console.log(`Study session ended. Time spent: ${timeSpent}ms`);
    };
  }, [currentQuestion.id]);

  // Tutorial steps for SolveQuestion page
  const tutorialSteps = [
    {
      target: ".study-timer",
      content: "This timer tracks how long you spend on each question. It starts automatically when you open a question and stops when you submit your solution.",
      disableBeacon: true,
    },
    {
      target: ".question-text-container",
      content:
        "This is the question you need to solve. Read it carefully to understand what's being asked.",
    },
    {
      target: "input[type='file']",
      content:
        "Upload images of your solution by clicking here. You can take photos of your work on paper or upload existing images.",
    },
    {
      target: ".btn-submit",
      content:
        "After uploading your solution, click this button to submit it for evaluation.",
    },
    {
      target: "button.btn-correct",
      content:
        "Click here to check if your answer is correct. Our system will analyze your solution image.",
    },
    {
      target: ".btn-back",
      content: "Click here to go back to the previous page.",
    },
    {
      target: ".btn-question-list",
      content: "Click here to see the list of questions.",
    },
    {
      target: ".solve-btn",
      content: "If you're stuck, click here to see a step-by-step solution.",
    },
    {
      target: ".explain-btn",
      content:
        "Need more help? Click here to get an explanation of the concepts needed to solve this problem.",
    },
    {
      target: ".gap-btn",
      content:
        "This will analyze your knowledge gaps related to this question and recommend what to study next.",
    },
  ];

  // Set current page when component mounts
  useEffect(() => {
    console.log("SolveQuestion component mounted");
    setCurrentPage("solveQuestion");

    // Check if tutorial should be shown
    if (shouldShowTutorialForPage("solveQuestion")) {
      console.log("Should show tutorial for SolveQuestion");
    }
  }, [setCurrentPage, shouldShowTutorialForPage]);

  // Handle tutorial completion - this is the final step in the tutorial flow
  const handleTutorialComplete = () => {
    console.log("Tutorial completed in SolveQuestion");
    markPageCompleted("solveQuestion");
    exitTutorialFlow(); // Mark the entire tutorial flow as complete
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64Data, mimeType) => {
    try {
      // Remove data URL prefix if it exists
      const dataStart = base64Data.indexOf(",");
      const actualData =
        dataStart !== -1 ? base64Data.slice(dataStart + 1) : base64Data;

      const byteCharacters = atob(actualData);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      return new Blob(byteArrays, { type: mimeType });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      return null;
    }
  };

  // Log state for debugging
  useEffect(() => {
    console.log("Location state:", location.state);
    console.log("Current question:", currentQuestion);
  }, [location.state, currentQuestion]);

  // Update currentQuestion when location state changes
  useEffect(() => {
    if (location.state) {
      const newQuestionId = location.state?.questionId || `question_${index}_${Date.now()}`;
      
      setCurrentQuestion({
        question: location.state.question || "",
        questionNumber:
          location.state.questionNumber ||
          (index !== undefined ? index + 1 : 1),
        image: location.state.image || "",
        id: newQuestionId
      });

      // Stop previous timer and start a new one
      stopTimer();
      startTimer(newQuestionId);

      // Reset other state
      setImages([]);
      setError(null);
      setUploadProgress(0);
      setProcessingButton(null);
    }
  }, [location.state, index]);

  // Handle image upload
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

    setImages(files);
    setIsSolveEnabled(files.length === 0);
    setError(null); // Clear previous errors
  };

  // Handle upload progress
  const handleUploadProgress = (percent) => {
    setUploadProgress(percent);
  };

  // Handle timer completion
  const handleTimerComplete = (seconds) => {
    setStudyTime(seconds);
  };

  // Handlers for different actions
  const handleSubmit = () => {
    // Stop the timer and get the time spent
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);
    
    // Add study time to the request
    sendFormData({ 
      submit: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "submit");
  };

  const handleSolve = () => {
    // Stop the timer and get the time spent
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);
    
    sendFormData({ 
      solve: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "solve");
  };

  const handleExplain = () => {
    // Stop the timer and get the time spent
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);
    
    sendFormData({ 
      explain: true,
      study_time_seconds: Math.floor(timeSpentMs / 1000),
      study_time_minutes: timeSpentMinutes
    }, "explain");
  };

  // Enhanced handleCorrect function
  const handleCorrect = async () => {
    console.log("Starting handleCorrect function");
    setProcessingButton("correct");
    setError(null);

    // Stop the timer and get the time spent
    const timeSpentMs = stopTimer();
    const timeSpentMinutes = Math.ceil(timeSpentMs / 60000);

    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);
    formData.append("question", currentQuestion.question);
    formData.append("subtopic", subtopic);
    formData.append("correct", true);
    formData.append("study_time_seconds", Math.floor(timeSpentMs / 1000));
    formData.append("study_time_minutes", timeSpentMinutes);

    // Helper: finalize and send the form after appending everything
    const finalizeAndSendForm = async () => {
      // Add user's solution images
      if (images.length > 0) {
        images.forEach((image) => {
          formData.append("ans_img", image);
        });
      }

      try {
        setUploadProgress(0);
        const response = await axiosInstance.uploadFile(
          "/anssubmit/",
          formData,
          handleUploadProgress
        );

        // Update study session
        updateStudySession(
          new Date().toISOString().split("T")[0], 
          timeSpentMinutes, 
          1, 
          100
        );

        // Update quest progress
        updateQuestProgress("daily_solve_questions", 1, QUEST_TYPES.DAILY);

        // Navigate to result page
        navigate("/resultpage", {
          state: {
            ...response.data,
            actionType: "correct",
            questionList,
            class_id,
            subject_id,
            topic_ids,
            subtopic,
            questionImage: currentQuestion.image,
            questionNumber: currentQuestion.questionNumber,
          },
        });

        playQuestionSolvedSound(true, 100);
      } catch (error) {
        console.error("API Error:", error);
        if (error.code === "ECONNABORTED") {
          setError(
            "Request timed out. Please try with a smaller image or check your connection."
          );
        } else if (error.friendlyMessage) {
          setError(error.friendlyMessage);
        } else {
          setError("Failed to correct the solution. Please try again.");
        }
        setProcessingButton(null);
        setUploadProgress(0);
        
        // Restart timer since submission failed
        startTimer(currentQuestion.id);
      }
    };

    // Process question image as base64
    if (currentQuestion.image) {
      if (currentQuestion.image.startsWith("data:image")) {
        // Already base64 – send as-is
        console.log("Detected base64 question image");
        formData.append("ques_img", currentQuestion.image);
        finalizeAndSendForm();
      } else if (currentQuestion.image.startsWith("http")) {
        try {
          const imageResponse = await fetch(currentQuestion.image);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }

          const blob = await imageResponse.blob();
          const reader = new FileReader();

          reader.onloadend = async () => {
            const base64String = reader.result;
            formData.append("question_img_base64", base64String);
            finalizeAndSendForm(); // Proceed after conversion
          };

          reader.readAsDataURL(blob);
        } catch (fetchError) {
          console.error(
            "Error fetching or converting image to base64:",
            fetchError
          );
          setError(`Error fetching image: ${fetchError.message}`);
          finalizeAndSendForm(); // Proceed even if image failed
        }
      } else {
        console.warn(
          "Unsupported image format:",
          currentQuestion.image.substring(0, 30)
        );
        finalizeAndSendForm();
      }
    } else {
      // No question image to process
      finalizeAndSendForm();
    }
  };

  // New handler for Gap Analysis
  const handleGapAnalysis = () => {
    // Stop the timer before navigating
    stopTimer();

    navigate("/gap-analysis", {
      state: {
        question: currentQuestion.question,
        questionImage: currentQuestion.image,
        class_id,
        subject_id,
        topic_ids,
      },
    });
  };

  // Send form data with progress tracking
  const sendFormData = async (flags = {}, actionType) => {
    setProcessingButton(actionType);
    setError(null);

    const formData = new FormData();
    formData.append("class_id", class_id);
    formData.append("subject_id", subject_id);
    formData.append("topic_ids", topic_ids);
    formData.append("question", currentQuestion.question);
    formData.append("subtopic", subtopic);

    Object.entries(flags).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add images if required by the action
    if (flags.submit) {
      images.forEach((image) => {
        formData.append("ans_img", image);
      });
    }

    try {
      // Use the custom upload method for actions with file uploads
      let response;

      if (flags.submit) {
        // Use custom upload method with progress tracking
        response = await axiosInstance.uploadFile(
          "/anssubmit/",
          formData,
          handleUploadProgress
        );
      } else {
        // Regular request for actions without file uploads
        response = await axiosInstance.post("/anssubmit/", formData);
      }

      // Update study session with time info if available
      if (flags.study_time_minutes) {
        updateStudySession(
          new Date().toISOString().split("T")[0],
          flags.study_time_minutes,
          1,
          0 // Accuracy unknown at this point
        );
      }

      // Navigate to results page
      navigate("/resultpage", {
        state: {
          ...response.data,
          actionType,
          questionList,
          class_id,
          subject_id,
          topic_ids,
          subtopic,
          questionImage: currentQuestion.image,
          questionNumber: currentQuestion.questionNumber,
        },
      });
    } catch (error) {
      console.error("API Error:", error);

      // Set user-friendly error message
      if (error.code === "ECONNABORTED") {
        setError(
          "Request timed out. Please try with a smaller image or check your connection."
        );
      } else if (error.friendlyMessage) {
        setError(error.friendlyMessage);
      } else {
        setError("Failed to perform the action. Please try again.");
      }

      setProcessingButton(null);
      setUploadProgress(0);
      
      // Restart timer since submission failed
      startTimer(currentQuestion.id);
    }
  };

  // Cancel image upload
  const handleCancelImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    setIsSolveEnabled(updatedImages.length === 0);
  };

  // Select question from list with tutorial flow handling
  const handleQuestionSelect = (
    selectedQuestion,
    selectedIndex,
    selectedImage
  ) => {
    console.log("Question selected in SolveQuestion");
    console.log("Selected question:", selectedQuestion);
    console.log("Selected image:", selectedImage);

    // Stop the current timer
    stopTimer();

    const newQuestionId = `question_${selectedIndex}_${Date.now()}`;
    
    setCurrentQuestion({
      question: selectedQuestion,
      questionNumber: selectedIndex + 1,
      image: selectedImage,
      id: newQuestionId
    });

    // Start a new timer for the selected question
    startTimer(newQuestionId);

    // Reset image related state
    setImages([]);
    setIsSolveEnabled(true);
    setError(null);
    setUploadProgress(0);

    // Close modal
    setShowQuestionListModal(false);
  };

  // Handle back button click
  const handleBackClick = () => {
    // Stop the timer before navigating back
    stopTimer();
    navigate(-1);
  };

  // Determine if a specific button is processing
  const isButtonProcessing = (buttonType) => {
    return processingButton === buttonType;
  };

  // Determine if any button is processing (to disable all buttons)
  const isAnyButtonProcessing = () => {
    return processingButton !== null;
  };

  return (
    <div className="solve-question-wrapper">
      {shouldShowTutorialForPage("solveQuestion") && (
        <Tutorial steps={tutorialSteps} onComplete={handleTutorialComplete} />
      )}

      <div className="solve-question-container">
        {/* Header section with timer */}
        <div className="solve-question-header d-flex justify-content-between align-items-center mb-3">
          {/* Tutorial restart button */}
          <div className="restart-tutorial-btn-container">
            <Button
              variant="outline-info"
              className="restart-tutorial-btn"
              onClick={() => {
                console.log("Restarting tutorial on SolveQuestion page...");
                restartTutorialForPage("solveQuestion");
              }}
              size="sm"
            >
              <FontAwesomeIcon icon={faQuestionCircle} className="me-2" />
              Replay Tutorial
            </Button>
          </div>
          
          {/* Study Timer */}
          <StudyTimer 
            isActive={isTimerActive}
            questionId={currentQuestion.id}
            onTimerComplete={handleTimerComplete}
            className={processingButton ? "stopped" : ""}
          />
        </div>

        {/* Question Display Section */}
        <div className="question-text-container">
          <span className="question-title">
            Question {currentQuestion.questionNumber}
          </span>
          {currentQuestion.image && (
            <img
              src={currentQuestion.image}
              alt="Question"
              className="question-image"
            />
          )}
          <p className="question-text">{currentQuestion.question}</p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="danger" className="my-3">
            {error}
          </Alert>
        )}

        {/* Image Upload Section */}
        <Form onSubmit={(e) => e.preventDefault()}>
          <Form.Group controlId="formImage">
            <Form.Label>Upload Solution Images</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={isAnyButtonProcessing()}
            />
            <Form.Text className="text-muted">
              Maximum file size: 5MB per image
            </Form.Text>
          </Form.Group>
        </Form>

        {/* Upload Progress Bar */}
        {isAnyButtonProcessing() && uploadProgress > 0 && (
          <div className="upload-progress mt-3">
            <div className="progress">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                {uploadProgress}%
              </div>
            </div>
            <p className="text-center mt-1">
              Uploading... Please don't close this page.
            </p>
          </div>
        )}

        {/* Image Previews */}
        <div className="uploaded-images">
          {images.map((image, index) => (
            <div key={index} className="image-preview-container">
              <img
                src={URL.createObjectURL(image)}
                alt={`Preview ${index}`}
                className="image-preview"
              />
              <Button
                variant="danger"
                className="btn-cancel"
                onClick={() => handleCancelImage(index)}
                disabled={isAnyButtonProcessing()}
              >
                Cancel
              </Button>
            </div>
          ))}
        </div>

        {/* New Button Layout */}
        <div className="button-grid mt-4">
          {/* Top Row with Navigation and Submit */}
          <Row className="mb-3">
            <Col xs={6} md={3}>
              <Button
                variant="secondary"
                onClick={handleBackClick}
                className="btn-back w-100"
                disabled={isAnyButtonProcessing()}
              >
                Back
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button
                variant="primary"
                onClick={() => setShowQuestionListModal(true)}
                className="btn-question-list w-100"
                disabled={isAnyButtonProcessing()}
              >
                Question List
              </Button>
            </Col>
          </Row>

          {/* Bottom Row with Action Buttons */}
          <Row>
            <Col xs={6} md={3} className="mb-2">
              <Button
                variant={isSolveEnabled ? "primary" : "secondary"}
                onClick={handleSolve}
                className="w-100 solve-btn"
                disabled={!isSolveEnabled || isAnyButtonProcessing()}
              >
                {isButtonProcessing("solve") ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />{" "}
                    Processing...
                  </>
                ) : (
                  "Solve"
                )}
              </Button>
            </Col>
            <Col xs={6} md={3} className="mb-2">
              <Button
                variant="primary"
                onClick={handleCorrect}
                className="w-100 btn-correct"
                disabled={images.length === 0 || isAnyButtonProcessing()}
              >
                {isButtonProcessing("correct") ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />{" "}
                    Processing...
                  </>
                ) : (
                  "Correct"
                )}
              </Button>
            </Col>
            <Col xs={6} md={3} className="mb-2">
              <Button
                variant="primary"
                onClick={handleExplain}
                className="w-100 explain-btn"
                disabled={isAnyButtonProcessing()}
              >
                {isButtonProcessing("explain") ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />{" "}
                    Processing...
                  </>
                ) : (
                  "Explain"
                )}
              </Button>
            </Col>
            <Col xs={6} md={3} className="mb-2">
              <Button
                variant="info"
                onClick={handleGapAnalysis}
                className="w-100 gap-btn"
                disabled={isAnyButtonProcessing()}
              >
                Gap Analysis
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Question List Modal */}
      <QuestionListModal
        show={showQuestionListModal}
        onHide={() => setShowQuestionListModal(false)}
        questionList={selectedQuestions || questionList}
        onQuestionClick={handleQuestionSelect}
        isMultipleSelect={false}
        onMultipleSelectSubmit={null}
      />
    </div>
  );
}

export default SolveQuestion;