
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { FileItem } from '@/services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { useApiCalls } from '../context/ApiCallsContext';

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const useFiles = (containerId: string | undefined) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<BreadcrumbItem[]>([
    { id: '', name: 'Root' }
  ]);
  const { isAuthenticated, getAccessToken } = useAuth();
  const { addApiCall } = useApiCalls();

  const fetchFiles = useCallback(async () => {
    if (!isAuthenticated || !containerId) return;

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

      console.log(`Fetching files for container ${containerId}, folder ${currentFolder || 'root'}`);
      
      // Track API call
      const apiCallData = {
        method: 'GET',
        url: `/containers/${containerId}/drive/items/${currentFolder || 'root'}/children`,
        request: { containerId, folder: currentFolder || 'root' }
      };

      try {
        const fileItems = await sharePointService.listFiles(token, containerId, currentFolder);
        
        // Ensure each file has the creator information and format
        const enhancedFiles = fileItems.map(item => ({
          ...item,
          createdByName: item.createdBy?.user?.displayName || 'Unknown',
          childCount: item.folder?.childCount || 0
        }));
        
        setFiles(enhancedFiles);
        
        // Track successful API call
        addApiCall({
          ...apiCallData,
          response: enhancedFiles,
          status: 200
        });
      } catch (apiError: any) {
        // Track failed API call
        addApiCall({
          ...apiCallData,
          response: { error: apiError.message },
          status: apiError.status || 500
        });
        throw apiError;
      }
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
  }, [isAuthenticated, getAccessToken, containerId, currentFolder, addApiCall]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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
      
      // Track API call
      const apiCallData = {
        method: 'DELETE',
        url: `/containers/${containerId}/drive/items/${file.id}`,
        request: { containerId, fileId: file.id, fileName: file.name }
      };

      try {
        await sharePointService.deleteFile(token, containerId, file.id);
        setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
        
        // Track successful API call
        addApiCall({
          ...apiCallData,
          response: { success: true, message: 'File deleted successfully' },
          status: 204
        });
        
        toast({
          title: "Success",
          description: "File deleted successfully",
        });
      } catch (apiError: any) {
        // Track failed API call
        addApiCall({
          ...apiCallData,
          response: { error: apiError.message },
          status: apiError.status || 500
        });
        throw apiError;
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshFiles = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    currentPath,
    currentFolder,
    handleFolderClick,
    handleNavigate,
    handleDeleteFile,
    refreshFiles
  };
};
