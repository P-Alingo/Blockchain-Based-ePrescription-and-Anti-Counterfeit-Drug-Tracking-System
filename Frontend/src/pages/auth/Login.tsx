// Login.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const navigate = useNavigate();

  // Helper: Connect to MetaMask wallet
  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setErrorMsg('MetaMask is not installed. Please install it to continue.');
      return;
    }
    try {
      setErrorMsg(null);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        return accounts[0];
      }
    } catch (err: any) {
      setErrorMsg('Wallet connection failed.');
    }
    return null;
  };

  // Start login flow: connect wallet and get nonce from backend
  const startLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    const address = await connectWallet();
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      // Fetch nonce for this wallet address from backend
      const res = await fetch(`/api/auth/nonce?wallet=${address}`);
      if (!res.ok) throw new Error('Failed to get nonce');
      const data = await res.json();
      setNonce(data.nonce);
    } catch (err) {
      setErrorMsg('Could not get nonce for signing. Please try again.');
      setLoading(false);
    }
  };

  // Sign the nonce message with wallet
  const signNonce = async () => {
    if (!walletAddress || !nonce) return;
    try {
      const message = `Login nonce: ${nonce}`;
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });
      setSignature(signature);
    } catch (err) {
      setErrorMsg('Signature rejected or failed.');
      setLoading(false);
    }
  };

  // Verify signature and obtain 2FA requirement and role
  useEffect(() => {
    if (!signature) return;

    const verifySignature = async () => {
      try {
        const res = await fetch('/api/auth/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: walletAddress, signature }),
        });
        if (!res.ok) throw new Error('Verification failed');
        const data = await res.json();
        // data could contain { requires2FA: boolean, role: string }
        if (data.requires2FA) {
          // Show 2FA input or handle 2FA flow here
          // For demo, let's simulate 2FA success immediately
          setIs2FAVerified(true);
          setSelectedRole(data.role);
        } else {
          // Directly get JWT if no 2FA required
          setJwtToken(data.token);
          setSelectedRole(data.role);
        }
      } catch (err) {
        setErrorMsg('Signature verification failed.');
        setLoading(false);
      }
    };
    verifySignature();
  }, [signature, walletAddress]);

  // After 2FA success or if no 2FA, get JWT token
  useEffect(() => {
    if (!is2FAVerified || !walletAddress) return;
    const getJwtAfter2FA = async () => {
      try {
        const res = await fetch('/api/auth/2fa-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: walletAddress }),
        });
        if (!res.ok) throw new Error('2FA verification failed');
        const data = await res.json();
        setJwtToken(data.token);
        setSelectedRole(data.role);
      } catch (err) {
        setErrorMsg('2FA verification failed.');
        setLoading(false);
      }
    };
    getJwtAfter2FA();
  }, [is2FAVerified, walletAddress]);

  // Redirect once JWT token and role are set
  useEffect(() => {
    if (jwtToken && selectedRole) {
      // Save token to localStorage or context as needed
      localStorage.setItem('jwtToken', jwtToken);
      localStorage.setItem('userRole', selectedRole);
      // Redirect to dashboard according to role
      navigate(`/${selectedRole}/dashboard`);
    }
  }, [jwtToken, selectedRole, navigate]);

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
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in securely with your MetaMask wallet</p>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMsg && (
              <div className="text-red-600 text-center font-semibold">{errorMsg}</div>
            )}

            {!walletAddress && (
              <Button
                onClick={startLogin}
                className="w-full btn-gradient-primary text-lg py-6 flex items-center justify-center space-x-2"
                disabled={loading}
              >
                <Wallet className="h-5 w-5" />
                <span>{loading ? 'Connecting Wallet...' : 'Connect MetaMask Wallet'}</span>
              </Button>
            )}

            {walletAddress && !nonce && (
              <div className="text-center text-muted-foreground">
                Connected wallet: <span className="font-mono">{walletAddress}</span><br />
                Loading nonce...
              </div>
            )}

            {nonce && !signature && (
              <Button
                onClick={signNonce}
                className="w-full btn-gradient-primary text-lg py-6"
                disabled={loading}
              >
                Sign Login Message
              </Button>
            )}

            {signature && !jwtToken && (
              <div className="text-center text-muted-foreground">
                Verifying signature...
              </div>
            )}

            {jwtToken && (
              <div className="text-center text-success font-semibold">
                Login successful! Redirecting...
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

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