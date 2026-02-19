"use client";

import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
    length?: number;
    onComplete: (otp: string) => void;
    onResend?: () => void;
    resendCooldown?: number; 
}

export default function OTPInput({
    length = 6,
    onComplete,
    onResend,
    resendCooldown = 60
}: OTPInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
    const [activeIndex, setActiveIndex] = useState(0);
    const [resendTimer, setResendTimer] = useState(resendCooldown);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendTimer]);

    const handleChange = (index: number, value: string) => {
        
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }

        
        if (newOtp.every(digit => digit !== '')) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newOtp = [...otp];

            if (otp[index]) {
                
                newOtp[index] = '';
                setOtp(newOtp);
            } else if (index > 0) {
                
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
                setActiveIndex(index - 1);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        if (!/^\d+$/.test(pastedData)) return; 

        const newOtp = pastedData.split('');
        while (newOtp.length < length) newOtp.push('');

        setOtp(newOtp);

        
        const lastFilledIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastFilledIndex]?.focus();
        setActiveIndex(lastFilledIndex);

        
        if (pastedData.length === length) {
            onComplete(pastedData);
        }
    };

    const handleResend = () => {
        if (canResend && onResend) {
            onResend();
            setResendTimer(resendCooldown);
            setCanResend(false);
            setOtp(new Array(length).fill(''));
            inputRefs.current[0]?.focus();
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        onFocus={() => setActiveIndex(index)}
                        className={`
                            w-12 h-14 text-center text-2xl font-bold
                            rounded-md border-2 transition-all duration-200
                            bg-bat-black text-white
                            ${activeIndex === index
                                ? 'border-bat-yellow ring-2 ring-bat-yellow/30'
                                : digit
                                    ? 'border-bat-yellow/50'
                                    : 'border-bat-gray/20'
                            }
                            focus:outline-none focus:border-bat-yellow focus:ring-2 focus:ring-bat-yellow/30
                        `}
                        autoFocus={index === 0}
                    />
                ))}
            </div>

            {onResend && (
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend}
                    className={`
                        text-sm font-medium transition-colors duration-200
                        ${canResend
                            ? 'text-bat-yellow hover:text-white cursor-pointer'
                            : 'text-gray-600 cursor-not-allowed'
                        }
                    `}
                >
                    {canResend
                        ? 'Resend OTP'
                        : `Resend in ${resendTimer}s`
                    }
                </button>
            )}
        </div>
    );
}
