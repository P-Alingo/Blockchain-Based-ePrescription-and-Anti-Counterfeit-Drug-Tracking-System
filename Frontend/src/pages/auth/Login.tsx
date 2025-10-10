// Login.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wallet } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // Step 1: enter email, Step 2: enter OTP
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  // -----------------------------
  // Connect Wallet
  // -----------------------------
  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setErrorMsg('MetaMask is not installed. Please install it to continue.');
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) setWalletAddress(accounts[0]);
    } catch (err) {
      setErrorMsg('Wallet connection failed.');
    }
  };

  // -----------------------------
  // Request OTP
  // -----------------------------
  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setErrorMsg('Connect your wallet first.');
    setLoading(true);
    setErrorMsg(null);

    try {
      interface OtpResponse {
        success: boolean;
        message?: string;
      }

      const res = await axios.post<OtpResponse>('http://localhost:4000/api/login-request-otp', {
        walletAddress,
        email,
      });

      if (res.data.success) {
        setStep(2); // Go to OTP step
      } else {
        setErrorMsg(res.data.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Verify OTP
  // -----------------------------
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return setErrorMsg('Connect your wallet first.');
    setLoading(true);
    setErrorMsg(null);

    try {
      interface VerifyOtpResponse {
        success: boolean;
        token?: string;
        role?: string;
        message?: string;
      }

      const res = await axios.post<VerifyOtpResponse>('http://localhost:4000/api/login-verify-otp', {
        walletAddress,
        email,
        otp,
      });

      if (res.data.success) {
        // Save JWT & role
        localStorage.setItem('jwtToken', res.data.token || '');
        localStorage.setItem('userRole', res.data.role || '');

        // Redirect to dashboard
        navigate(`/${res.data.role}/dashboard`);
      } else {
        setErrorMsg(res.data.message || 'Invalid OTP.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold mb-2">Sign In</h1>
          <p className="text-muted-foreground">Login securely with your wallet and email</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMsg && <div className="text-red-600 text-center font-semibold">{errorMsg}</div>}

            {!walletAddress && (
              <Button
                onClick={connectWallet}
                className="w-full btn-gradient-primary text-lg py-6 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                <Wallet className="h-5 w-5" />
                <span>{loading ? 'Connecting...' : 'Connect MetaMask Wallet'}</span>
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
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <Button
                  type="submit"
                  className="w-full btn-gradient-primary py-6 text-lg"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Request OTP'}
                </Button>
              </form>
            )}

            {walletAddress && step === 2 && (
              <form onSubmit={verifyOtp} className="space-y-4">
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
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
