
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { 
  File as FileIcon, 
  Folder, 
  Upload, 
  ChevronRight, 
  AlertCircle, 
  Eye, 
  PenSquare, 
  Loader2, 
  RefreshCw, 
  Home,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';

interface FileItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  isFolder: boolean;
}

const Files = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, getAccessToken } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [container, setContainer] = useState<{ id: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<{ id: string; name: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{ [id: string]: boolean }>({});
  const [allSelected, setAllSelected] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !containerId) return;
    
    const fetchContainerInfo = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        const containerData = await sharePointService.getContainer(token, containerId);
        setContainer({
          id: containerData.id,
          displayName: containerData.displayName
        });
      } catch (error) {
        console.error('Error fetching container:', error);
        toast({
          title: "Error",
          description: "Failed to fetch container information",
          variant: "destructive",
        });
      }
    };

    fetchContainerInfo();
  }, [containerId, isAuthenticated, getAccessToken]);

  const fetchFiles = async (folderId: string = 'root') => {
    if (!isAuthenticated || !containerId) return;
    
    try {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Failed to get access token",
          variant: "destructive",
        });
        return;
      }

      const filesData = await sharePointService.listFiles(token, containerId, folderId);
      setFiles(filesData);
      setSelectedFiles({});
      setAllSelected(false);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!containerId) return;
    fetchFiles('root');
  }, [containerId, isAuthenticated]);

  const handleFolderClick = (folder: FileItem) => {
    setCurrentPath([...currentPath, { id: folder.id, name: folder.name }]);
    fetchFiles(folder.id);
  };

  const navigateToPath = (index: number) => {
    if (index === -1) {
      // Navigate to root
      setCurrentPath([]);
      fetchFiles('root');
    } else {
      // Navigate to specific folder in path
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      fetchFiles(newPath[newPath.length - 1].id);
    }
  };

  const handleFileSelect = (id: string) => {
    setSelectedFiles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedFiles({});
    } else {
      const newSelected: { [id: string]: boolean } = {};
      files.forEach(file => {
        newSelected[file.id] = true;
      });
      setSelectedFiles(newSelected);
    }
    setAllSelected(!allSelected);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const files = Array.from(event.target.files);
    setUploading(true);
    setUploadProgress(0);
    
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

      let completed = 0;
      
      for (const file of files) {
        try {
          const folderId = currentPath.length > 0 
            ? currentPath[currentPath.length - 1].id 
            : 'root';
            
          await sharePointService.uploadFile(token, containerId!, folderId, file);
          completed++;
          setUploadProgress(Math.round((completed / files.length) * 100));
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      }
      
      toast({
        title: "Upload Complete",
        description: `${completed} of ${files.length} files uploaded successfully`,
      });
      
      // Refresh file list
      const folderId = currentPath.length > 0 
        ? currentPath[currentPath.length - 1].id 
        : 'root';
      fetchFiles(folderId);
    } catch (error) {
      console.error('Error during upload:', error);
      toast({
        title: "Upload Error",
        description: "An error occurred during file upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const previewFile = async (file: FileItem) => {
    if (file.isFolder) return;

    try {
      setPreviewLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      // For Office documents, redirect to webUrl
      const isOfficeDoc = /\.(docx?|xlsx?|pptx?|vsdx?)$/i.test(file.name);
      
      if (isOfficeDoc) {
        window.open(file.webUrl, '_blank');
      } else {
        // For non-Office documents, use preview API
        const previewUrl = await sharePointService.getFilePreview(token, containerId!, file.id);
        setPreviewUrl(previewUrl);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview Error",
        description: "Failed to generate file preview",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension) return <FileIcon className="h-5 w-5 text-gray-400" />;
    
    switch (extension) {
      case 'pdf':
        return <FileIcon className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileIcon className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileIcon className="h-5 w-5 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileIcon className="h-5 w-5 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Files</h1>
          <div className="flex items-center text-sm text-gray-500 space-x-1">
            <button 
              onClick={() => navigate('/')}
              className="hover:text-blue-600 flex items-center"
            >
              <Home className="h-3 w-3 mr-1" />
              Home
            </button>
            
            {container && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button 
                  onClick={() => navigateToPath(-1)}
                  className="hover:text-blue-600"
                >
                  {container.displayName}
                </button>
              </>
            )}
            
            {currentPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <ChevronRight className="h-3 w-3" />
                <button 
                  onClick={() => navigateToPath(index)}
                  className="hover:text-blue-600"
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              const folderId = currentPath.length > 0 
                ? currentPath[currentPath.length - 1].id 
                : 'root';
              fetchFiles(folderId);
            }}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
          />
        </div>
      </div>
      
      {uploading && (
        <div className="mb-4 p-4 border rounded-md bg-blue-50">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Uploading files...</span>
            <span className="text-sm text-blue-800">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      
      {currentPath.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newPath = currentPath.slice(0, -1);
            setCurrentPath(newPath);
            const folderId = newPath.length > 0 
              ? newPath[newPath.length - 1].id 
              : 'root';
            fetchFiles(folderId);
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {currentPath.length > 1 ? currentPath[currentPath.length - 2].name : container?.displayName}
        </Button>
      )}
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : (
        <>
          {files.length > 0 ? (
            <div className="border rounded-lg overflow-hidden bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all files"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={!!selectedFiles[file.id]}
                          onCheckedChange={() => handleFileSelect(file.id)}
                          aria-label={`Select ${file.name}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {file.isFolder ? (
                            <Folder className="flex-shrink-0 h-5 w-5 text-blue-500" />
                          ) : (
                            getFileIcon(file.name)
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {file.isFolder ? (
                                <button 
                                  onClick={() => handleFolderClick(file)}
                                  className="hover:text-blue-600 hover:underline"
                                >
                                  {file.name}
                                </button>
                              ) : (
                                <span>{file.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {file.isFolder ? (
                            `${file.folder?.childCount || 0} items`
                          ) : (
                            formatFileSize(file.size)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.lastModifiedDateTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {file.isFolder ? (
                          <button
                            onClick={() => handleFolderClick(file)}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Open
                          </button>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => previewFile(file)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                              disabled={previewLoading}
                            >
                              {previewLoading ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4 mr-1" />
                              )}
                              {/\.(docx?|xlsx?|pptx?|vsdx?)$/i.test(file.name) ? "Edit" : "Preview"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center bg-white">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
              <p className="text-gray-500 mb-4">
                {currentPath.length > 0 
                  ? `This folder is empty` 
                  : `This container is empty`
                }
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          )}
        </>
      )}
      
      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white rounded-lg w-11/12 h-5/6 overflow-hidden max-w-6xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">File Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewUrl(null)}
              >
                Close
              </Button>
            </div>
            <div className="h-[calc(100%-4rem)] w-full">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="File Preview"
                allowFullScreen
              />
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
