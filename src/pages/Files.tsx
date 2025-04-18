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
import { ConfigAlert } from '../components/ConfigAlert';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import { FileItem } from '@/services/sharePointService';

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
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

        const fileItems = await sharePointService.listFiles(token, containerId, currentFolder);
        
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
    setCurrentFolder(folderId);
    
    if (folderId) {
      setCurrentPath(prev => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const handleNavigate = (folderId: string) => {
    const folderIndex = currentPath.findIndex(item => item.id === folderId);
    
    if (folderIndex !== -1) {
      setCurrentPath(currentPath.slice(0, folderIndex + 1));
      setCurrentFolder(folderId);
    }
  };

  const getSortedItems = () => {
    return [
      ...folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        webUrl: folder.webUrl,
        lastModifiedDateTime: '',
        size: 0,
        isFolder: true
      })),
      ...files.map(file => ({
        id: file.id,
        name: file.name,
        webUrl: file.webUrl,
        size: file.size,
        lastModifiedDateTime: file.lastModifiedDateTime,
        isFolder: false
      }))
    ].sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
  };

  const handleViewFile = async (file: FileItem) => {
    if (!containerId) return;
    
    try {
      setPreviewLoading(true);
      setIsPreviewOpen(true);
      setPreviewUrl(null);
      
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }
      
      const previewUrl = await sharePointService.getFilePreview(token, containerId, file.id);
      setPreviewUrl(previewUrl);
    } catch (error: any) {
      console.error('Error getting file preview:', error);
      toast({
        title: "Error",
        description: "Failed to get file preview. Please try again.",
        variant: "destructive",
      });
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    handleViewFile(file);
  };

  const handleDeleteFile = async (file: FileItem): Promise<void> => {
    if (!containerId) return;
    
    try {
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }
      
      await sharePointService.deleteFile(token, containerId, file.id);
      
      setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <ConfigAlert />
      
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
        files={getSortedItems()}
        loading={loading}
        onFolderClick={(item) => handleFolderClick(item.id, item.name)}
        onFileClick={handleFileClick}
        onViewFile={handleViewFile}
        onDeleteFile={handleDeleteFile}
        containerId={containerId || ''}
      />
      
      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        previewUrl={previewUrl}
        previewLoading={previewLoading}
      />
    </div>
  );
};

export default Files;
