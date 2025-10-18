import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wallet } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Login = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setMessage('❌ MetaMask is not installed.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) setWalletAddress(accounts[0]);
      setMessage('✅ Wallet connected.');
    } catch {
      setMessage('❌ Wallet connection failed.');
    }
  };

  // Logout / disconnect wallet
  const handleLogout = async () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setWalletAddress('');
    setStep(1);
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
  };

  // OTP timer
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (step === 2 && timeLeft === 0) {
      setMessage('❌ OTP expired. Please request a new one.');
    }
  }, [step, timeLeft]);

  const startTimer = () => setTimeLeft(120);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getTimerColor = () => (timeLeft > 60 ? 'text-green-600' : timeLeft > 30 ? 'text-yellow-600' : 'text-red-600');

  // Request OTP
  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setMessage('Connect your wallet first.');
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post<{ message?: string }>('http://localhost:4000/api/auth/login/request-otp', { walletAddress, email });
      setMessage(res.data.message || '✅ OTP sent!');
      setStep(2);
      startTimer();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setMessage('Connect your wallet first.');
    setLoading(true);
    setMessage('');

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

      const res = await axios.post<VerifyOtpResponse>('http://localhost:4000/api/auth/login/verify-otp', {
        walletAddress,
        email,
        otp,
      });

      if (res.data.success) {
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

        setMessage('✅ Login successful! Redirecting...');
        navigate(`/${res.data.role?.toLowerCase()}/dashboard`, { replace: true });
      } else {
        setMessage(res.data.message || '❌ Invalid OTP.');
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };
  
  // Resend OTP
  const handleResendOtp = async () => {
    if (!walletAddress) return setMessage('Connect your wallet first.');
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:4000/api/auth/login/request-otp', { walletAddress, email });
      setMessage('✅ OTP resent successfully!');
      startTimer();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to resend OTP.');
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
          <h1 className="text-3xl font-bold mb-2">Sign In</h1>
          <p className="text-muted-foreground">Login securely with your wallet and email</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {message && (
              <div className={`text-center font-semibold p-3 rounded ${
                message.includes('✅') ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {message}
              </div>
            )}

            {!walletAddress && (
              <Button
                onClick={connectWallet}
                className="w-full btn-gradient-primary text-lg py-6 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                <Wallet className="h-5 w-5" />
                {loading ? 'Connecting...' : 'Connect MetaMask Wallet'}
              </Button>
            )}

            {walletAddress && step === 1 && (
              <form onSubmit={requestOtp} className="space-y-4">
                <div className="bg-muted p-2 rounded text-sm text-center">
                  Connected Wallet: <span className="font-mono">{walletAddress}</span>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <Button type="submit" className="w-full btn-gradient-primary py-6 text-lg" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Request OTP'}
                </Button>
              </form>
            )}

            {walletAddress && step === 2 && (
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
                <div className="flex w-full gap-3 mt-2">
                  <Button type="submit" className="flex-1 btn-gradient-primary py-4 text-lg font-semibold rounded-lg shadow" disabled={loading || timeLeft === 0}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <Button type="button" onClick={handleResendOtp} disabled={loading || timeLeft > 0} variant="outline" className="py-4 font-semibold rounded-lg border-primary/40">
                    Resend
                  </Button>
                </div>
                {timeLeft === 0 && <p className="text-red-600 text-center text-sm mt-2">OTP expired. Please request a new one.</p>}
              </form>
            )}

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="text-primary hover:underline font-semibold">Register here</Link>
              </p>
              {walletAddress && <Button onClick={handleLogout} variant="outline" className="w-full text-red-600 mt-2">Disconnect Wallet</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
