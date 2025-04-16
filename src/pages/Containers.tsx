
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { Link, Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  Folder, 
  Plus,
  Calendar,
  Info
} from 'lucide-react';
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

interface Container {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

const Containers = () => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [containerName, setContainerName] = useState<string>("");
  const [containerDescription, setContainerDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchContainers = async () => {
      try {
        setLoading(true);
        const token = await getAccessToken();
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Failed to get access token",
            variant: "destructive",
          });
          return;
        }

        const containersData = await sharePointService.listContainers(token);
        setContainers(containersData);
      } catch (error) {
        console.error('Error fetching containers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch containers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContainers();
  }, [isAuthenticated, getAccessToken]);

  const createContainer = async () => {
    if (!containerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Container name is required",
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

      const newContainer = await sharePointService.createContainer(
        token, 
        containerName, 
        containerDescription
      );
      
      setContainers([...containers, newContainer]);
      setCreateOpen(false);
      setContainerName("");
      setContainerDescription("");
      
      toast({
        title: "Success",
        description: `Container "${containerName}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating container:', error);
      toast({
        title: "Error",
        description: "Failed to create container",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const viewContainerInfo = async (container: Container) => {
    setSelectedContainer(container);
    setInfoOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Containers</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Container
        </Button>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : containers.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {containers.map((container) => (
                <tr key={container.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Folder className="flex-shrink-0 h-5 w-5 text-gray-400" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          <Link
                            to={`/files/${container.id}`}
                            className="hover:text-blue-600"
                          >
                            {container.displayName}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {container.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="flex-shrink-0 h-4 w-4 text-gray-400 mr-1" />
                      <div className="text-sm text-gray-500">
                        {formatDate(container.createdDateTime)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => viewContainerInfo(container)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center bg-white">
          <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No containers found</h3>
          <p className="text-gray-500 mb-4">Create your first container to get started</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Container
          </Button>
        </div>
      )}
      
      {/* Create Container Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Container</SheetTitle>
            <SheetDescription>
              Create a new container to store and organize your files.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="Enter container name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                value={containerDescription}
                onChange={(e) => setContainerDescription(e.target.value)}
                placeholder="Enter container description"
                rows={3}
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button 
              onClick={createContainer} 
              disabled={creating || !containerName.trim()}
            >
              {creating ? "Creating..." : "Create Container"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Container Info Sheet */}
      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Container Details</SheetTitle>
          </SheetHeader>
          {selectedContainer && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Display Name</h3>
                  <p className="mt-1">{selectedContainer.displayName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{selectedContainer.description || "-"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Container ID</h3>
                  <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded overflow-auto">
                    {selectedContainer.id}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Container Type ID</h3>
                  <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded overflow-auto">
                    {selectedContainer.containerTypeId}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1">{formatDate(selectedContainer.createdDateTime)}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  to={`/files/${selectedContainer.id}`}
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

export default Containers;
