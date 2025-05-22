// Define our own FileItem interface
export interface FileItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  createdDateTime?: string;
  webUrl: string;
  folder?: { childCount: number };
  isFolder: boolean;
  createdBy?: {
    user?: {
      displayName?: string;
      email?: string;
    }
  };
  createdByName?: string;
  childCount?: number;
}

// Define our Container interface
export interface Container {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
  webUrl?: string;
}

import { appConfig } from '../config/appConfig';

class SharePointService {
  // List containers using Search API (new method)
  async listContainersUsingSearch(token: string): Promise<Container[]> {
    try {
      // Using the search API endpoint
      const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
      
      console.log('Listing containers with search URL:', url);
      
      // Create the search query with the containerTypeId without quotes
      const requestBody = {
        requests: [
          {
            entityTypes: ["drive"],
            query: {
              queryString: `ContainerTypeId:${appConfig.containerTypeId}`
            },
            sharePointOneDriveOptions: {
              includeHiddenContent: true
            },
            fields: [
              "id",
              "name",
              "parentReference",
              "webUrl",
              "createdDateTime",
              "lastModifiedDateTime",
              "size",
              "createdBy",
              "lastModifiedBy",
              "fileSystemInfo"
            ]
          }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from search API:', errorText);
        throw new Error(`Failed to list containers using search: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Search API response:', data);
      
      // Extract and transform the container data from the search results
      const containers: Container[] = [];
      
      if (data.value && data.value.length > 0 && data.value[0].hitsContainers && data.value[0].hitsContainers.length > 0) {
        const hits = data.value[0].hitsContainers[0].hits || [];
        
        for (const hit of hits) {
          const resource = hit.resource;
          if (resource) {
            containers.push({
              id: resource.id || '',
              displayName: resource.name || '',
              description: '',
              containerTypeId: appConfig.containerTypeId,
              createdDateTime: resource.createdDateTime || '',
              webUrl: resource.webUrl || ''
            });
          }
        }
      }
      
      console.log('Processed containers:', containers);
      return containers;
    } catch (error) {
      console.error('List containers using search error details:', error);
      throw error;
    }
  }
  
  // Original method is completely removed and replaced with a function that uses the search method
  async listContainers(token: string): Promise<Container[]> {
    // Remove the old warning since it still shows the old URL in console logs
    console.log('Using search-based method for listing containers');
    
    // Directly use the search-based method without constructing the old URL
    return await this.listContainersUsingSearch(token);
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
  
  // Get container details including the web URL for Copilot
  async getContainerDetails(token: string, containerId: string): Promise<{ webUrl: string, name: string }> {
    try {
      // First try to get the web URL directly from the drive
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}`;
      console.log('Getting container details with URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Container details retrieved:', data);
        
        if (data.webUrl) {
          // Return the web URL and name from the drive
          return {
            webUrl: data.webUrl,
            name: data.name || 'SharePoint Drive'
          };
        }
      } else {
        console.error('Error fetching drive details:', await response.text());
      }
      
      // If the direct approach failed, try to get the root item which often has the webUrl
      const rootUrl = `${appConfig.endpoints.graphBaseUrl}/drives/${containerId}/root`;
      console.log('Getting container root with URL:', rootUrl);
      
      const rootResponse = await fetch(rootUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (rootResponse.ok) {
        const rootData = await rootResponse.json();
        console.log('Container root retrieved:', rootData);
        
        if (rootData.webUrl) {
          // Return the web URL from the root and a default name
          return {
            webUrl: rootData.webUrl,
            name: rootData.name || 'SharePoint Root'
          };
        }
      } else {
        console.error('Error fetching root item:', await rootResponse.text());
      }
      
      // As a last resort, fall back to a generic format
      // Parse container ID to try to extract meaningful parts
      let parsedId = containerId;
      if (containerId.startsWith('b!')) {
        parsedId = containerId.substring(2);
      }
      
      // If we couldn't get a valid webUrl from the API, construct a basic one
      return {
        webUrl: `${appConfig.sharePointHostname}/sites/shared-${parsedId.substring(0, 8)}`,
        name: 'SharePoint Container'
      };
    } catch (error) {
      console.error('Error getting container details:', error);
      // Return a basic fallback
      return {
        webUrl: `${appConfig.sharePointHostname}`,
        name: 'SharePoint'
      };
    }
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
  async listFiles(token: string, containerId: string, folderId: string = ''): Promise<FileItem[]> {
    // Fix: Properly handle the path construction to avoid double slashes
    let url;
    
    if (!folderId || folderId === '') {
      // If no folder ID is provided, use the root endpoint
      url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${containerId}/root/children?$expand=listItem($expand=fields)`;
    } else if (folderId === 'root') {
      // If 'root' is specified, use the root endpoint
      url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${containerId}/root/children?$expand=listItem($expand=fields)`;
    } else {
      // Normal folder ID
      url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${containerId}/items/${folderId}/children?$expand=listItem($expand=fields)`;
    }
    
    console.log('Fetching files with URL:', url);
    
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
      isFolder: !!item.folder,
      childCount: item.folder?.childCount || 0,
      createdByName: item.createdBy?.user?.displayName || 'Unknown'
    }));
  }
  
  // Upload a file with progress tracking
  async uploadFile(
    token: string, 
    driveId: string, 
    folderId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileItem> {
    const folderPath = folderId === 'root' ? 'root:' : `items/${folderId}:`;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/${folderPath}/${file.name}:/content`;
    
    console.log('Uploading file to URL:', url);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              ...data,
              isFolder: false
            });
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload'));
      };
      
      xhr.send(file);
    });
  }

  // Create a new folder
  async createFolder(token: string, driveId: string, parentFolderId: string, folderName: string): Promise<FileItem> {
    const folderPath = parentFolderId === 'root' ? 'root' : `items/${parentFolderId}`;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/${folderPath}/children`;
    
    console.log('Creating folder with URL:', url);
    
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

  // Share a file with other users
  async shareFile(
    token: string,
    driveId: string, 
    fileId: string,
    recipients: string[],
    role: 'read' | 'write',
    message?: string
  ): Promise<void> {
    const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${fileId}/invite`;
    
    // Convert role to SharePoint permission
    const sharePointRole = role === 'read' ? 'read' : 'write';
    
    // Format recipients
    const formattedRecipients = recipients.map(email => ({ email }));
    
    const body = {
      requireSignIn: false,
      sendInvitation: true,
      roles: [sharePointRole],
      recipients: formattedRecipients,
      message: message || ''
    };
    
    console.log('Sharing file with:', { url, body });
    
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
      console.error('Error sharing file:', errorText);
      throw new Error(`Failed to share file: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  }
}

export const sharePointService = new SharePointService();
