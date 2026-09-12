import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { lazy, Suspense, useEffect } from "react";

import { Toaster } from "react-hot-toast";

import FloatingShape from "./components/FloatingShape.jsx";

import { useAuthStore } from "./store/authStore.js";

/* =========================================================
   LAZY-LOADED PAGES
========================================================= */

// Public pages
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));

const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));

const EmailVerificationPage = lazy(
  () => import("./pages/EmailVerificationPage.jsx"),
);

const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword.jsx"));

const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));

const NewPasswordPage = lazy(() => import("./pages/NewPasswordPage.jsx"));

// Protected pages
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));

const StudentPage = lazy(() => import("./pages/StudentPage.jsx"));

const ReportPage = lazy(() => import("./pages/ReportPage.jsx"));

const SettingsPage = lazy(() => import("./pages/SettingsPage.jsx"));

const GuidancePage = lazy(() => import("./pages/GuidancePage.jsx"));

const InterventionPage = lazy(() => import("./pages/InterventionPage.jsx"));

const CaseManagement = lazy(() => import("./pages/CaseManagement.jsx"));

/* =========================================================
   GLOBAL NOTIFICATIONS
========================================================= */

const GlobalNotifications = lazy(
  () => import("./components/GlobalNotifications.jsx"),
);

/* =========================================================
   EDU-GUARD LOADING SCREEN
========================================================= */

const PageLoader = ({ message = "Preparing your workspace..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#F7F9F8]">
      {/* =================================================
          SOFT BACKGROUND GLOW
      ================================================= */}

      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-green-200/30 blur-3xl" />

      <div className="absolute top-1/2 left-1/2 w-72 h-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/20 blur-3xl" />

      {/* =================================================
          FLOATING DECORATIVE SHAPES
      ================================================= */}

      <div className="absolute top-[15%] left-[12%] w-3 h-3 rounded-full bg-emerald-400/40 animate-pulse" />

      <div
        className="absolute top-[25%] right-[15%] w-2 h-2 rounded-full bg-green-500/30 animate-pulse"
        style={{ animationDelay: "500ms" }}
      />

      <div
        className="absolute bottom-[20%] left-[18%] w-2 h-2 rounded-full bg-emerald-500/30 animate-pulse"
        style={{ animationDelay: "1000ms" }}
      />

      <div
        className="absolute bottom-[28%] right-[12%] w-3 h-3 rounded-full bg-green-400/30 animate-pulse"
        style={{ animationDelay: "1500ms" }}
      />

      {/* =================================================
          CENTER CONTENT
      ================================================= */}

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          {/* =================================================
              LOGO CONTAINER
          ================================================= */}

          <div className="relative mb-7">
            {/* Soft glow */}
            <div className="absolute inset-0 rounded-[28px] bg-emerald-400/20 blur-xl scale-125" />

            {/* Logo card */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[26px] bg-white border border-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.12)] flex items-center justify-center">
              {/* Replace this with your actual logo if desired */}
              <img
                src="/school-logo.webp"
                alt="GuidEd"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            </div>

            {/* =================================================
                ROTATING RING
            ================================================= */}

            <div className="absolute -inset-2 rounded-[30px] border-2 border-transparent border-t-emerald-500/70 border-r-emerald-400/30 animate-spin" />
          </div>

          {/* =================================================
              BRAND NAME
          ================================================= */}

          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
              Guid<span className="text-emerald-600">Ed</span>
            </h1>

            <p className="mt-1 text-xs sm:text-sm font-medium tracking-wide text-gray-500">
              Student Guidance
            </p>
          </div>

          {/* =================================================
              LOADING INDICATOR
          ================================================= */}

          <div className="mt-7 flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />

            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />

            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>

          {/* =================================================
              STATUS MESSAGE
          ================================================= */}

          <p className="mt-4 text-sm text-gray-500">{message}</p>

          {/* =================================================
              SCHOOL BRANDING
          ================================================= */}

          <p className="mt-8 text-[10px] sm:text-xs text-gray-400 tracking-wide">
            Our Lady of the Holy Rosary School
          </p>

          <p className="mt-1 text-[9px] sm:text-[10px] text-gray-400">
            General Trias Campus
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <PageLoader message="Checking your account..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

/* =========================================================
   REDIRECT AUTHENTICATED USERS
========================================================= */

const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();

  const location = useLocation();

  if (isCheckingAuth) {
    return <PageLoader message="Checking your account..." />;
  }

  /*
   * Allow signup even if a user is already authenticated.
   */
  if (location.pathname === "/signup") {
    return children;
  }

  /*
   * Redirect authenticated and verified users
   * away from login/auth pages.
   */
  if (isAuthenticated && user?.isVerified) {
    return <Navigate to="/dashboard" replace />;
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
     AUTHENTICATED INACTIVITY AUTO-LOGOUT
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
      window.addEventListener(event, handleActivity);
    });

    startInactivityTimer(() => {
      navigate("/login", {
        replace: true,
      });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, navigate, resetInactivityTimer, startInactivityTimer]);

  /* =======================================================
     SHOW LOADING UNTIL AUTH IS CONFIRMED
  ======================================================= */

  if (isCheckingAuth) {
    return <PageLoader message="Checking your account..." />;
  }

  /* =======================================================
     APP RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 flex items-center justify-center relative overflow-hidden">
      {/* =================================================
          FLOATING BACKGROUND
      ================================================= */}

      <FloatingShape />

      {/* =================================================
          GLOBAL WEB FCM NOTIFICATIONS
      ================================================= */}

      {isAuthenticated && (
        <Suspense fallback={null}>
          <GlobalNotifications />
        </Suspense>
      )}

      {/* =================================================
          ROUTES
      ================================================= */}

      <Suspense fallback={<PageLoader message="Loading your page..." />}>
        <Routes>
          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* STUDENTS */}
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <StudentPage />
              </ProtectedRoute>
            }
          />

          {/* GUIDANCE */}
          <Route
            path="/guidance"
            element={
              <ProtectedRoute>
                <GuidancePage />
              </ProtectedRoute>
            }
          />

          {/* REPORTS */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />

          {/* CASES */}
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <CaseManagement />
              </ProtectedRoute>
            }
          />

          {/* INTERVENTIONS */}
          <Route
            path="/interventions"
            element={
              <ProtectedRoute>
                <InterventionPage />
              </ProtectedRoute>
            }
          />

          {/* SETTINGS */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* SIGNUP */}
          <Route
            path="/signup"
            element={
              <RedirectAuthenticatedUser>
                <SignupPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <RedirectAuthenticatedUser>
                <LoginPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* FORGOT PASSWORD */}
          <Route
            path="/forgot-password"
            element={
              <RedirectAuthenticatedUser>
                <ForgotPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* RESET PASSWORD */}
          <Route
            path="/reset-password"
            element={
              <RedirectAuthenticatedUser>
                <ResetPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* NEW PASSWORD */}
          <Route
            path="/reset-password/new"
            element={
              <RedirectAuthenticatedUser>
                <NewPasswordPage />
              </RedirectAuthenticatedUser>
            }
          />

          {/* EMAIL VERIFICATION */}
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* DEFAULT ROUTE */}
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>

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
