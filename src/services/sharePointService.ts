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
  // List containers using enumeration API (updated method)
  async listContainers(token: string): Promise<Container[]> {
    try {
      // Use the enumeration API endpoint with proper filtering
      const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.fileStorage}${appConfig.endpoints.containers}?$select=id,displayName,description,containerTypeId,createdDateTime&$filter=containerTypeId eq ${appConfig.containerTypeId}`;
      
      console.log('Listing containers with enumeration URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from enumeration API:', errorText);
        throw new Error(`Failed to list containers using enumeration: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Enumeration API response:', data);
      
      // Return the containers directly from the value array
      return data.value || [];
    } catch (error) {
      console.error('List containers using enumeration error details:', error);
      throw error;
    }
  }

  // Enhanced search method with multiple query approaches
  async listContainersUsingSearch(token: string): Promise<Container[]> {
    try {
      console.log('Starting comprehensive container search...');
      console.log('Container Type ID:', appConfig.containerTypeId);
      
      // Try multiple search approaches to catch all containers
      const searchApproaches = [
        // Approach 1: Search by container type ID
        {
          name: 'ContainerTypeId Search',
          query: `ContainerTypeId:${appConfig.containerTypeId}`
        },
        // Approach 2: Search for all drives and filter later
        {
          name: 'All Drives Search',
          query: '*'
        },
        // Approach 3: Search by partial container type if it's a GUID
        {
          name: 'Partial ContainerType Search',
          query: appConfig.containerTypeId.includes('-') ? 
            `ContainerTypeId:${appConfig.containerTypeId.split('-')[0]}*` : 
            `ContainerTypeId:${appConfig.containerTypeId.substring(0, 8)}*`
        }
      ];

      let allContainers: Container[] = [];
      const seenIds = new Set<string>();

      for (const approach of searchApproaches) {
        try {
          console.log(`Trying search approach: ${approach.name} with query: ${approach.query}`);
          
          const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
          const requestBody = {
            requests: [
              {
                entityTypes: ["drive"],
                query: {
                  queryString: approach.query
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
                ],
                size: 100 // Increase the search result size
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
          
          if (response.ok) {
            const data = await response.json();
            console.log(`${approach.name} response:`, data);
            
            if (data.value && data.value.length > 0 && data.value[0].hitsContainers && data.value[0].hitsContainers.length > 0) {
              const hits = data.value[0].hitsContainers[0].hits || [];
              console.log(`${approach.name} found ${hits.length} hits`);
              
              for (const hit of hits) {
                const resource = hit.resource;
                if (resource && resource.id && !seenIds.has(resource.id)) {
                  // For the "All Drives" approach, we need to filter by container type
                  if (approach.name === 'All Drives Search') {
                    // Skip this container if we can't verify it's the right type
                    // We'll rely on the other approaches for this
                    continue;
                  }
                  
                  seenIds.add(resource.id);
                  allContainers.push({
                    id: resource.id,
                    displayName: resource.name || 'Untitled Container',
                    description: hit.summary || '',
                    containerTypeId: appConfig.containerTypeId,
                    createdDateTime: resource.createdDateTime || new Date().toISOString(),
                    webUrl: resource.webUrl || ''
                  });
                }
              }
            } else {
              console.log(`${approach.name} returned no hits`);
            }
          } else {
            console.error(`${approach.name} failed:`, await response.text());
          }
        } catch (error) {
          console.error(`Error in ${approach.name}:`, error);
          // Continue with other approaches
        }
      }

      console.log(`Total unique containers found: ${allContainers.length}`);
      console.log('Container IDs found:', allContainers.map(c => c.id));
      
      return allContainers;
    } catch (error) {
      console.error('Enhanced search error:', error);
      // Fall back to a basic search if all else fails
      return this.basicSearch(token);
    }
  }

  // Fallback basic search method
  private async basicSearch(token: string): Promise<Container[]> {
    try {
      console.log('Falling back to basic search...');
      
      const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
      const requestBody = {
        requests: [
          {
            entityTypes: ["drive"],
            query: {
              queryString: "*"
            },
            sharePointOneDriveOptions: {
              includeHiddenContent: true
            },
            size: 50
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
        throw new Error(`Basic search failed: ${response.status}`);
      }
      
      const data = await response.json();
      const containers: Container[] = [];
      
      if (data.value && data.value.length > 0 && data.value[0].hitsContainers && data.value[0].hitsContainers.length > 0) {
        const hits = data.value[0].hitsContainers[0].hits || [];
        
        for (const hit of hits) {
          const resource = hit.resource;
          if (resource) {
            containers.push({
              id: resource.id || '',
              displayName: resource.name || 'Container',
              description: hit.summary || '',
              containerTypeId: appConfig.containerTypeId,
              createdDateTime: resource.createdDateTime || new Date().toISOString(),
              webUrl: resource.webUrl || ''
            });
          }
        }
      }
      
      console.log(`Basic search found ${containers.length} containers`);
      return containers;
    } catch (error) {
      console.error('Basic search also failed:', error);
      return [];
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
    
    console.log('Creating container with URL:', url);
    console.log('Request body:', body);
    
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

  // Create a new Office file
  async createOfficeFile(
    token: string, 
    driveId: string, 
    parentFolderId: string, 
    fileName: string, 
    fileType: 'word' | 'excel' | 'powerpoint'
  ): Promise<FileItem> {
    const folderPath = parentFolderId === 'root' ? 'root' : `items/${parentFolderId}`;
    
    // Define file extensions and MIME types for each Office file type
    const fileConfig = {
      word: { 
        extension: '.docx', 
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      },
      excel: { 
        extension: '.xlsx', 
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      },
      powerpoint: { 
        extension: '.pptx', 
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
      }
    };
    
    const config = fileConfig[fileType];
    const fullFileName = fileName.endsWith(config.extension) ? fileName : `${fileName}${config.extension}`;
    
    // Create an empty file first
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/${folderPath}/children`;
    
    console.log('Creating Office file with URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: fullFileName,
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating Office file:', errorText);
      throw new Error(`Failed to create Office file: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      ...data,
      isFolder: false
    };
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
