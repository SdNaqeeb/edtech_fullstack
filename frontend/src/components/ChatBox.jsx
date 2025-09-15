// src/components/ChatBox.jsx
import React, { useEffect, useContext, useRef, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import axios from "axios";
import MarkdownWithMath from "./MarkdownWithMath";
import "./ChatBox.css";
import { AuthContext } from './AuthContext';
import axiosInstance from "../api/axiosInstance";
import MarkdownViewer from "./MarkdownViewer";

// ====== API BASE ======
const API_URL = "https://chatbot.smartlearners.ai";

// Axios client (no login cookies; pure session-based)
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// ====== Helpers for formatting ======
const formatMessage = (text) => {
  if (!text) return null;
  if (Array.isArray(text)) {
    return (
      <div className="paragraph-solution">
        {text.map((p, i) => (
          <p key={i} className="solution-paragraph">
            <MarkdownViewer>{p}</MarkdownViewer>
          </p>
        ))}
      </div>
    );
  }
  return <MarkdownViewer>{text}</MarkdownViewer>;
};

// ====== Fetch Student Data Function ======
function student_Data() {
  return axiosInstance.post("dummy/", {
    homework: "true",
    agentic_data: "true",
  })
  .then((response) => {
    return response.data;
  })
  .catch((error) => {
    console.error("❌ Error fetching dummy data:", error);
    throw error;
  });
}

// ====== Main Component ======
const ChatBox = () => {
  const { username } = useContext(AuthContext);
  const className=localStorage.getItem("class_name"); 
  
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
  const fetchStudentDataAndCreateSession = async () => {
    setConnectionStatus("checking");
    console.log("Fetching student data and creating session for:", username);
    
    try {
      // First, fetch the student data
      const data = await student_Data();
      
      let filteredData = null;
      if (data && data[username]) {
        filteredData = data[username];
        setStudentInfo(filteredData);
        console.log("✅ Student data fetched:", filteredData);
      } else {
        console.warn("⚠️ No student data found for", username);
      }
      
      // Now create session with the fetched data
      await createSessionWithData(filteredData);
      
    } catch (err) {
      console.error("❌ Failed to fetch student data or create session:", err);
      setConnectionStatus("disconnected");
      setMessages((prev) => [
        ...prev,
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const createSessionWithData = async (studentData) => {
    try {
      // Use the passed studentData directly, not the state
      const filteredStudentInfo = {
        data: studentData || {},
      };

      console.log("Creating session with student info:", filteredStudentInfo);
      
      const payload = {
        student_id: username,
        json_data: filteredStudentInfo,
      };
      
      const res = await api.post("/create_session", payload);
      console.log("create_session response:", res.data);
      
      if (!res.data?.session_id) throw new Error("No session_id");
      
      setSessionId(res.data.session_id);
      setConnectionStatus("connected");
      console.log("Session created successfully:", res.data.session_id);
      
    } catch (e) {
      console.error("create_session error:", e);
      setConnectionStatus("disconnected");
      setMessages((prev) => [
        ...prev,
        {
          id: "conn_fail",
          text: "⚠️ Unable to connect to AI service right now. Please refresh the page or try again later.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }
  };

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

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.match("image.*")) {
      alert("Please upload an image file");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      alert("Image must be ≤ 12MB");
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
      const audioBase64 = res?.data?.audio || res?.data?.audio_bytes;
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

  // ====== Message senders ======
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
      const combinedQuery = `${text || ""} `;
      
      if (imageFile) {
        // Image upload with message
        const fd = new FormData();
        fd.append("session_id", sessionId);
        fd.append("query", combinedQuery || "");
        fd.append("language", language);
        fd.append("image", imageFile, imageFile.name || `image_${Date.now()}.jpg`);
        
        // Add student context if available
        if (studentInfo) {
          fd.append("student_context", JSON.stringify(studentInfo));
        }

        const res = await api.post("/chat", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const audioBase64 = res?.data?.audio;
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.reply || "I've analyzed your image!",
            sender: "ai",
            timestamp: new Date(),
            audioUrl: aiAudioUrl,
          },
        ]);
      } else {
        // Text-only message
        const requestBody = {
          session_id: sessionId,
          query: text || "",
          language: language,
        };
        
        // Add student context if available
        if (studentInfo) {
          requestBody.student_context = studentInfo;
        }

        const res = await api.post("/chat-simple", requestBody, {
          headers: { session_token: sessionId },
        });
        const audioBase64 = res?.data?.audio;
        const aiAudioUrl = audioBase64 ? `data:audio/mp3;base64,${audioBase64}` : null;

        setMessages((prev) => [
          ...prev,
          {
            id: id + 1,
            text: res?.data?.reply || "I received your message!",
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
              className={`message ${
                m.sender === "user" ? "user-message" : "ai-message"
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
          <div className="d-grid gap-2">
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
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#555",
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              padding: 8,
              borderRadius: 6,
            }}
          >
            💡 Tip: Use "Solve It" for new questions, "Correct It" to check your answers.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={clearSelectedFile}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChatBox;