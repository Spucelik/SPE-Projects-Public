
import React from 'react';
import { Eye, Edit, File, Folder, FileText, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileItem } from '@/services/sharePointService';

interface FileListProps {
  files: FileItem[];
  onFolderClick: (folder: FileItem) => void;
  onFileClick: (file: FileItem) => void;
  onViewFile: (file: FileItem) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFolderClick,
  onFileClick,
  onViewFile,
}) => {
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
    }
    return <File className="h-5 w-5 text-gray-500" />;
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

  return (
    <div className="border rounded-lg overflow-hidden h-full bg-white">
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
                    onClick={() => onFolderClick(file)}
                    className="flex items-center text-left hover:text-blue-600"
                  >
                    <Folder className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium">{file.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onFileClick(file)}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewFile(file)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    
                    {file.name.match(/\.(docx|xlsx|pptx|doc|xls|ppt)$/i) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.webUrl, '_blank')}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
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
  );
};

export default FileList;
