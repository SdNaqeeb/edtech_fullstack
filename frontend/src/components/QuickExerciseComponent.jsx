import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Modal, Table, Badge, Card } from 'react-bootstrap';
import Select from 'react-select';
import axiosInstance from '../api/axiosInstance';
import QuestionListModal from './QuestionListModal';
import './QuickExerciseComponent.css';
import MarkdownWithMath from "./MarkdownWithMath";

const QuickExerciseComponent = ({ onCreateHomework, mode = "homework" }) => {
  // State for dropdown data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);

  // State for selections
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionType, setQuestionType] = useState("");
  const [questionLevel, setQuestionLevel] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("");
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for homework form
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkCode, setHomeworkCode] = useState("");
  const [homeworkDescription, setHomeworkDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State for classwork PDF upload
  const [classworkTitle, setClassworkTitle] = useState("");
  const [classworkCode, setClassworkCode] = useState("");
  const [classworkDescription, setClassworkDescription] = useState("");
  const [classworkDueDate, setClassworkDueDate] = useState("");
  const [classworkPDF, setClassworkPDF] = useState(null);
  const [isClassworkSubmitting, setIsClassworkSubmitting] = useState(false);
  const [classworkError, setClassworkError] = useState(null);
  const [showClassworkForm, setShowClassworkForm] = useState(false);

  // State for previous classwork submissions modal
  const [showPreviousClasswork, setShowPreviousClasswork] = useState(false);
  const [previousClassworkData, setPreviousClassworkData] = useState([]);
  const [isLoadingPreviousClasswork, setIsLoadingPreviousClasswork] = useState(false);
  const [previousClassworkError, setPreviousClassworkError] = useState(null);

  // State for previous homework submissions modal
  const [showPreviousHomework, setShowPreviousHomework] = useState(false);
  const [previousHomeworkData, setPreviousHomeworkData] = useState([]);
  const [isLoadingPreviousHomework, setIsLoadingPreviousHomework] = useState(false);
  const [previousHomeworkError, setPreviousHomeworkError] = useState(null);

  // State for homework list modal
  const [showHomeworkListModal, setShowHomeworkListModal] = useState(false);
  const [homeworkList, setHomeworkList] = useState([]);
  const [isLoadingHomeworkList, setIsLoadingHomeworkList] = useState(false);
  const [homeworkListError, setHomeworkListError] = useState(null);

  // Fetch classes on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        const classResponse = await axiosInstance.get("/classes/");
        const classesData = classResponse.data.data;
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes", error);
      }
    }
    fetchData();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          const subjectResponse = await axiosInstance.post("/subjects/", {
            class_id: selectedClass,
          });
          setSubjects(subjectResponse.data.data);
          // Reset dependent fields
          setSelectedSubject("");
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  // Fetch chapters when subject is selected
  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          const chapterResponse = await axiosInstance.post("/chapters/", {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });
          setChapters(chapterResponse.data.data);
          // Reset dependent fields
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("Error fetching chapters:", error);
          setChapters([]);
        }
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Fetch subtopics or worksheets when selection changes based on question type
  useEffect(() => {
    async function fetchDataForType() {
      if (!selectedClass || !selectedSubject || selectedChapters.length === 0) return;

      if (questionType === "external") {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0],
            external: true,
          });
          if (response.data && response.data.subtopics) {
            setSubTopics(response.data.subtopics);
          } else {
            setSubTopics([]);
          }
        } catch (error) {
          console.error("Error fetching subtopics:", error);
          setSubTopics([]);
        }
      } else if (questionType === "worksheets") {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0],
            worksheets: true,
          });
          setWorksheets(response.data?.worksheets || []);
        } catch (error) {
          console.error("Error fetching worksheets:", error);
          setWorksheets([]);
        }
      }
    }
    fetchDataForType();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  // Reset dependent fields when question type changes
  useEffect(() => {
    if (questionType !== "external") setQuestionLevel("");
    if (questionType !== "worksheets") setSelectedWorksheet("");
  }, [questionType]);

  // Fetch previous classwork submissions
  const fetchPreviousClassworkSubmissions = async () => {
    setIsLoadingPreviousClasswork(true);
    setPreviousClassworkError(null);
    
    try {
      const response = await axiosInstance.get("/classwork-submission/");
      console.log("Previous classwork submissions:", response.data);
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          setPreviousClassworkData(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setPreviousClassworkData(response.data.data);
        } else if (response.data.submissions && Array.isArray(response.data.submissions)) {
          setPreviousClassworkData(response.data.submissions);
        } else {
          // If data is an object with submissions, convert to array
          setPreviousClassworkData([response.data]);
        }
      } else {
        setPreviousClassworkData([]);
      }
      setShowPreviousClasswork(true);
    } catch (error) {
      console.error("Error fetching previous classwork:", error);
      setPreviousClassworkError(error.response?.data?.message || "Failed to fetch previous classwork submissions");
      setPreviousClassworkData([]);
      setShowPreviousClasswork(true);
    } finally {
      setIsLoadingPreviousClasswork(false);
    }
  };

  // Fetch previous homework submissions
  const fetchPreviousHomeworkSubmissions = async () => {
    setIsLoadingPreviousHomework(true);
    setPreviousHomeworkError(null);
    
    try {
      const response = await axiosInstance.get(`/homework-submission/?homework_code=HW-662037`);
      console.log("Previous homework submissions:", response.data);
      
      // Handle different response formats
      if (response.data) {
        if (Array.isArray(response.data)) {
          setPreviousHomeworkData(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setPreviousHomeworkData(response.data.data);
        } else if (response.data.submissions && Array.isArray(response.data.submissions)) {
          setPreviousHomeworkData(response.data.submissions);
        } else {
          // If data is an object with submissions, convert to array
          setPreviousHomeworkData([response.data]);
        }
      } else {
        setPreviousHomeworkData([]);
      }
      setShowPreviousHomework(true);
    } catch (error) {
      console.error("Error fetching previous homework:", error);
      setPreviousHomeworkError(error.response?.data?.message || "Failed to fetch previous homework submissions");
      setPreviousHomeworkData([]);
      setShowPreviousHomework(true);
    } finally {
      setIsLoadingPreviousHomework(false);
    }
  };

  // Fetch homework list for analysis reports
  const fetchHomeworkList = async () => {
    setIsLoadingHomeworkList(true);
    setHomeworkListError(null);
    setHomeworkList([]);

    try {
      const response = await axiosInstance.get("/homework-list/");
      console.log("Homework list:", response.data);
      
      if (response.data && response.data.homework_codes && Array.isArray(response.data.homework_codes)) {
        setHomeworkList(response.data.homework_codes);
      } else {
        setHomeworkListError("No homework codes found or invalid response format.");
      }
      setShowHomeworkListModal(true);
    } catch (error) {
      console.error("Error fetching homework list:", error);
      setHomeworkListError(error.response?.data?.message || "Failed to fetch homework list.");
      setHomeworkList([]);
      setShowHomeworkListModal(true);
    } finally {
      setIsLoadingHomeworkList(false);
    }
  };

  // Handle homework selection from list modal
  const handleHomeworkSelection = async (homeworkCode) => {
    setShowHomeworkListModal(false);
    setIsLoadingPreviousHomework(true);
    setPreviousHomeworkError(null);

    try {
      const response = await axiosInstance.get(`/homework-submission/?homework_code=${homeworkCode}`);
      console.log("Previous homework submissions for:", homeworkCode, response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setPreviousHomeworkData(response.data);
      } else if (response.data && response.data.submissions && Array.isArray(response.data.submissions)) {
        setPreviousHomeworkData(response.data.submissions);
      } else {
        setPreviousHomeworkData([response.data]);
      }
      setShowPreviousHomework(true);
    } catch (error) {
      console.error("Error fetching homework submissions for report:", error);
      setPreviousHomeworkError(error.response?.data?.message || "Failed to fetch homework submissions for report.");
      setPreviousHomeworkData([]);
      setShowPreviousHomework(true);
    } finally {
      setIsLoadingPreviousHomework(false);
    }
  };


  // Determine if generate button should be enabled
  const isGenerateButtonEnabled = () => {
    if (
      selectedClass === "" ||
      selectedSubject === "" ||
      selectedChapters.length === 0 ||
      questionType === "" ||
      isLoading
    ) {
      return false;
    }
    if (questionType === "external") return questionLevel !== "";
    if (questionType === "worksheets") return selectedWorksheet !== "";
    return false;
  };

  // Handle form submission to generate questions
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isGenerateButtonEnabled()) {
      console.error("Please select all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request data based on question type
      const requestData = {
        classid: Number(selectedClass),
        subjectid: Number(selectedSubject),
        topicid: selectedChapters,
        subtopic: questionType === "external" ? questionLevel : null,
        worksheet_name: questionType === "worksheets" ? selectedWorksheet : null,
      };

      console.log("Requesting questions with:", requestData);
      
      const response = await axiosInstance.post("/question-images/", requestData);
      console.log("Questions response:", response.data);
      
      // Process questions if they exist
      if (response.data && response.data.questions && Array.isArray(response.data.questions)) {
        console.log("Questions found:", response.data);
        const questionsWithImages = response.data.questions.map((question) => ({
          ...question,
          question: question.question,
          image: question.question_image
            ? `data:image/png;base64,${question.question_image}`
            : null,
        }));

        setQuestionList(questionsWithImages);
        setSelectedQuestions([]); // Reset selected questions
        setShowQuestionList(true);
      } else {
        // If no questions array in the response, try to map the subtopics to exercises
        // This is a fallback if the API behaves differently than expected
        console.log("No questions found in response, creating manual questions");
        
        // Get the selected subtopic's index in the subtopics array
        const subtopicIndex = subTopics.findIndex(st => st === questionLevel);
        const exerciseNumber = subtopicIndex !== -1 ? subtopicIndex + 1 : 1;
        
        // Create a single mock question representing the exercise
        const mockQuestions = [{
          question: `Exercise ${exerciseNumber} from Chapter ${selectedChapters.map(c => 
            chapters.find(ch => ch.topic_code === c)?.name || c).join(", ")}`,
          question_image: null
        }];
        
        setQuestionList(mockQuestions);
        setSelectedQuestions([]); // Reset selected questions
        setShowQuestionList(true);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert(`Failed to generate questions: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle question selection from modal
  const handleMultipleSelectSubmit = (selectedQuestionsData) => {
    console.log("Selected questions:", selectedQuestionsData);
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);
    setShowHomeworkForm(true);
    
    // Generate a default homework code
    const timestamp = new Date().getTime().toString().slice(-6);
    setHomeworkCode(`HW-${timestamp}`);
    
    // Generate a default title based on subject and chapter
    const subjectName = subjects.find(s => s.subject_code === selectedSubject)?.subject_name || "Subject";
    const chapterName = chapters.find(c => c.topic_code === selectedChapters[0])?.name || "Chapter";
    
    // Get exercise number from subtopic
    const subtopicIndex = subTopics.findIndex(st => st === questionLevel);
    const exerciseNumber = subtopicIndex !== -1 ? subtopicIndex + 1 : "";
    
    setHomeworkTitle(`${subjectName} - ${chapterName} Exercise ${exerciseNumber}`);
  };

  // Handle homework submission
  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!homeworkTitle.trim() || !homeworkCode.trim() || !dueDate) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // Create the questions text for the description
      const questionsText = selectedQuestions.map((q, idx) => 
        `Question ${idx + 1}: ${q.question}`
      ).join('\n\n');
      console.log("Questions text:", questionsText);
      // Combine user description with questions
      const fullDescription = homeworkDescription.trim() 
        ? `${homeworkDescription}\n\n${questionsText}`
        : questionsText;

      // Create assignment object
      const assignment = {
        homework_code: homeworkCode.trim(),
        title: homeworkTitle.trim(),
        description: selectedQuestions,
        imageUrl: selectedQuestions.length > 0 && selectedQuestions[0].image ? selectedQuestions[0].image : null,
        teacherId: selectedClass, // Using selectedClass as teacherId
        classId: selectedClass,
        due_date: new Date(dueDate).toISOString(),
        date_assigned: new Date().toISOString(),
        questions: selectedQuestions,
      };
      
      // Submit assignment
      await onCreateHomework(assignment);
      
      // Reset form and state
      setShowHomeworkForm(false);
      setHomeworkTitle("");
      setHomeworkCode("");
      setHomeworkDescription("");
      setDueDate("");
      setSelectedQuestions([]);
      
      // Show success message
     
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create assignment");
      console.error("Error creating homework assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF file upload for classwork with 30MB limit
  const handleClassworkPDFChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        setClassworkError("Please upload only PDF files.");
        e.target.value = null; // Reset the input
        setClassworkPDF(null);
        return;
      }
      
      // Check file size (30MB = 30 * 1024 * 1024 bytes)
      const maxSize = 30 * 1024 * 1024; // 30MB in bytes
      if (file.size > maxSize) {
        setClassworkError("File size must be less than 30MB.");
        e.target.value = null; // Reset the input
        setClassworkPDF(null);
        return;
      }
      
      setClassworkError(null); // Clear any previous errors
      setClassworkPDF(file);
    }
  };

  // Classwork submission handler (after questions are selected)
  const handleClassworkSubmit = async (e) => {
    e.preventDefault();
    setClassworkError(null);
    setIsClassworkSubmitting(true);
    
    if (!classworkTitle.trim() || !classworkCode.trim() || !classworkDueDate) {
      setClassworkError("Please fill in all required fields.");
      setIsClassworkSubmitting(false);
      return;
    }
    
    if (!classworkPDF) {
      setClassworkError("Please upload a PDF file of student work.");
      setIsClassworkSubmitting(false);
      return;
    }
    
    if (!selectedQuestions || selectedQuestions.length === 0) {
      setClassworkError("Please select at least one question.");
      setIsClassworkSubmitting(false);
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Append PDF file
      formData.append('pdf_response', classworkPDF);
      
      // Append classwork information
      formData.append('class_work_code', classworkCode.trim());
      formData.append('worksheet_name', classworkTitle.trim());
      
      // Append questions data
      formData.append('questions', JSON.stringify(selectedQuestions));
      
      // Make API call to classwork-submission endpoint
      const response = await axiosInstance.post('/classwork-submission/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Reset form and state
      setClassworkTitle("");
      setClassworkCode("");
      setClassworkDescription("");
      setClassworkDueDate("");
      setClassworkPDF(null);
      setSelectedQuestions([]);
      setShowClassworkForm(false);
      
      alert("Classwork PDF and questions uploaded successfully!");
    } catch (error) {
      setClassworkError(error.response?.data?.error || "Failed to upload classwork");
      console.error("Error uploading classwork:", error);
    } finally {
      setIsClassworkSubmitting(false);
    }
  };

  // Render the homework form
  const renderHomeworkForm = () => {
    return (
      <div className="homework-form-container">
        <h3>Create Homework Assignment</h3>
        {error && <div className="error-message">{error}</div>}
        
        <Form onSubmit={handleHomeworkSubmit}>
          <Row className="mb-3">
            <Col xs={12} md={6}>
              <Form.Group controlId="homeworkCode">
                <Form.Label>Homework Code</Form.Label>
                <Form.Control 
                  type="text"
                  value={homeworkCode}
                  onChange={(e) => setHomeworkCode(e.target.value)}
                  placeholder="Enter a unique code"
                  required
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={6}>
              <Form.Group controlId="dueDate">
                <Form.Label>Due Date</Form.Label>
                <Form.Control 
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group controlId="homeworkTitle" className="mb-3">
            <Form.Label>Assignment Title</Form.Label>
            <Form.Control 
              type="text"
              value={homeworkTitle}
              onChange={(e) => setHomeworkTitle(e.target.value)}
              placeholder="Enter assignment title"
              required
            />
          </Form.Group>
          
          <Form.Group controlId="homeworkDescription" className="mb-3">
            <Form.Label>Additional Instructions (Optional)</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              value={homeworkDescription}
              onChange={(e) => setHomeworkDescription(e.target.value)}
              placeholder="Enter any additional instructions"
            />
          </Form.Group>
          
          <div className="selected-questions-preview mb-3">
            <h5>Selected Questions ({selectedQuestions.length})</h5>
            <ul className="question-preview-list">
              {selectedQuestions.map((q, idx) => (
                <li key={idx} className="question-preview-item">
                  <span className="question-number">{idx + 1}.</span>
                  {/* <span className="question-text">{q.question}</span> */}
                  <MarkdownWithMath content={q.question} />
                  {q.image && (
                    <div className="question-image-small">
                      <img src={q.image} alt={`Question ${idx + 1}`} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="d-flex justify-content-between">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowHomeworkForm(false);
                setShowQuestionList(true);
              }}
            >
              Back to Questions
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Homework Assignment'}
            </Button>
          </div>
        </Form>
      </div>
    );
  };

  // Render classwork PDF upload form
  const renderClassworkForm = () => (
    <div className="homework-form-container">
      <h3>Upload Classwork PDF & Submit Questions</h3>
      {classworkError && <div className="error-message">{classworkError}</div>}
      <Form onSubmit={handleClassworkSubmit}>
        <Row className="mb-3">
          <Col xs={12} md={6}>
            <Form.Group controlId="classworkCode">
              <Form.Label>Classwork Code</Form.Label>
              <Form.Control
                type="text"
                value={classworkCode}
                onChange={(e) => setClassworkCode(e.target.value)}
                placeholder="Enter a unique code"
                required
              />
            </Form.Group>
          </Col>
          <Col xs={12} md={6}>
            <Form.Group controlId="classworkDueDate">
              <Form.Label>Duration in hours</Form.Label>
              <Form.Control
                type="number"
                value={classworkDueDate}
                onChange={(e) => setClassworkDueDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group controlId="classworkTitle" className="mb-3">
          <Form.Label>Classwork Title</Form.Label>
          <Form.Control
            type="text"
            value={classworkTitle}
            onChange={(e) => setClassworkTitle(e.target.value)}
            placeholder="Enter classwork title"
            required
          />
        </Form.Group>
        <Form.Group controlId="classworkDescription" className="mb-3">
          <Form.Label>Additional Instructions (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={classworkDescription}
            onChange={(e) => setClassworkDescription(e.target.value)}
            placeholder="Enter any additional instructions"
          />
        </Form.Group>
        
        {/* PDF upload with 30MB limit */}
        <Form.Group controlId="classworkPDF" className="mb-3">
          <Form.Label>Upload Student Work PDF (Max 30MB)</Form.Label>
          <Form.Control
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleClassworkPDFChange}
            required
          />
          {classworkPDF && (
            <div style={{ marginTop: 8, color: '#28a745' }}>
              <span>✓ Selected file: {classworkPDF.name} ({(classworkPDF.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          )}
          <Form.Text className="text-muted">
            Only PDF files up to 30MB are allowed
          </Form.Text>
        </Form.Group>
        
        {/* Preview selected questions */}
        <div className="selected-questions-preview mb-3">
          <h5>Selected Questions ({selectedQuestions.length})</h5>
          <ul className="question-preview-list">
            {selectedQuestions.map((q, idx) => (
              <li key={idx} className="question-preview-item">
                <span className="question-number">{idx + 1}.</span>
                <MarkdownWithMath content={q.question} />
                {q.image && (
                  <div className="question-image-small">
                    <img src={q.image} alt={`Question ${idx + 1}`} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => {
              setShowClassworkForm(false);
              setShowQuestionList(true);
            }}
          >
            Back to Questions
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isClassworkSubmitting}
          >
            {isClassworkSubmitting ? "Uploading..." : "Upload Classwork PDF & Questions"}
          </Button>
        </div>
      </Form>
    </div>
  );


  // Format subtopic display names
  const getSubtopicDisplayName = (subtopic, index) => {
    return `Exercise ${index + 1}`;
  };

  // Render Previous Classwork Modal
  const renderPreviousClassworkModal = () => (
    <Modal 
      show={showPreviousClasswork} 
      onHide={() => setShowPreviousClasswork(false)}
      size="xl"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>Previous Classwork Submissions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {previousClassworkError ? (
          <div className="alert alert-danger">
            {previousClassworkError}
          </div>
        ) : previousClassworkData.length === 0 ? (
          <div className="alert alert-info">
            No previous classwork submissions found.
          </div>
        ) : (
          <div className="previous-classwork-container">
            {previousClassworkData.map((submission, index) => (
              <Card key={submission.id || index} className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      Classwork Code: {submission.class_code || 'N/A'}
                    </h5>
                    <div>
                      <Badge bg="light" text="dark">
                        {submission.assignment_type || 'classwork'}
                      </Badge>
                      {submission.total_class_minutes && (
                        <Badge bg="info" className="ms-2">
                          {submission.total_class_minutes} mins
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {/* Processing Summary */}
                  {submission.processing_summary && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="text-primary">Processing Summary</h6>
                      <Row>
                        <Col md={3}>
                          <small className="text-muted">Processed At:</small>
                          <p className="mb-1">
                            {new Date(submission.processing_timestamp || submission.processing_summary.timestamp).toLocaleString()}
                          </p>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Total Pages:</small>
                          <p className="mb-1">{submission.processing_summary.total_pages || 0}</p>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Files Processed:</small>
                          <p className="mb-1">{submission.processing_summary.files_processed || 0}</p>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Students Evaluated:</small>
                          <p className="mb-1">{submission.processing_summary.students_evaluated || 0}</p>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Class Analytics */}
                  {submission.class_analytics && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="text-primary">Class Analytics</h6>
                      <Row>
                        <Col md={3}>
                          <small className="text-muted">Average Score:</small>
                          <h5 className="mb-1">{submission.class_analytics.average_score || 0}%</h5>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Highest Score:</small>
                          <h5 className="mb-1">{submission.class_analytics.highest_score || 0}%</h5>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Lowest Score:</small>
                          <h5 className="mb-1">{submission.class_analytics.lowest_score || 0}%</h5>
                        </Col>
                        <Col md={3}>
                          <small className="text-muted">Total Students:</small>
                          <h5 className="mb-1">{submission.class_analytics.total_students || 0}</h5>
                        </Col>
                      </Row>
                      
                      {/* Grade Distribution */}
                      {submission.class_analytics.grade_distribution && (
                        <div className="mt-3">
                          <small className="text-muted">Grade Distribution:</small>
                          <div className="d-flex gap-2 mt-2">
                            {Object.entries(submission.class_analytics.grade_distribution).map(([grade, count]) => (
                              <Badge 
                                key={grade} 
                                bg={grade === 'A' ? 'success' : grade === 'B' ? 'info' : grade === 'C' ? 'warning' : grade === 'D' ? 'secondary' : 'danger'}
                                className="p-2"
                              >
                                {grade}: {count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance Distribution */}
                  {submission.performance_distribution && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <h6 className="text-primary">Performance Distribution</h6>
                      <Row>
                        {Object.entries(submission.performance_distribution).map(([range, count]) => (
                          <Col md={4} key={range} className="mb-2">
                            <small className="text-muted">{range}%:</small>
                            <Badge bg="secondary" className="ms-2">{count} students</Badge>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {/* Student Results */}
                  {submission.student_results && submission.student_results.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-primary">Student Results</h6>
                      <Table striped bordered hover responsive className="mt-2">
                        <thead>
                          <tr>
                            <th>Roll Number</th>
                            <th>Grade</th>
                            <th>Marks Obtained</th>
                            <th>Total Marks</th>
                            <th>Percentage</th>
                            <th>Questions Attempted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submission.student_results.map((student, sIndex) => (
                            <tr key={sIndex}>
                              <td>{student.roll_number}</td>
                              <td>
                                <Badge 
                                  bg={student.grade === 'A' ? 'success' : 
                                     student.grade === 'B' ? 'info' : 
                                     student.grade === 'C' ? 'warning' : 
                                     student.grade === 'D' ? 'secondary' : 'danger'}
                                >
                                  {student.grade}
                                </Badge>
                              </td>
                              <td>{student.total_marks_obtained || 0}</td>
                              <td>{student.total_max_marks || 0}</td>
                              <td>{student.overall_percentage || 0}%</td>
                              <td>{student.questions ? student.questions.length : 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      
                      {/* Detailed Question Analysis for Each Student */}
                      {submission.student_results.some(s => s.questions && s.questions.length > 0) && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-primary">View Detailed Question Analysis</summary>
                          <div className="mt-2">
                            {submission.student_results.map((student, sIndex) => (
                              student.questions && student.questions.length > 0 && (
                                <Card key={sIndex} className="mb-2">
                                  <Card.Header className="py-2">
                                    <strong>Roll Number: {student.roll_number}</strong>
                                  </Card.Header>
                                  <Card.Body className="p-2">
                                    <Table size="sm" bordered>
                                      <thead>
                                        <tr>
                                          <th>Q.No</th>
                                          <th>Score</th>
                                          <th>Max</th>
                                          <th>Error Type</th>
                                          <th>Mistakes Made</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {student.questions.map((q, qIndex) => (
                                          <tr key={qIndex}>
                                            <td>{q.question_number}</td>
                                            <td>{q.total_score || 0}</td>
                                            <td>{q.max_marks || 0}</td>
                                            <td>
                                              <Badge bg="warning" text="dark">
                                                {q.error_type || 'N/A'}
                                              </Badge>
                                            </td>
                                            <td className="small">{q.mistakes_made || 'N/A'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </Card.Body>
                                </Card>
                              )
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Question Analytics */}
                  {submission.class_analytics && submission.class_analytics.question_analytics && (
                    <details className="mb-3">
                      <summary className="cursor-pointer text-primary">View Question Analytics</summary>
                      <div className="mt-2 p-3 bg-light rounded">
                        <Table size="sm" bordered>
                          <thead>
                            <tr>
                              <th>Question</th>
                              <th>Attempts</th>
                              <th>Average Score</th>
                              <th>Max Score</th>
                              <th>Average %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(submission.class_analytics.question_analytics).map(([qNum, data]) => (
                              <tr key={qNum}>
                                <td>{qNum}</td>
                                <td>{data.attempts}</td>
                                <td>{data.total_score}</td>
                                <td>{data.max_score}</td>
                                <td>{data.average_percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </details>
                  )}

                  {/* Footer Info */}
                  <div className="mt-3 pt-3 border-top">
                    <Row>
                      <Col md={6}>
                        <small className="text-muted">Teacher ID: {submission.teacher_name || 'N/A'}</small>
                      </Col>
                      <Col md={6} className="text-end">
                        <small className="text-muted">
                          Submission Date: {submission.submission_date ? new Date(submission.submission_date).toLocaleString() : 'Not submitted'}
                        </small>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowPreviousClasswork(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  // Render Previous Homework Modal
  const renderPreviousHomeworkModal = () => (
    <Modal 
      show={showPreviousHomework} 
      onHide={() => setShowPreviousHomework(false)}
      size="xl"
      scrollable
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-chart-line me-2"></i>
          Previous Homework Analysis Report
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {previousHomeworkError ? (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {previousHomeworkError}
          </div>
        ) : previousHomeworkData.length === 0 ? (
          <div className="alert alert-info text-center py-4">
            <i className="fas fa-info-circle fa-2x mb-3"></i>
            <h5>No previous homework submissions found.</h5>
            <p className="mb-0">Start creating homework assignments to see analysis reports here.</p>
          </div>
        ) : (
          <div className="homework-analysis-container">
            {previousHomeworkData.map((submission, index) => (
              <Card key={submission.id || index} className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-gradient-primary text-black py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      {/* <h5 className="mb-1">
                        <i className="fas fa-homework me-2"></i>
                        Homework: {submission.homework || 'N/A'}
                      </h5> */}
                     
                    </div>
                    <div className="text">
                      <Badge bg="light" text="dark" className="fs-2 px-3 py-2">
                        <i className="fas fa-file-alt me-1"></i>
                        Analysis Report of {submission.student_id}
                      </Badge>
                      <small className="opacity-75">
                        {/* Student: {submission.student_name || 'N/A'} |  */}
                        Submitted: {submission.submission_date ? new Date(submission.submission_date).toLocaleString() : 'N/A'}
                      </small>
                    </div>
                  </div>
                </Card.Header>
                
                <Card.Body className="p-0">
                  {/* Overall Performance Summary */}
                  {submission.result_json && submission.result_json.questions && (
                    <div className="p-4 bg-light">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-chart-pie me-2"></i>
                        Performance Overview
                      </h6>
                      <Row>
                        <Col md={3}>
                          <div className="text-center p-3 bg-white rounded shadow-sm">
                            <div className="text-success fs-4 fw-bold">
                              {submission.result_json.questions.filter(q => q.answer_category === 'Correct').length}
                            </div>
                            <small className="text-muted">Correct Answers</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center p-3 bg-white rounded shadow-sm">
                            <div className="text-warning fs-4 fw-bold">
                              {submission.result_json.questions.filter(q => q.answer_category === 'Partially-Correct').length}
                            </div>
                            <small className="text-muted">Partially Correct</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center p-3 bg-white rounded shadow-sm">
                            <div className="text-danger fs-4 fw-bold">
                              {submission.result_json.questions.filter(q => q.answer_category !== 'Correct' && q.answer_category !== 'Partially-Correct').length}
                            </div>
                            <small className="text-muted">Incorrect</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center p-3 bg-white rounded shadow-sm">
                            <div className="text-info fs-4 fw-bold">
                              {submission.result_json.questions.reduce((sum, q) => sum + (q.total_score || 0), 0)}/{submission.result_json.questions.reduce((sum, q) => sum + (q.max_score || 0), 0)}
                            </div>
                            <small className="text-muted">Total Score</small>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {/* Detailed Question Analysis */}
                  {submission.result_json && submission.result_json.questions && (
                    <div className="p-4">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-list-ul me-2"></i>
                        Question-by-Question Analysis
                      </h6>
                      
                      {submission.result_json.questions.map((question, qIndex) => (
                        <Card key={qIndex} className="mb-3 border-0 shadow-sm">
                          <Card.Header className={`py-2 ${
                            question.answer_category === 'Correct' ? 'bg-success text-white' :
                            question.answer_category === 'Partially-Correct' ? 'bg-warning text-dark' :
                            'bg-danger text-white'
                          }`}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0">
                                <i className="fas fa-question-circle me-2"></i>
                                Question {qIndex + 1}: {question.topic}
                              </h6>
                              <div className="d-flex align-items-center gap-2">
                                <Badge bg="light" text="dark">
                                  {question.answer_category}
                                </Badge>
                                <span className="fs-6">
                                  {question.total_score}/{question.max_score}
                                </span>
                              </div>
                            </div>
                          </Card.Header>
                          
                          <Card.Body className="p-3">
                            <Row>
                              <Col md={8}>
                                <div className="mb-3">
                                  <strong className="text-primary">Question:</strong>
                                  <p className="mb-2 mt-1">{question.question}</p>
                                </div>
                                
                                <div className="mb-3">
                                  <strong className="text-primary">Student's Work:</strong>
                                  <p className="mb-2 mt-1 text-muted">{question.comment}</p>
                                </div>
                                
                                <div className="mb-3">
                                  <strong className="text-primary">Correction:</strong>
                                  <p className="mb-0 mt-1 text-success">{question.correction_comment}</p>
                                </div>
                              </Col>
                              
                              <Col md={4}>
                                <div className="bg-light p-3 rounded">
                                  <h6 className="text-primary mb-2">Analysis</h6>
                                  
                                  <div className="mb-2">
                                    <small className="text-muted">Score:</small>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="fw-bold">{question.total_score}</span>
                                      <span className="text-muted">/</span>
                                      <span className="text-muted">{question.max_score}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-2">
                                    <small className="text-muted">Category:</small>
                                    <Badge 
                                      bg={
                                        question.answer_category === 'Correct' ? 'success' :
                                        question.answer_category === 'Partially-Correct' ? 'warning' :
                                        'danger'
                                      }
                                      className="ms-2"
                                    >
                                      {question.answer_category}
                                    </Badge>
                                  </div>
                                  
                                  <div className="mb-2">
                                    <small className="text-muted">Concepts:</small>
                                    <div className="mt-1">
                                      {question.concept_required && question.concept_required.map((concept, cIndex) => (
                                        <Badge key={cIndex} bg="info" className="me-1 mb-1">
                                          {concept}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Concepts Mastery Summary */}
                  {submission.result_json && submission.result_json.questions && (
                    <div className="p-4 bg-light">
                      <h6 className="text-primary mb-3">
                        <i className="fas fa-brain me-2"></i>
                        Concepts Mastery Summary
                      </h6>
                      
                      <div className="row">
                        {(() => {
                          const conceptStats = {};
                          submission.result_json.questions.forEach(q => {
                            if (q.concept_required) {
                              q.concept_required.forEach(concept => {
                                if (!conceptStats[concept]) {
                                  conceptStats[concept] = { total: 0, correct: 0, questions: [] };
                                }
                                conceptStats[concept].total++;
                                conceptStats[concept].questions.push(q);
                                if (q.answer_category === 'Correct') {
                                  conceptStats[concept].correct++;
                                }
                              });
                            }
                          });
                          
                          return Object.entries(conceptStats).map(([concept, stats]) => (
                            <Col md={6} key={concept} className="mb-3">
                              <Card className="border-0 shadow-sm">
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="mb-0 text-primary">{concept}</h6>
                                    <Badge 
                                      bg={
                                        stats.correct === stats.total ? 'success' :
                                        stats.correct >= stats.total * 0.7 ? 'warning' :
                                        'danger'
                                      }
                                    >
                                      {Math.round((stats.correct / stats.total) * 100)}%
                                    </Badge>
                                  </div>
                                                                     <div className="progress mb-2" style={{ height: '8px' }}>
                                     <div 
                                       className={`progress-bar ${
                                         stats.correct === stats.total ? 'bg-success' :
                                         stats.correct >= stats.total * 0.7 ? 'bg-warning' :
                                         'bg-danger'
                                       }`}
                                       style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                                     ></div>
                                   </div>
                                  <small className="text-muted">
                                    {stats.correct} out of {stats.total} questions correct
                                  </small>
                                </Card.Body>
                              </Card>
                            </Col>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={() => setShowPreviousHomework(false)}>
          <i className="fas fa-times me-2"></i>
          Close
        </Button>
        {/* <Button variant="primary" onClick={() => window.print()}>
          <i className="fas fa-print me-2"></i>
          Print Report
        </Button> */}
      </Modal.Footer>
    </Modal>
  );

  // Render Homework List Modal
  const renderHomeworkListModal = () => (
    <Modal
      show={showHomeworkListModal}
      onHide={() => setShowHomeworkListModal(false)}
      size="lg"
      centered
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-list-alt me-2"></i>
          Previous Homework Assignments
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoadingHomeworkList ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Fetching previous homework assignments...</p>
          </div>
        ) : homeworkListError ? (
          <div className="alert alert-danger text-center py-4">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {homeworkListError}
          </div>
        ) : homeworkList.length === 0 ? (
          <div className="alert alert-info text-center py-4">
            <i className="fas fa-info-circle fa-2x mb-3"></i>
            <h5>No previous homework assignments found.</h5>
            <p className="mb-0">Start creating new homework assignments to see them here.</p>
          </div>
        ) : (
          <div className="list-group">
            {homeworkList.map((homeworkCode, index) => (
              <button
                key={index}
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                onClick={() => handleHomeworkSelection(homeworkCode)}
              >
                <span>{homeworkCode}</span>
                <Badge bg="light" text="dark">
                  View Report
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowHomeworkListModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <>
    <div className="quick-exercise-container">
      {/* Add Previous Classwork Button only for classwork mode */}
      {mode === "classwork" && !showClassworkForm && (
        <div className="d-flex justify-content-end mb-3">
          <Button 
            variant="info" 
            onClick={fetchPreviousClassworkSubmissions}
            disabled={isLoadingPreviousClasswork}
          >
            {isLoadingPreviousClasswork ? 'Loading...' : 'View Previous Classwork Submissions'}
          </Button>
        </div>
      )}

      {mode === "homework" && !showHomeworkForm && (
        <div className="d-flex justify-content-end mb-3">
          {/* <Button 
            variant="info" 
            onClick={fetchPreviousHomeworkSubmissions}
            disabled={isLoadingPreviousHomework}
          >
            {isLoadingPreviousHomework ? 'Loading...' : 'View Previous Homework Submissions'}
          </Button> */}
        </div>
      )}

      {mode === "homework" && !showHomeworkForm && (
        <div className="d-flex justify-content-end mb-3">
          <Button 
            variant="info" 
            onClick={fetchHomeworkList}
            disabled={isLoadingHomeworkList}
          >
            {isLoadingHomeworkList ? 'Loading...' : 'View Previous Homework Assignments'}
          </Button>
        </div>
      )}

      {mode === "classwork"
        ? (
            !showClassworkForm ? (
              <div className="question-selection-container">
                <h3>Quick Classwork Generator</h3>
                <p className="text-muted">Select class, subject, and chapter to generate questions for classwork</p>
                <Form onSubmit={handleSubmit}>
                  <Row className="mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="formClass">
                        <Form.Label>Class</Form.Label>
                        <Form.Control
                          as="select"
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.class_code} value={cls.class_code}>
                              {cls.class_name}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group controlId="formSubject">
                        <Form.Label>Subject</Form.Label>
                        <Form.Control
                          as="select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="form-control"
                          disabled={!selectedClass}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map((subject) => (
                            <option
                              key={subject.subject_code}
                              value={subject.subject_code}
                            >
                              {subject.subject_name}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col className="select-chapters" xs={12} md={6}>
                      <Form.Group controlId="formChapters">
                        <Form.Label>Chapters</Form.Label>
                        <Select
                          isMulti
                          options={chapters.map((chapter) => ({
                            value: chapter.topic_code,
                            label: chapter.name,
                          }))}
                          value={selectedChapters.map((code) => ({
                            value: code,
                            label: chapters.find(
                              (chapter) => chapter.topic_code === code
                            )?.name,
                          }))}
                          onChange={(selectedOptions) => {
                            setSelectedChapters(
                              selectedOptions.map((option) => option.value)
                            );
                          }}
                          classNamePrefix="react-select"
                          placeholder="Select Chapters"
                          isDisabled={!selectedSubject}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group controlId="formQuestionType">
                        <Form.Label>Question Type</Form.Label>
                        <Form.Control
                          as="select"
                          value={questionType}
                          onChange={(e) => setQuestionType(e.target.value)}
                          className="form-control"
                          disabled={selectedChapters.length === 0}
                        >
                          <option value="">Select Question Type</option>
                          <option value="external">Set of Questions</option>
                          <option value="worksheets">Worksheets</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                  {/* Conditional selectors for Set or Worksheet */}
                  {questionType === "external" && (
                    <Row className="mb-3">
                      <Col xs={12} md={6}>
                        <Form.Group controlId="formQuestionLevel">
                          <Form.Label>Select The Set</Form.Label>
                          <Form.Control
                            as="select"
                            value={questionLevel}
                            onChange={(e) => setQuestionLevel(e.target.value)}
                            className="form-control"
                            disabled={selectedChapters.length === 0}
                          >
                            <option value="">Select The Set</option>
                            {subTopics.map((subTopic, index) => (
                              <option key={subTopic} value={subTopic}>
                                {getSubtopicDisplayName(subTopic, index)}
                              </option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  {questionType === "worksheets" && (
                    <Row className="mb-3">
                      <Col xs={12} md={6}>
                        <Form.Group controlId="formWorksheet">
                          <Form.Label>Select Worksheet</Form.Label>
                          <Form.Control
                            as="select"
                            value={selectedWorksheet}
                            onChange={(e) => setSelectedWorksheet(e.target.value)}
                            className="form-control"
                            disabled={selectedChapters.length === 0}
                          >
                            <option value="">Select Worksheet</option>
                            {worksheets.map((worksheet) => (
                              <option key={worksheet.id || worksheet.worksheet_name} value={worksheet.worksheet_name}>
                                {worksheet.worksheet_name}
                              </option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      type="submit"
                      className="btn-generate mt-3"
                      disabled={!isGenerateButtonEnabled()}
                    >
                      {isLoading ? 'Loading...' : 'Generate Questions'}
                    </Button>
                  </div>
                </Form>
              </div>
            ) : renderClassworkForm()
          )
        : (!showHomeworkForm ? (
            <div className="question-selection-container">
              <h3>Quick Homework Generator</h3>
              <p className="text-muted">Select class, subject, and chapter to generate questions for homework</p>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formClass">
                      <Form.Label>Class</Form.Label>
                      <Form.Control
                        as="select"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="form-control"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls.class_code} value={cls.class_code}>
                            {cls.class_name}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formSubject">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control
                        as="select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="form-control"
                        disabled={!selectedClass}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option
                            key={subject.subject_code}
                            value={subject.subject_code}
                          >
                            {subject.subject_name}
                          </option>
                        ))}
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col className="select-chapters" xs={12} md={6}>
                    <Form.Group controlId="formChapters">
                      <Form.Label>Chapters</Form.Label>
                      <Select
                        isMulti
                        options={chapters.map((chapter) => ({
                          value: chapter.topic_code,
                          label: chapter.name,
                        }))}
                        value={selectedChapters.map((code) => ({
                          value: code,
                          label: chapters.find(
                            (chapter) => chapter.topic_code === code
                          )?.name,
                        }))}
                        onChange={(selectedOptions) => {
                          setSelectedChapters(
                            selectedOptions.map((option) => option.value)
                          );
                        }}
                        classNamePrefix="react-select"
                        placeholder="Select Chapters"
                        isDisabled={!selectedSubject}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formQuestionType">
                      <Form.Label>Question Type</Form.Label>
                      <Form.Control
                        as="select"
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                        className="form-control"
                        disabled={selectedChapters.length === 0}
                      >
                        <option value="">Select Question Type</option>
                        <option value="external">Set of Questions</option>
                        <option value="worksheets">Worksheets</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                </Row>
                {/* Conditional selectors for Set or Worksheet */}
                {questionType === "external" && (
                  <Row className="mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="formQuestionLevel">
                        <Form.Label>Select The Set</Form.Label>
                        <Form.Control
                          as="select"
                          value={questionLevel}
                          onChange={(e) => setQuestionLevel(e.target.value)}
                          className="form-control"
                          disabled={selectedChapters.length === 0}
                        >
                          <option value="">Select The Set</option>
                          {subTopics.map((subTopic, index) => (
                            <option key={subTopic} value={subTopic}>
                              {getSubtopicDisplayName(subTopic, index)}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                {questionType === "worksheets" && (
                  <Row className="mb-3">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="formWorksheet">
                        <Form.Label>Select Worksheet</Form.Label>
                        <Form.Control
                          as="select"
                          value={selectedWorksheet}
                          onChange={(e) => setSelectedWorksheet(e.target.value)}
                          className="form-control"
                          disabled={selectedChapters.length === 0}
                        >
                          <option value="">Select Worksheet</option>
                          {worksheets.map((worksheet) => (
                            <option key={worksheet.id || worksheet.worksheet_name} value={worksheet.worksheet_name}>
                              {worksheet.worksheet_name}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn-generate mt-3"
                    disabled={!isGenerateButtonEnabled()}
                  >
                    {isLoading ? 'Loading...' : 'Generate Questions'}
                  </Button>
                </div>
              </Form>
            </div>
          ) : renderHomeworkForm())}
      
      {/* Question List Modal */}
      {showQuestionList && mode !== "classwork" && (
        <QuestionListModal
          show={showQuestionList}
          onHide={() => setShowQuestionList(false)}
          questionList={questionList}
          isMultipleSelect={true}
          onMultipleSelectSubmit={handleMultipleSelectSubmit}
        />
      )}
      
      {/* For classwork mode, show question list modal and then classwork form */}
      {showQuestionList && mode === "classwork" && (
        <QuestionListModal
          show={showQuestionList}
          onHide={() => setShowQuestionList(false)}
          questionList={questionList}
          isMultipleSelect={true}
          onMultipleSelectSubmit={(selectedQuestionsData) => {
            setSelectedQuestions(selectedQuestionsData);
            setShowQuestionList(false);
            setShowClassworkForm(true);
            // Optionally, generate a default code/title
            const timestamp = new Date().getTime().toString().slice(-6);
            setClassworkCode(`CW-${timestamp}`);
            const subjectName = subjects.find(s => s.subject_code === selectedSubject)?.subject_name || "Subject";
            const chapterName = chapters.find(c => c.topic_code === selectedChapters[0])?.name || "Chapter";
            const subtopicIndex = subTopics.findIndex(st => st === questionLevel);
            const exerciseNumber = subtopicIndex !== -1 ? subtopicIndex + 1 : "";
            setClassworkTitle(`${subjectName} - ${chapterName} Exercise ${exerciseNumber}`);
          }}
        />
      )}
      
      {/* Render Previous Classwork Modal */}
      {renderPreviousClassworkModal()}

      {/* Render Previous Homework Modal */}
      {renderPreviousHomeworkModal()}

      {/* Render Homework List Modal */}
      {renderHomeworkListModal()}
    </div>

    <div></div>
    </>
  );
};

export default QuickExerciseComponent;