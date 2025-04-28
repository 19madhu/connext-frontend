import { useEffect } from "react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { signup, isSigningUp } = useAuthStore();
  const { state } = useLocation();
  const [codeInput, setCodeInput] = useState("");

  // ✅ Redirect to signup if page accessed directly or refreshed
  useEffect(() => {
    if (!state || !state.email || !state.code) {
      toast.error("Access denied. Please sign up first.");
      navigate("/signup");
    }
  }, [state, navigate]);

  // ✅ Pull data from location.state (safe since we're checking above)
  const { fullName, email, password, code } = state || {};

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!codeInput.trim()) {
      return toast.error("Please enter the verification code");
    }

    if (codeInput !== code) {
      return toast.error("Incorrect verification code");
    }

    try {
      await signup({ fullName, email, password });
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      // toast.error("Signup failed. Please try again.");
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* Left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="text-2xl font-bold">Verify Your Email</h1>
              <p className="text-sm text-gray-500">
                Code sent to <span className="font-medium">{email}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter verification code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />

            <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right side visual */}
      <div className="hidden lg:block">
        <AuthImagePattern />
      </div>
    </div>
  );
};

export default VerifyEmail;
