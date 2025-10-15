// src/App.js
import React from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { LeaderboardProvider } from "./contexts/LeaderboardContext";
import { QuestProvider } from "./contexts/QuestContext";
import { CurrentQuestionProvider } from "./contexts/CurrentQuestionContext";
import AppRoutes from "./routing/Routing";
import ChatBox from "./components/ChatBox";
import FeedbackBox from "./components/FeedbackBox";
import "./styles/theme.css";
import { TutorialProvider } from "./contexts/TutorialContext";
import { TimerProvider } from "./contexts/TimerContext";
import RouteTracker from "./components/RouteTracker";

// Wrapper component to use location hook
function AppContent() {
  const location = useLocation();

  // Check if current path is login or signup
  const isAuthPage = ["/login", "/", "/signup"].includes(location.pathname);

  return (
    <>
    <RouteTracker />
      <AppRoutes />
      {!isAuthPage && (
        <>
          <FeedbackBox />
          <ChatBox />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProgressProvider>
          <TimerProvider>
            <LeaderboardProvider>
              <QuestProvider>
                <TutorialProvider>
                  <CurrentQuestionProvider>
                    <Router>
                      <AppContent />
                    </Router>
                  </CurrentQuestionProvider>
                </TutorialProvider>
              </QuestProvider>
            </LeaderboardProvider>
          </TimerProvider>
        </ProgressProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
export default App;
