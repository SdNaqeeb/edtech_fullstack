// src/components/ClassworkDetailsModal.jsx
import React from 'react';
import { Modal, Button, Badge, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faGraduationCap, 
  faChartLine, 
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faLightbulb,
  faBrain
} from '@fortawesome/free-solid-svg-icons';

const ClassworkDetailsModal = ({ show, onHide, submission }) => {
  const questions = submission?.questions || [];
  
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

  // Helper function to get error type icon and color
  const getErrorTypeInfo = (errorType) => {
    switch (errorType) {
      case 'no_error':
        return { icon: faCheckCircle, color: 'success', label: 'Correct' };
      case 'calculation_error':
        return { icon: faTimesCircle, color: 'danger', label: 'Calculation Error' };
      case 'conceptual_error':
        return { icon: faBrain, color: 'warning', label: 'Conceptual Error' };
      case 'logical_error':
        return { icon: faExclamationTriangle, color: 'warning', label: 'Logical Error' };
      default:
        return { icon: faExclamationTriangle, color: 'secondary', label: errorType };
    }
  };

  // Helper function to get percentage color
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FontAwesomeIcon icon={faGraduationCap} className="me-2" />
          Classwork Details - {submission?.classwork_code || submission?.worksheet_id}
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
                {submission?.submission_date 
                  ? new Date(submission.submission_date).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'N/A'}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <FontAwesomeIcon icon={faChartLine} className="text-info me-2" />
                <strong>Overall Score:</strong>{" "}
                <span className="fw-bold">{submission?.score || 0}</span> / {submission?.max_possible_score || 0}
                {" "}
                {/* <Badge bg={getGradeColor(submission?.grade)}>
                  {submission?.grade || 'N/A'}
                </Badge> */}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {/* <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">Performance</small>
              <small className="fw-bold">{submission?.percentage || 0}%</small>
            </div>
            <ProgressBar 
              now={submission?.percentage || 0} 
              variant={getPercentageColor(submission?.percentage || 0)}
              animated
              striped
            />
          </div> */}
        </div>

        {/* Questions Section */}
        <h5 className="mb-3 d-flex align-items-center">
          <FontAwesomeIcon icon={faLightbulb} className="text-warning me-2" />
          Question-wise Analysis
        </h5>

        {questions.length === 0 ? (
          <div className="alert alert-warning">
            No questions found in this submission.
          </div>
        ) : (
          questions.map((q, index) => {
            const errorInfo = getErrorTypeInfo(q.error_type);
            const questionPercentage = q.percentage || ((q.total_score / q.max_marks) * 100) || 0;
            
            return (
              <div key={index} className="mb-4 border rounded overflow-hidden">
                {/* Question Header */}
                <div className="p-3 bg-light border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      Question {q.question_number || index + 1}
                    </h6>
                    <div className="d-flex align-items-center gap-3">
                      <Badge bg={errorInfo.color} className="d-flex align-items-center">
                        <FontAwesomeIcon icon={errorInfo.icon} className="me-1" />
                        {errorInfo.label}
                      </Badge>
                      <span className="fw-bold">
                        {q.total_score} / {q.max_marks} marks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question Details */}
                <div className="p-3">
                  {/* Score Progress */}
                  {/* <div className="mb-3">
                    <ProgressBar 
                      now={questionPercentage} 
                      variant={getPercentageColor(questionPercentage)}
                      label={`${Math.round(questionPercentage)}%`}
                      style={{ height: '20px' }}
                    />
                  </div> */}

                  {/* Concepts Required */}
                  {q.concepts_required && q.concepts_required.length > 0 && (
                    <div className="mb-3">
                      <strong className="text-muted">Concepts Required:</strong>
                      <div className="mt-1">
                        {q.concepts_required.map((concept, idx) => (
                          <Badge key={idx} bg="secondary" className="me-2 mb-1">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mistakes Made */}
                  {q.mistakes_made && q.mistakes_made !== "Question not attempted" && (
                    <div className="mb-3">
                      <strong className="text-danger">Mistakes Made:</strong>
                      <p className="mb-0 mt-1">{q.mistakes_made}</p>
                    </div>
                  )}

                  {/* Gap Analysis */}
                  {q.gap_analysis && (
                    <div className="alert alert-info mb-0">
                      <strong>
                        <FontAwesomeIcon icon={faBrain} className="me-2" />
                        Feedback:
                      </strong>
                      <p className="mb-0 mt-2">{q.gap_analysis}</p>
                    </div>
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
        <Button variant="primary" onClick={() => {
          // Navigate to detailed gap analysis if needed
          // navigate(`/classwork-gap-analysis/${submission?.classwork_code}`, { state: { submission } });
        }}>
          View Full Gap Analysis
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClassworkDetailsModal;