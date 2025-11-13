import React from 'react';
import { Modal, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalculator, 
  faCode, 
  faCalendarAlt, 
  faComment
} from '@fortawesome/free-solid-svg-icons';
import './SessionDetails.css';
import MarkdownWithMath from './MarkdownWithMath';

const SessionDetails = ({ show, onHide, session }) => {
  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };


  
  // Function to render solution steps with proper formatting (same as ResultPage)
  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <p>No solution steps available.</p>;
    }

    // If steps is a string, split it into array by newlines or Step patterns
    let stepsArray = steps;
    // if (typeof steps === 'string') {
    //   // First try to split by "Step" pattern
    //   if (steps.includes('Step')) {
    //     stepsArray = steps.split(/(?=Step\s+\d+:)/i).filter(s => s.trim());
    //   } else {
    //     // Otherwise split by newlines
    //     stepsArray = steps.split('\n').filter(s => s.trim());
    //   }
    // } else if (!Array.isArray(steps)) {
    //   return <MarkdownWithMath content={String(steps)} />;
    // }

    return (
      <div className="solution-steps">
        {stepsArray.map((step, index) => {
          const stepMatch = step.match(/^Step\s+(\d+):\s+(.*)/i);
          
          if (stepMatch) {
            const [_, stepNumber, stepContent] = stepMatch;
            return (
              <div key={index} className="solution-step-container">
                <div className="step-title">Step {stepNumber}:</div>
                
                <div className="step-description">
                  <MarkdownWithMath content={stepContent} />
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="solution-step-container">
                 <div className="step-title">Step {index+1}:</div>
                <div className="question-step">
                  <MarkdownWithMath content={step} />
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Helper function to parse and format AI answer
  const formatAIAnswer = (aiAnswer) => {
    if (!aiAnswer) return null;
    
    // If aiAnswer is already an array, join with line breaks
    if (Array.isArray(aiAnswer)) {
      return aiAnswer.join('\n');
    }
    
    // If aiAnswer is already a plain string (not stringified array), return it
    if (typeof aiAnswer === 'string' && !aiAnswer.startsWith('[')) {
      return aiAnswer;
    }
    
    // Handle stringified array format like "['step1','step2']"
    if (typeof aiAnswer === 'string' && aiAnswer.startsWith('[') && aiAnswer.endsWith(']')) {
      try {
        // First, try to parse it as JSON (in case it's valid JSON)
        const parsed = JSON.parse(aiAnswer);
        if (Array.isArray(parsed)) {
          return parsed.join('\n');
        }
      } catch (e) {
        // If JSON parsing fails, try manual parsing
        try {
          // Remove outer brackets
          let content = aiAnswer.slice(1, -1).trim();
          
          // Handle empty array
          if (!content || content === "''") {
            return null;
          }
          
          // Split by comma and clean up each item
          // This regex handles both single and double quotes
          const items = [];
          const regex = /['"]((?:[^'"\\]|\\.)*)['"](?:\s*,\s*)?/g;
          let match;
          
          while ((match = regex.exec(content)) !== null) {
            // Unescape any escaped characters
            const item = match[1].replace(/\\(.)/g, '$1');
            if (item) {
              items.push(item);
            }
          }
          
          // If no matches found, try a simpler approach
          if (items.length === 0) {
            // Split by comma and clean quotes
            const simpleItems = content.split(',').map(item => {
              // Remove leading/trailing whitespace and quotes
              return item.trim().replace(/^['"]|['"]$/g, '');
            }).filter(item => item);
            
            if (simpleItems.length > 0) {
              return simpleItems.join('\n');
            }
          }
          
          return items.length > 0 ? items.join('\n') : null;
        } catch (parseError) {
          console.error("Error manually parsing AI answer:", parseError);
          // Return the original string without the brackets as fallback
          return aiAnswer.slice(1, -1).replace(/['"]/g, '');
        }
      }
    }
    
    // If it's an object, try to stringify it
    if (typeof aiAnswer === 'object') {
      try {
        return JSON.stringify(aiAnswer, null, 2);
      } catch (e) {
        console.error("Error stringifying AI answer:", e);
      }
    }
    
    // If all else fails, return the original as string
    return String(aiAnswer);
  };

  // If no session is provided, don't render anything
  if (!session) {
    return null;
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className="session-details-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon 
            icon={session.subject?.toLowerCase().includes('math') ? faCalculator : faCode} 
            className="me-2" 
          />
          Session Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Session Header */}
        <div className="session-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="session-title mb-0">
              {session.subject} - {session.answering_type === 'correct' ? 'Exercise' : 'Solved Examples'}
            </h4>
            <div className="session-date">
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              {formatDate(session.date)}
            </div>
          </div>
          <div className="session-meta mt-2">
            <span className="badge bg-primary me-2">Class {session.class_name}</span>
            <span className="badge bg-secondary me-2">Chapter {session.chapter_number}</span>
            {session.student_score !== undefined && (
              <span className={`badge ${session.student_score > 50 ? 'bg-success' : 'bg-danger'} me-2`}>
                Score: {session.student_score}
              </span>
            )}
          </div>
        </div>

        {/* Question Section */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Question</strong>
          </Card.Header>
          <Card.Body>
            <MarkdownWithMath content={session.question_text} />
            {session.question_image_base64 && session.question_image_base64 !== "No image for question" && (
              <div className="text-center">
                <img 
                  src={session.question_image_base64.startsWith('data:') 
                    ? session.question_image_base64 
                    : `data:image/jpeg;base64,${session.question_image_base64}`}
                  alt="Question" 
                  className="question-image"
                />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Student Answer Section */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>Your Answer</strong>
          </Card.Header>
          <Card.Body>
            {/* Check if student_answer contains steps pattern */}
            
              <pre className="student-answer">
                <MarkdownWithMath content={session.student_answer}/>
              </pre>
            
            {session.student_answer_base64 && (
              <div className="text-center mt-3">
                <img 
                  src={session.student_answer_base64.startsWith('data:') 
                    ? session.student_answer_base64 
                    : `data:image/jpeg;base64,${session.student_answer_base64}`}
                  alt="Student Answer" 
                  className="answer-image"
                />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* AI Answer Section */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <strong>AI Answer</strong>
          </Card.Header>
          <Card.Body>
            {/* Use renderSolutionSteps for AI answer */}
             {renderSolutionSteps(session.ai_answer_array)}
          </Card.Body>
        </Card>

        {/* Teacher's Comment Section */}
        {session.comment && (
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <FontAwesomeIcon icon={faComment} className="me-2" />
              <strong>Teacher's Comment</strong>
            </Card.Header>
            <Card.Body>
              {/* Check if comment contains steps pattern */}
              
                <div className="teacher-comment">
                  <MarkdownWithMath content={session.comment} />
                </div>
             
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionDetails;