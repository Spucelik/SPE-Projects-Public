
import React from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileItem } from '@/services/sharePointService';
import { ConfigAlert } from '../components/ConfigAlert';
import FileList from '@/components/files/FileList';
import FolderNavigation from '@/components/files/FolderNavigation';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import CopilotChat from '@/components/CopilotChat';
import { useFiles } from '@/hooks/useFiles';
import { useContainerDetails } from '@/hooks/useContainerDetails';
import { useFilePreview } from '@/hooks/useFilePreview';

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const {
    files,
    loading,
    error,
    currentPath,
    handleFolderClick,
    handleNavigate,
    handleDeleteFile
  } = useFiles(containerId);

  const containerDetails = useContainerDetails(containerId);
  
  const {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    previewLoading,
    handleViewFile
  } = useFilePreview(containerId);

  const getSortedItems = () => {
    return [
      ...files.filter(file => file.isFolder).map(folder => ({
        ...folder,
        lastModifiedDateTime: folder.lastModifiedDateTime || '',
        size: 0,
      })),
      ...files.filter(file => !file.isFolder)
    ].sort((a, b) => {
      if (a.isFolder === b.isFolder) {
        return a.name.localeCompare(b.name);
      }
      return a.isFolder ? -1 : 1;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <ConfigAlert />
        
        {containerDetails && (
          <div className="text-sm text-muted-foreground">
            <span>Connected to:</span> <a href={containerDetails.webUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{containerDetails.name}</a>
          </div>
        )}
        
        {containerId && (
          <CopilotChat containerId={containerId} />
        )}
      </div>
      
      <FolderNavigation 
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FileList 
        files={getSortedItems()}
        loading={loading}
        onFolderClick={(item) => handleFolderClick(item.id, item.name)}
        onFileClick={handleViewFile}
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
