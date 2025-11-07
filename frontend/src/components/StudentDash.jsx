// Enhanced StudentDash.jsx - Modern Design with Better UX and Chapter Debugging - FIXED
import React, { useState, useEffect, useContext } from "react";
import 'katex/dist/katex.min.css';
import { Form, Button, Row, Col, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./StudentDash.css";
import axiosInstance from "../api/axiosInstance";
import QuestionListModal from "./QuestionListModal";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AuthContext } from "./AuthContext";
import { useAlert } from './AlertBox';
import {
  faSchool,
  faBookOpen,
  faListAlt,
  faClipboardQuestion,
  faQuestionCircle,
  faRocket,
  faGraduationCap,
  faBrain,
  faLightbulb,
  faBars,
  faTimes,
  faSun,
  faMoon,
  faFire,
  faTrophy,
  faMagic,
  faStar,
  faChartLine,
  faCalendarAlt,
  faUsers,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import UnifiedSessions from "./UnifiedSessions";
import StreakTracker from "./StreakTracker";
import LiveNotifications from "./LiveNotifications";

function StudentDash() {
  const navigate = useNavigate();
  const { username, fullName } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();

  // Dark mode state with improved persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // State for dropdown data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subTopics, setSubTopics] = useState([]);
  const [worksheets, setWorksheets] = useState([]);

  // State for selections with smart defaults
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [questionType, setQuestionType] = useState("");
  const [questionLevel, setQuestionLevel] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("");
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [questionList, setQuestionList] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Extract class from username (e.g., 10HPS24 -> 10, 12ABC24 -> 12)
  const extractClassFromUsername = (username) => {
    if (!username) return "";

    const firstTwo = username.substring(0, 2);
    if (!isNaN(firstTwo)) {
      return firstTwo; // ✅ both are digits
    }

    const firstOne = username.charAt(0);
    if (!isNaN(firstOne)) {
      return firstOne; // ✅ only first is digit
    }

    return ""; // ❌ no digits at the start
  };

  // Enhanced time-based greeting with more personalization
  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 6) {
      return "Good Night";
    } else if (currentHour >= 6 && currentHour < 12) {
      return "Good Morning";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "Good Evening";
    } else {
      return "Good Night";
    }
  };

  // Get motivational message based on time
  const getMotivationalMessage = () => {
    const messages = [
      "Ready to unlock your mathematical genius today? Let's dive into some exciting problem-solving! 🚀",
      "Time to explore the fascinating world of mathematics! Every problem is a new adventure waiting to be solved! ✨",
      "Mathematics is the language of the universe - let's learn to speak it fluently! 🌟",
      "Today's learning journey begins with a single step. Let's make it count! 💪",
      "Ready to turn complex problems into simple solutions? Your mathematical journey awaits! 🎯"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Toggle dark mode with smooth transition
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    document.body.classList.toggle('dark-mode', newMode);
  };

  // Apply dark mode on component mount
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Determine if generate button should be enabled
  const isGenerateButtonEnabled = () => {
    if (questionType === "external") {
      return (
        selectedClass !== "" &&
        selectedSubject !== "" &&
        selectedChapters.length > 0 &&
        questionType !== "" &&
        questionLevel !== ""
      );
    }

    if (questionType === "worksheets") {
      return (
        selectedClass !== "" &&
        selectedSubject !== "" &&
        selectedChapters.length > 0 &&
        questionType !== "" &&
        selectedWorksheet !== ""
      );
    }

    return (
      selectedClass !== "" &&
      selectedSubject !== "" &&
      selectedChapters.length > 0 &&
      questionType !== ""
    );
  };

  // Fetch classes and set defaults with debugging
  useEffect(() => {
    async function fetchData() {
      try {
        // console.log("🔍 Fetching classes...");
        const classResponse = await axiosInstance.get("/classes/");
        // console.log("📋 Classes API Response:", classResponse.data);

        const classesData = classResponse.data.data;
        setClasses(classesData);

        // Set default class based on username
        const defaultClass = extractClassFromUsername(username);
        // console.log("👤 Username:", username, "Extracted Class:", defaultClass);

        if (defaultClass) {
          const matchingClass = classesData.find(cls =>
            cls.class_name.includes(defaultClass) || cls.class_code === defaultClass
          );
          // console.log("🎯 Matching class found:", matchingClass);

          if (matchingClass) {
            setSelectedClass(matchingClass.class_code);
            // console.log("✅ Auto-selected class:", matchingClass.class_code);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching classes", error);
      }
    }
    fetchData();
  }, [username]);

  // Fetch subjects and set default with enhanced debugging
  useEffect(() => {
    async function fetchSubjects() {
      if (selectedClass) {
        try {
          // console.log("🔍 Fetching subjects for class:", selectedClass);

          const subjectResponse = await axiosInstance.post("/subjects/", {
            class_id: selectedClass,
          });

          // console.log("📚 Subjects API Response:", subjectResponse.data);

          const subjectsData = subjectResponse.data.data;
          setSubjects(subjectsData);

          // Set default subject to Mathematics
          const mathSubject = subjectsData.find(subject =>
            subject.subject_name.toLowerCase().includes('math')
          );
          if (mathSubject) {
            setSelectedSubject(mathSubject.subject_code);
            // console.log("📐 Auto-selected Math subject:", mathSubject);
          } else {
            // console.log("⚠ No Math subject found, available subjects:", subjectsData);
          }

          // Reset dependent fields
          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("❌ Error fetching subjects:", error);
          console.error("📄 Error details:", error.response?.data);
          setSubjects([]);
        }
      }
    }
    fetchSubjects();
  }, [selectedClass]);

  // Fetch chapters with comprehensive debugging - FIXED
  useEffect(() => {
    async function fetchChapters() {
      if (selectedSubject && selectedClass) {
        try {
          // console.log("🔍 Fetching chapters with parameters:");
          // console.log("   📖 Subject ID:", selectedSubject);
          // console.log("   🏫 Class ID:", selectedClass);

          const chapterResponse = await axiosInstance.post("/chapters/", {
            subject_id: selectedSubject,
            class_id: selectedClass,
          });

          // console.log("📚 Chapters API Response:", chapterResponse.data);
          // console.log("📊 Response structure:", {
          //   hasData: !!chapterResponse.data.data,
          //   dataLength: chapterResponse.data.data?.length,
          //   firstChapter: chapterResponse.data.data?.[0]
          // });

          if (chapterResponse.data && chapterResponse.data.data) {
            setChapters(chapterResponse.data.data);
            // console.log("✅ Chapters set successfully:", chapterResponse.data.data.length, "chapters");
            // console.log("📝 First few chapters:", chapterResponse.data.data.slice(0, 3));

            // Log the structure of chapters to verify field names
            if (chapterResponse.data.data.length > 0) {
              // console.log("🔍 Chapter structure:", Object.keys(chapterResponse.data.data[0]));
            }
          } else {
            console.warn("⚠ No chapters data found in response");
            setChapters([]);
          }

          setSelectedChapters([]);
          setQuestionType("");
          setQuestionLevel("");
          setSelectedWorksheet("");
        } catch (error) {
          console.error("❌ Error fetching chapters:", error);
          console.error("📄 Error details:", error.response?.data);
          setChapters([]);
        }
      } else {
        // console.log("⚠ Cannot fetch chapters - missing requirements:");
        // console.log("   📖 Selected Subject:", selectedSubject);
        // console.log("   🏫 Selected Class:", selectedClass);
      }
    }
    fetchChapters();
  }, [selectedSubject, selectedClass]);

  // Effect for fetching subtopics when External question type is selected
  useEffect(() => {
    async function fetchSubTopics() {
      if (
        questionType === "external" &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0], // Using first chapter for subtopics
            external: true,
          });
          console.log("Subtopics response:", response);
          setSubTopics(response.data.subtopics || []);
        } catch (error) {
          console.error("Error fetching subtopics:", error);
          setSubTopics([]);
        }
      }
    }
    fetchSubTopics();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  // Effect for fetching worksheets when Worksheets question type is selected
  useEffect(() => {
    async function fetchWorksheets() {
      if (
        questionType === "worksheets" &&
        selectedClass &&
        selectedSubject &&
        selectedChapters.length > 0
      ) {
        try {
          const response = await axiosInstance.post("/question-images/", {
            classid: selectedClass,
            subjectid: selectedSubject,
            topicid: selectedChapters[0], // Using first chapter for worksheets
            worksheets: true,
          });
          console.log("Worksheets response:", response);
          setWorksheets(response.data.worksheets || []);
        } catch (error) {
          console.error("Error fetching worksheets:", error);
          setWorksheets([]);
        }
      }
    }
    fetchWorksheets();
  }, [questionType, selectedClass, selectedSubject, selectedChapters]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isGenerateButtonEnabled()) {
      console.error("Please select all required fields");
      return;
    }

    // API request structure
    const requestData = {
      classid: Number(selectedClass),
      subjectid: Number(selectedSubject),
      topicid: selectedChapters,
      solved: questionType === "solved",
      exercise: questionType === "exercise",
      // external: questionType === "external",
      // worksheets: questionType === "worksheets",
      subtopic: questionType === "external" ? questionLevel : null,
      worksheet_name: questionType === "worksheets" ? selectedWorksheet : null,
    };

    // console.log("Request data for question generation:", requestData);

    try {
      const response = await axiosInstance.post("/question-images/", requestData);
      // console.log("the response data is :", response.data);

      // Process questions with images and context
      const questionsWithImages = (response.data.questions || []).map((question, index) => ({
        ...question,
        id: index,
        question_id: question.id,
        question: question.question,
        context: question.context || null,
        image: question.question_image
          ? `data:image/png;base64,${question.question_image}`
          : null,
      }));
      console.log("Processed questions with images:", questionsWithImages);
      setQuestionList(questionsWithImages);
      setSelectedQuestions([]);

      // Show the modal
      setShowQuestionList(true);
    } catch (error) {
      console.error("Error generating questions:", error);
      showAlert("Failed to generate questions. Please try again.", "error");
    }
  };

  // Enhanced question click handler
  const handleQuestionClick = (question, index, image, question_id, context) => {
    console.log("Question clicked:", { question, index, image, question_id, context });

    setShowQuestionList(false);

    navigate("/solvequestion", {
      state: {
        question,
        question_id: question_id,
        questionNumber: index + 1,
        questionList,
        class_id: selectedClass,
        subject_id: selectedSubject,
        topic_ids: selectedChapters,
        subtopic: questionType === "external" ? questionLevel : "",
        worksheet_id: questionType === "worksheets" ? selectedWorksheet : "",
        image,
        context: context || null,
        selectedQuestions: selectedQuestions,

      },
    });
  };

  const handleMultipleSelectSubmit = (selectedQuestionsData) => {
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);

    const firstQuestion = selectedQuestionsData[0];
    navigate("/solvequestion", {
      state: {
        question: firstQuestion.question,
        question_id: firstQuestion.question_id,
        questionNumber: firstQuestion.index + 1,
        questionList,
        class_id: selectedClass,
        subject_id: selectedSubject,
        topic_ids: selectedChapters,
        subtopic: questionType === "external" ? questionLevel : "",
        worksheet_id: questionType === "worksheets" ? selectedWorksheet : "",
        image: firstQuestion.image,
        context: firstQuestion.context || null,
        selectedQuestions: selectedQuestionsData,
      },
    });
  };

  // Reset dependent fields when question type changes
  useEffect(() => {
    if (questionType !== "external") {
      setQuestionLevel("");
    }
    if (questionType !== "worksheets") {
      setSelectedWorksheet("");
    }
  }, [questionType]);

  // Enhanced styles for react-select with portal rendering for full visibility
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: state.isFocused
        ? (isDarkMode ? '#7c3aed' : '#667eea')
        : (isDarkMode ? '#475569' : '#e2e8f0'),
      color: isDarkMode ? '#f1f5f9' : '#2d3748',
      minHeight: '56px',
      border: `2px solid ${state.isFocused
        ? (isDarkMode ? '#7c3aed' : '#667eea')
        : (isDarkMode ? '#475569' : '#e2e8f0')}`,
      borderRadius: '12px',
      boxShadow: state.isFocused
        ? `0 0 0 4px ${isDarkMode ? 'rgba(124, 58, 237, 0.1)' : 'rgba(102, 126, 234, 0.1)'}`
        : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        borderColor: isDarkMode ? '#6366f1' : '#5a67d8',
      },
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 10000,
      position: 'fixed',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      zIndex: 10000,
      borderRadius: '12px',
      border: `2px solid ${isDarkMode ? '#7c3aed' : '#667eea'}`,
      boxShadow: isDarkMode
        ? '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      maxHeight: '500px',
      overflow: 'hidden',
      position: 'fixed',
      width: 'auto',
      minWidth: '450px',
      maxWidth: '600px',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '470px',
      padding: '12px',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'thin',
      scrollbarColor: `${isDarkMode ? '#7c3aed' : '#667eea'} ${isDarkMode ? '#334155' : '#f8fafc'}`,
      '&::-webkit-scrollbar': {
        width: '12px',
      },
      '&::-webkit-scrollbar-track': {
        background: isDarkMode ? '#334155' : '#f8fafc',
        borderRadius: '6px',
        margin: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: isDarkMode ? '#7c3aed' : '#667eea',
        borderRadius: '6px',
        border: `2px solid ${isDarkMode ? '#334155' : '#f8fafc'}`,
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: isDarkMode ? '#6366f1' : '#5a67d8',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? (isDarkMode ? '#7c3aed' : '#667eea')
        : state.isSelected
          ? (isDarkMode ? '#6366f1' : '#5a67d8')
          : (isDarkMode ? '#1e293b' : '#ffffff'),
      color: state.isFocused || state.isSelected
        ? '#ffffff'
        : (isDarkMode ? '#f1f5f9' : '#2d3748'),
      padding: '16px 20px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: state.isSelected ? '600' : '500',
      lineHeight: '1.5',
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      minHeight: '50px',
      display: 'flex',
      alignItems: 'center',
      borderBottom: `1px solid ${isDarkMode ? '#475569' : '#f1f5f9'}`,
      transition: 'all 0.2s ease',
      position: 'relative',
      '&:hover': {
        backgroundColor: isDarkMode ? '#7c3aed' : '#667eea',
        color: '#ffffff',
        transform: 'translateX(4px)',
      },
      '&:last-child': {
        borderBottom: 'none',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#6366f1' : '#667eea',
      borderRadius: '8px',
      margin: '3px',
      padding: '2px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '13px',
      padding: '6px 10px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#ffffff',
      borderRadius: '0 8px 8px 0',
      '&:hover': {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        transform: 'scale(1.1)',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? '#94a3b8' : '#6b7280',
      fontSize: '15px',
      fontWeight: '500',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? '#f1f5f9' : '#2d3748',
      fontSize: '15px',
      fontWeight: '600',
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: isDarkMode ? '#94a3b8' : '#6b7280',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.3s ease',
      '&:hover': {
        color: isDarkMode ? '#7c3aed' : '#667eea',
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: isDarkMode ? '#94a3b8' : '#6b7280',
      '&:hover': {
        color: isDarkMode ? '#ef4444' : '#dc2626',
      },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#475569' : '#e2e8f0',
    }),
  };

  return (
    <>
      <AlertContainer />
      <div className={`student-dash-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
        {/* Main Content - Sidebar removed (now in Layout.jsx) */}
        <div className="main-content-fixed ">
          {/* Enhanced Greeting Header with Dynamic Content & Dark Mode Toggle */}
          {/* <div className="greeting-header dashboard-grid-layout">
            
          </div> */}

          {/* Enhanced Motivational Quote */}
          {/* <div className="motivational-quote">
          <FontAwesomeIcon icon={faMagic} className="quote-icon" />
          <div className="quote-content">
            <h3>"Mathematics is not about numbers, equations, or algorithms: it is about understanding!"</h3>
            <p>— William Paul Thurston</p>
          </div>
        </div> */}

          <Container className="py-4">
            {/* 3:1 Grid Layout - Main Content and Right Sidebar */}
            <div className="dashboard-grid-layout">
              {/* Left Side - Main Content (3 parts) */}
              <div className="dashboard-main-content">
                <div className="greeting-content">
                  <div className="greeting-text">
                    <h1>
                      {getTimeBasedGreeting()}, {localStorage.getItem("fullName") || username}! 👋
                    </h1>
                  </div>
                  <div className="current-date-wrapper">
                    <div className="current-date">
                      <span className="date-label">Today</span>
                      <span className="date-value">{new Date().toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</span>
                    </div>
                    {/* Dark Mode Toggle Button */}
                    <button
                      className="dark-mode-toggle-btn"
                      onClick={toggleDarkMode}
                      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                      <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
                    </button>
                  </div>
                </div>
                {/* Enhanced Learning Adventure Section */}
                <div className="learning-adventure-section">
                  {/* <div className="section-header">
              <h2>
                <FontAwesomeIcon icon={faRocket} className="me-2" />
                🚀 Start Your Learning Adventure
              </h2>
              <p>Select your preferences and let's begin this exciting mathematical journey!</p>
            </div> */}

                  <div className="form-container">
                    <Form onSubmit={handleSubmit}>
                      <Row className="form-row">
                        <Col md={6}>
                          <Form.Group controlId="formClass">
                            <Form.Label>
                              <FontAwesomeIcon icon={faSchool} className="me-2" />
                              Class
                            </Form.Label>
                            <Form.Control
                              as="select"
                              value={selectedClass}
                              onChange={(e) => {
                                // console.log("🏫 Class selection changed to:", e.target.value);
                                setSelectedClass(e.target.value);
                              }}
                              className="form-control-enhanced"
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

                        <Col md={6}>
                          <Form.Group controlId="formSubject">
                            <Form.Label>
                              <FontAwesomeIcon icon={faBookOpen} className="me-2" />
                              Subject
                            </Form.Label>
                            <Form.Control
                              as="select"
                              value={selectedSubject}
                              onChange={(e) => {
                                // console.log("📚 Subject selection changed to:", e.target.value);
                                setSelectedSubject(e.target.value);
                              }}
                              className="form-control-enhanced"
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

                      <Row className="form-row">
                        <Col md={6}>
                          <Form.Group controlId="formChapters">
                            <Form.Label>
                              <FontAwesomeIcon icon={faListAlt} className="me-2" />
                              Chapters (Select Multiple) - {chapters.length} Available
                            </Form.Label>

                            <Select
                              isMulti
                              value={selectedChapters.map(chapterCode => {
                                const chapter = chapters.find(ch => ch.topic_code === chapterCode);
                                return chapter ? { value: chapter.topic_code, label: chapter.name } : null;
                              }).filter(Boolean)}
                              onChange={(selectedOptions) => {
                                const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
                                setSelectedChapters(values);
                                // console.log("Selected chapters:", values);
                              }}
                              options={chapters.map(chapter => ({
                                value: chapter.topic_code,
                                label: chapter.name
                              }))}
                              placeholder="Select chapters..."
                              isDisabled={!selectedSubject || chapters.length === 0}
                              className="chapters-select-final"
                              classNamePrefix="select"
                              closeMenuOnSelect={false}
                              isSearchable={true}
                              isClearable={true}
                              hideSelectedOptions={false}
                              // CRITICAL: Render dropdown at body level to avoid container constraints
                              menuPortalTarget={document.body}
                              styles={{
                                control: (provided, state) => ({
                                  ...provided,
                                  minHeight: '56px',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '12px',
                                  backgroundColor: 'white',
                                  '&:hover': {
                                    borderColor: '#667eea',
                                  },
                                  boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
                                }),
                                // CRITICAL: Portal-specific styling
                                menuPortal: (provided) => ({
                                  ...provided,
                                  zIndex: 99999,
                                }),
                                menu: (provided) => ({
                                  ...provided,
                                  borderRadius: '12px',
                                  border: '2px solid #667eea',
                                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                  // FIXED: Use viewport height to ensure dropdown is never cut off
                                  maxHeight: 'min(70vh, 500px)',
                                  minWidth: '400px',
                                  maxWidth: '600px',
                                }),
                                menuList: (provided) => ({
                                  ...provided,
                                  // CRITICAL: Enough height for all chapters + comfortable scrolling
                                  maxHeight: 'min(65vh, 450px)',
                                  overflowY: 'auto',
                                  padding: '8px',
                                  // Enhanced scrollbar
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#667eea #f1f5f9',
                                }),
                                option: (provided, state) => ({
                                  ...provided,
                                  backgroundColor: state.isFocused
                                    ? '#667eea'
                                    : state.isSelected
                                      ? '#5a67d8'
                                      : 'white',
                                  color: state.isFocused || state.isSelected ? 'white' : '#2d3748',
                                  padding: '10px 14px',
                                  margin: '2px 0',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: state.isSelected ? '600' : '400',
                                  // Ensure text wraps for long chapter names
                                  whiteSpace: 'normal',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.4',
                                  minHeight: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }),
                                multiValue: (provided) => ({
                                  ...provided,
                                  backgroundColor: '#667eea',
                                  borderRadius: '6px',
                                  margin: '2px',
                                }),
                                multiValueLabel: (provided) => ({
                                  ...provided,
                                  color: 'white',
                                  fontWeight: '600',
                                  fontSize: '12px',
                                  padding: '3px 6px',
                                }),
                                multiValueRemove: (provided) => ({
                                  ...provided,
                                  color: 'white',
                                  borderRadius: '0 6px 6px 0',
                                  '&:hover': {
                                    backgroundColor: '#e53e3e',
                                    color: 'white',
                                  },
                                }),
                                placeholder: (provided) => ({
                                  ...provided,
                                  color: '#6b7280',
                                  fontWeight: '500',
                                }),
                                dropdownIndicator: (provided, state) => ({
                                  ...provided,
                                  color: '#6b7280',
                                  transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.3s ease',
                                  padding: '8px',
                                }),
                              }}
                            />

                            {/* Enhanced action buttons */}
                            <div className="mt-2 d-flex gap-2 flex-wrap">
                              {/* <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setSelectedChapters(chapters.map(ch => ch.topic_code))}
          disabled={!chapters.length}
          style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}
        >
          Select All ({chapters.length})
        </Button> */}
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setSelectedChapters([])}
                                disabled={!selectedChapters.length}
                                style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}
                              >
                                Clear ({selectedChapters.length})
                              </Button>
                              {/* <Button
          variant="outline-info"
          size="sm"
          onClick={() => {
            // console.log("📊 Chapter Debug Info:");
            // console.log("Total chapters loaded:", chapters.length);
            // console.log("Chapters:", chapters.map(ch => ch.name));
            // console.log("Selected chapters:", selectedChapters.length);
          }}
          style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}
        >
        </Button> */}
                            </div>


                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group controlId="formQuestionType">
                            <Form.Label>
                              <FontAwesomeIcon icon={faClipboardQuestion} className="me-2" />
                              Question Type
                            </Form.Label>
                            <Form.Control
                              as="select"
                              value={questionType}
                              onChange={(e) => setQuestionType(e.target.value)}
                              className="form-control-enhanced"
                              disabled={selectedChapters.length === 0}
                            >
                              <option value="">Select Question Type</option>
                              <option value="solved">Solved Examples</option>
                              <option value="external">Exercises</option>
                              <option value="worksheets">Worksheets</option>
                            </Form.Control>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Debug info - Remove after confirming all chapters work
{chapters.length > 0 && (
  <div style={{ 
    background: '#e8f5e8', 
    padding: '15px', 
    borderRadius: '8px', 
    margin: '15px 0',
    fontSize: '14px',
    border: '1px solid #4ade80'
  }}>
    <strong>✅ Chapter Status:</strong>
    <br />• <strong>Total Loaded:</strong> {chapters.length} chapters
    <br />• <strong>Currently Selected:</strong> {selectedChapters.length} chapters
    <br />• <strong>Available Chapters:</strong>
    <div style={{ 
      maxHeight: '120px', 
      overflow: 'auto', 
      marginTop: '8px',
      fontSize: '12px',
      background: 'white',
      padding: '8px',
      borderRadius: '4px'
    }}>
      {chapters.map((ch, idx) => (
        <div key={ch.topic_code} style={{ 
          color: selectedChapters.includes(ch.topic_code) ? '#059669' : '#374151',
          fontWeight: selectedChapters.includes(ch.topic_code) ? 'bold' : 'normal'
        }}>
          {idx + 1}. {ch.name} {selectedChapters.includes(ch.topic_code) ? '✓' : ''}
        </div>
      ))}
    </div>
  </div>
)} */}

                      {questionType === "external" && (
                        <Row className="form-row">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>
                                <FontAwesomeIcon icon={faBookmark} className="me-2" />
                                Select The Set
                              </Form.Label>
                              <Form.Control
                                as="select"
                                value={questionLevel}
                                onChange={(e) => setQuestionLevel(e.target.value)}
                                className="form-control-enhanced"
                              >
                                <option value="">Select The Set</option>
                                {subTopics.map((subTopic, index) => (
                                  <option key={subTopic} value={subTopic}>
                                    Exercise {index + 1}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      {questionType === "worksheets" && (
                        <Row className="form-row">
                          <Col md={6}>
                            <Form.Group>
                              <Form.Label>
                                <FontAwesomeIcon icon={faUsers} className="me-2" />
                                Select Worksheet
                              </Form.Label>
                              <Form.Control
                                as="select"
                                value={selectedWorksheet}
                                onChange={(e) => setSelectedWorksheet(e.target.value)}
                                className="form-control-enhanced"
                              >
                                <option value="">Select Worksheet</option>
                                {worksheets.map((worksheet) => (
                                  <option key={worksheet.id} value={worksheet.worksheet_name}>
                                    {worksheet.worksheet_name}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
                          </Col>
                        </Row>
                      )}

                      <div className="new-button form-actions">
                        <button
                          type="submit"
                          className="button button--mimas"
                          disabled={!isGenerateButtonEnabled()}
                        >
                          <span>
                            <FontAwesomeIcon icon={faRocket} className="me-2" />
                            Generate Questions
                          </span>
                        </button>
                      </div>
                    </Form>
                  </div>
                </div>

                {/* Recent Sessions */}
                <UnifiedSessions />
              </div>
              {/* Right Side - Sidebar (1 part) */}
              <div className="dashboard-right-sidebar">
                {/* Streak Tracker */}
                <StreakTracker />

                {/* Live Notifications */}
                <LiveNotifications />
              </div>
            </div>
          </Container>
        </div>

        {/* Enhanced Question List Modal */}
        <QuestionListModal
          show={showQuestionList}
          onHide={() => setShowQuestionList(false)}
          questionList={questionList}
          onQuestionClick={handleQuestionClick}
          isMultipleSelect={questionType === "external"}
          onMultipleSelectSubmit={handleMultipleSelectSubmit}
          worksheetName={questionType === "worksheets" ? selectedWorksheet : ""}

        />
      </div>
    </>
  );
}

export default StudentDash;