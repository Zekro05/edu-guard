import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
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

import GlobalNotifications from "./components/GlobalNotifications.jsx";

import { useAuthStore } from "./store/authStore.js";

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,
    user,
    isCheckingAuth,
  } = useAuthStore();

  if (isCheckingAuth) {
    return (
      <div className="text-white text-center mt-20">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!user?.isVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
      />
    );
  }

  return children;
};

/* =========================================================
   REDIRECT AUTHENTICATED USERS
========================================================= */

const RedirectAuthenticatedUser = ({
  children,
}) => {
  const {
    isAuthenticated,
    user,
    isCheckingAuth,
  } = useAuthStore();

  const location = useLocation();

  if (isCheckingAuth) {
    return (
      <div className="text-white text-center mt-20">
        Checking authentication...
      </div>
    );
  }

  /*
   * Allow signup even if a user is already authenticated.
   */
  if (
    location.pathname === "/signup"
  ) {
    return children;
  }

  /*
   * Redirect authenticated and verified users
   * away from login/auth pages.
   */
  if (
    isAuthenticated &&
    user?.isVerified
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
};

/* =========================================================
   APP
========================================================= */

function App() {
  const {
    checkAuth,
    isCheckingAuth,
    isAuthenticated,
    startInactivityTimer,
    resetInactivityTimer,
  } = useAuthStore();

  const navigate = useNavigate();

  /* =======================================================
     CHECK AUTHENTICATION ON APP LOAD
  ======================================================= */

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /* =======================================================
     GLOBAL WEB FCM NOTIFICATION REGISTRATION
     
     This component stays mounted regardless of which
     protected page the admin is currently viewing.

     Therefore web FCM notifications can be received on:

     /dashboard
     /students
     /guidance
     /reports
     /cases
     /interventions
     /settings
  ======================================================= */

  useEffect(() => {
    if (!isAuthenticated) {
      console.log(
        "🔕 Global FCM listener waiting for authentication..."
      );

      return;
    }

    console.log(
      "🌐 Admin authenticated - global notification system active."
    );
  }, [isAuthenticated]);

  /* =======================================================
     INACTIVITY AUTO-LOGOUT
  ======================================================= */

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const activityEvents = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity
      );
    });

    startInactivityTimer(() => {
      navigate(
        "/login",
        {
          replace: true,
        }
      );
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });
    };
  }, [
    isAuthenticated,
    navigate,
    resetInactivityTimer,
    startInactivityTimer,
  ]);

  /* =======================================================
     SHOW LOADING UNTIL AUTH IS CONFIRMED
  ======================================================= */

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Checking authentication...
      </div>
    );
  }

  /* =======================================================
     APP RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">

      {/* ===================================================
          FLOATING BACKGROUND
      =================================================== */}

      <FloatingShape />

      {/* ===================================================
          GLOBAL WEB FCM NOTIFICATIONS

          IMPORTANT:
          This is OUTSIDE <Routes>.

          It will therefore remain mounted while navigating
          around the entire authenticated web application.
      =================================================== */}

      {isAuthenticated && (
        <GlobalNotifications />
      )}

      {/* ===================================================
          ROUTES
      =================================================== */}

      <Routes>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            STUDENTS
        ================================================= */}

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentPage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            GUIDANCE
        ================================================= */}

        <Route
          path="/guidance"
          element={
            <ProtectedRoute>
              <GuidancePage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            REPORTS
        ================================================= */}

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            CASES
        ================================================= */}

        <Route
          path="/cases"
          element={
            <ProtectedRoute>
              <CaseManagement />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            INTERVENTIONS
        ================================================= */}

        <Route
          path="/interventions"
          element={
            <ProtectedRoute>
              <InterventionPage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SETTINGS
        ================================================= */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            SIGNUP
        ================================================= */}

        <Route
          path="/signup"
          element={
            <RedirectAuthenticatedUser>
              <SignupPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* =================================================
            LOGIN
        ================================================= */}

        <Route
          path="/login"
          element={
            <RedirectAuthenticatedUser>
              <LoginPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* =================================================
            FORGOT PASSWORD
        ================================================= */}

        <Route
          path="/forgot-password"
          element={
            <RedirectAuthenticatedUser>
              <ForgotPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* =================================================
            RESET PASSWORD
        ================================================= */}

        <Route
          path="/reset-password"
          element={
            <RedirectAuthenticatedUser>
              <ResetPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* =================================================
            NEW PASSWORD
        ================================================= */}

        <Route
          path="/reset-password/new"
          element={
            <RedirectAuthenticatedUser>
              <NewPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />

        {/* =================================================
            EMAIL VERIFICATION
        ================================================= */}

        <Route
          path="/verify-email"
          element={
            <EmailVerificationPage />
          }
        />

        {/* =================================================
            DEFAULT ROUTE
        ================================================= */}

        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

      </Routes>

      {/* ===================================================
          TOAST
      =================================================== */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}

export default App;