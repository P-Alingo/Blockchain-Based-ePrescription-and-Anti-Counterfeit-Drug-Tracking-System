import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Wallet, Download, ArrowLeft, CheckCircle, LogIn } from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Register = () => {
  const navigate = useNavigate();

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [step, setStep] = useState<number>(1); // 1: Check MetaMask, 2: Connect Wallet, 3: Fill Form, 4: OTP
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasMetaMask, setHasMetaMask] = useState<boolean | null>(null);

  // Common user fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");

  // Role-specific fields
  const [licenseno, setLicenseno] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [pharmacy, setPharmacy] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  const [otp, setOtp] = useState("");

  // Check for MetaMask on component mount
  useEffect(() => {
    checkMetaMaskInstalled();
  }, []);

  // Check if MetaMask is installed
  const checkMetaMaskInstalled = () => {
    const installed = typeof window.ethereum !== 'undefined';
    setHasMetaMask(installed);
    
    if (installed) {
      setStep(2); // Move to connect wallet step if installed
    } else {
      setStep(1); // Show install instructions if not installed
    }
  };

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage("❌ MetaMask is not available.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    try {
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setMessage("✅ Wallet connected successfully!");
        setTimeout(() => {
          setStep(3); // Move to form filling step
          setMessage("");
        }, 1500);
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setMessage("❌ Wallet connection rejected. Please connect to continue.");
      } else {
        setMessage("❌ Wallet connection failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Install MetaMask handler
  const handleInstallMetaMask = () => {
    window.open("https://metamask.io/download/", "_blank");
  };

  // Check if user has installed MetaMask after being redirected
  const checkAfterInstall = () => {
    const installed = typeof window.ethereum !== 'undefined';
    if (installed) {
      setHasMetaMask(true);
      setStep(2);
      setMessage("✅ MetaMask detected! You can now connect your wallet.");
    } else {
      setMessage("❌ MetaMask not detected. Please make sure you've installed it and refresh the page.");
    }
  };

  // OTP Timer
  useEffect(() => {
    if (step === 4 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (step === 4 && timeLeft === 0) {
      setMessage("❌ OTP expired. Please request a new one.");
    }
  }, [step, timeLeft]);

  const startTimer = () => setTimeLeft(120);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getTimerColor = () =>
    timeLeft > 60 ? "text-green-600" : timeLeft > 30 ? "text-yellow-600" : "text-red-600";

  // Request OTP
  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setMessage("Connect your wallet first.");
    if (!gender) return setMessage("Please select your gender.");
    if (!role) return setMessage("Please select your role.");
    
    setLoading(true);
    setMessage("");

    try {
      const payload: any = {
        walletAddress,
        full_name: fullName,
        email,
        dob,
        phone_number: phoneNumber,
        gender,
        role,
      };

      // Add role-specific fields dynamically
      if (role === "doctor") {
        payload.licenseno = licenseno;
        payload.specialization = specialization;
        payload.hospital = hospital;
      } else if (role === "pharmacist") {
        payload.licenseno = licenseno;
        payload.pharmacy = pharmacy;
      } else if (role === "distributor") {
        payload.companyname = companyName;
        payload.licenseno = licenseno;
      } else if (role === "manufacturer") {
        payload.companyname = companyName;
        payload.licenseno = licenseno;
      } else if (role === "regulator") {
        payload.organizationname = organizationName;
      } else if (role === "patient") {
        // Patient doesn't require additional fields
      }

      const res = await axios.post<{ message?: string }>(
        "http://localhost:4000/api/auth/register/request-otp",
        payload
      );
      setMessage(res.data.message || "✅ OTP sent!");
      setStep(4);
      startTimer();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP - UPDATED to redirect to dashboard
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setMessage("Connect your wallet first.");
    setLoading(true);
    setMessage("");

    try {
      interface VerifyOtpResponse {
        success: boolean;
        id?: string;
        token?: string;
        role?: string;
        email?: string;
        walletAddress?: string;
        fullName?: string;
        userCode?: string;
        message?: string;
      }

      const res = await axios.post<VerifyOtpResponse>("http://localhost:4000/api/auth/register/verify-otp", {
        walletAddress,
        email,
        otp,
      });

      if (res.data.success) {
        // Store user data and token in localStorage
        const userData = {
          id: res.data.id,
          token: res.data.token,
          role: res.data.role,
          email: res.data.email,
          walletAddress: res.data.walletAddress,
          fullName: res.data.fullName,
          userCode: res.data.userCode,
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('token', res.data.token ?? '');

        setMessage("✅ Registration successful! Redirecting to your dashboard...");
        
        // Redirect to role-specific dashboard
        setTimeout(() => {
          navigate(`/${res.data.role?.toLowerCase()}/dashboard`, { replace: true });
        }, 1500);
      } else {
        setMessage(res.data.message || "❌ Invalid OTP.");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP function
  const handleResendOtp = async () => {
    if (!walletAddress) return setMessage("Connect your wallet first.");
    setLoading(true);
    setMessage("");
    try {
      await axios.post("http://localhost:4000/api/auth/register/request-otp", { 
        walletAddress, 
        email,
        full_name: fullName,
        dob,
        phone_number: phoneNumber,
        gender,
        role,
        // Include role-specific fields if needed
        ...(role === "doctor" && { licenseno, specialization, hospital }),
        ...(role === "pharmacist" && { licenseno, pharmacy }),
        ...(role === "distributor" && { companyname: companyName, licenseno }),
        ...(role === "manufacturer" && { companyname: companyName, licenseno }),
        ...(role === "regulator" && { organizationname: organizationName }),
      });
      setMessage("✅ OTP resent successfully!");
      startTimer();
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setMessage("");
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
          <h1 className="text-3xl font-bold mb-2">Register</h1>
          <p className="text-muted-foreground">Create your account and get started</p>
        </div>

        <Card className="card-elevated">
          <CardHeader className="relative">
            {step > 1 && step < 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <CardTitle className="text-center">
              {step === 1 && "Install MetaMask"}
              {step === 2 && "Connect Wallet"}
              {step === 3 && "Complete Registration"}
              {step === 4 && "Verify OTP"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {message && (
              <div
                className={`text-center font-semibold p-3 rounded ${
                  message.includes("✅") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                }`}
              >
                {message}
              </div>
            )}

            {/* Step 1: MetaMask Installation */}
            {step === 1 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <Download className="h-10 w-10 text-yellow-600" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">MetaMask Required</h3>
                  <p className="text-muted-foreground">
                    To register on our platform, you need to have MetaMask installed in your browser.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg text-left space-y-2">
                    <h4 className="font-semibold text-blue-800">Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                      <li>Click the "Install MetaMask" button below</li>
                      <li>Download and install the extension</li>
                      <li>Create a new wallet or import an existing one</li>
                      <li>Return to this page after installation</li>
                      <li>Click "I've Installed MetaMask" to continue</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleInstallMetaMask}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6 flex items-center justify-center space-x-2"
                  >
                    <Download className="h-5 w-5" />
                    Install MetaMask
                  </Button>
                  
                  <Button
                    onClick={checkAfterInstall}
                    variant="outline"
                    className="w-full text-lg py-6"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    I've Installed MetaMask
                  </Button>

                  {/* Login link for Step 1 */}
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline font-medium">
                        Login here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Connect Wallet */}
            {step === 2 && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-10 w-10 text-blue-600" />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your MetaMask wallet to continue with registration.
                  </p>
                </div>

                <Button
                  onClick={connectWallet}
                  className="w-full btn-gradient-primary text-lg py-6 flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <Wallet className="h-5 w-5" />
                  {loading ? "Connecting..." : "Connect MetaMask Wallet"}
                </Button>

                {/* Login link for Step 2 */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Login here
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Registration Form */}
            {step === 3 && (
              <form onSubmit={requestOtp} className="space-y-4">
                <div className="bg-green-50 p-3 rounded text-sm text-center border border-green-200">
                  <span className="font-semibold text-green-700">Connected: </span>
                  <span className="font-mono text-green-600">{walletAddress}</span>
                </div>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />

                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />

                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 text-muted-foreground"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2 text-muted-foreground"
                >
                  <option value="">Select Role</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="patient">Patient</option>
                  <option value="distributor">Distributor</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="regulator">Regulator</option>
                </select>

                {/* Role-specific fields */}
                {role === "doctor" && (
                  <>
                    <input
                      type="text"
                      placeholder="License Number"
                      value={licenseno}
                      onChange={(e) => setLicenseno(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Specialization"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Hospital"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </>
                )}

                {role === "pharmacist" && (
                  <>
                    <input
                      type="text"
                      placeholder="License Number"
                      value={licenseno}
                      onChange={(e) => setLicenseno(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Pharmacy Name"
                      value={pharmacy}
                      onChange={(e) => setPharmacy(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </>
                )}

                {role === "distributor" && (
                  <>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="License Number"
                      value={licenseno}
                      onChange={(e) => setLicenseno(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </>
                )}

                {role === "manufacturer" && (
                  <>
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="License Number"
                      value={licenseno}
                      onChange={(e) => setLicenseno(e.target.value)}
                      required
                      className="w-full border rounded px-3 py-2"
                    />
                  </>
                )}

                {role === "regulator" && (
                  <input
                    type="text"
                    placeholder="Organization Name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                )}

                <Button
                  type="submit"
                  className="w-full btn-gradient-primary py-6 text-lg"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Request OTP"}
                </Button>

                {/* Login link for Step 3 */}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-1">
                      <LogIn className="h-4 w-4" />
                      Login here
                    </Link>
                  </p>
                </div>

                {/* Disconnect Wallet button */}
                {walletAddress && (
                  <Button
                    onClick={async () => {
                      localStorage.removeItem('userData');
                      localStorage.removeItem('token');
                      setWalletAddress('');
                      setStep(2);
                      setOtp('');
                      setMessage('You have been logged out.');
                      if (window.ethereum) {
                        try {
                          await window.ethereum.request({
                            method: 'wallet_revokePermissions',
                            params: [{ eth_accounts: {} }],
                          });
                        } catch {
                          console.warn('Wallet revoke not supported.');
                        }
                        window.ethereum.removeAllListeners('accountsChanged');
                      }
                      setTimeout(() => navigate('/'), 1500);
                    }}
                    variant="outline"
                    className="w-full text-red-600 mt-2"
                  >
                    Disconnect Wallet
                  </Button>
                )}
              </form>
            )}

            {/* Step 4: OTP Verification */}
            {step === 4 && (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div className="flex flex-col items-center gap-2 w-full mb-2">
                  <Shield className={`h-8 w-8 ${getTimerColor()}`} />
                  <span className={`text-2xl font-bold tracking-widest ${getTimerColor()}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <p className="text-muted-foreground text-center">
                  An OTP has been sent to your email. It expires in 2 minutes.
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <div className="flex w-full gap-3">
                  <Button
                    type="submit"
                    className="flex-1 btn-gradient-primary py-4 text-lg font-semibold rounded-lg shadow"
                    disabled={loading || timeLeft === 0}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={loading || timeLeft > 0} 
                    variant="outline" 
                    className="py-4 font-semibold rounded-lg border-primary/40"
                  >
                    Resend
                  </Button>
                </div>
                {timeLeft === 0 && (
                  <p className="text-red-600 text-center text-sm mt-2">
                    OTP expired. Please request a new one.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;