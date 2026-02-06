import React, { useState } from "react";
import { motion } from "framer-motion";
import Input from "../components/Input";
import { User, Mail, Lock, Loader, Camera } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import EmailVerificationPage from "./EmailVerificationPage";
import toast from "react-hot-toast";

const SignupPage = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const { signup, verifyOTP, otpRequired, setOtpRequired, error, isLoading } = useAuthStore();
  const [localError, setLocalError] = useState("");

  // Handle image preview
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setProfilePhoto(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
    else setPhotoPreview(null);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !studentId || !password || !confirmPassword || !grade || !gender) {
      setLocalError("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      setLocalError("");
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("middleName", middleName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      formData.append("studentId", studentId);
      formData.append("grade", grade);
      formData.append("gender", gender);
      if (profilePhoto) formData.append("profilePhoto", profilePhoto);

      await signup(formData);
      toast.success("OTP sent to your email!");
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      await verifyOTP(otp);
      setOtpRequired(false);
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    }
  };

  if (otpRequired) {
    return <EmailVerificationPage onVerify={handleVerifyOTP} title="Enter OTP to Complete Signup" />;
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
          Join Us in Our Journey!
        </h2>

        <form onSubmit={handleSignUp} encType="multipart/form-data">
          <div className="grid grid-cols-2 gap-4">
            <Input icon={User} type="text" placeholder="First Name*" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input icon={User} type="text" placeholder="Last Name*" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <Input icon={User} type="text" placeholder="Middle Name (Optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          <Input icon={Mail} type="email" placeholder="Email*" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input icon={User} type="text" placeholder="Student ID*" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <Input icon={User} type="text" placeholder="Grade*" value={grade} onChange={(e) => setGrade(e.target.value)} />

          {/* Gender select */}
          <select
            className="w-full p-3 rounded-xl bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition mb-2"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender*</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <Input icon={Lock} type="password" placeholder="Password*" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input icon={Lock} type="password" placeholder="Confirm Password*" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-full border-2 border-green-400" />}

          <div className="mt-2">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <Camera /> Profile Photo (Optional)
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
          </div>

          {(localError || error) && <p className="text-red-500 font-semibold mt-2">{localError || error}</p>}

          <PasswordStrengthMeter password={password} />

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white
            font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-green-500 focus:ring-offset-2
            focus:ring-offset-gray-900 transition duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? <Loader className="animate-spin mx-auto" size={24} /> : "Register"}
          </motion.button>
        </form>
      </div>

      <div className="px-8 py-4 bg-gray-900/50 flex justify-center">
        <p className="text-sm text-gray-400">
          Back to{" "}
          <Link to={"/login"} className="text-green-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignupPage;
