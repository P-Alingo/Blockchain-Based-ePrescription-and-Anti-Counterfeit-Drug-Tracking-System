import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Wallet } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Register = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [extraField, setExtraField] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const navigate = useNavigate();

  const userRoles = [
    { value: "doctor", label: "Doctor" },
    { value: "patient", label: "Patient" },
    { value: "pharmacist", label: "Pharmacist" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "distributor", label: "Distributor" },
    { value: "regulator", label: "Regulator" },
  ];

  useEffect(() => {
    setHasMetaMask(!!window.ethereum);
  }, []);

  // -----------------------------
  // Connect MetaMask
  // -----------------------------
  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage("❌ MetaMask not detected. Install it first.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletAddress(accounts[0]);
      setMessage("✅ Wallet connected successfully!");
    } catch (err) {
      setMessage("❌ Failed to connect wallet. Try again.");
    }
  };

  // -----------------------------
  // Register (request OTP)
  // -----------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:4000/api/register", {
      walletAddress,
      email,
      role,
      fullName,
      phoneNumber,
      dob,
      gender,
  ...(role === "doctor" && { specialization: extraField }),
  ...(role === "pharmacist" && { licenseNumber: extraField }),
  ...(role === "manufacturer" && { companyName: extraField }),
  ...(role === "distributor" && { distributionFirm: extraField }),
  ...(role === "regulator" && { organizationName: extraField }),
});

      const data = res.data as { message?: string };
      setMessage(data?.message || "OTP sent to your email!");
      setStep(2);
    } catch (error) {
      setMessage(error.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Verify OTP and Auto-Login
  // -----------------------------
  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      interface VerifyOtpResponse {
        token?: string;
        [key: string]: any;
      }
      const res = await axios.post<VerifyOtpResponse>("http://localhost:4000/api/register-verify-otp", {
        walletAddress,
        otp,
      });

      // ✅ Save user data to localStorage so ProtectedRoute knows you're logged in
      const userData = {
        email,
        role,
        walletAddress,
        token: res.data?.token || null, // store token if backend provides one
      };
      localStorage.setItem("userData", JSON.stringify(userData));

      setMessage("✅ Account verified! Redirecting...");

      // ✅ Redirect to role dashboard
      setTimeout(() => {
        navigate(`/${role}/dashboard`);
      }, 1000);
    } catch (error) {
      setMessage(error.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Logout Function
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("userData"); // clear localStorage
    setMessage("You have been logged out.");
    navigate("/"); // redirect to landing page
  };

  // -----------------------------
  // Role-Specific Field Label
  // -----------------------------
  const getExtraFieldLabel = () => {
    switch (role) {
      case "doctor":
        return "Specialization";
      case "pharmacist":
        return "License Number";
      case "manufacturer":
        return "Company Name";
      case "distributor":
        return "Distribution Firm";
      case "regulator":
        return "Organization Name";
      default:
        return "";
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-5"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">ePrescribe Kenya</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Register securely with your MetaMask wallet</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Follow the steps below to register your account securely.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* STEP 1: Wallet Connection */}
            {!hasMetaMask ? (
              <div className="text-center space-y-4">
                <p>
                  Install{" "}
                  <a href="https://metamask.io/" target="_blank" className="text-primary underline">
                    MetaMask
                  </a>{" "}
                  to continue.
                </p>
              </div>
            ) : !walletAddress ? (
              <div className="text-center space-y-4">
                <Button
                  onClick={connectWallet}
                  className="w-full btn-gradient-primary py-6 text-lg flex items-center justify-center space-x-2"
                >
                  <Wallet className="h-5 w-5" />
                  <span>{loading ? "Connecting..." : "Connect MetaMask Wallet"}</span>
                </Button>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="bg-muted p-2 rounded text-sm text-center">
                  Connected Wallet: <span className="font-mono">{walletAddress}</span>
                </div>

                {/* Common Fields */}
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>

                {/* Role */}
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Role</option>
                  {userRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>

                {/* Role-Specific Field */}
                {getExtraFieldLabel() && (
                  <input
                    type="text"
                    placeholder={getExtraFieldLabel()}
                    value={extraField}
                    onChange={(e) => setExtraField(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                )}

                <Button
                  type="submit"
                  className="w-full btn-gradient-primary py-6 text-lg"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Register & Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-muted-foreground text-center">
                  An OTP has been sent to your email. It expires in 2 minutes.
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <Button
                  type="submit"
                  className="w-full btn-gradient-primary py-6 text-lg"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </form>
            )}

            {/* Messages */}
            {message && (
              <div
                className={`text-center text-sm font-semibold ${
                  message.includes("✅")
                    ? "text-green-600"
                    : message.includes("❌")
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {message}
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Login link */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </p>

              {/* Logout button */}
              <Button onClick={handleLogout} variant="outline" className="w-full text-red-600">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
