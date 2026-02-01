import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Input from '../components/Input';
import { User, Mail, Lock, Loader } from "lucide-react";
import { Link } from 'react-router-dom';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuthStore } from '../store/authStore';
import EmailVerificationPage from './EmailVerificationPage';
import toast from 'react-hot-toast';

const SignupPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { signup, verifySignupOTP, otpRequired, setOtpRequired, error, isLoading } = useAuthStore();
    const [localError, setLocalError] = useState("");

    const handleSignUp = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            setLocalError("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        try {
            setLocalError(""); 
            const res = await signup(name, email, password, confirmPassword); // send to backend
            if (res.requiresOTP) {
                toast.success("OTP sent to your email!");
            } else {
                toast.success("Signup successful!");
            }
        } catch (err) {
            setLocalError(err.response?.data?.message || err.message);
        }
    };

    const handleVerifyOTP = async (otp) => {
        try {
            await verifySignupOTP(email, otp); // verify OTP via store
            setOtpRequired(false);
            navigate("/login", { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || "OTP verification failed");
        }
    };

    if (otpRequired) {
        return (
            <EmailVerificationPage
                onVerify={handleVerifyOTP}
                title="Enter OTP to Complete Signup"
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='max-w-md w-full bg-gray-800/50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
        >
            <div className='p-8'>
                <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text'>
                    Join Us in Our Journey!
                </h2>

                <form onSubmit={handleSignUp}>
                    <Input icon={User} type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input icon={Mail} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input icon={Lock} type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <Input icon={Lock} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                    {(localError || error) && <p className='text-red-500 font-semibold mt-2'>{localError || error}</p>}

                    <PasswordStrengthMeter password={password} />

                    <motion.button
                        className='mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white
                        font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-green-500 focus:ring-offset-2
                        focus:ring-offset-gray-900 transition duration-200'
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type='submit'
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className='animate-spin mx-auto' size={24} /> : "Sign Up"}
                    </motion.button>
                </form>
            </div>

            <div className='px-8 py-4 bg-gray-900/50 flex justify-center'>
                <p className='text-sm text-gray-400'>
                    Already have an account?{" "}
                    <Link to={"/login"} className='text-green-400 hover:underline'>
                        Login
                    </Link>
                </p>
            </div>
        </motion.div>
    );
};

export default SignupPage;
