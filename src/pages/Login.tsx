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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Brand and illustration */}
          <div className="bg-blue-600 p-8 md:w-2/5 relative overflow-hidden">
            <div className="text-white relative z-10">
              <h3 className="text-lg font-medium">Contoso</h3>
              <h2 className="text-2xl font-bold">Project</h2>
              <h2 className="text-2xl font-bold">Management</h2>
              <h2 className="text-2xl font-bold mb-2">Service</h2>
              <p className="text-sm text-blue-100">Everything you need for convenient team work</p>
            </div>
            
            {/* Abstract shapes for visual interest */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,89.9,-16.3,88.8,-0.6C87.7,15,83,30,74.9,42.3C66.8,54.6,55.4,64.2,42.2,70.6C28.9,77,14.5,80.2,-0.2,80.5C-14.8,80.8,-29.6,78.3,-43.9,72.5C-58.2,66.7,-72,57.7,-79.8,45.1C-87.7,32.5,-89.5,16.2,-87.4,1.2C-85.3,-13.9,-79.1,-27.8,-70.5,-39.7C-61.9,-51.6,-51,-61.5,-38.7,-69.4C-26.5,-77.4,-13.2,-83.3,1.2,-85.3C15.7,-87.3,31.3,-85.3,44.7,-76.4Z" transform="translate(100 100)" />
              </svg>
            </div>
            
            {/* Overlapping circles for depth */}
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-blue-500 rounded-full opacity-30"></div>
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-blue-700 rounded-full opacity-20"></div>
            
            {/* Small grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="h-full w-full" style={{ 
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
                backgroundSize: '15px 15px' 
              }}></div>
            </div>
          </div>
          
          {/* Right side - Login form */}
          <div className="p-8 md:w-3/5 bg-gray-50">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center">Log in</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example.company@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button className="text-sm text-blue-600 hover:underline">
                      Forgot the password?
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md"
                >
                  {loading ? 'Signing in...' : 'Log in'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
