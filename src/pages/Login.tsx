
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left sidebar with illustration and brand info */}
        <div className="bg-blue-600 text-white p-8 md:w-2/5 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-medium">Contoso</h2>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Project Management Service</h1>
            <p className="text-blue-100">
              Everything you need for convenient team work
            </p>
          </div>
          
          <div className="mt-auto flex-1 flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1770&ixlib=rb-4.0.3" 
              alt="Team collaboration" 
              className="max-w-full rounded-lg opacity-85 max-h-64 object-cover"
            />
          </div>
        </div>
        
        {/* Right side login form */}
        <div className="bg-gray-50 p-8 md:p-12 md:w-3/5">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Log in</h2>
          </div>
          
          <div className="space-y-6 max-w-md mx-auto md:mx-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example.company@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-3 rounded-md pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right">
                <button className="text-sm text-blue-600 hover:underline">
                  Forgot the password
                </button>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!isConfigured && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-700 my-4">
                <AlertTitle>Configuration Required</AlertTitle>
                <AlertDescription>
                  You must configure CLIENT_ID, TENANT_ID, and CONTAINER_TYPE_ID before login will work.
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleLogin}
              disabled={loading || !isConfigured}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md flex items-center justify-center"
            >
              <LogIn className="mr-2" size={18} />
              {loading ? 'Signing in...' : 'Log in'}
            </Button>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo application for SharePoint Embedded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
