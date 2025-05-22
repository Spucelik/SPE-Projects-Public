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
}

export class SearchService {
  async searchFiles(
    token: string,
    searchTerm: string,
    containerId?: string
  ): Promise<SearchResult[]> {
    try {
      const url = `${appConfig.endpoints.graphBaseUrl}/search/query`;
      
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
          // Extract and log the hit to see its structure
          console.log('Processing hit:', hit);
          
          const resource = hit.resource;
          if (resource) {
            // Extract properties from the listItem fields if available
            let title = 'Untitled';
            let createdBy = 'Unknown';
            let createdDateTime = '';
            let preview = '';
            let driveId = '';
            let itemId = '';
            let webUrl = '';
            
            // Extract title
            if (resource.listItem && resource.listItem.fields && resource.listItem.fields.title) {
              title = resource.listItem.fields.title;
            } else {
              title = resource.Title || resource.name || resource.title || 'Untitled';
            }
            
            // Extract preview/summary from the hit
            preview = hit.summary || '';
            if (!preview && resource.listItem && resource.listItem.fields && resource.listItem.fields.preview) {
              preview = resource.listItem.fields.preview;
            }
            
            // Extract created info
            if (resource.listItem && resource.listItem.fields && resource.listItem.fields.createdBy) {
              createdBy = resource.listItem.fields.createdBy;
            } else if (resource.createdBy && resource.createdBy.user && resource.createdBy.user.displayName) {
              createdBy = resource.createdBy.user.displayName;
            } else if (resource.CreatedBy) {
              createdBy = resource.CreatedBy;
            }
            
            // Extract creation date
            if (resource.listItem && resource.listItem.fields && resource.listItem.fields.created) {
              createdDateTime = resource.listItem.fields.created;
            } else {
              createdDateTime = resource.Created || resource.createdDateTime || '';
            }
            
            // Extract IDs
            if (resource.listItem && resource.listItem.fields && resource.listItem.fields.driveId) {
              driveId = resource.listItem.fields.driveId;
            } else {
              driveId = resource.driveId || '';
            }
            
            if (resource.listItem && resource.listItem.id) {
              itemId = resource.listItem.id;
            } else {
              itemId = resource.itemId || resource.id || '';
            }
            
            // Extract webUrl more carefully - log it for debugging
            if (resource.webUrl) {
              webUrl = resource.webUrl;
              console.log(`Found webUrl directly: ${webUrl}`);
            } else if (resource.listItem && resource.listItem.fields && resource.listItem.fields.path) {
              webUrl = resource.listItem.fields.path;
              console.log(`Found webUrl in path: ${webUrl}`);
            } else if (resource.path) {
              webUrl = resource.path;
              console.log(`Found webUrl in resource.path: ${webUrl}`);
            }
            
            // Ensure the webUrl is properly formatted if it's a relative URL
            if (webUrl && !webUrl.startsWith('http')) {
              if (webUrl.startsWith('/')) {
                // Construct proper URL if it's a relative path
                const baseUrl = new URL(appConfig.endpoints.graphBaseUrl).origin;
                webUrl = `${baseUrl}${webUrl}`;
              }
            }
            
            searchResults.push({
              id: itemId,
              title: title,
              createdBy: createdBy,
              createdDateTime: createdDateTime,
              preview: preview,
              driveId: driveId,
              itemId: itemId,
              webUrl: webUrl
            });
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

  // Convert search result to file item format for preview
  convertToFileItem(result: SearchResult): FileItem {
    return {
      id: result.itemId,
      name: result.title,
      size: 0, // Size not available in search results
      lastModifiedDateTime: result.createdDateTime,
      createdDateTime: result.createdDateTime,
      webUrl: result.webUrl || '',
      isFolder: false,
      createdByName: result.createdBy
    };
  }
}

export const searchService = new SearchService();
