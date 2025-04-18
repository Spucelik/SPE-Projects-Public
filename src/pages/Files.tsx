import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { appConfig } from '../config/appConfig';
import FileList from '@/components/files/FileList';
import FolderNavigation from '@/components/files/FolderNavigation';

interface File {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  fileType: string;
  lastModifiedDateTime: string;
}

interface Folder {
  id: string;
  name: string;
  webUrl: string;
}

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const { isAuthenticated, getAccessToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigInfo, setShowConfigInfo] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !containerId) return;

    const fetchFilesAndFolders = async () => {
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

        const { files: fetchedFiles, folders: fetchedFolders } = await sharePointService.getFilesAndFolders(token, containerId, currentFolder);
        setFiles(fetchedFiles);
        setFolders(fetchedFolders);
      } catch (error: any) {
        console.error('Error fetching files:', error);
        setError(error.message || "Failed to fetch files. This may be due to insufficient permissions or API limitations.");
        toast({
          title: "Error",
          description: "Failed to fetch files. Please check console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFilesAndFolders();
  }, [isAuthenticated, getAccessToken, containerId, currentFolder]);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleNavigateUp = () => {
    setCurrentFolder('');
  };

  return (
    <div className="space-y-6">
      {showConfigInfo && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-700 flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <div>
              <AlertTitle>Configuration Information</AlertTitle>
              <AlertDescription>
                <p>You must configure these values in the app configuration:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>CLIENT_ID:</strong> {appConfig.clientId}</li>
                  <li><strong>TENANT_ID:</strong> {appConfig.tenantId}</li>
                  <li><strong>CONTAINER_TYPE_ID:</strong> {appConfig.containerTypeId}</li>
                </ul>
              </AlertDescription>
            </div>
          </div>
          <button 
            onClick={() => setShowConfigInfo(false)}
            className="text-sm text-blue-700 hover:underline ml-4"
          >
            Hide
          </button>
        </Alert>
      )}

      <FolderNavigation 
        currentFolder={currentFolder}
        onNavigateUp={handleNavigateUp}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <FileList 
        files={files}
        folders={folders}
        loading={loading}
        onFolderClick={handleFolderClick}
      />
    </div>
  );
};

export default Files;
