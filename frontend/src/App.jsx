import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import FloatingShape from "./components/FloatingShape.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPassword.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import NewPasswordPage from "./pages/NewPasswordPage.jsx";
import StudentPage from "./pages/StudentPage.jsx";
import ReportPage from "./pages/ReportPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import GuidancePage from "./pages/GuidancePage.jsx";
import InterventionPage from "./pages/InterventionPage.jsx";
import CaseManagement from "./pages/CaseManagement.jsx";
import { useAuthStore } from "./store/authStore.js";



// ================== PROTECTED ROUTE ==================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <div className="text-white text-center mt-20">Checking authentication...</div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isVerified) return <Navigate to="/verify-email" replace />;

  return children;
};

// ================== REDIRECT AUTHENTICATED USERS ==================
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return <div className="text-white text-center mt-20">Checking authentication...</div>;
  }

  // Allow /signup page to render even if user is authenticated
  if (location.pathname === "/signup") return children;

  // Redirect authenticated & verified users away from login/signup
  if (isAuthenticated && user?.isVerified) return <Navigate to="/dashboard" replace />;

  return children;
};


function App() {
  const {
    checkAuth,
    isCheckingAuth,
    isAuthenticated,
    startInactivityTimer,
    resetInactivityTimer,
  } = useAuthStore();

  const navigate = useNavigate();

  // 1️⃣ Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2️⃣ Setup inactivity auto-logout only once for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));

    // Start inactivity timer with redirect callback
    startInactivityTimer(() => navigate("/login", { replace: true }));

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, navigate]); // ✅ only runs when auth state changes

  // Show loading until auth is confirmed
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      {/* Floating Shapes */}
      <FloatingShape />

      {/* Routes */}
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guidance"
          element={
            <ProtectedRoute>
              <GuidancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CaseManagement/>
            </ProtectedRoute>
          }
        />


        <Route
          path="/interventions"
          element={
            <ProtectedRoute>
              <InterventionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <RedirectAuthenticatedUser>
              <SignupPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectAuthenticatedUser>
              <LoginPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectAuthenticatedUser>
              <ForgotPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RedirectAuthenticatedUser>
              <ResetPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path="/reset-password/new"
          element={
            <RedirectAuthenticatedUser>
              <NewPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;