// src/components/HomeworkDetailsModal.jsx
import React, { useMemo } from 'react';
import { Modal, Button, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faBookOpen,
  faChartLine,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faLightbulb,
  faBrain,
  faCalculator,
  faCommentDots,
  faEdit,
  faStar,
  faStarHalfAlt,
  faGraduationCap,
  faDownload,
  faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import MarkdownWithMath from './MarkdownWithMath';
import './HomeworkDetailsModal.css';

const HomeworkDetailsModal = ({ show, onHide, submission }) => {
  const questions = useMemo(() => submission?.result_json?.questions || [], [submission]);
  
  // Calculate total score and percentage
  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.total_score || 0), 0);
  }, [questions]);

  const maxPossibleScore = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.max_score || q.max_marks || 0), 0);
  }, [questions]);

  const overallPercentage = useMemo(() => {
    if (maxPossibleScore === 0) return 0;
    return Math.round((totalScore / maxPossibleScore) * 100);
  }, [totalScore, maxPossibleScore]);

  // Helper function to determine grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 30) return 'D';
    return 'F';
  };

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': case 'A+': return 'success';
      case 'B': case 'B+': return 'info';
      case 'C': case 'C+': return 'warning';
      case 'D': return 'danger';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  };

  // Helper function to get category/error type icon and color
  const getCategoryInfo = (category) => {
    const categoryLower = (category || '').toLowerCase();
    
   if (categoryLower.includes('partially-')) {
    return { icon: faStarHalfAlt, color: 'info', label: 'Partially Correct' };}
    else if (categoryLower.includes('correct') || categoryLower.includes('no_error')) {
      return { icon: faCheckCircle, color: 'success', label: 'Correct' };
    } else if (categoryLower.includes('calculation') || categoryLower.includes('numerical')) {
      return { icon: faCalculator, color: 'danger', label: 'Calculation Error' };
    } else if (categoryLower.includes('conceptual')) {
      return { icon: faBrain, color: 'warning', label: 'Conceptual Error' };
    } else if (categoryLower.includes('logical')) {
      return { icon: faExclamationTriangle, color: 'warning', label: 'Logical Error' };
    } else {
      return { icon: faExclamationTriangle, color: 'secondary', label: category || 'Unknown' };
    }
  };

  // Helper function to get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const grade = getGrade(overallPercentage);

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable centered className="homework-details-modal">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FontAwesomeIcon icon={faBookOpen} className="me-2" />
          Homework Details - {submission?.worksheet_id || submission?.homework || 'N/A'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Submission Overview */}
        <div className="mb-4 p-3 bg-light rounded">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                <strong>Submitted On:</strong>{" "}
                {formatDate(submission?.submission_timestamp || submission?.submission_date)}
              </p>
              {submission?.class && (
                <p className="mb-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-info me-2" />
                  <strong>Class:</strong> {submission.class} | 
                  <strong className="ms-2">Board:</strong> {submission.board || 'CBSE'}
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-info me-2" />
                <strong>Overall Score:</strong>{" "}
                <span className="fw-bold">{totalScore}</span> / {maxPossibleScore}
                {" "}
                <Badge bg={getGradeColor(grade)} className="ms-2">
                  Grade {grade}
                </Badge>
              </p>
              {submission?.difficulty_level && (
                <p className="mb-2">
                  <FontAwesomeIcon icon={faClipboardCheck} className="text-warning me-2" />
                  <strong>Difficulty:</strong>{" "}
                  <Badge bg={
                    submission.difficulty_level === 'Hard' ? 'danger' : 
                    submission.difficulty_level === 'Medium' ? 'warning' : 'success'
                  }>
                    {submission.difficulty_level}
                  </Badge>
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {/* <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Overall Performance</small>
              <small className="fw-bold">{overallPercentage}%</small>
            </div>
            <ProgressBar 
              now={overallPercentage} 
              variant={getPercentageColor(overallPercentage)}
              animated
              striped
              label={`${overallPercentage}%`}
              style={{ height: '25px' }}
            />
          </div> */}

          {/* Summary Stats */}
          {questions.length > 0 && (
            <div className="row mt-3 d-flex justify-content-around">
              <div className="col-md-4">
                <div className="text-center">
                  <FontAwesomeIcon icon={faClipboardCheck} className="text-primary mb-1" size="lg" />
                  <p className="mb-0 small text-muted">Total Questions</p>
                  <p className="mb-0 fw-bold">{questions.length}</p>
                </div>
              </div>
             
              <div className="col-md-4">
                <div className="text-center">
                  <FontAwesomeIcon icon={faStar} className="text-warning mb-1" size="lg" />
                  <p className="mb-0 small text-muted">Avg. Score</p>
                  <p className="mb-0 fw-bold">
                    {questions.length > 0 ? Math.round(totalScore / questions.length * 10) / 10 : 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Section */}
        <h5 className="mb-3 d-flex align-items-center">
          <FontAwesomeIcon icon={faLightbulb} className="text-warning me-2" />
          Question-wise Analysis
        </h5>

        {questions.length === 0 ? (
          <Alert variant="warning">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            No questions found in this submission.
          </Alert>
        ) : (
          questions.map((q, index) => {
            const categoryInfo = getCategoryInfo(q.answer_category || q.error_type);
            const questionScore = q.total_score || 0;
            const questionMaxScore = q.max_score || q.max_marks || 0;
            const questionPercentage = questionMaxScore > 0 
              ? Math.round((questionScore / questionMaxScore) * 100) 
              : 0;
            const concepts = q.concept_required || q.concepts_required || [];

            return (
              <div key={index} className="mb-4 border rounded overflow-hidden shadow-sm">
                {/* Question Header */}
                <div className="p-3 bg-light border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 d-flex align-items-center">
                      <FontAwesomeIcon icon={faBookOpen} className="text-primary me-2" />
                      Question {index + 1}
                    </h6>
                    <div className="d-flex align-items-center gap-3">
                      <Badge bg={categoryInfo.color} className="d-flex align-items-center">
                        <FontAwesomeIcon icon={categoryInfo.icon} className="me-1" />
                        {categoryInfo.label}
                      </Badge>
                      <span className="fw-bold">
                        {questionScore} / {questionMaxScore} marks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question Details */}
                <div className="p-3">
                  {/* Question Text */}
                  {(q.question_text || q.question) && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="text-muted mb-2">
                        <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                        Question:
                      </h6>
                      <div className="ps-3">
                        <MarkdownWithMath content={q.question_text || q.question} />
                      </div>
                    </div>
                  )}

                  {/* Score Progress */}
                  <div className="mb-3">
                    {/* <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Score Achievement</small>
                      <small className="fw-bold">{questionPercentage}%</small>
                    </div> */}
                    {/* <ProgressBar 
                      now={questionPercentage} 
                      variant={getPercentageColor(questionPercentage)}
                      label={`${questionPercentage}%`}
                      style={{ height: '20px' }}
                    /> */}
                  </div>

                  {/* Concepts Required */}
                  {concepts.length > 0 && (
                    <div className="mb-3">
                      <strong className="text-muted">
                        <FontAwesomeIcon icon={faBrain} className="me-2" />
                        Concepts Required:
                      </strong>
                      <div className="mt-2">
                        {concepts.map((concept, idx) => (
                          <Badge key={idx} bg="secondary" className="me-2 mb-1">
                            <MarkdownWithMath content={concept} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Corrections/Mistakes */}
                  {(q.correction_comment || q.mistakes_made) && (
                    <Alert variant="danger" className="mb-3">
                      <strong>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Corrections Needed:
                      </strong>
                   
                        <MarkdownWithMath content={q.correction_comment || q.mistakes_made} />
                  
                    </Alert>
                  )}

                  {/* Feedback/Comments */}
                  {(q.comment || q.gap_analysis) && (
                    <Alert variant="info" className="mb-0">
                      <strong>
                        <FontAwesomeIcon icon={faCommentDots} className="me-2" />
                        Teacher's Feedback:
                      </strong>
               
                        <MarkdownWithMath content={q.comment || q.gap_analysis} />
                
                    </Alert>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {/* <Button 
          variant="info" 
          onClick={() => {
            // Implement download functionality
            console.log('Download report for:', submission?.worksheet_id);
          }}
        >
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Download Report
        </Button> */}
        {/* <Button 
          variant="primary" 
          onClick={() => {
            // Navigate to detailed gap analysis if needed
            console.log('View gap analysis for:', submission?.worksheet_id);
          }}
        >
          View Full Gap Analysis
        </Button> */}
      </Modal.Footer>
    </Modal>
  );
};

export default HomeworkDetailsModal;