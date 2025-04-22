
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sharePointService } from '@/services/sharePointService';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';

const Index = () => {
  const { getAccessToken } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError("Failed to get access token. Please try logging in again.");
          return;
        }

        const projectsList = await sharePointService.listContainers(token);
        setProjects(projectsList);
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setError(error.message || "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [getAccessToken]);

  return (
    <div className="space-y-8">
      {/* Add ProjectDashboard at the top */}
      <ProjectDashboard projectName="Project Overview" />
      
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to SharePoint Embedded Demo</CardTitle>
            <CardDescription>
              This is a simple demo application that demonstrates the SharePoint Embedded functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SharePoint Embedded is a cloud storage platform that provides file storage and sharing capabilities that can be embedded in your applications.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link to="/projects">View Projects</Link>
            </Button>
          </CardFooter>
        </Card>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                You have {projects.length} project{projects.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects found. Create a new project to get started.</p>
              ) : (
                <ul className="space-y-2">
                  {projects.slice(0, 5).map((project) => (
                    <li key={project.id} className="text-sm hover:underline">
                      <Link to={`/files/${project.id}`}>{project.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link to="/projects">View All Projects</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
