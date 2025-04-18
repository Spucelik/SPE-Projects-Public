import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { Link, Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Folder, Settings, AlertCircle, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { appConfig } from '../config/appConfig';

interface Container {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

const Index = () => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchContainers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError("Failed to get access token. Please try logging in again.");
          toast({
            title: "Authentication Error",
            description: "Failed to get access token",
            variant: "destructive",
          });
          return;
        }

        const containersData = await sharePointService.listContainers(token);
        setContainers(containersData);
      } catch (error: any) {
        console.error('Error fetching containers:', error);
        setError(error.message || "Failed to fetch containers. This may be due to insufficient permissions or API limitations.");
        toast({
          title: "Error",
          description: "Failed to fetch containers. Please check console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
  }, [isAuthenticated, getAccessToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Welcome to SharePoint Embedded File Upload</h1>
        <p className="text-gray-600">
          This application allows you to manage and upload files to your SharePoint Embedded containers.
        </p>
      </div>

      {showConfig && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-700 relative">
          <button 
            onClick={() => setShowConfig(false)}
            className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded-full"
            aria-label="Close configuration information"
          >
            <X className="h-4 w-4" />
          </button>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Information</AlertTitle>
          <AlertDescription>
            <p>You must configure these values in the app configuration:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>CLIENT_ID:</strong> {appConfig.clientId}</li>
              <li><strong>TENANT_ID:</strong> {appConfig.tenantId}</li>
              <li><strong>CONTAINER_TYPE_ID:</strong> {appConfig.containerTypeId}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="text-blue-500" />
            <h2 className="text-xl font-semibold">Your Containers</h2>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">
              <p>There was an error loading containers.</p>
            </div>
          ) : containers.length > 0 ? (
            <ul className="space-y-2">
              {containers.map((container) => (
                <li key={container.id} className="border-b pb-2">
                  <Link 
                    to={`/files/${container.id}`}
                    className="hover:text-blue-600 font-medium"
                  >
                    {container.displayName}
                  </Link>
                  {container.description && (
                    <p className="text-sm text-gray-500">{container.description}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No containers found. Create your first container to get started.</p>
          )}
          <div className="mt-4">
            <Link 
              to="/containers" 
              className="text-blue-600 hover:underline text-sm"
            >
              View all containers →
            </Link>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="text-blue-500" />
            <h2 className="text-xl font-semibold">Getting Started</h2>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Make sure you have the correct permissions in your Microsoft tenant</li>
            <li>Create a new container or browse existing ones</li>
            <li>Upload files to your containers</li>
            <li>Browse and preview files in containers</li>
          </ol>
          <div className="mt-6 p-4 bg-gray-100 rounded-md text-sm">
            <p className="font-semibold">Need help?</p>
            <a 
              href="https://aka.ms/start-spe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Get Started with SharePoint Embedded →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
