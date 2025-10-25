// src/components/ExamDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Badge, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faGraduationCap,
  faChartLine,
  faCheckCircle,
  faExclamationTriangle,
  faLightbulb,
  faTrophy,
  faChartBar,
  faClipboardCheck,
  faFileAlt,
  faBullseye,
  faArrowUp,
  faArrowDown,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import MarkdownWithMath from './MarkdownWithMath';
import axiosInstance from '../api/axiosInstance';



const ExamDetailsModal = ({ show, onHide, result }) => {
  // State for questions evaluation
  const [questionsEvaluation, setQuestionsEvaluation] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Reset questions state when modal is closed or exam changes
  useEffect(() => {
    if (!show) {
      // Clear all questions-related state when modal is closed
      setQuestionsEvaluation(null);
      setShowQuestions(false);
      setQuestionsError(null);
      setLoadingQuestions(false);
    }
  }, [show]);

  // Clear questions state when the exam result changes
  useEffect(() => {
    setQuestionsEvaluation(null);
    setShowQuestions(false);
    setQuestionsError(null);
    setLoadingQuestions(false);
  }, [result?.result_id, result?.student_id, result?.id]);
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

  // Helper function to get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  // Helper function to get performance level
  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { label: 'Outstanding', color: 'success', icon: faTrophy };
    if (percentage >= 80) return { label: 'Excellent', color: 'success', icon: faCheckCircle };
    if (percentage >= 70) return { label: 'Very Good', color: 'info', icon: faArrowUp };
    if (percentage >= 60) return { label: 'Good', color: 'info', icon: faCheckCircle };
    if (percentage >= 50) return { label: 'Average', color: 'warning', icon: faChartBar };
    if (percentage >= 40) return { label: 'Below Average', color: 'warning', icon: faArrowDown };
    return { label: 'Needs Improvement', color: 'danger', icon: faExclamationTriangle };
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

  const percentage = result?.overall_percentage || 0;
  const performance = getPerformanceLevel(percentage);

  // Parse strengths and areas for improvement - handle both string and array formats
  const parseListData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') return data.split(',').map(s => s.trim()).filter(s => s);
    return [];
  };

  const strengths = parseListData(result?.strengths);
  const improvements = parseListData(result?.areas_for_improvement);

  // Fetch questions evaluation
  const fetchQuestionsEvaluation = async () => {
    // Try multiple possible field names for the student result ID
    const studentResultId = result?.student_id || result?.result_id || result?.id;

    if (!studentResultId) {
      setQuestionsError('Student result ID not available');
      return;
    }

    try {
      setLoadingQuestions(true);
      setQuestionsError(null);

      const response = await axiosInstance.get('/questions-evaluated/', {
        params: {
          student_result_id: studentResultId
        }
      });

      if (response.data) {
        // API returns an array with one object containing questions_evaluation
        let data = Array.isArray(response.data) ? response.data[0] : response.data;
        data = data?.question_data?.[0] || [];
        console.log("Fetched questions evaluation:", data);

        setQuestionsEvaluation(data);
        setShowQuestions(true);
      }
    } catch (error) {
      console.error('Error fetching questions evaluation:', error);
      setQuestionsError(error.response?.data?.error || 'Failed to fetch questions evaluation');
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FontAwesomeIcon icon={faFileAlt} className="me-2" />
          Exam Details - {result?.exam_name || 'N/A'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Exam Overview */}
        <div className="mb-2 p-3 bg-light rounded">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-primary me-2" />
                <strong>Exam Type:</strong>{" "}
                <Badge bg="secondary">{result?.exam_type || 'N/A'}</Badge>
              </p>
              <p className="mb-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-info me-2" />
                <strong>Class/Section:</strong> {result?.class_section || 'N/A'}
              </p>
              {result?.roll_number && (
                <p className="mb-2">
                  <FontAwesomeIcon icon={faClipboardCheck} className="text-success me-2" />
                  <strong>Roll Number:</strong> {result.roll_number}
                </p>
              )}
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-info me-2" />
                <strong>Score:</strong>{" "}
                <span className="fw-bold">{result?.total_marks_obtained || 0}</span> / {result?.total_max_marks || 0}
                {" "}
                <Badge bg={getGradeColor(result?.grade)} className="ms-2">
                  Grade {result?.grade || 'N/A'}
                </Badge>
              </p>
              <p className="mb-2">
                <FontAwesomeIcon icon={faChartBar} className="text-warning me-2" />
                <strong>Percentage:</strong>{" "}
                <span className="fw-bold">{percentage.toFixed(2)}%</span>
              </p>
              <p className="mb-0">
                <FontAwesomeIcon icon={performance.icon} className={`text-${performance.color} me-2`} />
                <strong>Performance:</strong>{" "}
                <Badge bg={performance.color}>{performance.label}</Badge>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Overall Performance</small>
              <small className="fw-bold">{percentage.toFixed(1)}%</small>
            </div>
            <ProgressBar
              now={percentage}
              variant={getPercentageColor(percentage)}
              animated
              striped
              label={`${percentage.toFixed(1)}%`}
              style={{ height: '25px', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="row mb-4">
          <div className="col-md-6">
            {/* Strengths Section */}
            {strengths.length > 0 && (
              <Alert variant="success" className="mb-3">
                <h6 className="alert-heading d-flex align-items-center mb-3">
                  <FontAwesomeIcon icon={faBullseye} className="me-2" />
                  Strengths
                </h6>
                <ul className="mb-0 ps-3">
                  {strengths.map((strength, idx) => (
                    <li key={idx} className="mb-1">
                      <MarkdownWithMath content={strength} />
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
          <div className="col-md-6">
            {/* Areas for Improvement */}
            {improvements.length > 0 && (
              <Alert variant="warning" className="mb-3">
                <h6 className="alert-heading d-flex align-items-center mb-3">
                  <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                  Areas for Improvement
                </h6>
                <ul className="mb-0 ps-3">
                  {improvements.map((improvement, idx) => (
                    <li key={idx} className="mb-1">
                      <MarkdownWithMath content={improvement} />
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {result?.questions && result.questions.length > 0 && (
          <>
            <h5 className="mb-3 d-flex align-items-center">
              <FontAwesomeIcon icon={faClipboardCheck} className="text-warning me-2" />
              Question-wise Analysis
            </h5>

            {result.questions.map((question, index) => (
              <div key={index} className="mb-3 border rounded overflow-hidden">
                <div className="p-3 bg-light border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      Question {index + 1}
                    </h6>
                    <span className="fw-bold">
                      {question.marks_obtained || 0} / {question.max_marks || 0} marks
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  {question.feedback && (
                    <div className="alert alert-info mb-0">
                      <strong>Feedback:</strong>
                      <p className="mb-0 mt-2">
                        <MarkdownWithMath content={question.feedback} />
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* No detailed data available */}
        {(!result?.questions || result.questions.length === 0) &&
          (!strengths.length && !improvements.length) && !showQuestions && (
            <Alert variant="info">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              No detailed analysis available for this exam.
            </Alert>
          )}

        {/* Questions Evaluation Section */}
        {showQuestions && questionsEvaluation && (
          <div className="mt-4">
            <h5 className="mb-3 d-flex align-items-center">
              <FontAwesomeIcon icon={faEye} className="text-primary me-2" />
              Detailed Questions Evaluation
            </h5>

            {questionsEvaluation.questions_evaluation && questionsEvaluation.questions_evaluation.length > 0 ? (
              questionsEvaluation.questions_evaluation.map((question, index) => {
                // Helper function to get error type badge color
                const getErrorTypeBadge = (errorType) => {
                  switch (errorType) {
                    case 'no_error':
                      return { bg: 'success', text: 'No Error' };
                    case 'conceptual_error':
                      return { bg: 'warning', text: 'Conceptual Error' };
                    case 'calculation_error':
                      return { bg: 'danger', text: 'Calculation Error' };
                    case 'incomplete':
                      return { bg: 'secondary', text: 'Incomplete' };
                    default:
                      return { bg: 'secondary', text: errorType || 'Unknown' };
                  }
                };

                const errorBadge = getErrorTypeBadge(question.error_type);

                return (
                  <div key={index} className="mb-4 border rounded overflow-hidden shadow-sm">
                    {/* Question Header */}
                    <div className="p-3 bg-primary text-white">
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <h6 className="mb-0 text-white">
                          <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
                          {question.question_number || `Question ${index + 1}`}
                        </h6>
                        <div className="d-flex gap-2 align-items-center ">
                          {question.total_score !== undefined && question.max_marks !== undefined && (
                            <Badge bg="light" text="dark" >
                              {question.total_score} / {question.max_marks} marks
                            </Badge>
                          )}
                          {question.percentage !== undefined && (
                            <Badge bg="light" text="dark">
                              {question.percentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-3">
                      {/* Question Text */}
                      {question.question && (
                        <div className="mb-3">
                          <strong className="text-primary d-flex align-items-center">
                            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                            Question:
                          </strong>
                          <div className="mt-2 p-3 bg-light rounded border border-primary">
                            <MarkdownWithMath content={question.question} />
                          </div>
                        </div>
                      )}

                      {/* Error Type Badge */}
                      {question.error_type && (
                        <div className="mb-3">
                          <Badge bg={errorBadge.bg} className="px-3 py-2">
                            {errorBadge.text}
                          </Badge>
                        </div>
                      )}

                      {/* Concepts Required */}
                      {question.concepts_required && question.concepts_required.length > 0 && (
                        <div className="mb-3">
                          <strong className="text-info d-block mb-2">
                            <FontAwesomeIcon icon={faLightbulb} className="me-2" />
                            Concepts Required:
                          </strong>

                          <div className="d-flex flex-column gap-2">
                            {question.concepts_required.map((concept, idx) => {
                              // Handle both string and object formats
                              const conceptName =
                                typeof concept === "object" && concept.concept_name
                                  ? concept.concept_name
                                  : concept;

                              const conceptDescription =
                                typeof concept === "object" && concept.concept_description
                                  ? concept.concept_description
                                  : null;

                              return (
                                <div key={idx} className="d-flex flex-column">
                                  <Badge
                                    bg="info"
                                    className="px-3 py-2 align-self-start"
                                    style={{ fontSize: '14px' }}
                                  >
                                    {conceptName}
                                  </Badge>
                                  {conceptDescription && (
                                    <div className="mt-2 ms-2 p-2 bg-light rounded border border-info" style={{ fontSize: '13px' }}>
                                      <MarkdownWithMath content={conceptDescription} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}


                      {/* Mistakes Made and Gap Analysis - Column Layout */}
                      <div className="d-flex flex-column gap-3">
                        {/* Mistakes Made */}
                        {question.mistakes_made && (
                          <Alert variant="danger" className="mb-0">
                            <div className="d-flex flex-column">
                              <strong className="mb-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                Mistakes Made:
                              </strong>
                              <div className="ms-0">
                                <MarkdownWithMath content={question.mistakes_made} />
                              </div>
                              {question.mistake_section && (
                                <div className="mt-2">
                                  <small className="text-muted">
                                    <strong>Section:</strong> {question.mistake_section}
                                  </small>
                                </div>
                              )}
                            </div>
                          </Alert>
                        )}

                        {/* Gap Analysis */}
                        {question.gap_analysis && (
                          <Alert variant="warning" className="mb-0">
                            <div className="d-flex flex-column">
                              <strong className="mb-2">
                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                Gap Analysis:
                              </strong>
                              <div className="ms-0">
                                <MarkdownWithMath content={question.gap_analysis} />
                              </div>
                            </div>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <Alert variant="warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                No questions evaluation data available.
              </Alert>
            )}
          </div>
        )}

        {/* Error displaying questions */}
        {questionsError && (
          <Alert variant="danger" className="mt-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {questionsError}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        {(result?.result_id) && (
          <Button
            variant="primary"
            onClick={fetchQuestionsEvaluation}
            disabled={loadingQuestions}
          >
            {loadingQuestions ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Loading...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faEye} className="me-2" />
                View Questions
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ExamDetailsModal;
