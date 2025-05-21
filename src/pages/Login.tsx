
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // These fields would be used in a real implementation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await login();
      toast({
        title: "Login successful",
        description: "You have been successfully authenticated.",
      });
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      toast({
        title: "Login failed",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check if the required configuration is set
  const isConfigured = appConfig.clientId && appConfig.tenantId && appConfig.containerTypeId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden flex">
        {/* Left side - Brand and illustration */}
        <div className="bg-blue-600 p-8 text-white w-2/5 flex flex-col items-center justify-center text-center">
          <div className="mb-6 flex flex-col items-center">
            <h3 className="text-lg font-medium mb-1">Contoso</h3>
            <h2 className="text-2xl font-bold mb-1">Project</h2>
            <h2 className="text-2xl font-bold mb-1">Management</h2>
            <h2 className="text-2xl font-bold">Service</h2>
            <p className="mt-4 text-sm text-blue-100">Everything you need for convenient team work</p>
          </div>
          
          <div className="flex-grow flex items-end justify-center">
            {/* Placeholder for illustration - could be replaced with an actual image */}
            <div className="w-64 h-64 rounded-full bg-blue-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-white/70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="p-8 w-3/5 bg-gray-50 flex flex-col items-center justify-center">
          <div className="mb-8 text-center w-full">
            <h2 className="text-3xl font-bold text-blue-600">Log in</h2>
          </div>
          
          <div className="space-y-5 w-full max-w-md flex flex-col items-center">
            <div className="space-y-2 w-full flex flex-col items-center">
              <Label htmlFor="email" className="text-sm font-medium text-center">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example.company@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-md text-center"
              />
            </div>
            
            <div className="space-y-2 w-full flex flex-col items-center">
              <Label htmlFor="password" className="text-sm font-medium text-center">
                Password
              </Label>
              <div className="relative w-full">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 rounded-md pr-10 text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-center w-full">
                <button className="text-sm text-blue-600 hover:underline">
                  Forgot the password?
                </button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="my-4 w-full text-center">
                <AlertTitle className="text-center">Error</AlertTitle>
                <AlertDescription className="text-center">{error}</AlertDescription>
              </Alert>
            )}
            
            {!isConfigured && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-700 my-4 w-full">
                <AlertTitle className="text-center">Configuration Required</AlertTitle>
                <AlertDescription className="text-center">
                  You must configure CLIENT_ID, TENANT_ID, and CONTAINER_TYPE_ID before login will work.
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleLogin}
              disabled={loading || !isConfigured}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md flex items-center justify-center"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
