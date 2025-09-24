import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const userRoles = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'patient', label: 'Patient' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'regulator', label: 'Regulator' }
  ];

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setErrorMsg('MetaMask is not installed. Please install it to continue.');
      return null;
    }
    try {
      setErrorMsg(null);
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        return accounts[0];
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setErrorMsg('Wallet connection failed.');
    }
    return null;
  };

  const startRegistration = async () => {
    setErrorMsg(null);
    if (!selectedRole) {
      setErrorMsg('Please select your role before connecting wallet.');
      return;
    }
    setLoading(true);
    const address = await connectWallet();
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/register?walletAddress=${address}`);
      if (!res.ok) throw new Error('Failed to get nonce from server');
      const data = await res.json();
      setNonce(data.nonce);
    } catch (error) {
      console.error('Fetching nonce error:', error);
      setErrorMsg('Failed to get nonce from server. Try again.');
      setLoading(false);
    }
  };

  const signNonce = async () => {
    if (!walletAddress || !nonce) return;
    setLoading(true);
    try {
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [nonce, walletAddress],
      });
      setSignature(signature);
    } catch (error) {
      console.error('Signing error:', error);
      setErrorMsg('Signature rejected or failed.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const submitRegistration = async () => {
      if (!walletAddress || !signature || !selectedRole) return;
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, signature, role: selectedRole }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Registration failed');
        }
        // Success: redirect to confirmation or dashboard
        navigate('/register/confirmation');
      } catch (error) {
        console.error('Registration submission error:', error);
        setErrorMsg((error as Error).message || 'Registration failed.');
      } finally {
        setLoading(false);
      }
    };
    if (signature) {
      submitRegistration();
    }
  }, [signature, walletAddress, selectedRole, navigate]);

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
              Choose your role, connect your wallet, then sign the message to register.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorMsg && (
              <div className="text-red-600 text-center font-semibold">{errorMsg}</div>
            )}

            <div>
              <label htmlFor="role" className="block mb-1 font-semibold text-sm">
                Select Your Role
              </label>
              <select
                id="role"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={!!walletAddress}
              >
                <option value="" disabled>
                  Choose your role
                </option>
                {userRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {!walletAddress && (
              <Button
                onClick={startRegistration}
                className="w-full btn-gradient-primary text-lg py-6 flex items-center justify-center space-x-2"
                disabled={loading || !selectedRole}
              >
                <Wallet className="h-5 w-5" />
                <span>{loading ? 'Connecting Wallet...' : 'Connect Wallet & Get Nonce'}</span>
              </Button>
            )}

            {walletAddress && nonce && !signature && (
              <div>
                <div className="text-center text-muted-foreground mb-4">
                  Connected wallet: <span className="font-mono">{walletAddress}</span>
                </div>
                <Button
                  onClick={signNonce}
                  className="w-full btn-gradient-primary text-lg py-6"
                  disabled={loading}
                >
                  {loading ? 'Waiting for Signature...' : 'Sign Registration Message'}
                </Button>
              </div>
            )}

            {signature && (
              <div className="text-center text-success font-semibold">
                Signature received. Completing registration...
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
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;