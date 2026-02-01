import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import FloatingShape from "./components/FloatingShape";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import StudentPage from "./pages/StudentPage";


import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import NewPasswordPage from "./pages/NewPasswordPage";

// ================== PROTECTED ROUTE ==================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();

  // Wait until auth check is done
  if (isCheckingAuth) {
    return (
      <div className="text-white text-center mt-20">
        Checking authentication...
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but email not verified → redirect to verify email
  if (!user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // All good → render child page
  return children;
};

// ================== REDIRECT AUTHENTICATED USERS ==================
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user, isCheckingAuth } = useAuthStore();
  const location = useLocation();

  if (isCheckingAuth) {
    return (
      <div className="text-white text-center mt-20">
        Checking authentication...
      </div>
    );
  }

  // If user is on /signup, redirect to login **after signup + OTP**
  if (location.pathname === "/signup") {
    return children;
  }

  // If user is already logged in and verified → redirect to dashboard
  if (isAuthenticated && user?.isVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};


function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  // Check auth on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
      

      {/* Routes */}
      <Routes>
        <Route
          path="/"
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
      <NewPasswordPage/>
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
