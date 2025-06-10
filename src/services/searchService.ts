
import { appConfig } from '../config/appConfig';
import { FileItem, sharePointService } from './sharePointService';

export interface SearchResult {
  id: string;
  title: string;
  createdBy: string;
  createdDateTime: string;
  preview: string;
  driveId: string;
  itemId: string;
  webUrl?: string;
  editUrl?: string;
  parentReference?: {
    siteId?: string;
    sharepointIds?: {
      listItemUniqueId?: string;
    };
  };
}

// Extended FileItem interface to include driveId for search results
export interface SearchFileItem extends FileItem {
  driveId?: string;
  isFolder?: boolean;
  createdByName?: string;
}

export class SearchService {
  async searchFiles(
    token: string,
    searchTerm: string,
    containerId?: string
  ): Promise<SearchResult[]> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
      
      // Build query string for searching containers by ContainerTypeId
      let queryString = '';
      if (containerId) {
        // Search within a specific container
        queryString = `'${searchTerm}' AND ContainerID:${containerId}`;
      } else {
        // Search for containers by type
        queryString = `ContainerTypeId:${appConfig.containerTypeId}`;
      }
      
      const requestBody = {
        requests: [
          {
            entityTypes: ["drive"],
            query: {
              queryString
            },
            sharePointOneDriveOptions: {
              includeHiddenContent: true
            },
            fields: [
              "name",
              "parentReference", 
              "file",
              "folder",
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
      
      console.log('Search request:', { url, body: requestBody });
      
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
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Search API response:', data);
      
      const searchResults: SearchResult[] = [];
      
      if (data.value && 
          data.value.length > 0 && 
          data.value[0].hitsContainers && 
          data.value[0].hitsContainers.length > 0) {
        
        const hits = data.value[0].hitsContainers[0].hits || [];
        
        for (const hit of hits) {
          console.log('Processing hit:', hit);
          console.log('Hit resource:', hit.resource);
          
          const resource = hit.resource;
          if (resource && resource['@odata.type'] === '#microsoft.graph.drive') {
            // Extract the drive ID from the hitId (this is the actual drive ID)
            const driveId = hit.hitId;
            
            // Get the site ID from the parentReference if available
            let displayName = 'Untitled Project';
            let siteId = '';
            
            if (resource.parentReference && resource.parentReference.siteId) {
              siteId = resource.parentReference.siteId;
              
              try {
                // Fetch the site details to get the proper display name
                console.log('Fetching site details for siteId:', siteId);
                const siteDetails = await sharePointService.getSiteDetails(token, siteId);
                displayName = siteDetails.displayName || siteDetails.name || 'Project Container';
                console.log('Retrieved display name from site details:', displayName);
              } catch (error) {
                console.warn('Failed to fetch site details for siteId:', siteId, error);
                // Fallback to the resource name
                displayName = resource.name || 'Project Container';
              }
            } else {
              // Fallback to the resource name if no site reference
              displayName = resource.name || 'Project Container';
            }
            
            // Extract created by information
            let createdBy = 'Unknown';
            if (resource.createdBy && resource.createdBy.user && resource.createdBy.user.displayName) {
              createdBy = resource.createdBy.user.displayName;
            }
            
            // Extract creation/modification date
            const createdDateTime = resource.createdDateTime || 
                                  resource.lastModifiedDateTime ||
                                  '';
            
            console.log('Extracted drive info with display name:', {
              title: displayName,
              createdBy,
              createdDateTime,
              driveId,
              siteId,
              webUrl: resource.webUrl
            });
            
            // Add the search result
            searchResults.push({
              id: driveId,
              title: displayName,
              createdBy: createdBy,
              createdDateTime: createdDateTime,
              preview: hit.summary || '',
              driveId: driveId,
              itemId: driveId, // For drives, itemId is the same as driveId
              webUrl: resource.webUrl
            });
          } else {
            console.warn('Skipping non-drive resource or missing @odata.type:', resource);
          }
        }
      }
      
      console.log('Processed search results:', searchResults);
      return searchResults;
    } catch (error) {
      console.error('Search error details:', error);
      throw error;
    }
  }

  async getFileDetails(token: string, driveId: string, itemId: string): Promise<{ webUrl: string }> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${itemId}?$expand=listItem($expand=fields)`;
      
      console.log('Fetching file details:', { url });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching file details:', errorText);
        throw new Error(`Failed to get file details: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('File details response:', data);
      
      return { 
        webUrl: data.webUrl || ''
      };
    } catch (error) {
      console.error('Error getting file details:', error);
      throw error;
    }
  }

  async getFilePreviewUrl(token: string, driveId: string, itemId: string): Promise<string> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/drives/${driveId}/items/${itemId}/preview`;
      
      console.log('Fetching file preview URL:', { url });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching file preview URL:', errorText);
        throw new Error(`Failed to get file preview URL: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('File preview URL response:', data);
      
      // Add &nb=true parameter as specified
      const previewUrl = data.getUrl + "&nb=true";
      return previewUrl;
    } catch (error) {
      console.error('Error getting file preview URL:', error);
      throw error;
    }
  }

  convertToFileItem(result: SearchResult): SearchFileItem {
    return {
      id: result.itemId,
      name: result.title,
      size: 0,
      lastModifiedDateTime: result.createdDateTime,
      createdDateTime: result.createdDateTime,
      webUrl: result.webUrl || '',
      isFolder: false,
      createdByName: result.createdBy,
      driveId: result.driveId,
      eTag: '',
      folder: undefined,
      file: {
        mimeType: 'application/octet-stream',
        hashes: {
          quickXorHash: '',
          sha1Hash: ''
        }
      }
    };
  }
}

export const searchService = new SearchService();
