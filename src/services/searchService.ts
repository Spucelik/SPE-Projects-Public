import { appConfig } from '../config/appConfig';
import { FileItem } from './sharePointService';

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
}

export class SearchService {
  async searchFiles(
    token: string,
    searchTerm: string,
    containerId?: string
  ): Promise<SearchResult[]> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl.replace('/v1.0', '/beta')}/search/query`;
      
      // Build query string based on whether containerId is available
      let queryString = `'${searchTerm}'`;
      if (containerId) {
        queryString += ` AND ContainerID:${containerId}`;
      }
      
      const requestBody = {
        requests: [
          {
            entityTypes: ["driveItem"],
            query: {
              queryString
            },
            fields: [
              "Title",
              "Path",
              "CreatedBy",
              "Created",
              "ModifiedBy", 
              "Modified",
              "lastModifiedDateTime",
              "summary",
              "preview",
              "driveId",
              "itemId",
              "name",
              "filename",
              "parentReference",
              "webUrl"
            ],
            sharePointOneDriveOptions: {
              includeHiddenContent: true
            },
            sortProperties: [
              {
                name: "name",
                isDescending: false
              }
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
          if (resource) {
            // Extract properties from the resource
            let title = 'Untitled';
            let createdBy = 'Unknown';
            let createdDateTime = '';
            let preview = '';
            let driveId = '';
            let itemId = '';
            
            // More comprehensive title extraction - try multiple possible fields
            title = resource.name || 
                   resource.Title || 
                   resource.title || 
                   resource.filename || 
                   resource.displayName ||
                   hit.hitId ||
                   'Untitled';
            
            console.log('Extracted title from resource:', {
              name: resource.name,
              Title: resource.Title,
              title: resource.title,
              filename: resource.filename,
              displayName: resource.displayName,
              finalTitle: title
            });
            
            // Extract preview/summary from the hit
            preview = hit.summary || resource.preview || resource.description || '';
            
            // Extract created info
            if (resource.createdBy && resource.createdBy.user && resource.createdBy.user.displayName) {
              createdBy = resource.createdBy.user.displayName;
            } else if (resource.CreatedBy) {
              createdBy = resource.CreatedBy;
            } else if (resource.author) {
              createdBy = resource.author;
            }
            
            // Extract creation date
            createdDateTime = resource.Created || 
                            resource.createdDateTime || 
                            resource.lastModifiedDateTime || 
                            resource.modified ||
                            '';
            
            // Fix: Extract IDs properly from the resource itself, not from hitId
            // The resource should contain the actual driveId and id
            driveId = resource.driveId || resource.parentReference?.driveId || '';
            itemId = resource.id || resource.itemId || '';
            
            // If we still don't have proper IDs, try to extract from webUrl or other sources
            if (!driveId && resource.webUrl) {
              // Try to extract driveId from webUrl pattern
              const webUrlMatch = resource.webUrl.match(/\/drives\/([^\/]+)\//);
              if (webUrlMatch) {
                driveId = webUrlMatch[1];
              }
            }
            
            // If we still don't have itemId, try to extract from webUrl
            if (!itemId && resource.webUrl) {
              const itemMatch = resource.webUrl.match(/\/items\/([^\/\?]+)/);
              if (itemMatch) {
                itemId = itemMatch[1];
              }
            }
            
            console.log('Final processed result with corrected IDs:', {
              title,
              createdBy,
              createdDateTime,
              driveId,
              itemId,
              hitId: hit.hitId,
              resourceId: resource.id,
              resourceDriveId: resource.driveId,
              parentReference: resource.parentReference,
              webUrl: resource.webUrl
            });
            
            // Only add results that have both driveId and itemId
            if (driveId && itemId) {
              searchResults.push({
                id: itemId,
                title: title,
                createdBy: createdBy,
                createdDateTime: createdDateTime,
                preview: preview,
                driveId: driveId,
                itemId: itemId,
                webUrl: resource.webUrl
              });
            } else {
              console.warn('Skipping result due to missing IDs:', { 
                driveId, 
                itemId, 
                hit,
                resourceKeys: Object.keys(resource),
                resourceDriveId: resource.driveId,
                resourceId: resource.id,
                parentReference: resource.parentReference
              });
            }
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
      driveId: result.driveId // Now this is allowed by SearchFileItem interface
    };
  }
}

export const searchService = new SearchService();
