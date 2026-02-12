"use client";

import { useState, useEffect, useRef } from 'react';
import { Mail, Clock, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
    emailHint: string;
    expiresIn: number; // seconds
    onVerify: (otp: string) => Promise<void>;
    onResend?: () => Promise<void>;
    error?: string;
}

export default function OTPVerification({
    emailHint,
    expiresIn,
    onVerify,
    onResend,
    error: externalError,
}: OTPVerificationProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(expiresIn);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState(externalError || '');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Update error when external error changes
    useEffect(() => {
        setError(externalError || '');
    }, [externalError]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle OTP input
    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newOtp.every((digit) => digit !== '') && !isVerifying) {
            handleSubmit(newOtp.join(''));
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Auto-submit if complete
        if (newOtp.every((digit) => digit !== '') && !isVerifying) {
            handleSubmit(newOtp.join(''));
        }
    };

    // Submit OTP
    const handleSubmit = async (otpValue?: string) => {
        const otpCode = otpValue || otp.join('');

        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        if (timeLeft === 0) {
            setError('OTP has expired. Please request a new one.');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            await onVerify(otpCode);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    // Resend OTP
    const handleResend = async () => {
        if (!onResend) return;

        setError('');
        try {
            await onResend();
            setOtp(['', '', '', '', '', '']);
            setTimeLeft(expiresIn);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="mb-4 inline-flex p-3 bg-blue-900/30 rounded-full">
                    <Mail className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-gray-400">
                    We've sent a 6-digit code to<br />
                    <span className="text-blue-400 font-medium">{emailHint}</span>
                </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-12 h-14 text-center text-2xl font-bold bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        disabled={isVerifying || timeLeft === 0}
                    />
                ))}
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className={timeLeft < 60 ? 'text-red-400' : ''}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Resend Button */}
            {onResend && (
                <div className="text-center">
                    <button
                        onClick={handleResend}
                        disabled={timeLeft > 0}
                        className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        {timeLeft > 0 ? 'Resend code' : 'Code expired - Click to resend'}
                    </button>
                </div>
            )}

            {/* Verify Button (manual submit) */}
            <button
                onClick={() => handleSubmit()}
                disabled={isVerifying || otp.some((d) => !d) || timeLeft === 0}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
            </button>
        </div>
    );
}
