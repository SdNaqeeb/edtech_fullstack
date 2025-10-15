import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./QuestionListModal.css";
import MarkdownWithMath from "./MarkdownWithMath";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardCheck, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useAlert } from './AlertBox';

const QuestionListModal = ({
  show,
  onHide,
  questionList = [],
  onQuestionClick,
  isMultipleSelect = false,
  onMultipleSelectSubmit,
  worksheetName = "",
  setName = "", // Add this prop
  mode = "" // Add mode prop (homework/classwork)
}) => {
  const navigate = useNavigate();
  const { showAlert, AlertContainer } = useAlert();
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // In QuestionListModal.jsx, update the handleQuestionClick function:

const handleQuestionClick = (questionData, index) => {
  // Check if we're in teacher mode
  const isTeacherMode = window.location.pathname.includes('teacher-dash');
  
  if (isTeacherMode || isMultipleSelect) {
    // Multiple selection for teachers
    setSelectedQuestions((prev) => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length < 20) {
          return [...prev, index];
        } else {
          showAlert("You can select up to 20 questions only", "warning");
        }
        return prev;
      }
    });
  } else {
    // Single selection for students
    const selectedQuestion = {
      question: questionData.question,
      image: questionData.question_image
        ? `data:image/png;base64,${questionData.question_image}`
        : null,
      question_id: questionData.question_id || questionData.id || index,
    };
    onQuestionClick(selectedQuestion.question, index, selectedQuestion.image, selectedQuestion.question_id);
  }
};

  // Update the modal title
  const getModalTitle = () => {
    if (setName) {
      return `🎯 ${setName} - Select up to 20 Questions`;
    }
    if (worksheetName) {
      return `📄 ${worksheetName} - Select up to 20 Questions`;
    }
    return isMultipleSelect ? "Select up to 20 Questions" : "Question List";
  };

  // Handle single question submission (for students)
  const handleSingleQuestionSubmit = (questionData, index) => {
    console.log("Single question selected:", questionData);
    
    let imageUrl = null;
    if (questionData.question_image) {
      if (questionData.question_image.startsWith('data:image')) {
        imageUrl = questionData.question_image;
      } else {
        imageUrl = `data:image/png;base64,${questionData.question_image}`;
      }
    }

    const selectedQuestion = {
      question: typeof questionData.question === 'string'
        ? questionData.question
        : JSON.stringify(questionData.question),
      questionImage: imageUrl,
      questionNumber: index + 1,
      level: questionData.level || '',
      worksheet_name: worksheetName || ''
    };

    console.log("Navigating to solve page with:", selectedQuestion);
    navigate("/solve", { state: selectedQuestion });
    onHide();
  };

  // Handle multiple question submission (for teachers)
  const handleMultipleSubmit = () => {
    if (selectedQuestions.length === 0) {
      showAlert("Please select at least one question", "warning");
      return;
    }

    const selectedQuestionData = selectedQuestions.map(index => {
      const questionData = questionList[index];
      let imageUrl = null;
      
      if (questionData.question_image) {
        if (questionData.question_image.startsWith('data:image')) {
          imageUrl = questionData.question_image;
        } else {
          imageUrl = `data:image/png;base64,${questionData.question_image}`;
        }
      }

      return {
        ...questionData,
        questionImage: imageUrl,
        questionNumber: index + 1,
        originalIndex: index,
        source: setName || worksheetName || "Selected Questions",
        mode: mode // Pass the mode (homework/classwork)
      };
    });

    console.log("Submitting selected questions:", selectedQuestionData);
    
    if (onMultipleSelectSubmit) {
      onMultipleSelectSubmit(selectedQuestionData, mode);
    }
    
    onHide();
  };

  // Handle worksheet solve action (for students)
  const handleSolveWorksheet = () => {
    if (worksheetName && questionList.length > 0) {
      navigate("/solve-worksheet", {
        state: {
          worksheetName,
          questions: questionList,
        },
      });
      onHide();
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedQuestions([]);
    onHide();
  };

  // Render question content
  const renderQuestionContent = (questionData) => {
    if (typeof questionData.question === 'string') {
      return <MarkdownWithMath content={questionData.question} />;
    } else if (typeof questionData.question === 'object' && questionData.question.text) {
      return <MarkdownWithMath content={questionData.question.text} />;
    } else {
      return <span>{JSON.stringify(questionData.question)}</span>;
    }
  };

  // Determine if we're in teacher mode with worksheet
  const isTeacherMode = window.location.pathname.includes('teacher-dash');
  const isWorksheetMode = !!worksheetName;
  const showSubmitButton = (isTeacherMode && isWorksheetMode) || isMultipleSelect;

  return (
    <>
      <AlertContainer />
      <Modal 
        show={show} 
        onHide={handleModalClose} 
        size="lg" 
        className="question-modal"
        backdrop="static"
      >
      <Modal.Header closeButton>
        <Modal.Title>{getModalTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="question-list-container">
          {Array.isArray(questionList) && questionList.length > 0 ? (
            <ul className="question-list">
              {questionList.map((questionData, index) => (
                <li
                  key={index}
                  className={`question-item ${
                    selectedQuestions.includes(index) ? "selected" : ""
                  } ${isWorksheetMode && !isTeacherMode ? "worksheet-question" : ""}`}
                  onClick={() => handleQuestionClick(questionData, index)}
                  style={{ cursor: "pointer" }}
                >
                  {(isMultipleSelect || (isTeacherMode && isWorksheetMode)) && (
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(index)}
                      onChange={() => handleQuestionClick(questionData, index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className="question-number">{index + 1}</div>
                  <div className="question-content">
                    <div className="question-text">
                      {renderQuestionContent(questionData)}
                    </div>

                    <div
                      className={`question-level ${
                        questionData.level?.toLowerCase() || "medium"
                      }`}
                    >
                      {questionData.level || 'MEDIUM'}
                    </div>

                    {questionData.question_image && (
                      <div className="question-image-preview">
                        <img
                          src={`data:image/png;base64,${questionData.question_image}`}
                          alt={`Question ${index + 1}`}
                          className="preview-image"
                        />
                      </div>
                    )}
                  </div>
                 
                </li>
              ))}
            </ul>
          ) : (
            <p>No questions available.</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-200">
          <div>
            {selectedQuestions.length > 0 && (
              <span className="text-muted">
                {selectedQuestions.length}/20 questions selected
              </span>
            )}
          </div>
          <div>
            {worksheetName && !isTeacherMode && (
              <Button
                variant="success"
                onClick={handleSolveWorksheet}
                className="me-2"
              >
                <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                Solve Worksheet
              </Button>
            )}
            {showSubmitButton && (
              <Button
                variant="primary"
                onClick={handleMultipleSubmit}
                disabled={selectedQuestions.length === 0}
                className="me-2"
              >
                Submit Selected Questions ({selectedQuestions.length}/20)
              </Button>
            )}
            <Button variant="secondary" onClick={handleModalClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default QuestionListModal;