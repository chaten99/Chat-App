import React, { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const OtpPage = () => {
  const { verifyOtp, pendingEmail } = useContext(AuthContext);

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);


  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = pasteData.split("");
    setOtp(newOtp);

    newOtp.forEach((digit, idx) => {
      if (inputsRef.current[idx]) {
        inputsRef.current[idx].value = digit;
      }
    });

    inputsRef.current[5]?.focus();
  };

  const handleVerify = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      return toast.error("Enter complete OTP");
    }

    setLoading(true);
    try {
      await verifyOtp(finalOtp);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b141a] px-4">
      <div className="w-full max-w-md bg-[#111b21] p-8 rounded-xl shadow-xl text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-400 mb-6">
          Code sent to <span className="text-white">{pendingEmail}</span>
        </p>

        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onPaste={handlePaste}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-12 text-center text-xl rounded-lg bg-[#202c33] text-white outline-none focus:ring-2 focus:ring-[#00a884]"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2 bg-[#00a884] hover:bg-[#019f7a] rounded-md font-medium text-black"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <p className="text-sm text-gray-400 mt-4">
          {timer > 0 ? (
            <>Resend in {timer}s</>
          ) : (
            <span className="text-[#00a884] cursor-pointer">
              Resend OTP
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default OtpPage;
