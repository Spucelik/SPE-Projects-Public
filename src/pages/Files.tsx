
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

interface BreadcrumbItem {
  id: string;
  name: string;
}

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const { isAuthenticated, getAccessToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigInfo, setShowConfigInfo] = useState(false);
  const [currentPath, setCurrentPath] = useState<BreadcrumbItem[]>([
    { id: '', name: 'Root' }
  ]);

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

        // Use the existing listFiles method instead of listFilesAndFolders
        const fileItems = await sharePointService.listFiles(token, containerId, currentFolder);
        
        // Separate files and folders from the returned items
        const fileList: File[] = [];
        const folderList: Folder[] = [];
        
        fileItems.forEach(item => {
          if (item.isFolder) {
            folderList.push({
              id: item.id,
              name: item.name,
              webUrl: item.webUrl
            });
          } else {
            fileList.push({
              id: item.id,
              name: item.name,
              webUrl: item.webUrl,
              size: item.size,
              fileType: item.name.split('.').pop() || '',
              lastModifiedDateTime: item.lastModifiedDateTime
            });
          }
        });
        
        setFiles(fileList);
        setFolders(folderList);
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

  const handleFolderClick = (folderId: string, folderName: string) => {
    // Update current folder
    setCurrentFolder(folderId);
    
    // Update breadcrumb path
    if (folderId) {
      setCurrentPath(prev => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const handleNavigate = (folderId: string) => {
    // Find the index of the folder in the current path
    const folderIndex = currentPath.findIndex(item => item.id === folderId);
    
    // If found, truncate the path to that point and set the current folder
    if (folderIndex !== -1) {
      setCurrentPath(currentPath.slice(0, folderIndex + 1));
      setCurrentFolder(folderId);
    }
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
        currentPath={currentPath}
        onNavigate={handleNavigate}
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
        files={[
          ...files.map(file => ({
            id: file.id,
            name: file.name,
            webUrl: file.webUrl,
            size: file.size,
            lastModifiedDateTime: file.lastModifiedDateTime,
            isFolder: false
          })),
          ...folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            webUrl: folder.webUrl,
            lastModifiedDateTime: '',
            size: 0,
            isFolder: true
          }))
        ]}
        loading={loading}
        onFolderClick={(item) => handleFolderClick(item.id, item.name)}
        onFileClick={() => {}}
        onViewFile={() => {}}
        onDeleteFile={async () => {}}
        containerId={containerId || ''}
      />
    </div>
  );
};

export default Files;
