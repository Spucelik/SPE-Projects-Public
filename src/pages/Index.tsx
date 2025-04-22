import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { Link, Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Folder, Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ConfigAlert } from '../components/ConfigAlert';
import { appConfig } from '../config/appConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Project {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

const Index = () => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProjects = async () => {
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

        const projectsData = await sharePointService.listContainers(token);
        setProjects(projectsData);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError(error.message || "Failed to fetch projects. This may be due to insufficient permissions or API limitations.");
        toast({
          title: "Error",
          description: "Failed to fetch projects. Please check console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthenticated, getAccessToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{appConfig.appName}</h1>
        <p className="text-gray-600">
          This application allows you to manage files and collaborate on projects using SharePoint Embedded.
        </p>
      </div>

      <ConfigAlert />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Folder className="text-blue-500" />
              <CardTitle>Your Projects</CardTitle>
            </div>
            <CardDescription>
              Access your project containers to manage files and collaborate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-red-500">
                <p>There was an error loading projects.</p>
              </div>
            ) : projects.length > 0 ? (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li key={project.id} className="border-b pb-2">
                    <Link 
                      to={`/files/${project.id}`}
                      className="hover:text-blue-600 font-medium"
                    >
                      {project.displayName}
                    </Link>
                    {project.description && (
                      <p className="text-sm text-gray-500">{project.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No projects found. Create your first project to get started.</p>
            )}
            <div className="mt-4">
              <Link 
                to="/projects" 
                className="text-blue-600 hover:underline text-sm"
              >
                View all projects →
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="text-blue-500" />
              <CardTitle>Getting Started</CardTitle>
            </div>
            <CardDescription>
              Follow these steps to start working with SharePoint Embedded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
              <li>Make sure you have the correct permissions in your Microsoft tenant</li>
              <li>Create a new project or browse existing ones</li>
              <li>Upload files to your projects</li>
              <li>Browse and preview files in projects</li>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
