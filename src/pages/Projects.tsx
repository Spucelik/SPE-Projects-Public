
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { Link, Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  CircleCheck,
  CircleX,
  CircleAlert,
  CircleDot,
  Calendar,
  Clock,
  Info,
  ExternalLink,
  ShieldAlert,
  Plus,
  Bug
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ConfigAlert } from '../components/ConfigAlert';
import { useContainerDetails } from '../hooks/useContainerDetails';
import { CreateContainerForm } from '../components/CreateContainerForm';
import { DevModePanel } from '../components/DevModePanel';

interface Project {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
  webUrl?: string;
  type: 'Project' | 'Tracker' | 'Enhancement' | 'Production Support';
  status: 'Not Started' | 'In Progress' | 'Completed';
  health: 'Green' | 'Yellow' | 'Red';
  percentComplete: number;
  startDate: string;
  endDate: string;
}

interface ApiCall {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  request?: any;
  response?: any;
  status?: number;
}

const ProjectDetails = ({ project }: { project: Project }) => {
  // If we already have webUrl from search, we can use it directly
  const containerDetails = project.webUrl ? null : useContainerDetails(project.id);
  const projectUrl = project.webUrl || (containerDetails?.webUrl || '');

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Project URL</h4>
        {projectUrl ? (
          <a 
            href={projectUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            <span className="truncate">{projectUrl}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <p className="text-muted-foreground">Loading URL...</p>
        )}
      </div>
      
      <div>
        <h4 className="font-semibold">Project Name</h4>
        <p>{project.displayName}</p>
      </div>
      
      <div>
        <h4 className="font-semibold">Description</h4>
        <p>{project.description || 'No description available'}</p>
      </div>
      
      <div>
        <h4 className="font-semibold">Created</h4>
        <p>{new Date(project.createdDateTime).toLocaleDateString()}</p>
      </div>
      
      <div>
        <h4 className="font-semibold">Status</h4>
        <p>{project.status}</p>
      </div>
      
      <div>
        <h4 className="font-semibold">Progress</h4>
        <div className="flex items-center gap-2">
          <Progress value={project.percentComplete} className="h-2" />
          <span>{project.percentComplete}%</span>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const { isAuthenticated, getAccessToken, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState<boolean>(false);
  const [devModeOpen, setDevModeOpen] = useState<boolean>(false);
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);

  const addApiCall = (call: Omit<ApiCall, 'id' | 'timestamp'>) => {
    const newCall: ApiCall = {
      ...call,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString()
    };
    setApiCalls(prev => [newCall, ...prev]);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      
      const token = await getAccessToken();
      if (!token) {
        setError("Failed to get access token. Please try logging in again.");
        return;
      }

      try {
        // Use the enumeration method as the primary method now
        console.log('Fetching projects using enumeration method...');
        
        // Track the API call
        const apiCallStart = {
          method: 'GET',
          url: 'https://graph.microsoft.com/beta/storage/fileStorage/containers',
          request: {
            headers: {
              'Authorization': 'Bearer [REDACTED]',
              'Content-Type': 'application/json'
            }
          }
        };
        
        const projectsData = await sharePointService.listContainers(token);
        
        // Track successful API response
        addApiCall({
          ...apiCallStart,
          response: {
            value: projectsData,
            '@odata.context': 'https://graph.microsoft.com/beta/$metadata#storage/fileStorage/containers'
          },
          status: 200
        });
        
        // Process the data
        const enhancedProjects = projectsData.map(project => {
          // Handle dates safely to prevent invalid date errors
          let startDate;
          let endDate;
          
          // Use project's createdDateTime if available, or fallback to current date
          try {
            if (project.createdDateTime && project.createdDateTime !== '') {
              startDate = new Date(project.createdDateTime).toISOString();
            } else {
              startDate = new Date().toISOString();
            }
            
            // Generate a random end date 1-30 days in the future from the start date
            const start = new Date(startDate);
            const futureDate = new Date(start.getTime() + (Math.floor(Math.random() * 30) + 1) * 24 * 60 * 60 * 1000);
            endDate = futureDate.toISOString();
          } catch (err) {
            // Fallback if date parsing fails
            console.warn('Date parsing issue:', err);
            const now = new Date();
            startDate = now.toISOString();
            endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
          }
          
          return {
            ...project,
            type: ['Project', 'Tracker', 'Enhancement', 'Production Support'][Math.floor(Math.random() * 4)] as Project['type'],
            status: ['Not Started', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)] as Project['status'],
            health: ['Green', 'Yellow', 'Red'][Math.floor(Math.random() * 3)] as Project['health'],
            percentComplete: Math.floor(Math.random() * 100),
            startDate,
            endDate,
          };
        });
        
        setProjects(enhancedProjects);
      } catch (error: any) {
        console.error('Error from enumeration API:', error);
        
        // Track failed API response
        addApiCall({
          method: 'GET',
          url: 'https://graph.microsoft.com/beta/storage/fileStorage/containers',
          request: {
            headers: {
              'Authorization': 'Bearer [REDACTED]',
              'Content-Type': 'application/json'
            }
          },
          response: error,
          status: error.message && error.message.includes('403') ? 403 : 500
        });
        
        // Check if it's a permissions error (403)
        if (error.message && error.message.includes('403')) {
          setPermissionError(true);
          toast({
            title: "Permission Error",
            description: "Your account doesn't have sufficient permissions to access projects.",
            variant: "destructive",
          });
        } else {
          throw error; // Re-throw if it's not a permissions error
        }
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProjects();
  }, [isAuthenticated, getAccessToken]);

  const handleCreateSuccess = () => {
    setIsCreatePanelOpen(false);
    fetchProjects(); // Refresh the projects list
  };

  const getHealthIcon = (health: Project['health']) => {
    switch (health) {
      case 'Green':
        return <CircleCheck className="text-green-500" />;
      case 'Yellow':
        return <CircleAlert className="text-yellow-500" />;
      case 'Red':
        return <CircleX className="text-red-500" />;
      default:
        return <CircleDot className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <div className="space-y-6" style={{ paddingBottom: devModeOpen ? '320px' : '60px' }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Project Sites Rollup</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDevModeOpen(!devModeOpen)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Dev Mode
            </Button>
          </div>
          <Sheet open={isCreatePanelOpen} onOpenChange={setIsCreatePanelOpen}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create New Container</SheetTitle>
                <SheetDescription>
                  Create a new project container with display name, description, and administrator settings.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <CreateContainerForm 
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreatePanelOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <ConfigAlert />

        {permissionError && (
          <Alert variant="destructive" className="mb-4">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Insufficient Permissions</AlertTitle>
            <AlertDescription>
              <p>Your account ({user?.username || 'Guest'}) does not have the required permissions to view or manage projects.</p>
              <p className="mt-2">Please contact your administrator for access.</p>
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : permissionError ? (
          <div className="border rounded-lg p-8 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Permission Denied</h3>
            <p className="mb-4 text-muted-foreground">
              Your account doesn't have access to view or manage projects. This is common for guest accounts.
            </p>
            <p className="text-sm text-muted-foreground">
              Error code: 403 Forbidden
            </p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error loading projects</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : projects.length === 0 ? (
          <div className="border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground">
              There are no projects available to display. Create your first container to get started.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="w-[50px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.type}</TableCell>
                    <TableCell>
                      <Link
                        to={`/files/${project.id}`}
                        className="hover:text-blue-600 font-medium"
                      >
                        {project.displayName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(project.health)}
                        <span>{project.health}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.percentComplete} className="h-2" />
                        <span className="min-w-[3ch] text-sm">
                          {project.percentComplete}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {formatDate(project.startDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        {formatDate(project.endDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Project Details</SheetTitle>
                            <SheetDescription>
                              View detailed information about this project
                            </SheetDescription>
                          </SheetHeader>
                          <div className="mt-6">
                            <ProjectDetails project={project} />
                          </div>
                          <SheetFooter className="mt-6">
                            <SheetClose asChild>
                              <Button variant="secondary">Close</Button>
                            </SheetClose>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DevModePanel 
        isOpen={devModeOpen}
        onToggle={() => setDevModeOpen(!devModeOpen)}
        apiCalls={apiCalls}
      />
    </>
  );
};

export default Projects;
