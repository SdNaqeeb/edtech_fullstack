 import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col, Accordion, Alert, Spinner } from 'react-bootstrap';
import './ResultPage.css';
import QuestionListModal from './QuestionListModal';
import axiosInstance from '../api/axiosInstance';
import MarkdownWithMath from './MarkdownWithMath';
import Tutorial from './Tutorial';
import { useTutorial } from '../contexts/TutorialContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import Mascot from './Mascot';
// import { useMascot } from '../contexts/MascotContext';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuestionListModal, setShowQuestionListModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [autoCalculatedScore, setAutoCalculatedScore] = useState(null);

  // Tutorial context
  const {
    shouldShowTutorialForPage,
    completeTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
  } = useTutorial();

  // Mascot context
  // const { setEmotionFromScore } = useMascot();

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const { state } = location;
  const {
    message,
    ai_data,
    actionType,
    questionList,
    class_id,
    subject_id,
    topic_ids,
    subtopic,
    questionImage,
    questionNumber,
    studentImages = [],
    question_id,// Get student images from state
    context
  } = state || {};
  console.log('question_id from explain state:', question_id);
  const { 
    question, 
    ai_explaination, 
    student_answer, 
    concepts, 
    comment,gap_analysis,time_analysis,error_type,
    concepts_used,
    solution, 
    score, 
    obtained_marks, 
    total_marks, 
    question_marks,
    question_image_base64,
    student_answer_base64, // Add this to get the processed student image from API
    videos = [],
    real_world_videos = []
  } = ai_data || {};
  console.log('AI Data:', ai_data);
  const formated_concepts_used = Array.isArray(concepts_used)
    ? concepts_used.join(', ')
    : concepts_used || '';

  // Combine student images from state and API response
  const getAllStudentImages = () => {
    const images = [];
    
    // Add images from state (uploaded/captured images)
    if (studentImages && studentImages.length > 0) {
      studentImages.forEach((imageUrl, index) => {
        images.push({
          src: imageUrl,
          type: 'uploaded',
          label: `Uploaded Image `
        });
      });
    }
    
    // Add processed image from API response
    if (student_answer_base64) {
      images.push({
        src: `data:image/jpeg;base64,${student_answer_base64}`,
        type: 'processed',
        label: 'Processed Solution'
      });
    }
    
    return images;
  };

  const allStudentImages = getAllStudentImages();

  // Tutorial steps for ResultPage
  const tutorialSteps = [
    {
      target: '.result-title',
      content: 'Congratulations! This is your result page where you can see AI feedback on your solution.',
      disableBeacon: true,
    },
    {
      target: '.student-images',
      content: 'Here you can see your uploaded solution images. The AI has analyzed your work!',
      skipIfMissing: true,
    },
    {
      target: '.result-question',
      content: 'This section shows the AI\'s feedback, solution steps, and corrections for your answer.',
    },
    {
      target: '.practice-btn-fixed',
      content: 'Click here to practice similar questions and improve your understanding!',
    },
    {
      target: '.dashboard-btn-fixed',
      content: 'Use the Question List button to try other questions from your selection.',
    },
    {
      target: '.back-btn-fixed',
      content: 'You can go back to modify your answer or try a different approach. That completes the tutorial!',
    },
  ];

  // Handle tutorial completion for ResultPage
  const handleTutorialComplete = () => {
    console.log("ResultPage tutorial completed - marking entire flow as complete");
    completeTutorialFlow();
  };

  // Set mascot emotion based on score
  // useEffect(() => {
  //   if (obtained_marks !== undefined && total_marks !== undefined) {
  //     setEmotionFromScore(obtained_marks, total_marks);
  //   } else if (score !== undefined) {
  //     // If score is provided as percentage
  //     setEmotionFromScore(score, 100);
  //   }
  // }, [obtained_marks, total_marks, score, setEmotionFromScore]);

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

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      studentImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [studentImages]);

  // Auto-calculate score if none is provided from API
  useEffect(() => {
    if ((actionType === 'submit' || actionType === 'correct') && 
        student_answer && 
        obtained_marks === undefined && 
        score === undefined) {
      calculateAutoScore();
    }
  }, [ai_data, actionType, student_answer]);

  // Function to calculate score based on student answer
  const calculateAutoScore = async () => {
    if (!student_answer || !question) {
      return;
    }
    
    setIsCalculatingScore(true);
    
    try {
      const aiScoringResponse = await axiosInstance.post('/auto-score/', {
        student_answer,
        question,
        expected_solution: ai_explaination || solution || [],
        total_marks: total_marks || question_marks || 10
      }).catch(() => null);

      if (aiScoringResponse?.data?.score !== undefined) {
        setAutoCalculatedScore(aiScoringResponse.data.score);
      } else {
        const fallbackScore = calculateFallbackScore();
        setAutoCalculatedScore(fallbackScore);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
      const fallbackScore = calculateFallbackScore();
      setAutoCalculatedScore(fallbackScore);
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Fallback scoring method using keyword matching
  const calculateFallbackScore = () => {
    const totalMark = total_marks || question_marks || 10;
    
    const expectedSolution = Array.isArray(ai_explaination) 
      ? ai_explaination.join(' ') 
      : (Array.isArray(solution) ? solution.join(' ') : '');
    
    if (!expectedSolution) {
      return 0;
    }

    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    };
    
    const normalizedStudentAnswer = normalizeText(student_answer);
    const normalizedSolution = normalizeText(expectedSolution);
    
    const extractKeywords = (text) => {
      const commonWords = ['the', 'and', 'is', 'in', 'of', 'to', 'for', 'a', 'by', 'with', 'as'];
      const words = text.split(/\s+/);
      return words.filter(word => 
        word.length > 2 && !commonWords.includes(word)
      );
    };
    
    const solutionKeywords = extractKeywords(normalizedSolution);
    const studentKeywords = extractKeywords(normalizedStudentAnswer);
    
    let matchCount = 0;
    for (const keyword of solutionKeywords) {
      if (studentKeywords.includes(keyword)) {
        matchCount++;
      }
    }
    
    const matchPercentage = solutionKeywords.length > 0 
      ? matchCount / solutionKeywords.length 
      : 0;
    
    let calculatedScore = Math.round(matchPercentage * totalMark);
    
    if (calculatedScore === 0 && matchCount > 0 && normalizedStudentAnswer.length > 10) {
      calculatedScore = 1;
    }
    
    if (matchPercentage > 0.8) {
      calculatedScore = totalMark;
    }
    
    return calculatedScore;
  };

  const handleBackToDashboard = () => {
    navigate('/student-dash');
  };

  const handleBack = () => {
    navigate('/solvequestion', {
      state: {
        question: question,
        questionNumber: questionNumber,
        questionList: questionList,
        class_id: class_id,
        subject_id: subject_id,
        topic_ids: topic_ids,
        subtopic: subtopic,
        image: questionImage,
        index: questionNumber ? questionNumber - 1 : 0,
        selectedQuestions: questionList,
        question_id: question_id,
        context: context
      }
    });
  };
  const handleShowQuestionList = () => {
    setShowQuestionListModal(true);
  };

  const handleCloseQuestionList = () => {
    setShowQuestionListModal(false);
  };

  const handleQuestionSelect = (selectedQuestion, index, selectedImage, question_id, questionContext = null) => {
    navigate('/solvequestion', {
      state: {
        question: selectedQuestion,
        questionNumber: index + 1,
        questionList,
        class_id,
        subject_id,
        topic_ids,
        subtopic,
        image: selectedImage,
        question_id: question_id || `question_${index}_${Date.now()}`,
        context: questionContext
      }
    });
  };

  const handlePracticeSimilar = () => {
    if (!question) {
      setErrorMessage('No question available for practice');
      return;
    }
  
    navigate('/similar-questions', {
      state: {
        originalQuestion: question,
        class_id,
        subject_id,
        topic_ids,
        subtopic,
        questionImage,
        solution: ai_explaination || solution
      }
    });
  };

  // Display the score with proper formatting
  const renderScore = () => {
    const scoreFromApi = obtained_marks !== undefined 
                    ? (typeof obtained_marks === 'number' ? obtained_marks : parseInt(obtained_marks, 10))
                    : (score !== undefined 
                        ? (typeof score === 'number' ? score : parseInt(score, 10))
                        : null);
    
    const totalValue = total_marks !== undefined
      ? (typeof total_marks === 'number' ? total_marks : parseInt(total_marks, 10))
      : (question_marks !== undefined
          ? (typeof question_marks === 'number' ? question_marks : parseInt(question_marks, 10))
          : 10);

    if (scoreFromApi !== null) {
      return (
        <div className="result-score">
          <p><strong>Score:</strong> {scoreFromApi} / {totalValue}</p>
        </div>
      );
    }
    
    if (isCalculatingScore) {
      return (
        <div className="result-score calculating">
          <p>
            <Spinner animation="border" size="sm" /> 
            <strong> Calculating Score...</strong>
          </p>
        </div>
      );
    }
  };

  // Function to render solution steps with proper formatting
  const renderSolutionSteps = (steps) => {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return <p>No solution steps available.</p>;
    }

    return (
      <div className="solution-steps">
        {steps.map((step, index) => {
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

  const formatExampleContent = (example) => {
    if (!example) return null;

    const [intro, ...stepParts] = example.split(/Step \d+:/);
// Remove empty parts
    return (
      <div className="example-content">
        <div className="example-steps">
          {stepParts.map((step, index) => (
            <div key={index} className="example-step">
              <strong>{`Step ${index + 1}:`}</strong><MarkdownWithMath content={step.replace(/\*\*/g, '').trim()} />
            </div>
          ))}
        </div>
        
        
      </div>
    );
  };
// Function to render video cards (for concept videos or real-world applications)
  const renderVideoSection = (videosArray, title) => {
    if (!Array.isArray(videosArray) || videosArray.length === 0) return null;

    return (
      <div className="video-section">
        <h5 className="video-section-title">{title}</h5>
        <div className="video-list">
          {videosArray.map((video, index) => (
            <div key={index} className="video-card">
              <a
                href={video.url || video.embed_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="video-thumbnail"
                />
              </a>
              <div className="video-info">
                <p className="video-title"><strong>{video.title}</strong></p>
                <p className="video-channel">{video.channel}</p>
                <p className="video-meta">
                  ⏱ {video.duration} | 👁 {video.views} | 👍 {video.likes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContentBasedOnAction = () => {
    if (!actionType) {
      return <p>No action type provided. Unable to display results.</p>;
    }

    switch (actionType) {

      case 'submit':
        return (
          <>
            <div className="result-question">
              <p><strong>Student Answer:</strong></p>
              <div className="student-answer-content">
                {student_answer || "No answer submitted"}
              </div>
            </div>
            {renderScore()}
            {comment && (
              <div className="result-question">
                <p><strong>Comments:</strong> {comment}</p>
              </div>
            )}
            {formated_concepts_used && (
              <div className="result-question">
                <p><strong>Concepts Used:</strong> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );
      case 'solve':
        return (
          <>
            <div className="result-question">
              <p className="solution-header">AI Solution:</p>
              {question_image_base64 && (
                <div className="solution-image-container">
                  <img 
                    src={`data:image/jpeg;base64,${question_image_base64}`}
                    alt="Solution diagram"
                    className="solution-image"
                  />
                </div>
              )}
              {renderSolutionSteps(ai_explaination)}
            </div>
            {comment && (
              <div className="result-question">
                <p><strong>Comments:</strong> {comment}</p>
              </div>
            )}
            {formated_concepts_used && (
              <div className="result-question">
                <p><strong>Concepts Used:</strong> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );
        case 'correct':   
        return (         
        <>
            {/* <div className="result-question">
              <p><strong>Student Answer:</strong></p>
              <div className="student-answer-content">
                {student_answer || "No answer submitted"}
              </div>
            </div> */}
          <div className="result-question">
            <p className="solution-header">AI Solution:</p>
            {question_image_base64 && (
              <div className="solution-image-container">
                <img 
                  src={`data:image/jpeg;base64,${question_image_base64}`}
                  alt="Solution diagram"
                  className="solution-image"
                />
              </div>
            )}
            {renderSolutionSteps(ai_explaination)}
            </div>
            {renderScore()}
            {comment && (
              <div className="result-question">
                <p><strong>Comments:</strong> <MarkdownWithMath content={comment} /></p>
              </div>
            )}
            {gap_analysis && (
              <div className="result-question">
                <p><strong>Gap Analysis:</strong><MarkdownWithMath content={gap_analysis} /></p>
              </div>
            )}

            {error_type && (
              <div className="result-question">
                <p><strong>Type of Error:</strong> <MarkdownWithMath content={error_type} /></p>
              </div>
            )}
            {time_analysis && (
              <div className="result-question">
                <p><strong>Time-Management:</strong><MarkdownWithMath content={time_analysis} /> </p>
              </div>
            )}
            {formated_concepts_used && (
              <div className="result-question">
                <p><strong>Concepts Required:</strong> <MarkdownWithMath content={formated_concepts_used} /></p>
              </div>
            )}
          </>
        );
    
      case 'explain':
        return (
          <>
            {concepts && (
              <Accordion defaultActiveKey="0" className="result-accordion">
                {concepts.map((conceptItem, index) => (
                  <Accordion.Item eventKey={index.toString()} key={index} className="accordion-item">
                    <Accordion.Header>
                      <strong>{`Concept ${index + 1}`}</strong>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p className="concept-title">
                        <strong>{conceptItem.concept}</strong>
                      </p>
                       <p className="example-content">
                        <strong className='example-header'>Explanation:</strong>
                      </p>
                      <p>  <MarkdownWithMath content={conceptItem.explanation} /></p>

                      {/* 🧮 Example Section */}
                      {conceptItem.example && (
                        <div className="example-content pt-3">
                          {typeof conceptItem.example === "string" ? (
                            <>
                            <p className="example-content">
                        <strong className='example-header'>Example:</strong>
                      </p>
                              <MarkdownWithMath content={conceptItem.example} />
                              <strong className="example-header">Solution:</strong>
                              <MarkdownWithMath content={conceptItem.application} />
                            
                            </>
                          ) : (
                            <>
                              {conceptItem.example.problem && (
                                <MarkdownWithMath content={conceptItem.example.problem} />
                              )}
                              {conceptItem.example.solution && (
                                <>
                                  <strong className="example-header">Solution:</strong>
                                  <MarkdownWithMath content={conceptItem.example.solution} />
                                  <MarkdownWithMath content={conceptItem.example.explaination} />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* 🟦 Add filtered video + real world video sections */}
                      {Array.isArray(videos) && videos.length > 0 && (
                        videos
                          .filter(
                            (item) =>
                              item.concept_name?.toLowerCase().trim() ===
                              conceptItem.concept?.toLowerCase().trim()
                          )
                          .map((item, idx) => (
                            <div key={idx}>
                              {/* Concept Explanation Videos */}
                              {Array.isArray(item.videos) && item.videos.length > 0 && (
                                renderVideoSection(
                                  item.videos,
                                  `Concept Explanation Videos`
                                )
                              )}

                              {/* Real World Applications */}
                              {item.real_world_video && (
                                renderVideoSection(
                                  [item.real_world_video],
                                  // `${item.concept_name} - Real World Applications`
                                )
                              )}
                            </div>
                          ))
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
            {comment && (
              <div className="result-question">
                <p><strong>Comments:</strong> </p>
                <MarkdownWithMath content={comment} />
              </div>
            )}
            {formated_concepts_used && (
              <div className="result-question">
                <p><strong>Concepts Used:</strong> {formated_concepts_used}</p>
              </div>
            )}
          </>
        );
        
      default:
        return <p>No action type provided. Unable to display results.</p>;
    }
  };

  return (
    <>
      {/* Fixed Back Button - Top Left */}
      <div className="fixed-back-button">
        <Button
          variant="outline-primary"
          onClick={handleBack}
          className="back-btn-fixed"
        >
          ← Back
        </Button>
        {/* Tutorial Toggle Button */}
        {/* <button
          className="tutorial-toggle-btn-result"
          onClick={() => startTutorialForPage("resultPage")}
          title="Start Tutorial"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginLeft: '10px',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: '5px' }} />
          Tutorial
        </button> */}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed-bottom-buttons">
        <Button
          variant="outline-primary"
          onClick={handleShowQuestionList}
          className="dashboard-btn-fixed"
        >
           Question List
        </Button>
        <Button
          variant="primary"
          onClick={handlePracticeSimilar}
          className="practice-btn-fixed"
        >
          Similar Questions
        </Button>
      </div>

      {/* Main Content Container */}
      <Container fluid className={`result-page-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <Row className="result-row">
          {/* Left Column - Sticky Image Container */}
          {allStudentImages.length > 0 && (
            <Col lg={5} className="image-column">
              <div className="result-content">
                <h2 className="result-title">Your Solution</h2>
                <div className="student-images">
                  {allStudentImages.map((imageData, index) => (
                    <div key={index} className="student-image-wrapper">
                      <img 
                        src={imageData.src}
                        alt={imageData.label}
                        className="student-solution-image"
                        onError={(e) => {
                          console.error('Error loading image:', imageData.src);
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="image-label">{imageData.label}</span>
                      {imageData.type === 'processed' && (
                        <span className="image-type-badge">AI Processed</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Fallback text display if no images or images fail to load */}
                {student_answer && (
                  <div className="student-answer-text">
                    <h5>Answer Text:</h5>
                    <div className="answer-text-content">
                      <MarkdownWithMath content={student_answer} />
                    </div>
                  </div>
                )}
               
              </div>
            </Col>
          )}
          
          {/* Right Column - Content */}
          <Col lg={allStudentImages.length > 0 ? 7 : 12} className="content-column">
            <div className="result-content">
              <h2 className="result-title">Result</h2>
              
              {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                  {errorMessage}
                </Alert>
              )}
              
              <div className="result-question">
                <p><strong>Question {questionNumber}:</strong> <MarkdownWithMath content={question} /></p>
                {questionImage && (
                  <div className="question-image-container">
                    <img 
                      src={questionImage}
                      alt="Question"
                      className="question-image"
                    />
                  </div>
                )}
                {solution && solution.length > 0 && (
                  <div className="result-solution">
                    <p className="solution-header">Solution:</p>
                    {renderSolutionSteps(solution)}
                  </div>
                )}
              </div>
              
              {renderContentBasedOnAction()}
              
              {/* Add some bottom padding to prevent content from being hidden behind fixed buttons */}
              <div style={{ height: '100px' }}></div>
            </div>
          </Col>
        </Row>

        <QuestionListModal
          show={showQuestionListModal}
          onHide={handleCloseQuestionList}
          questionList={questionList}
          onQuestionClick={handleQuestionSelect}
        />
      </Container>

      {/* Tutorial Component */}
      {/* {shouldShowTutorialForPage("resultPage") && (
        <Tutorial
          steps={tutorialSteps}
          onComplete={handleTutorialComplete}
        />
      )} */}

      {/* Mascot Component */}
      {/* <Mascot position="bottom-right" mode="3d" /> */}
    </>
  );
};

export default ResultPage; 