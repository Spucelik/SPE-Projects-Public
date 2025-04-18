import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharePointService, FileItem, Container } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Home, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import FileList from '@/components/files/FileList';
import EmptyState from '@/components/files/EmptyState';
import FilePreviewDialog from '@/components/files/FilePreviewDialog';
import FileUploadProgress from '@/components/files/FileUploadProgress';

interface BreadcrumbItem {
  id: string;
  name: string;
}

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const { isAuthenticated, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !containerId) return;

    const fetchContainerAndFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError("Failed to get access token");
          return;
        }

        const containerData = await sharePointService.getContainer(token, containerId);
        setContainer(containerData);

        setBreadcrumbs([{ id: 'root', name: containerData.displayName }]);

        const filesData = await sharePointService.listFiles(token, containerId, currentFolder);
        setFiles(filesData);
      } catch (error: any) {
        console.error('Error fetching files:', error);
        setError(error.message || "Failed to fetch files");
        toast({
          title: "Error",
          description: "Failed to fetch files. Please check console for details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContainerAndFiles();
  }, [isAuthenticated, getAccessToken, containerId, currentFolder]);

  const handleFolderClick = (folder: FileItem) => {
    setCurrentFolder(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    setCurrentFolder(item.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !containerId) return;

    setUploading(true);
    setUploadProgress(0);

    const token = await getAccessToken();
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Failed to get access token",
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    try {
      let totalFiles = files.length;
      let completedFiles = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await sharePointService.uploadFile(token, containerId, currentFolder, file);
        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }

      const updatedFiles = await sharePointService.listFiles(token, containerId, currentFolder);
      setFiles(updatedFiles);

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.name.match(/\.(docx|xlsx|pptx|doc|xls|ppt)$/i)) {
      window.open(file.webUrl, '_blank');
      return;
    }

    try {
      setPreviewLoading(true);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }

      const url = await sharePointService.getFilePreview(token, containerId!, file.id);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error: any) {
      console.error('Error getting preview:', error);
      toast({
        title: "Preview Error",
        description: error.message || "Failed to get file preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleViewFile = async (file: FileItem) => {
    if (file.isFolder) return;
    
    try {
      setPreviewLoading(true);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }

      const url = await sharePointService.getFilePreview(token, containerId!, file.id);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (error: any) {
      console.error('Error getting preview:', error);
      toast({
        title: "Preview Error",
        description: error.message || "Failed to get file preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!containerId) {
    return <Navigate to="/containers" replace />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-1 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/containers">Containers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{item.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      onClick={() => handleBreadcrumbClick(item, index)}
                      className="cursor-pointer"
                    >
                      {item.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{container?.displayName || 'Files'}</h1>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      <FileUploadProgress uploading={uploading} progress={uploadProgress} />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : files.length > 0 ? (
          <FileList
            files={files}
            onFolderClick={handleFolderClick}
            onFileClick={handleFileClick}
            onViewFile={handleViewFile}
          />
        ) : (
          <EmptyState onUploadClick={() => fileInputRef.current?.click()} />
        )}
      </div>

      <FilePreviewDialog
        isOpen={previewOpen}
        onOpenChange={setPreviewOpen}
        previewUrl={previewUrl}
        previewLoading={previewLoading}
      />
    </div>
  );
};

export default Files;
