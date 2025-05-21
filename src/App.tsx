
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { SidebarProvider } from "./components/ui/sidebar";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Files from "./pages/Files";
import NotFound from "./pages/NotFound";
import { useAuth } from "./context/AuthContext";
import React, { Suspense } from 'react';

// Initialize QueryClient with default options and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Log global query errors - using the correct listener format for TanStack Query v5
queryClient.getQueryCache().subscribe(
  // Pass a callback function directly instead of using an object with event handlers
  (event) => {
    if (event.type === 'error' && event.error) {
      console.error('Query cache error:', event.error);
    }
  }
);

// Simple fallback for loading states
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const App = () => {
  console.log('App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <ConfigProvider>
              <SidebarProvider>
                <>
                  <Toaster />
                  <Sonner />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                      <Route path="/files/:containerId" element={<ProtectedRoute><Files /></ProtectedRoute>} />
                      <Route path="/files" element={<ProtectedRoute><Navigate to="/projects" replace /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </>
              </SidebarProvider>
            </ConfigProvider>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  console.log('ProtectedRoute - Authentication status:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

export default App;
