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
  const [extraField, setExtraField] = useState<string | Record<string, string>>("");
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

  useEffect(() => setHasMetaMask(!!window.ethereum), []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage("❌ MetaMask not detected. Install it first.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setMessage("✅ Wallet connected successfully!");
    } catch {
      setMessage("❌ Failed to connect wallet. Try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post<{ message?: string }>("http://localhost:4000/api/auth/register/request-otp", {
        walletAddress,
        email,
        role,
        fullName,
        phoneNumber,
        dob,
        gender,
        ...(role === "doctor" && typeof extraField === "object" && extraField),
        ...(role === "pharmacist" && typeof extraField === "object" && extraField),
        ...(role === "manufacturer" && typeof extraField === "object" && extraField),
        ...(role === "distributor" && typeof extraField === "object" && extraField),
        ...(role === "regulator" && typeof extraField === "string" && { organizationname: extraField }),
      });

      setMessage(res.data?.message || "OTP sent to your email!");
      setStep(2);
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post<{ token: string }>("http://localhost:4000/api/auth/register/verify-otp", {
        walletAddress,
        otp,
      });

      // Save token and user info
      const userData = {
        email,
        role,
        walletAddress,
        token: res.data?.token || null,
      };
      localStorage.setItem("userData", JSON.stringify(userData));

      setMessage("✅ Account verified! Redirecting to dashboard...");
      navigate(`/${role}/dashboard`, { replace: true });

    } catch (error: any) {
      setMessage(error.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const getExtraFieldLabel = () => {
    switch (role) {
      case "doctor": return "Specialization";
      case "pharmacist": return "License Number";
      case "manufacturer":
      case "distributor": return "Company Name";
      case "regulator": return "Organization Name";
      default: return "";
    }
  };

  const [timeLeft, setTimeLeft] = useState(120);
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 60) return "text-green-600";
    if (timeLeft > 20) return "text-yellow-600";
    if (timeLeft > 0) return "text-red-600";
    return "text-gray-400";
  };

  const handleResendOtp = async () => {
    setTimeLeft(120);
    setLoading(true);
    setMessage("");

    try {
      await axios.post("http://localhost:4000/api/auth/register/request-otp", {
        walletAddress,
        email,
        role,
        fullName,
        phoneNumber,
        dob,
        gender,
        ...(role === "doctor" && typeof extraField === "object" && extraField),
        ...(role === "pharmacist" && typeof extraField === "object" && extraField),
        ...(role === "manufacturer" && typeof extraField === "object" && extraField),
        ...(role === "distributor" && typeof extraField === "object" && extraField),
        ...(role === "regulator" && typeof extraField === "string" && { organizationname: extraField }),
      });
      setMessage("OTP resent to your email!");
    } catch (error: any) {
      setMessage(error.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

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
            {!hasMetaMask ? (
              <p className="text-center">Install <a href="https://metamask.io/" target="_blank" className="text-primary underline">MetaMask</a> to continue.</p>
            ) : !walletAddress ? (
              <Button onClick={connectWallet} className="w-full btn-gradient-primary py-6 text-lg flex items-center justify-center space-x-2">
                <Wallet className="h-5 w-5" />
                {loading ? "Connecting..." : "Connect MetaMask Wallet"}
              </Button>
            ) : step === 1 ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="bg-muted p-2 rounded text-sm text-center">
                  Connected Wallet: <span className="font-mono">{walletAddress}</span>
                </div>
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full border rounded px-3 py-2" />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
                <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="w-full border rounded px-3 py-2" />
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} required className="w-full border rounded px-3 py-2" />
                <select value={gender} onChange={e => setGender(e.target.value)} required className="w-full border rounded px-3 py-2">
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <select value={role} onChange={e => setRole(e.target.value)} required className="w-full border rounded px-3 py-2">
                  <option value="">Select Role</option>
                  {userRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                {role && getExtraFieldLabel() && (
                  <input type="text" placeholder={getExtraFieldLabel()} value={typeof extraField === "string" ? extraField : ""} onChange={e => setExtraField(e.target.value)} className="w-full border rounded px-3 py-2" />
                )}

                <Button type="submit" className="w-full btn-gradient-primary py-6 text-lg" disabled={loading}>
                  {loading ? "Submitting..." : "Register & Send OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="flex flex-col items-center gap-2 w-full mb-2">
                  <Shield className={`h-8 w-8 ${getTimerColor()}`} />
                  <span className={`text-2xl font-bold tracking-widest ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
                </div>
                <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} required className="w-full border rounded px-3 py-2" />
                <div className="flex w-full gap-3 mt-2">
                  <Button type="submit" className="flex-1 btn-gradient-primary py-4 text-lg font-semibold rounded-lg shadow" disabled={loading || timeLeft === 0}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <Button type="button" onClick={handleResendOtp} disabled={loading || (timeLeft > 0 && timeLeft < 120)} variant="outline" className="py-4 font-semibold rounded-lg border-primary/40">
                    Resend
                  </Button>
                </div>
                {timeLeft === 0 && <p className="text-red-600 text-center text-sm mt-2">OTP expired. Please request a new one.</p>}
              </form>
            )}

            {message && <p className={`text-center text-sm font-semibold ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}>{message}</p>}

            <div className="text-center mt-4">
              <Link to="/login" className="text-primary hover:underline">Already have an account? Sign in here</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
