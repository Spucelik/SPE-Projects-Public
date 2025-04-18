// Define our own FileItem interface
export interface FileItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  isFolder: boolean;
}

// Define our Container interface
export interface Container {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

import { appConfig } from '../config/appConfig';

class SharePointService {
  // List containers
  async listContainers(token: string): Promise<Container[]> {
    try {
      // API endpoint for SharePoint Embedded containers
      const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.fileStorage}${appConfig.endpoints.containers}?$select=id,displayName,description,containerTypeId,createdDateTime&$filter=containerTypeId eq ${appConfig.containerTypeId}`;
      
      console.log('Listing containers with URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to list containers: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.value;
    } catch (error) {
      console.error('List containers error details:', error);
      throw error;
    }
  }
  
  // Get a specific container
  async getContainer(token: string, containerId: string): Promise<Container> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.fileStorage}${appConfig.endpoints.containers}/${containerId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get container: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  // Create a container
  async createContainer(token: string, displayName: string, description: string = ''): Promise<Container> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.fileStorage}${appConfig.endpoints.containers}`;
    
    const body = {
      displayName,
      description,
      containerTypeId: appConfig.containerTypeId
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating container:', errorText);
      throw new Error(`Failed to create container: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  }
  
  // List files in a container/folder
  async listFiles(token: string, containerId: string, folderId: string = 'root'): Promise<FileItem[]> {
    const folderPath = folderId === 'root' ? 'root' : folderId;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${containerId}/items/${folderPath}/children?$expand=listItem($expand=fields)`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value.map((item: any) => ({
      ...item,
      isFolder: !!item.folder
    }));
  }
  
  // Upload a file
  async uploadFile(token: string, driveId: string, folderId: string, file: File): Promise<FileItem> {
    const folderPath = folderId === 'root' ? 'root:' : `${folderId}:`;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${folderPath}/${file.name}:/content`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      ...data,
      isFolder: false
    };
  }

  // Create a new folder
  async createFolder(token: string, driveId: string, parentFolderId: string, folderName: string): Promise<FileItem> {
    const folderPath = parentFolderId === 'root' ? 'root' : parentFolderId;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${folderPath}/children`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        folder: {}
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating folder:', errorText);
      throw new Error(`Failed to create folder: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      ...data,
      isFolder: true
    };
  }

  // Get preview URL for a file
  async getFilePreview(token: string, driveId: string, fileId: string): Promise<string> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${fileId}/preview`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get preview: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.getUrl + "&nb=true"; // Add nb=true parameter as specified
  }

  // Delete a file
  async deleteFile(token: string, driveId: string, fileId: string): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${fileId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error deleting file:', errorText);
      throw new Error(`Failed to delete file: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }
}

export const sharePointService = new SharePointService();
