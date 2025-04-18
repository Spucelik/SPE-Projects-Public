
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharePointService, FileItem, Container } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';
import {
  Folder,
  File,
  Upload,
  ChevronRight,
  Home,
  ExternalLink,
  AlertCircle,
  Eye,
  Edit,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

        // Fetch container details
        const containerData = await sharePointService.getContainer(token, containerId);
        setContainer(containerData);

        // Reset breadcrumbs when container changes
        setBreadcrumbs([{ id: 'root', name: containerData.displayName }]);

        // Fetch files
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

      // Refresh file list
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
    // For Office documents, open in Office Online
    if (file.name.match(/\.(docx|xlsx|pptx|doc|xls|ppt)$/i)) {
      window.open(file.webUrl, '_blank');
      return;
    }

    // For other files, get preview URL
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

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (fileName.match(/\.(pdf)$/i)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (fileName.match(/\.(docx|doc)$/i)) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (fileName.match(/\.(xlsx|xls)$/i)) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (fileName.match(/\.(pptx|ppt)$/i)) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to containers if no containerId
  if (!containerId) {
    return <Navigate to="/containers" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <Link to="/containers" className="hover:text-blue-600">
              Containers
            </Link>
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.id}>
                <ChevronRight className="h-4 w-4 mx-1" />
                <button
                  onClick={() => handleBreadcrumbClick(item, index)}
                  className={`hover:text-blue-600 ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-700' : ''}`}
                >
                  {item.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{container?.displayName || 'Files'}</h1>
        </div>
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

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    {file.isFolder ? (
                      <button
                        onClick={() => handleFolderClick(file)}
                        className="flex items-center text-left hover:text-blue-600"
                      >
                        <Folder className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="font-medium">{file.name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFileClick(file)}
                        className="flex items-center text-left hover:text-blue-600"
                      >
                        {getFileIcon(file.name)}
                        <span className="ml-2">{file.name}</span>
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    {file.isFolder ? (
                      <span className="text-sm text-gray-500">
                        {file.folder?.childCount} {file.folder?.childCount === 1 ? 'item' : 'items'}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">{getFileSize(file.size)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDate(file.lastModifiedDateTime)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!file.isFolder && (
                      <div className="flex items-center space-x-2">
                        {file.name.match(/\.(docx|xlsx|pptx|doc|xls|ppt)$/i) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.webUrl, '_blank')}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileClick(file)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-12 text-center bg-white">
          <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
          <p className="text-gray-500 mb-4">Upload files to get started</p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      )}

      {/* File Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col min-h-0">
            {previewLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : previewUrl ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
                <div className="flex-1 min-h-0 border rounded">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="File Preview"
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Preview not available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Files;
