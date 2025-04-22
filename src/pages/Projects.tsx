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
  Info
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
import { ConfigAlert } from '../components/ConfigAlert';
import { useContainerDetails } from '../hooks/useContainerDetails';

interface Project {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
  type: 'Project' | 'Tracker' | 'Enhancement' | 'Production Support';
  status: 'Not Started' | 'In Progress' | 'Completed';
  health: 'Green' | 'Yellow' | 'Red';
  percentComplete: number;
  startDate: string;
  endDate: string;
}

const ProjectDetails = ({ project }: { project: Project }) => {
  const containerDetails = useContainerDetails(project.id);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold">Project URL</h4>
        {containerDetails?.webUrl ? (
          <a 
            href={containerDetails.webUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {containerDetails.webUrl}
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
          return;
        }

        const projectsData = await sharePointService.listContainers(token);
        const enhancedProjects = projectsData.map(project => ({
          ...project,
          type: ['Project', 'Tracker', 'Enhancement', 'Production Support'][Math.floor(Math.random() * 4)] as Project['type'],
          status: ['Not Started', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)] as Project['status'],
          health: ['Green', 'Yellow', 'Red'][Math.floor(Math.random() * 3)] as Project['health'],
          percentComplete: Math.floor(Math.random() * 100),
          startDate: new Date(project.createdDateTime).toISOString(),
          endDate: new Date(new Date(project.createdDateTime).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        setProjects(enhancedProjects);
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

    fetchProjects();
  }, [isAuthenticated, getAccessToken]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Sites Rollup</h1>
      </div>
      
      <ConfigAlert />
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
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
  );
};

export default Projects;
