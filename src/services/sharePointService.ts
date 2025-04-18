
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
      // Based on the error, we need to use a different endpoint structure
      const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers`;
      
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
    const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}`;
    
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
    const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers`;
    
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
    let url;
    if (folderId === 'root') {
      url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}/drive/root/children`;
    } else {
      url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}/drive/items/${folderId}/children`;
    }
    
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
  async uploadFile(token: string, containerId: string, folderId: string, file: File): Promise<FileItem> {
    let url;
    if (folderId === 'root') {
      url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}/drive/root:/${file.name}:/content`;
    } else {
      url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}/drive/items/${folderId}:/${file.name}:/content`;
    }
    
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

  // Get preview URL for a file
  async getFilePreview(token: string, containerId: string, fileId: string): Promise<string> {
    const url = `${appConfig.endpoints.graphBaseUrl}/storage/fileStorage/containers/${containerId}/drive/items/${fileId}/preview`;
    
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
    return data.getUrl;
  }
}

export const sharePointService = new SharePointService();
