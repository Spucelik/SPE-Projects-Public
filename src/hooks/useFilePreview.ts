
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService, FileItem } from '@/services/sharePointService';
import { toast } from '@/hooks/use-toast';

export const useFilePreview = (containerId: string | undefined) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { getAccessToken } = useAuth();

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
      
      const url = await sharePointService.getFilePreview(token, containerId, file.id);
      setPreviewUrl(url);
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

  return {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    previewLoading,
    handleViewFile
  };
};
