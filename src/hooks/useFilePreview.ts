
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService, FileItem } from '@/services/sharePointService';
import { searchService } from '@/services/searchService';
import { toast } from '@/hooks/use-toast';

export const useFilePreview = (containerId: string | undefined) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const handleViewFile = async (file: FileItem) => {
    if (!containerId) {
      console.error('Container ID is undefined');
      toast({
        title: "Error",
        description: "Missing container information",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Attempting to view file:', file.name);
      setPreviewLoading(true);
      setIsPreviewOpen(true);
      setPreviewUrl(null);
      
      const token = await getAccessToken();
      if (!token) {
        console.error('Failed to get access token');
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        setIsPreviewOpen(false);
        return;
      }
      
      // Check if this file has driveId (from search results)
      const fileWithIds = file as FileItem & { driveId?: string };
      
      let url: string;
      if (fileWithIds.driveId) {
        // This is from search results, use searchService
        console.log('Getting file preview URL from search service for:', file.id);
        url = await searchService.getFilePreviewUrl(token, fileWithIds.driveId, file.id);
      } else {
        // This is from regular file browsing, use sharePointService
        console.log('Getting file preview for:', file.id);
        url = await sharePointService.getFilePreview(token, containerId, file.id);
      }
      
      console.log('Received preview URL:', url);
      setPreviewUrl(url);
    } catch (error: any) {
      console.error('Error getting file preview:', error);
      toast({
        title: "Error",
        description: "Failed to get file preview: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  return {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    setPreviewUrl,
    previewLoading,
    setPreviewLoading,
    handleViewFile
  };
};
