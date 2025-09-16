// src/routing/Routing.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../components/LoginPage";
import StudentDash from "../components/StudentDash";
import SolveQuestion from "../components/SolveQuestion";
import ResultPage from "../components/ResultPage";
import SignupPage from "../components/SignupPage";
import PrivateRoute from "../components/PrivateRoute";
import Layout from "../components/Layout";
import QuestionListModal from "../components/QuestionListModal";
import Analytics from "../components/Analytics";
import SimilarQuestions from "../components/SimilarQuestions";
import LeaderboardPage from "../components/LeaderBoardPage";
import ProgressDashboard from "../components/ProgressDashboard";
import QuestsPage from "../components/QuestsPage";
import TeacherDash from "../components/EnhancedTeacherDash";
import HomeworkSubmissionForm from "../components/HomeworkSubmissionForm";
import StudentGapAnalysisReport from "../components/StudentGapAnalysisReport";
import WorksheetSubmission from "../components/WorksheetSubmission";
import RouteTracker from "../components/RouteTracker"; // ✅ new import

const AppRoutes = () => {
  // Read last visited route from localStorage
  const lastRoute = localStorage.getItem("lastRoute");

  return (
    <>
      {/* This tracks and stores the current route */}
      <RouteTracker />

      <Routes>
        {/* Root path → go to lastRoute if exists, else login */}
        <Route
          path="/"
          element={<Navigate to={lastRoute || "/login"} replace />}
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/student-dash"
          element={
            <PrivateRoute>
              <Layout>
                <StudentDash />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher-dash"
          element={
            <PrivateRoute>
              <Layout>
                <TeacherDash />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/worksheet-submission"
          element={
            <PrivateRoute>
              <Layout>
                <WorksheetSubmission />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/solvequestion"
          element={
            <PrivateRoute>
              <Layout>
                <SolveQuestion />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/progress-dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <ProgressDashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/questionlistmodal"
          element={
            <PrivateRoute>
              <Layout>
                <QuestionListModal />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/resultpage"
          element={
            <PrivateRoute>
              <Layout>
                <ResultPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/similar-questions"
          element={
            <PrivateRoute>
              <Layout>
                <SimilarQuestions />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Layout>
                <Analytics />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/homework"
          element={
            <PrivateRoute>
              <Layout>
                <HomeworkSubmissionForm />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <Layout>
                <LeaderboardPage />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/gap-analysis-report"
          element={
            <PrivateRoute>
              <Layout>
                <StudentGapAnalysisReport />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/quests"
          element={
            <PrivateRoute>
              <Layout>
                <QuestsPage />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Fallback for unknown paths */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
