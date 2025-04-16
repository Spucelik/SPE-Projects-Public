
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const { isAuthenticated, login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      toast({
        title: "Login successful",
        description: "You have been successfully authenticated.",
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: "An error occurred during authentication.",
        variant: "destructive",
      });
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">SharePoint File Upload</h1>
          <p className="mt-2 text-gray-600">Sign in with your Microsoft account</p>
        </div>
        
        <button
          onClick={handleLogin}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in
        </button>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Demo application for SharePoint Embedded
          </p>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <a 
          href="https://aka.ms/start-spe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Get Started with SharePoint Embedded
        </a>
      </footer>
    </div>
  );
};

export default Login;
