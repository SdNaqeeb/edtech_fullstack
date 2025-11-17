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
import Tutorial from "./Tutorial";
import { useTutorial } from "../contexts/TutorialContext";
import Mascot from "./Mascot";
// import { useMascot } from "../contexts/MascotContext";

function StudentDash() {
  const navigate = useNavigate();
  const { username, fullName, role } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();

  // Tutorial context
  const {
    shouldShowTutorialForPage,
    continueTutorialFlow,
    completeTutorialFlow,
    startTutorialFromToggle,
    startTutorialForPage,
    tutorialFlow,
    completedPages,
  } = useTutorial();

  // Mascot context
  // const { setWaving, setIdle, setHappy, setCelebrating } = useMascot();

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

  const [scienceSubtopics, setScienceSubtopics] = useState([]);

  // Resume Learning state
  const [lastSession, setLastSession] = useState(null);
  const [canResume, setCanResume] = useState(false);

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
  const tutorialSteps = [
    {
      target: '.greeting-content',
      content: 'Welcome to your Student Dashboard! Let me guide you through how to get started with solving questions.',
      disableBeacon: true,
    },
    {
      target: '#formClass',
      content: 'First, select your class from this dropdown. Your class should be pre-selected based on your username.',
    },
    {
      target: '#formSubject',
      content: 'Next, choose the subject you want to study. Mathematics is usually selected by default.',
    },
    {
      target: '.chapters-select-final',
      content: 'Select one or more chapters you want to practice. You can select multiple chapters at once!',
    },
    {
      target: '#formQuestionType',
      content: 'Choose the type of questions: Solved Examples (to learn), Exercises (to practice), or Worksheets (for tests).',
    },
    {
      target: '.button--mimas',
      content: 'Finally, click this button to generate questions based on your selections. You\'ll see a list of available questions!',
    },
  ];

  // Handle tutorial completion for StudentDash
  const handleTutorialComplete = () => {
    // console.log("StudentDash tutorial completed");
    // Don't mark as complete yet - will continue to next page when user clicks generate
  };


  // Apply dark mode on component mount
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Set mascot to waving on component mount
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setWaving();
  //   }, 1000);

  //   return () => clearTimeout(timer);
  // }, [setWaving]);

  // Load last session on component mount
  useEffect(() => {
    const loadLastSession = () => {
      try {
        const savedSession = localStorage.getItem(`lastSession_${username}`);
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          // Check if session is recent (within last 7 days)
          const sessionDate = new Date(sessionData.timestamp);
          const daysSinceSession = (new Date() - sessionDate) / (1000 * 60 * 60 * 24);

          if (daysSinceSession <= 7 && sessionData.questionList && sessionData.questionList.length > 0) {
            setLastSession(sessionData);
            setCanResume(true);
            console.log("✅ Last session loaded:", sessionData);
          } else {
            // Session too old or invalid, clear it
            localStorage.removeItem(`lastSession_${username}`);
          }
        }
      } catch (error) {
        console.error("Error loading last session:", error);
      }
    };

    if (username) {
      loadLastSession();
    }
  }, [username]);


// Helper function to check if selected subject is Science
const isScienceSubject = () => {
  if (!selectedSubject || !subjects.length) return false;
  const subject = subjects.find(s => s.subject_code === selectedSubject);
  return subject && subject.subject_name.toLowerCase().includes('science');
};

// Complete mapping of question types with IDs
const QUESTION_TYPE_MAPPING = [
  { id: "1", value: 'activity_based_questions', label: 'Activity Based Questions' },
  { id: "2", value: 'conceptual_questions', label: 'Conceptual Questions' },
  { id: "3", value: 'diagram_based_questions', label: 'Diagram Based Questions' },
  { id: "4", value: 'fill_in_the_blanks', label: 'Fill in the Blanks' },
  { id: "5", value: 'matching_questions', label: 'Matching Questions' },
  { id: "6", value: 't_f_questions', label: 'True/False Questions' }
];

// Get question type options based on subject
const getQuestionTypeOptions = () => {
  if (isScienceSubject()) {
    // Filter question types based on available subtopics from backend
    if (scienceSubtopics.length > 0) {
      return QUESTION_TYPE_MAPPING.filter(type => 
        scienceSubtopics.includes(type.id)
      );
    }
    // If no subtopics loaded yet, show all options
    return QUESTION_TYPE_MAPPING;
  } else {
    return [
      { value: 'solved', label: 'Solved Examples' },
      { value: 'external', label: 'Exercises' },
      { value: 'worksheets', label: 'Worksheets' }
    ];
  }
};

// Reset question type when subject changes
useEffect(() => {
  if (selectedSubject) {
    setQuestionType("");
    setQuestionLevel("");
    setSelectedWorksheet("");
    setScienceSubtopics([]); // Reset science subtopics
  }
}, [selectedSubject]);

