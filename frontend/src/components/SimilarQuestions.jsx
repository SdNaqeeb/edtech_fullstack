// SimilarQuestions.jsx - Updated version

import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './SimilarQuestions.css';
import MarkdownWithMath from './MarkdownWithMath';

const SimilarQuestions = () => {
  const [similarQuestions, setSimilarQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply dark mode on component mount and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
      setIsDarkMode(darkModeEnabled);
      document.body.classList.toggle('dark-mode', darkModeEnabled);
    };

    checkDarkMode();

    // Listen for storage events (dark mode changes in other tabs/components)
    window.addEventListener('storage', checkDarkMode);

    return () => {
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

  // Fetch similar questions when component mounts
  useEffect(() => {
    console.log("Location state:", location.state);
    fetchSimilarQuestions();
  }, []);

  // Function to fetch similar questions from API
  const fetchSimilarQuestions = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if original question exists in location state
      if (!location.state?.originalQuestion) {
        throw new Error('Original question not found in the navigation state');
      }

      console.log("Sending request with question:", location.state.originalQuestion);

      // Make API call with additional parameter to request specific theoretical concepts
      const response = await axiosInstance.post('/similarquestion/', {
        question: location.state.originalQuestion,
        request_specific_concepts: true  // Add this flag to request specific theoretical concepts
      });

      console.log("API Response:", response.data);

      // Set the response data
      setSimilarQuestions(response.data);
    } catch (err) {
      console.error('Error fetching similar questions:', err);
      
      // Generate fallback similar questions with question-specific concepts
      generateFallbackSimilarQuestions();
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback similar questions when API fails - with more specific concepts
  const generateFallbackSimilarQuestions = () => {
    if (!location.state?.originalQuestion) return;
    
    const originalQuestion = location.state.originalQuestion;
    let specificConcepts = '';
    
    // Check if the question contains keywords to generate more specific concepts
    if (originalQuestion.toLowerCase().includes('circle') || 
        originalQuestion.toLowerCase().includes('tangent')) {
      // For circle geometry questions
      specificConcepts = `1. CIRCLE PROPERTIES:\n- A circle is a set of points that are equidistant from a given point (the center).\n- The radius is the distance from the center to any point on the circle.\n- Tangents to a circle are perpendicular to the radius at the point of tangency.\n\n2. TANGENT PROPERTIES:\n- A tangent to a circle touches the circle at exactly one point.\n- If two tangents are drawn to a circle from an external point, they are equal in length.\n- The tangent at any point on a circle is perpendicular to the radius drawn to that point.\n\n3. PARALLEL LINES AND ANGLES:\n- When parallel lines are cut by a transversal, corresponding angles are equal.\n- When parallel lines are cut by a transversal, alternate angles are equal.\n- The sum of angles in a triangle equals 180 degrees.\n\n4. ANGLE IN A SEMICIRCLE:\n- An angle inscribed in a semicircle is always 90 degrees (a right angle).`;
    } else if (originalQuestion.toLowerCase().includes('cylinder') || 
               originalQuestion.toLowerCase().includes('hemisphere')) {
      // For 3D geometry questions about cylinders
      specificConcepts = `1. CORE CONCEPTS:\n- Cylinder: A three-dimensional shape with two parallel circular bases and a curved surface connecting the bases. Its height is the distance between the bases.\n- Hemisphere: Half of a sphere, having a curved surface and a flat circular face.\n- Surface Area: The total area that the surface of a three-dimensional object occupies.\n- Modification of Solids: When parts are removed from a solid, care must be taken to account for added or removed surfaces in surface area calculations.\n\n2. DETAILED EXPLANATION:\n- We start with a cylinder of height h and base radius r.\n- Two hemispheres with the same radius are scooped out from both ends of the cylinder.\n- By removing each hemisphere, the flat circular ends of the cylinder are no longer part of the surface. Instead, we have the curved surface of the hemispheres.\n\n3. PROBLEM-SOLVING APPROACH:\n- Step 1: Calculate the lateral surface area of the cylinder using the formula: 2πrh.\n- Step 2: Calculate the curved surface area of one hemisphere using the formula: 2πr². Since there are two hemispheres, multiply this by 2.\n- Step 3: Add the lateral surface area of the cylinder to the total curved surface area of the hemispheres.\n\n4. FORMULAS AND PRINCIPLES:\n- Lateral Surface Area of Cylinder: 2πrh\n- Curved Surface Area of a Hemisphere: 2πr²\n- Total Surface Area: Combine the lateral surface area of the cylinder and twice the curved surface area of one hemisphere.`;
    } else {
      // Generic concepts as fallback
      specificConcepts = `1. UNDERSTANDING THE PROBLEM:\n- Identify what is given in the problem.\n- Determine what is being asked for.\n- Recognize the relevant mathematical concepts involved.\n\n2. STRATEGY SELECTION:\n- Choose appropriate formulas and methods based on the problem type.\n- Break down complex problems into smaller, manageable parts.\n- Consider alternative approaches if direct methods are challenging.\n\n3. SYSTEMATIC SOLUTION PROCESS:\n- Apply selected formulas correctly with the given values.\n- Perform calculations step by step to avoid errors.\n- Check intermediate results for reasonableness.\n\n4. VERIFICATION AND INTERPRETATION:\n- Verify the solution by checking if it satisfies all conditions of the problem.\n- Interpret the answer in the context of the original problem.\n- Consider if the solution makes physical or practical sense.`;
    }
    
    const fallbackData = {
      similar_question: `"${originalQuestion.substring(0, 100)}..."`,
      theory_concepts: specificConcepts
    };
    
    setSimilarQuestions(fallbackData);
  };

  // Render theoretical concepts with improved formatting for specific concepts
  const renderTheoreticalConcepts = () => {
    if (!similarQuestions || !similarQuestions.theory_concepts) {
      return null;
    }

    return (
      <Card className="question-card theory-card">
        <Card.Header className="question-header">Theoretical Concepts</Card.Header>
        <Card.Body>
          <div className="theory-content">
            {similarQuestions.theory_concepts.split('\n').map((paragraph, index) => {
              const trimmedPara = paragraph.trim();
              
              if (!trimmedPara) return null;

              // Format section headers (e.g., "1. CORE CONCEPTS:")
              if (trimmedPara.match(/^\d+\.\s+[A-Z\s]+:?/)) {
                return (
                  <div key={index} className="concept-item">
                    <h5 className="concept-title">{trimmedPara}</h5>
                  </div>
                );
              }

              // Format bullet points
              if (trimmedPara.startsWith('-')) {
                return (
                  <div key={index} className="concept-point">
                    <MarkdownWithMath content = {trimmedPara.substring(1).trim()} />
                  </div>
                );
              }

              // Regular paragraphs
              return <p key={index}>{trimmedPara}</p>;
            })}
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Handle selecting a question to solve
  const handleQuestionSelect = (question) => {
    navigate('/solvequestion', {
      state: {
        question: question.similar_question,
        class_id: location.state?.class_id,
        subject_id: location.state?.subject_id,
        topic_ids: location.state?.topic_ids,
        subtopic: location.state?.subtopic,
        image: location.state?.questionImage
      }
    });
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate('/student-dash');
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className={`similar-questions-container loading-view ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">Loading similar questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`similar-questions-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="similar-questions-container">
        <h2 className="page-title">Similar Practice Questions</h2>
        
        <div className="question-cards">
          {/* Original Question Section */}
          <Card className="question-card">
            <Card.Header className="question-header">Original Question</Card.Header>
            <Card.Body>
              <MarkdownWithMath content= {location.state?.originalQuestion || "Consider a variation of the original problem with different values."} />
              {location.state?.questionImage && (
                <div className="question-image-wrapper">
                  <img 
                    src={location.state.questionImage} 
                    alt="Question" 
                    className="question-image"
                  />
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Theoretical Concepts Section */}
          {renderTheoreticalConcepts()}

          {/* Similar Question Section */}
          {similarQuestions && similarQuestions.similar_question && (
            <Card className="question-card practice-card">
              <Card.Header className="question-header">Practice Question</Card.Header>
              <Card.Body>
                <MarkdownWithMath content={similarQuestions.similar_question} />
                <div className="button-container">
                  <Button 
                    variant="primary"
                    onClick={() => handleQuestionSelect(similarQuestions)}
                    className="solve-button"
                  >
                    Solve This Question
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
        
        {/* Back to Dashboard button at the end of content */}
        <div className="dashboard-button-container">
          <Button 
            variant="secondary"
            onClick={handleBackToDashboard}
            className="back-button"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimilarQuestions;