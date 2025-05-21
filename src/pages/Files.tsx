import React from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, FolderPlus, Upload, MessageSquare } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { FileItem } from '@/services/sharePointService';
import { ConfigAlert } from '../components/ConfigAlert';
import FileList from '@/components/files/FileList';
import FolderNavigation from '@/components/files/FolderNavigation';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import FileUploadProgress from '@/components/files/FileUploadProgress';
import CopilotChat from '@/components/CopilotChat';
import { useFiles } from '@/hooks/useFiles';
import { useContainerDetails } from '@/hooks/useContainerDetails';
import { useFilePreview } from '@/hooks/useFilePreview';
import { useAuth } from '@/context/AuthContext';
import { sharePointService } from '@/services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const { getAccessToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [newFolderName, setNewFolderName] = useState('');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotSize, setCopilotSize] = useState(30); // Default size percentage for Copilot panel
  
  const {
    files,
    loading,
    error,
    currentPath,
    currentFolder,
    handleFolderClick,
    handleNavigate,
    handleDeleteFile,
    refreshFiles
  } = useFiles(containerId);

  const containerDetails = useContainerDetails(containerId);
  
  const {
    isPreviewOpen,
    setIsPreviewOpen,
    previewUrl,
    previewLoading,
    handleViewFile
  } = useFilePreview(containerId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!containerId || !event.target.files || event.target.files.length === 0) return;

    try {
      setIsUploading(true);
      const newProgress: Record<string, number> = {};
      const files = Array.from(event.target.files);
      
      files.forEach(file => {
        newProgress[file.name] = 0;
      });
      
      setUploadProgress(newProgress);
      
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }
      
      for (const file of files) {
        try {
          await sharePointService.uploadFile(
            token, 
            containerId, 
            currentFolder || 'root', 
            file,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: progress
              }));
            }
          );
          
          toast({
            title: "Upload Success",
            description: `File ${file.name} uploaded successfully`,
          });
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          toast({
            title: "Upload Failed",
            description: `File ${file.name} could not be uploaded`,
            variant: "destructive",
          });
        }
      }
      
      refreshFiles();
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const handleCreateFolder = async () => {
    if (!containerId || !newFolderName.trim()) return;
    
    try {
      setIsCreatingFolder(true);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }
      
      await sharePointService.createFolder(
        token,
        containerId,
        currentFolder || 'root',
        newFolderName.trim()
      );
      
      toast({
        title: "Success",
        description: `Folder "${newFolderName}" created successfully`,
      });
      
      setNewFolderName('');
      setIsFolderDialogOpen(false);
      
      refreshFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

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

  // Handle resize event from the resizable panel
  const handleResize = (sizes: number[]) => {
    if (sizes.length > 0) {
      setCopilotSize(sizes[1]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <ConfigAlert />
          
          {containerDetails && (
            <div className="text-sm text-muted-foreground mt-2">
              <span>Connected to:</span> <a href={containerDetails.webUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{containerDetails.name}</a>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsFolderDialogOpen(true)}
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </Button>
          
          <Button className="gap-2" asChild>
            <label>
              <Upload size={16} />
              <span>Upload Files</span>
              <input 
                type="file" 
                multiple 
                className="sr-only" 
                onChange={handleFileUpload}
                disabled={isUploading} 
              />
            </label>
          </Button>
          
          {/* Copilot Chat Button */}
          {containerId && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsCopilotOpen(true)}
            >
              <MessageSquare size={16} />
              <span>Copilot</span>
            </Button>
          )}
        </div>
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
      
      {isUploading && Object.keys(uploadProgress).length > 0 && (
        <FileUploadProgress 
          files={Object.entries(uploadProgress).map(([name, progress]) => ({ name, progress }))} 
        />
      )}

      {/* Main content with resizable panels */}
      <div className={`${isCopilotOpen ? 'flex flex-row h-[calc(100vh-250px)]' : ''}`}>
        <div className={`${isCopilotOpen ? 'flex-1 overflow-auto pr-4' : ''}`}>
          <FileList 
            files={getSortedItems()}
            loading={loading}
            onFolderClick={(item) => handleFolderClick(item.id, item.name)}
            onFileClick={handleViewFile}
            onViewFile={handleViewFile}
            onDeleteFile={handleDeleteFile}
            containerId={containerId || ''}
          />
        </div>
        
        {/* Copilot Chat Panel - Directly integrated (not in a Sheet) */}
        {containerId && isCopilotOpen && (
          <div className="flex flex-col border-l bg-background overflow-hidden" style={{ width: `${copilotSize}%` }}>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">SharePoint AI Copilot</h2>
                <p className="text-sm text-muted-foreground">
                  {containerDetails?.name || 'AI Assistant'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCopilotOpen(false)}
              >
                Close
              </Button>
            </div>
            
            <ResizablePanelGroup direction="horizontal" onLayout={handleResize} className="h-full">
              <ResizablePanel defaultSize={0} />
              <ResizableHandle withHandle className="bg-muted hover:bg-muted-foreground/20 transition-colors" />
              <ResizablePanel defaultSize={100} className="h-full">
                {containerId && (
                  <div className="h-full">
                    <CopilotChat containerId={containerId} className="h-full" />
                  </div>
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>
      
      <FilePreviewDialog
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        previewUrl={previewUrl}
        previewLoading={previewLoading}
      />
      
      {/* Folder creation Sheet */}
      <Sheet open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Folder</SheetTitle>
            <SheetDescription>
              Enter a name for your new folder
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input 
                id="folderName" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button 
              onClick={handleCreateFolder} 
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? "Creating..." : "Create Folder"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Files;
