import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

// --- MetaMask Instructions ---
function MetaMaskInstructions({ onContinue }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p>
        Install MetaMask from{" "}
        <a href="https://metamask.io/" target="_blank" rel="noreferrer">
          MetaMask Official Site
        </a>{" "}
        if you haven't.
      </p>
      <p>Once your wallet is ready, continue below.</p>
      <button onClick={onContinue} style={{ width: "100%", padding: 10 }}>
        I have MetaMask Installed
      </button>
    </div>
  );
}

// --- Connect Wallet ---
function ConnectWallet({ onConnect }) {
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    if (!window.ethereum) return setError("MetaMask not detected");

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      onConnect(accounts[0]);
    } catch {
      setError("User rejected wallet connection");
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={connect} style={{ width: "100%", padding: 10 }}>
        Connect MetaMask Wallet
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// --- Register Component ---
function Register({ onAuthenticated, onSwitchToLogin }) { // CHANGED: onRegistered → onAuthenticated
  const [step, setStep] = useState("instructions");
  const [walletAddress, setWalletAddress] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  function proceed() {
    setStep("connect");
  }

  async function handleWalletConnect(addr) {
    setWalletAddress(addr);
    
    // Check if user already exists with this wallet
    setLoading(true);
    try {
      const checkRes = await axios.post(`${API_URL}/check-user`, { 
        walletAddress: addr
      });
      
      if (checkRes.data.exists) {
        setUserExists(true);
        setMessage("ℹ️ This wallet is already registered. Please login instead.");
      } else {
        setStep("form");
      }
    } catch (err) {
      console.log("Check user failed, proceeding to form:", err.message);
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  async function registerUser() {
    setMessage("");
    if (!email.match(/^\S+@\S+\.\S+$/)) return setMessage("Enter a valid email");
    if (!role.trim()) return setMessage("Enter your role");

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register`, {
        address: walletAddress,
        email,
        role,
      });
      setMessage("✅ OTP sent to email for registration!");
      setOtpSent(true);
      console.log(res.data);
    } catch (err) {
      if (err.response?.data?.error?.includes("already registered")) {
        setMessage("❌ This email or wallet is already registered. Please login instead.");
        setUserExists(true);
      } else if (err.response?.status === 404) {
        setMessage("❌ Server endpoint not found. Please check backend setup.");
      } else {
        setMessage(
          `❌ ${
            err.response?.data?.error || err.message || "Registration failed"
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setMessage("");
    if (otp.length !== 6) return setMessage("Enter 6-digit OTP");

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { 
        address: walletAddress,
        otp 
      });
      setMessage("✅ Registration successful! Redirecting to dashboard...");
      console.log(res.data);
      // CHANGED: Direct to dashboard instead of login
      setTimeout(() => onAuthenticated(res.data.token, res.data.email, walletAddress), 1500);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || err.message || "OTP verification failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Register</h2>
      
      {userExists ? (
        <div>
          <p style={{ color: "orange", marginBottom: 20 }}>
            This wallet or email is already registered.
          </p>
          <button 
            onClick={() => onSwitchToLogin(walletAddress)}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          >
            Go to Login
          </button>
          <button 
            onClick={() => {
              setUserExists(false);
              setStep("instructions");
              setWalletAddress("");
              setEmail("");
              setRole("");
              setMessage("");
              setOtpSent(false);
              setOtp("");
            }}
            style={{ width: "100%", padding: 10, backgroundColor: "#666" }}
          >
            Register Different Account
          </button>
        </div>
      ) : (
        <>
          {step === "instructions" && <MetaMaskInstructions onContinue={proceed} />}
          {step === "connect" && <ConnectWallet onConnect={handleWalletConnect} />}
          
          {/* REGISTRATION FORM */}
          {step === "form" && !otpSent && (
            <>
              <p><strong>Wallet Address:</strong> {walletAddress}</p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
              <input
                type="text"
                placeholder="Role (e.g., Patient, Doctor)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                style={{ width: "100%", padding: 8, marginBottom: 10 }}
              />
              <button onClick={registerUser} disabled={loading} style={{ width: "100%", padding: 10 }}>
                Send OTP for Registration
              </button>
            </>
          )}
          
          {/* OTP VERIFICATION */}
          {otpSent && (
            <div>
              <p><strong>Wallet Address:</strong> {walletAddress}</p>
              <p><strong>Email:</strong> {email}</p>
              <p style={{ marginBottom: 15 }}>Enter the 6-digit OTP sent to your email:</p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: 12, 
                  marginBottom: 15, 
                  fontSize: 18, 
                  textAlign: 'center',
                  letterSpacing: '3px'
                }}
              />
              <button 
                onClick={verifyOtp} 
                disabled={loading || otp.length !== 6} 
                style={{ width: "100%", padding: 12, marginBottom: 10 }}
              >
                {loading ? "Verifying..." : "Verify OTP & Complete Registration"}
              </button>
              <button 
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setMessage("");
                }}
                style={{ width: "100%", padding: 10, backgroundColor: "#666" }}
              >
                Back to Registration
              </button>
            </div>
          )}
        </>
      )}
      
      {message && (
        <p
          style={{
            marginTop: 10,
            color: message.includes("✅") ? "green" : 
                   message.includes("ℹ️") ? "orange" : "red",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// --- Login Component ---
function Login({ walletAddress: initialWallet, onAuthenticated, onSwitchToRegister }) {
  const [walletConnected, setWalletConnected] = useState(!!initialWallet);
  const [walletAddress, setWalletAddress] = useState(initialWallet || "");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    setMessage("");
    if (!window.ethereum) return setMessage("MetaMask not detected");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      setMessage("✅ Wallet connected successfully!");
    } catch {
      setMessage("User rejected wallet connection");
    }
  }

  async function requestOtp() {
    setMessage("");
    if (!email.match(/^\S+@\S+\.\S+$/)) return setMessage("Enter a valid email");
    if (!walletConnected) return setMessage("Connect your wallet first");

    setLoading(true);
    try {
      await axios.post(`${API_URL}/login/request-otp`, { 
        address: walletAddress,
        email 
      });
      setMessage("✅ OTP sent to your email");
      setOtpSent(true);
    } catch (err) {
      if (err.response?.data?.error?.includes("User not found")) {
        setMessage("❌ No account found with these details. Please register first.");
      } else {
        setMessage(`❌ ${err.response?.data?.error || err.message || "Failed to send OTP"}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setMessage("");
    if (otp.length !== 6) return setMessage("Enter 6-digit OTP");

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { 
        address: walletAddress,
        otp 
      });
      setMessage("✅ Login successful! Redirecting to dashboard...");
      console.log(res.data);
      onAuthenticated(res.data.token, res.data.email, walletAddress);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || err.message || "OTP verification failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      
      {/* Step 1: Connect Wallet (if not connected) */}
      {!walletConnected && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={connectWallet} style={{ width: "100%", padding: 10 }}>
            Connect MetaMask
          </button>
        </div>
      )}
      
      {/* Step 2: Email Input (only after wallet is connected) */}
      {walletConnected && !otpSent && (
        <div>
          <p><strong>Connected Wallet:</strong> {walletAddress}</p>
          <input
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />
          <button 
            onClick={requestOtp} 
            disabled={loading || !email} 
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          >
            Send OTP
          </button>
          <button 
            onClick={onSwitchToRegister}
            style={{ width: "100%", padding: 10, backgroundColor: "#666" }}
          >
            Need to Register?
          </button>
        </div>
      )}
      
      {/* Step 3: OTP Input (only after OTP is sent) */}
      {otpSent && (
        <div>
          <p><strong>Connected Wallet:</strong> {walletAddress}</p>
          <p><strong>Email:</strong> {email}</p>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={loading}
            style={{ width: "100%", padding: 8, marginBottom: 10 }}
          />
          <button 
            onClick={verifyOtp} 
            disabled={loading || otp.length !== 6} 
            style={{ width: "100%", padding: 10 }}
          >
            Verify OTP
          </button>
        </div>
      )}

      {message && (
        <p style={{ 
          marginTop: 10, 
          color: message.includes("✅") || message.includes("successful") ? "green" : 
                 message.includes("ℹ️") ? "orange" : "red" 
        }}>
          {message}
        </p>
      )}
    </div>
  );
}

// --- Dashboard ---
function Dashboard({ walletAddress, email, onLogout }) {
  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Dashboard</h2>
      <p><strong>Wallet:</strong> {walletAddress}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Status:</strong> ✅ Authenticated</p>
      <button onClick={onLogout} style={{ width: "100%", padding: 10, marginTop: 20 }}>Logout</button>
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [page, setPage] = useState("main");
  const [walletAddress, setWalletAddress] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  function handleAuthenticated(tok, userEmail, addr) {
    setToken(tok);
    setEmail(userEmail);
    setWalletAddress(addr);
    setPage("dashboard");
  }

  function redirectToLogin(addr) {
    setWalletAddress(addr);
    setPage("login");
  }

  function redirectToRegister(addr = "") {
    setWalletAddress(addr);
    setPage("register");
  }

  function logout() {
    setToken("");
    setWalletAddress("");
    setEmail("");
    setPage("main");
  }

  if (page === "main") {
    return (
      <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
        <h1>Welcome</h1>
        <button onClick={() => setPage("register")} style={{ width: "100%", padding: 15, marginBottom: 10 }}>Register</button>
        <button onClick={() => setPage("login")} style={{ width: "100%", padding: 15 }}>Login</button>
      </div>
    );
  }

  if (page === "register") return (
    <Register 
      onAuthenticated={handleAuthenticated} // CHANGED: onRegistered → onAuthenticated
      onSwitchToLogin={redirectToLogin}
    />
  );
  
  if (page === "login") return (
    <Login 
      walletAddress={walletAddress} 
      onAuthenticated={handleAuthenticated}
      onSwitchToRegister={redirectToRegister}
    />
  );
  
  if (page === "dashboard") return (
    <Dashboard 
      walletAddress={walletAddress} 
      email={email} 
      onLogout={logout} 
    />
  );

  return null;
}