// Fetch available Science subtopics when Science subject is selected with chapters
useEffect(() => {
  async function fetchScienceSubtopics() {
    if (
      isScienceSubject() &&
      selectedClass &&
      selectedSubject &&
      selectedChapters.length > 0
    ) {
      try {
        console.log("🔬 Fetching Science subtopics...");
        const response = await axiosInstance.post("/question-images/", {
          classid: selectedClass,
          subjectid: selectedSubject,
          topicid: selectedChapters,
          external: true,
        });
        
        console.log("📊 Science subtopics response:", response.data);
        
        if (response.data && response.data.subtopics) {
          setScienceSubtopics(response.data.subtopics);
          console.log("✅ Available Science subtopics:", response.data.subtopics);
        } else {
          setScienceSubtopics([]);
        }
      } catch (error) {
        console.error("❌ Error fetching Science subtopics:", error);
        setScienceSubtopics([]);
      }
    } else if (!isScienceSubject()) {
      // Clear science subtopics if not science subject
      setScienceSubtopics([]);
    }
  }
  fetchScienceSubtopics();
}, [selectedClass, selectedSubject, selectedChapters]);

  const isGenerateButtonEnabled = () => {
  // Basic validations
  if (!selectedClass || !selectedSubject || selectedChapters.length === 0 || !questionType) {
    return false;
  }

  // For Science subject with its specific question types
  if (isScienceSubject()) {
    return true; // All Science question types can be generated immediately
  }

  // For non-Science subjects
  if (questionType === "worksheets") return selectedWorksheet !== "";
  if (questionType === "external") return questionLevel !== "";
  if (questionType === "solved") return true;
  
  return false;
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
          // console.log("Subtopics response:", response);
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
          // console.log("Worksheets response:", response);
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
  };

  // ✅ UPDATED: Add question type flags based on whether it's Science or not
  if (isScienceSubject()) {
    // For Science, send subtopicid based on selected question type
    const selectedQuestionType = QUESTION_TYPE_MAPPING.find(
      type => type.value === questionType
    );
    
    if (selectedQuestionType) {
      requestData.subtopic = selectedQuestionType.id;
      console.log("🔬 Sending Science request with subtopic:", selectedQuestionType.id);
    }
  } else {
    // For other subjects, use the existing logic
    requestData.solved = questionType === "solved";
    requestData.exercise = questionType === "exercise";
    requestData.subtopic = questionType === "external" ? questionLevel : null;
    requestData.worksheet_name = questionType === "worksheets" ? selectedWorksheet : null;
  }

  // console.log("📤 Request data for question generation:", requestData);

  try {
    const response = await axiosInstance.post("/question-images/", requestData);
    // console.log("📥 Response data:", response.data);

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
    
    // console.log("✅ Processed questions with images:", questionsWithImages);
    setQuestionList(questionsWithImages);
    setSelectedQuestions([]);

    // Show the modal
    setShowQuestionList(true);
  } catch (error) {
    console.error("❌ Error generating questions:", error);
    showAlert("Failed to generate questions. Please try again.", "error");
  }
};

  // Save session data to localStorage
  const saveSessionData = (sessionData) => {
    try {
      const dataToSave = {
        ...sessionData,
        timestamp: new Date().toISOString(),
        username: username,
      };
      localStorage.setItem(`lastSession_${username}`, JSON.stringify(dataToSave));
      console.log("💾 Session saved:", dataToSave);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  // Resume learning from last session
  const handleResumeLearning = () => {
    if (!lastSession) return;

    console.log("▶️ Resuming learning from:", lastSession);

    navigate("/solvequestion", {
      state: {
        question: lastSession.question,
        question_id: lastSession.question_id,
        questionNumber: lastSession.questionNumber,
        questionList: lastSession.questionList,
        class_id: lastSession.class_id,
        subject_id: lastSession.subject_id,
        topic_ids: lastSession.topic_ids,
        subtopic: lastSession.subtopic,
        worksheet_id: lastSession.worksheet_id,
        image: lastSession.image,
        context: lastSession.context,
        selectedQuestions: lastSession.selectedQuestions || [],
        isResuming: true, // Flag to indicate this is a resume
      },
    });
  };

  // Enhanced question click handler
  const handleQuestionClick = (question, index, image, question_id, context) => {
    // console.log("Question clicked:", { question, index, image, question_id, context });

    setShowQuestionList(false);

    const sessionData = {
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
    };

    // Save session before navigating
    saveSessionData(sessionData);

    navigate("/solvequestion", {
      state: sessionData,
    });
  };

  const handleMultipleSelectSubmit = (selectedQuestionsData) => {
    setSelectedQuestions(selectedQuestionsData);
    setShowQuestionList(false);

    const firstQuestion = selectedQuestionsData[0];
    const sessionData = {
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
    };

    // Save session before navigating
    saveSessionData(sessionData);

    navigate("/solvequestion", {
      state: sessionData,
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
                    {/* Tutorial Toggle Button */}
                    <button
                      className="tutorial-toggle-btn"
                      onClick={() => startTutorialForPage("studentDash")}
                      title="Start Tutorial"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: 'white',
                        cursor: 'pointer',
                        marginRight: '8px',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: '5px' }} />
                      Tutorial
                    </button>
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

                {/* Resume Learning Section */}
                {canResume && lastSession && (
                  <div className="resume-learning-section" style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                      : 'linear-gradient(135deg, rgb(95 123 248) 0%, rgb(97 111 242) 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                    border: `2px solid ${isDarkMode ? '#7c3aed' : '#667eea'}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Background decoration */}
                    <div style={{
                      position: 'absolute',
                      top: '-50px',
                      right: '-50px',
                      width: '200px',
                      height: '200px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      filter: 'blur(40px)',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                      }}>
                        <div style={{ flex: 1, minWidth: '250px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '12px',
                            color: '#ffffff',
                          }}>
                            <FontAwesomeIcon
                              icon={faRocket}
                              style={{
                                fontSize: '24px',
                                marginRight: '12px',
                                animation: 'pulse 2s infinite',
                              }}
                            />
                            <span style={{
                              margin: 0,
                              fontSize: '22px',
                              fontWeight: '700',
                              color: 'white',
                            }}>
                              Continue Your Learning Journey
                            </span>
                          </div>

                          <div style={{
                            color: '#ffffff',
                            opacity: 0.95,
                            fontSize: '15px',
                            marginBottom: '16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: '8px', width: '16px' }} />
                              <span>
                                <strong>Subject:</strong> {subjects.find(s => s.subject_code === lastSession.subject_id)?.subject_name || 'Unknown'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '8px', width: '16px', marginTop: '3px' }} />
                              <span>
                                <strong>Chapter:</strong>{' '}
                                {lastSession.topic_ids && lastSession.topic_ids.length > 0 ? (
                                  <span>
                                    {lastSession.topic_ids.map((topicId, index) => {
                                      const chapter = chapters.find(ch => ch.topic_code === topicId);
                                      return chapter ? (
                                        <span key={topicId}>
                                          {chapter.name}
                                          {index < lastSession.topic_ids.length - 1 ? ', ' : ''}
                                        </span>
                                      ) : null;
                                    }).filter(Boolean)}
                                    {lastSession.topic_ids.length > 1 && ` (${lastSession.topic_ids.length} chapters)`}
                                  </span>
                                ) : 'N/A'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <FontAwesomeIcon icon={faClipboardQuestion} style={{ marginRight: '8px', width: '16px' }} />
                              <span>
                                <strong>Progress:</strong> Question {lastSession.questionNumber} of {lastSession.questionList?.length || 0}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px', width: '16px' }} />
                              <span>
                                <strong>Last active:</strong> {new Date(lastSession.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '16px',
                          }}>
                            <div style={{
                              width: `${(lastSession.questionNumber / (lastSession.questionList?.length || 1)) * 100}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, rgb(84 250 195) 0%, rgb(21 188 136) 100%)',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={handleResumeLearning}
                            style={{
                              background: 'linear-gradient(135deg, rgb(84 250 195) 0%, rgb(21 188 136) 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '16px 32px',
                              fontSize: '16px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                              transition: 'all 0.3s ease',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 12px 28px rgba(16, 185, 129, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                            }}
                          >
                            <FontAwesomeIcon icon={faRocket} />
                            Resume Learning
                          </button>

                          <button
                            onClick={() => {
                              localStorage.removeItem(`lastSession_${username}`);
                              setCanResume(false);
                              setLastSession(null);
                              showAlert('Session cleared successfully', 'success');
                            }}
                            style={{
                              background: 'transparent',
                              color: '#ffffff',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              marginTop: '12px',
                              width: '100%',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                            }}
                          >
                            Start Fresh
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                              <FontAwesomeIcon icon={faListAlt} className="chapter-select me-2" />
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
                                  zIndex: 9990,
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
                              {getQuestionTypeOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
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

                      {/* Only show this for non-Science subjects with external question type */}
                    {!isScienceSubject() && questionType === "external" && (
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

                    {/* Only show this for non-Science subjects with worksheets question type */}
                    {!isScienceSubject() && questionType === "worksheets" && (
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
          { role==="student" &&   ( <UnifiedSessions />)}
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

        {/* Tutorial Component */}
        {shouldShowTutorialForPage("studentDash") && (
          <Tutorial
            steps={tutorialSteps}
            onComplete={handleTutorialComplete}
          />
        )}

        {/* Mascot Component */}
        {/* <Mascot position="bottom-right" mode="3d" /> */}
      </div>
    </>
  );
}

export default StudentDash;