import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import EmailVerificationPage from "./EmailVerificationPage";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const {
    login,
    verifyLoginOTP,
    otpRequired,
    setOtpRequired,
    isLoading,
    error,
  } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      await login(email, password);
      // ✅ DO NOT toast success or failure here
      // OTP or dashboard will handle it
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      await verifyLoginOTP(otp);
      toast.success("Login successful!");
      setOtpRequired(false);
      navigate("/dashboard"); // ✅ redirect properly
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  if (otpRequired) {
    return (
      <EmailVerificationPage
        onVerify={handleVerifyOTP}
        title="Enter OTP to Login"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-800/50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
          Welcome to EduGuard!
        </h2>

        <form onSubmit={handleLogin}>
          <Input
            icon={Mail}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            icon={Lock}
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-500 font-semibold mb-2">{error}</p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg
              shadow-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        <div className="flex items-center mt-4">
          <Link
            to="/forgot-password"
            className="text-sm text-green-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      <div className="px-8 py-4 bg-gray-900/50 flex justify-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginPage;
