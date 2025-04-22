import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { Link, Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  Folder, 
  Plus,
  Calendar,
  Info,
  AlertCircle
} from 'lucide-react';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appConfig } from '../config/appConfig';
import { ConfigAlert } from '../components/ConfigAlert';

interface Project {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

const Projects = () => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  const createProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }

      const newProject = await sharePointService.createContainer(
        token, 
        projectName, 
        projectDescription
      );
      
      setProjects([...projects, newProject]);
      setCreateOpen(false);
      setProjectName("");
      setProjectDescription("");
      
      toast({
        title: "Success",
        description: `Project "${projectName}" created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const viewProjectInfo = async (project: Project) => {
    setSelectedProject(project);
    setInfoOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>
      
      <ConfigAlert />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-8">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg overflow-hidden bg-white">
              <ProjectDashboard projectName={project.displayName} />
              <div className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Folder className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2" />
                    <Link
                      to={`/files/${project.id}`}
                      className="hover:text-blue-600 font-medium"
                    >
                      {project.displayName}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Calendar className="flex-shrink-0 h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">
                        {formatDate(project.createdDateTime)}
                      </span>
                    </div>
                    <button 
                      onClick={() => viewProjectInfo(project)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center bg-white">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}
      
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Project</SheetTitle>
            <SheetDescription>
              Create a new project to store and organize your files.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button 
              onClick={createProject} 
              disabled={creating || !projectName.trim()}
            >
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Project Details</SheetTitle>
          </SheetHeader>
          {selectedProject && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project Name</h3>
                  <p className="mt-1">{selectedProject.displayName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{selectedProject.description || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project ID</h3>
                  <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded overflow-auto">
                    {selectedProject.id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Project Type ID</h3>
                  <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded overflow-auto">
                    {selectedProject.containerTypeId}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1">{formatDate(selectedProject.createdDateTime)}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  to={`/files/${selectedProject.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Browse Files
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Projects;
