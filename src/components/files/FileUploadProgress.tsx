
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface FileUploadProgressProps {
  uploading: boolean;
  progress: number;
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({ uploading, progress }) => {
  if (!uploading) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default FileUploadProgress;
