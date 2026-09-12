import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import { Toaster } from "react-hot-toast";

import FloatingShape from "./components/FloatingShape.jsx";

import { useAuthStore } from "./store/authStore.js";

/* =========================================================
   LAZY-LOADED PAGES

   IMPORTANT:
   These pages are NOT downloaded when /login loads.

   They are downloaded only when the user actually visits
   that route.
========================================================= */

// Public pages
const LoginPage = lazy(
  () => import("./pages/LoginPage.jsx")
);

const SignupPage = lazy(
  () => import("./pages/SignupPage.jsx")
);

const EmailVerificationPage = lazy(
  () => import("./pages/EmailVerificationPage.jsx")
);

const ForgotPasswordPage = lazy(
  () => import("./pages/ForgotPassword.jsx")
);

const ResetPasswordPage = lazy(
  () => import("./pages/ResetPasswordPage.jsx")
);

const NewPasswordPage = lazy(
  () => import("./pages/NewPasswordPage.jsx")
);

// Protected pages
const DashboardPage = lazy(
  () => import("./pages/DashboardPage.jsx")
);

const StudentPage = lazy(
  () => import("./pages/StudentPage.jsx")
);

const ReportPage = lazy(
  () => import("./pages/ReportPage.jsx")
);

const SettingsPage = lazy(
  () => import("./pages/SettingsPage.jsx")
);

const GuidancePage = lazy(
  () => import("./pages/GuidancePage.jsx")
);

const InterventionPage = lazy(
  () => import("./pages/InterventionPage.jsx")
);

const CaseManagement = lazy(
  () => import("./pages/CaseManagement.jsx")
);

/* =========================================================
   GLOBAL NOTIFICATIONS

   This is also lazy-loaded.

   Firebase / notification-related code should NOT be part
   of the initial /login JavaScript bundle.
========================================================= */

const GlobalNotifications = lazy(
  () => import("./components/GlobalNotifications.jsx")
);

/* =========================================================
   LOADING FALLBACK
========================================================= */

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />

        <p className="text-sm text-white/80">
          Loading...
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   PROTECTED ROUTE
========================================================= */

const ProtectedRoute = ({
  children,
}) => {
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

      {/* =================================================
          FLOATING BACKGROUND
      ================================================= */}

      <FloatingShape />

      {/* =================================================
          GLOBAL WEB FCM NOTIFICATIONS

          Still mounted globally when authenticated.

          The important difference is that the actual
          notification code is now loaded lazily.
      ================================================= */}

      {isAuthenticated && (
        <Suspense fallback={null}>
          <GlobalNotifications />
        </Suspense>
      )}

      {/* =================================================
          ROUTES

          All pages are lazy-loaded.
      ================================================= */}

      <Suspense fallback={<PageLoader />}>
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