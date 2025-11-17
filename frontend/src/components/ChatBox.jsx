// src/components/ChatBox.jsx
import React, { useEffect, useContext, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faPaperPlane,
  faTimes,
  faUpload,
  faTrash,
  faLanguage,
  faMicrophone,
  faStop,
  faChartLine,
  faExclamationTriangle,
  faBook,
  faGraduationCap,
  faRobot,
  faLightbulb,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import axios from "axios";
import MarkdownWithMath from "./MarkdownWithMath";
import "./ChatBox.css";
import { useAlert } from './AlertBox';
import { AuthContext } from './AuthContext';
import axiosInstance from "../api/axiosInstance";
import MarkdownViewer from "./MarkdownViewer";
import { useCurrentQuestion } from "../contexts/CurrentQuestionContext";
import { useTutorial } from "../contexts/TutorialContext";
// import { useMascot } from "../contexts/MascotContext";

// ====== API BASE ======
const API_URL = "https://chatbot.smartlearners.ai";

// Axios client (no login cookies; pure session-based)
const api = axios.create({
  baseURL: API_URL,
  timeout: 180000,
});

// ====== Helpers for formatting ======
const formatMessage = (text) => {
  if (!text) return null;
  if (Array.isArray(text)) {
    return (
      <div className="paragraph-solution">
        {text.map((p, i) => (
          <p key={i} className="solution-paragraph">
            <MarkdownWithMath content={p} />
          </p>
        ))}
      </div>
    );
  }
  return <MarkdownWithMath content={text} />;
};



// ====== Main Component ======
const ChatBox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useContext(AuthContext);
  const { showAlert, AlertContainer } = useAlert();
  const className = localStorage.getItem("className");
  const { currentQuestion, questionMetadata } = useCurrentQuestion();
  const { resetTutorial, startTutorialForPage } = useTutorial();
  // const { setTeaching, setThinking, setHappy } = useMascot();
  const includeQuestionContext = (() => {
    const stored = localStorage.getItem("include_question_context");
    return stored === null ? true : stored === "true";
  })();

  // Check if we're on the SolveQuestion page
  const isOnSolveQuestionPage = location.pathname === "/solvequestion";

  const [isOpen, setIsOpen] = useState(false);
  const toggleChat = () => setIsOpen((o) => !o);

  // Session + connection
  const [sessionId, setSessionId] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");

  // Chat
  const [messages, setMessages] = useState([
    {
      id: "hello",
      text: "👋 Hi! I'm your Math Assistant. Ask a doubt or upload a problem image.",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("en");

  // Files / image
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Image action modal (Solve / Correct)
  const [showImageModal, setShowImageModal] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const [inputText, setInputText] = useState("");

  // ====== Suggestion Questions ======
  // Different suggestions based on whether we're on SolveQuestion page
  const getSuggestionQuestions = () => {
    if (isOnSolveQuestionPage && currentQuestion) {
      return [
        {
          text: "AI-Solution",
          icon: faRobot,
          isTutorial: false,
          isApiAction: true,
          apiFlag: "solve",
        },
        {
          text: "Concepts-Required and videos",
          icon: faLightbulb,
          isTutorial: false,
          isApiAction: true,
          apiFlag: "explain",
        },
        {
          text: "Start Tutorial Walkthrough",
          icon: faGraduationCap,
          isTutorial: true,
          isApiAction: false,
        },
      ];
    }

    return [
      {
        text: "What is my progress?",
        icon: faChartLine,
        isTutorial: false,
        isApiAction: false,
      },
      {
        text: "What are my weaknesses?",
        icon: faExclamationTriangle,
        isTutorial: false,
        isApiAction: false,
      },
      {
        text: "Give remedial program for 1 week as per my weaknesses",
        icon: faBook,
        isTutorial: false,
        isApiAction: false,
      },
      {
        text: "Start Tutorial Walkthrough",
        icon: faGraduationCap,
        isTutorial: true,
        isApiAction: false,
      },
    ];
  };

  const suggestionQuestions = getSuggestionQuestions();

  // ====== Effects ======
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial session creation - wait for username
  useEffect(() => {
    if (hasInitialized.current) return;
    if (!username) return; // Wait for username to be available

    hasInitialized.current = true;
    fetchStudentDataAndCreateSession();
  }, [username]);

  // ====== Session handling ======
  const fetchStudentData = async () => {
    try {
      // console.log("Fetching student data for:", username)
      const response = await axiosInstance.post("dummy/", {
        homework: "true",
        agentic_data: "true",
      })

      // console.log("✅ Student Data Response:", response.data)

      if (response.data && response.data[username]) {
        // console.log("📦 Student data found for", username)
        return response.data[username]
      } else {
        console.warn("⚠ No student data found for", username)
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching student data:", error)
      return null
    }
  }

  const fetchExamData = async () => {
    try {
      // console.log("Fetching student data for:", username)
      const response = await axiosInstance.get("questions-evaluated/")

      // console.log("✅ Student Data Response:", response.data)

      if (response.data) {
        console.log("📦 Student data found for", username)
        return response.data
      } else {
        console.warn("⚠ No student data found for", username)
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching student data:", error)
      return null
    }
  }

  const fetchStudentDataAndCreateSession = async () => {
    setConnectionStatus("checking")
    // console.log("Fetching student data and creating session for:", username)

    try {
      const data = await fetchStudentData()
      const examdata = await fetchExamData()
      // console.log("Fetched exam data:", examdata)

      let filteredData = null
      if (data) {
        filteredData = data
        setStudentInfo(filteredData)
        // console.log("✅ Student data fetched:", filteredData)
      } else {
        console.warn("⚠️ No student data found for", username)
      }

      await createSessionWithData(filteredData, examdata)

    } catch (err) {
      console.error("❌ Failed to fetch student data or create session:", err)
      setConnectionStatus("disconnected")
      setMessages([{
        id: "conn_fail",
        text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
        sender: "ai",
        timestamp: new Date(),
      }])
    }
  }

  const createSessionWithData = async (studentData, examData) => {
    try {
      const filteredStudentInfo = {
        data: studentData || {},
      }

    //  console.log("Creating session with student info:", filteredStudentInfo);
// console.log("Student ID:", localStorage.getItem("fullName") || username || "guest_user");
// console.log("Exam data:", examData);
// console.log("Class name:", className || "default_class");

// Create FormData object
const formData = new FormData();
formData.append("student_name", localStorage.getItem("fullName") || username || "guest_user");
formData.append("json_data", JSON.stringify(filteredStudentInfo));  // serialize JSON
formData.append("exam_data", JSON.stringify(examData || {}));       // serialize JSON
formData.append("class_name", className || "default_class");

// Log formData entries for debugging
for (let [key, value] of formData.entries()) {
  // console.log(`${key}:`, value);
}

// Send the request using FormData
const res = await api.post("/create_session", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});


      // console.log("create_session response:", res.data)

      if (!res.data?.session_id) throw new Error("No session_id")

      setSessionId(res.data.session_id)
      setConnectionStatus("connected")
      // console.log("Session created successfully:", res.data.session_id)

    } catch (e) {
      console.error("create_session error:", e)
      setConnectionStatus("disconnected")
      setMessages((prev) => [
        ...prev,
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }
  }

  const clearChat = async () => {
    if (!sessionId) return;
    try {
      await api.delete(`/clear-session/${sessionId}`)
    } catch (e) {
      console.error("Failed to clear session:", e);
    } finally {
      setMessages([
        {
          id: "cleared",
          text: "🧹 Chat cleared. Starting a fresh session… Ask your next question!",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setSessionId(null);
      setConnectionStatus("checking");
      // Re-fetch data and create new session
      await fetchStudentDataAndCreateSession();
    }
  };

  // ====== File handlers ======
  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => handleFile(e.target.files?.[0]);

  const handleText = (e) => {
    setInputText(e.target.value); // store user input in state
  };


  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("image.*")) {
      showAlert("Please upload an image file", "warning");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showAlert("Image must be ≤ 12MB", "warning");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowImageModal(true);
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowImageModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ====== Audio handlers ======
  const startRecording = async () => {
    if (isRecording || connectionStatus !== "connected" || !sessionId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        await processAudioBlob(audioBlob);
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.error("Failed to stop recording:", err);
    } finally {
      setIsRecording(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) stopRecording();
    else await startRecording();
  };

  const processAudioBlob = async (audioBlob) => {
    if (!sessionId) return;
    const id = Date.now();
    setIsTyping(true);
    // Show processing placeholder
    setMessages((prev) => [
      ...prev,
      {
        id,
        text: "🎙️ Processing audio...",
        sender: "user",
        timestamp: new Date(),
      },
    ]);

    try {
      const fd = new FormData();
      fd.append("session_id", sessionId);
      fd.append("language", language);
      fd.append("audio", audioBlob, `recording_${id}.webm`);

      const res = await api.post("/process-audio", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const transcription = res?.data?.transcription || "(no transcription)";
      const aiText = res?.data?.response || res?.data?.content || "";
      const audioBase64 = res?.data?.audio_base64 || res?.data?.audio_bytes;
      const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null;

      // Replace placeholder with actual transcription
      setMessages((prev) => {
        const withoutPlaceholder = prev.filter((m) => m.id !== id);
        return [
          ...withoutPlaceholder,
          {
            id,
            text: transcription,
            sender: "user",
            timestamp: new Date(),
          },
          {
            id: id + 1,
            text: aiText,
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ];
      });
    } catch (e) {
      console.error("processAudio error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: "❌ Sorry, I couldn't process the audio. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ====== Handler for calling anssubmit API ======
  const handleApiAction = async (apiFlag, actionName) => {
    if (!currentQuestion || !questionMetadata) {
      showAlert("Missing question data. Please refresh the page.", "error");
      return;
    }

    // Set mascot to thinking mode while processing
    // setThinking();

    const id = Date.now();

    // Show user's action in chat
    setMessages((prev) => [
      ...prev,
      {
        id,
        text: `Requesting ${actionName}...`,
        sender: "user",
        timestamp: new Date(),
      },
    ]);

    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append("class_id", questionMetadata.class_id);
      formData.append("subject_id", questionMetadata.subject_id);
      formData.append("topic_ids", questionMetadata.topic_ids);
      formData.append("subtopic", questionMetadata.subtopic || "");
      formData.append("question_id", currentQuestion.question_id || currentQuestion.id);
      formData.append(apiFlag, true); // solve, explain, or correct

      console.log(`📤 Calling anssubmit/ API with ${apiFlag}:`, {
        class_id: questionMetadata.class_id,
        subject_id: questionMetadata.subject_id,
        topic_ids: questionMetadata.topic_ids,
        question_id: currentQuestion.question_id || currentQuestion.id,
        apiFlag,
      });

      const response = await axiosInstance.post("/anssubmit/", formData);

      console.log("📥 anssubmit/ API response:", response.data);

      // Extract and format the response based on the action type
      let responseText = "";

      // Check if data is nested in ai_data object
      const apiData = response.data.ai_data || response.data;

      if (apiFlag === "solve") {
        // Handle AI Solution response
        if (apiData.ai_explaination && Array.isArray(apiData.ai_explaination)) {
          responseText = apiData.ai_explaination.join("\n\n");
          console.log("✅ Solve response formatted:", responseText.substring(0, 100) + "...");
        } else {
          responseText = apiData.solution || apiData.answer || "Solution generated successfully!";
          console.log("⚠️ No ai_explaination found, using fallback");
        }
        // Set mascot to happy mode after providing solution
        // setHappy("Here's the solution! Let me know if you need more help!");
      } else if (apiFlag === "explain") {
        // Handle Concepts-Required response - check both locations
        const conceptsData = apiData.concepts || response.data.concepts;
        if (conceptsData && Array.isArray(conceptsData)) {
          // Format concepts with proper structure
          const conceptsFormatted = conceptsData.map((concept, index) => {
            let formatted = `### ${index + 1}. ${concept.concept}\n\n`;

            if (concept.explanation) {
              formatted += `**Explanation:**\n${concept.explanation}\n\n`;
            }

            if (concept.example) {
              formatted += `**Example:**\n${concept.example}\n\n`;
            }

            if (concept.application) {
              formatted += `**Application:**\n${concept.application}\n\n`;
            }

            return formatted;
          }).join("\n---\n\n");

          responseText = `## 📚 Key Concepts Required\n\n${conceptsFormatted}`;

          // Add videos if available (check both apiData and response.data)
          const videosData = apiData.videos || response.data.videos;
          if (videosData && Array.isArray(videosData) && videosData.length > 0) {
            responseText += `\n\n## 🎥 Recommended Videos\n\n`;
            videosData.forEach((videoGroup, groupIndex) => {
              if (videoGroup.concept_name) {
                responseText += `\n**${videoGroup.concept_name}:**\n`;
              }
              if (videoGroup.videos && Array.isArray(videoGroup.videos)) {
                videoGroup.videos.forEach((video, videoIndex) => {
                  responseText += `\n${groupIndex + 1}.${videoIndex + 1}. [${video.title}](${video.url})\n`;
                  responseText += `   - Channel: ${video.channel}\n`;
                  responseText += `   - Duration: ${video.duration}\n`;
                  responseText += `   - Views: ${video.views}\n`;
                });
              }
            });
          }
        } else {
          responseText = "Concepts explained successfully!";
          console.log("⚠️ No concepts found in response");
        }
        // Set mascot to teaching mode after explaining concepts
        // setTeaching("Let me explain these concepts to help you understand better!");
      } else if (apiFlag === "correct") {
        responseText = apiData.correction || apiData.feedback || "Correction completed!";
        // Set mascot to happy mode after correction
        // setHappy("I've reviewed your answer! Keep practicing!");
      }

      // Display AI response in chat
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: responseText,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      // showAlert(`${actionName} completed successfully!`, "success");
    } catch (error) {
      console.error(`❌ Error calling anssubmit/ API with ${apiFlag}:`, error);

      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: `❌ Sorry, I couldn't process your ${actionName} request. Please try again.`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      showAlert(`Failed to get ${actionName}. Please try again.`, "error");
    } finally {
      setIsTyping(false);
    }
  };

  // ====== Message senders ======
  const handleSuggestionClick = async (suggestion) => {
    // Handle tutorial button click
    if (suggestion.isTutorial) {
      // Show confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "🎓 Tutorial started! I'll guide you through the platform. Navigating to dashboard...",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);

      // Close the chatbot and start tutorial
      setTimeout(() => {
        setIsOpen(false);
        // Reset any previous tutorial state
        resetTutorial();
        // Navigate to dashboard
        navigate('/student-dash');
        // Start the tutorial after a short delay to ensure navigation completes
        setTimeout(() => {
          startTutorialForPage('studentDash');
        }, 300);
      }, 500);
      return;
    }

    // Handle API actions (AI-Solution, Concepts-Required, etc.)
    if (suggestion.isApiAction) {
      await handleApiAction(suggestion.apiFlag, suggestion.text);
      return;
    }

    // Handle regular suggestions
    if (!sessionId || connectionStatus !== "connected" || isTyping) return;
    await sendMessageBase(suggestion.text, null);
  };

  const sendImageWithCommand = async (command) => {
    setShowImageModal(false);
    await sendMessageBase(command, selectedFile);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;
    await sendMessageBase(newMessage.trim(), selectedFile);
  };

  const sendMessageBase = async (text, imageFile) => {
    if (!sessionId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Connecting… please try again in a moment.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const id = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id,
        text,
        sender: "user",
        timestamp: new Date(),
        image: imageFile ? previewUrl : null,
      },
    ]);
    setNewMessage("");
    setIsTyping(true);

    try {
      // Build combined query with optional context
      let combinedQuery = `${text || ""}`.trim();
      if (includeQuestionContext && currentQuestion && (currentQuestion.question || currentQuestion.image)) {
        const contextParts = [];
        if (currentQuestion.question) {
          contextParts.push(`Question: ${currentQuestion.question}`);
        }
        if (currentQuestion.image) {
          contextParts.push(`Question Image: ${currentQuestion.image}`);
        }
        const contextStr = contextParts.join("\n");
        combinedQuery = [combinedQuery, contextStr].filter(Boolean).join("\n\nContext:\n");
      }

      if (imageFile) {
        // Image upload with message
        const fd = new FormData();
        fd.append("session_id", sessionId);
        fd.append("query", combinedQuery || "");
        fd.append("language", language);
        fd.append("image", imageFile, imageFile.name || `image_${Date.now()}.jpg`);

        // Add student context if available
        if (studentInfo) {
          // fd.append("student_context", JSON.stringify(studentInfo));
        }

        const res = await api.post("/chat", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const audioBase64 = res?.data?.audio_base64;
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.response || "I've analyzed your image!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]);
      } else {
        // Text-only message
        const requestBody = {
          session_id: sessionId,
          query: combinedQuery || "",
          language: language,
        };

        // Add student context if available
        // if (studentInfo) {
        //   requestBody.student_context = studentInfo;
        // }

        const res = await api.post("/chat-simple", requestBody, {
          headers: { session_token: sessionId },
        });
        const audioBase64 = res?.data?.aiAudioUrl;
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.response || "I received your message!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]);
      }
    } catch (e) {
      console.error("sendMessage error:", e);
      setMessages((prev) => [
        ...prev,
        {
          id: id + 1,
          text: "❌ Sorry, I couldn't process that right now. Please try again.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      clearSelectedFile();
    }
  };

  // ====== Render ======
  return (
    <>
      <AlertContainer />
      <div className="chat-box-container">
        {/* Floating Toggle */}
        <button
          className={`chat-toggle-btn ${isOpen ? "open" : ""}`}
          onClick={toggleChat}
          title={isOpen ? "Close chat" : "Ask a question"}
        >
          <FontAwesomeIcon icon={isOpen ? faTimes : faCommentDots} />
          {!isOpen && <span className="chat-label">Ask a question</span>}
        </button>

        {/* Chat Window */}
        <div className={`chat-box ${isOpen ? "open" : ""}`}>
          {/* Header */}
          <div className="chat-header">
            <h5>
              🤖 {`${className} Class`} Math Assistant
            </h5>
            <div className="flex-grow" />

            {/* Language Selector */}
            <Form.Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              size="sm"
              style={{ width: 140, marginRight: 8 }}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
            </Form.Select>

            {/* Clear chat */}
            <Button
              variant="outline-light"
              size="sm"
              onClick={clearChat}
              disabled={connectionStatus !== "connected" || !sessionId}
              title="Clear chat & start new session"
              style={{ marginRight: 8 }}
            >
              <FontAwesomeIcon icon={faTrash} /> Clear
            </Button>

            {/* Connection status */}
            <Button variant="outline-light" size="sm" disabled>
              <FontAwesomeIcon icon={faLanguage} />{" "}
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "checking"
                  ? "Connecting..."
                  : "Disconnected"}
            </Button>

            <button className="close-btn" onClick={toggleChat}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message ${m.sender === "user" ? "user-message" : "ai-message"
                  }`}
              >
                <div className="message-bubble">
                  {formatMessage(m.text)}
                  {m.audioUrl && (
                    <div className="message-audio-container" style={{ marginTop: 8 }}>
                      <audio controls src={m.audioUrl} />
                    </div>
                  )}
                  {m.image && (
                    <div className="message-image-container">
                      <img
                        src={m.image}
                        alt="User uploaded"
                        className="message-image"
                      />
                    </div>
                  )}
                </div>

                {/* Message footer */}
                <div
                  className="message-time"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  {m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : ""}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message ai-message">
                <div className="message-bubble typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips - Above Input */}
          {!isTyping && (
            <div className="suggestion-container">
              {suggestionQuestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={
                    suggestion.isApiAction
                      ? isTyping // API actions only need to check if typing
                      : !suggestion.isTutorial && (connectionStatus !== "connected" || isTyping) // Regular suggestions need connection
                  }
                  title={
                    suggestion.isTutorial
                      ? "Start guided tutorial"
                      : suggestion.isApiAction
                      ? `Get ${suggestion.text} from AI`
                      : `Ask: ${suggestion.text}`
                  }
                  style={
                    suggestion.isTutorial
                      ? {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: '600',
                        }
                      : suggestion.isApiAction
                      ? {
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          fontWeight: '600',
                          borderColor: '#3b82f6',
                        }
                      : {}
                  }
                >
                  <FontAwesomeIcon icon={suggestion.icon} className="suggestion-icon" />
                  <span>{suggestion.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <Form onSubmit={sendMessage} className="chat-input">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder={
                  connectionStatus === "connected"
                    ? "Type your question..."
                    : "Connecting to AI service..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={connectionStatus !== "connected" || isTyping}
              />

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
                disabled={connectionStatus !== "connected" || isTyping}
              />

              {/* Image thumbnail or Upload button */}
              {previewUrl ? (
                <div className="input-thumbnail-container">
                  <div className="input-thumbnail">
                    <img
                      src={previewUrl}
                      alt="Thumbnail"
                      className="thumbnail-image"
                    />
                    <button
                      className="remove-thumbnail-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        clearSelectedFile();
                      }}
                      aria-label="Remove image"
                      type="button"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  className="ms-1 d-flex align-items-center justify-content-center"
                  type="button"
                  onClick={handleFileButtonClick}
                  title="Upload image"
                  disabled={connectionStatus !== "connected" || isTyping}
                >
                  <FontAwesomeIcon icon={faUpload} />
                </Button>
              )}

              {/* Audio record button */}
              <Button
                className="ms-1 d-flex align-items-center justify-content-center"
                type="button"
                onClick={toggleRecording}
                title={isRecording ? "Stop recording" : "Record audio"}
                disabled={connectionStatus !== "connected" || isTyping}
                variant={isRecording ? "danger" : "primary"}
              >
                <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} />
              </Button>

              {/* Send button */}
              <Button
                className="ms-1 d-flex align-items-center justify-content-center"
                type="submit"
                disabled={
                  connectionStatus !== "connected" ||
                  isTyping ||
                  (!newMessage.trim() && !selectedFile)
                }
                title="Send message"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </Button>
            </InputGroup>
          </Form>
        </div>

        {/* Image Action Modal */}
        <Modal show={showImageModal} onHide={clearSelectedFile} centered>
          <Modal.Header closeButton>
            <Modal.Title>📸 Choose Analysis</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {previewUrl && (
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 240,
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
            <div className="upload d-grid gap-2">
              <Button
                variant="primary"
                onClick={() => sendImageWithCommand("solve it")}
                disabled={connectionStatus !== "connected"}
              >
                🧮 Solve It
              </Button>
              <Button
                variant="success"
                onClick={() => sendImageWithCommand("correct it")}
                disabled={connectionStatus !== "connected"}
              >
                ✅ Correct It
              </Button>
              <div className="input-container">
                <input
                  type="text"
                  className="custom-input"
                  onChange={handleText}
                  accept="image/*"
                  placeholder="Type your message..."

                  disabled={connectionStatus !== "connected" || isTyping}
                />
                <Button
                  className="send-btn"
                  onClick={() => sendImageWithCommand(inputText)}
                  disabled={connectionStatus !== "connected"}
                >
                  Send Input
                </Button>
              </div>
            </div>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={clearSelectedFile}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default ChatBox;