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
            
            // Extract webUrl with highest priority on direct webUrl property
            if (resource.webUrl) {
              webUrl = resource.webUrl;
              console.log(`Found webUrl directly on resource: ${webUrl}`);
            } else if (resource.listItem && resource.listItem.webUrl) {
              webUrl = resource.listItem.webUrl;
              console.log(`Found webUrl on listItem: ${webUrl}`);
            } else if (resource.listItem && resource.listItem.fields && resource.listItem.fields.webUrl) {
              webUrl = resource.listItem.fields.webUrl;
              console.log(`Found webUrl in fields: ${webUrl}`);
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
                console.log(`Converted relative URL to absolute: ${webUrl}`);
              }
            }
            
            // Log out the final webUrl for debugging
            console.log(`Final webUrl for ${title}: ${webUrl}`);
            
            searchResults.push({
              id: itemId,
              title: title,
              createdBy: createdBy,
              createdDateTime: createdDateTime,
              preview: preview,
              driveId: driveId,
              itemId: itemId,
              webUrl: webUrl,
              parentReference: {
                siteId: resource.parentReference?.siteId,
                sharepointIds: {
                  listItemUniqueId: resource.parentReference?.sharepointIds?.listItemUniqueId
                }
              }
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
        webUrl: data.webUrl || data.listItem?.webUrl || data.listItem?.fields?.webUrl || ''
      };
    } catch (error) {
      console.error('Error getting file details:', error);
      throw error;
    }
  }

  // Build an edit URL for Office documents based on SharePoint site details
  buildEditUrl(result: SearchResult): string | undefined {
    try {
      if (!result.webUrl || !result.parentReference?.siteId || 
          !result.parentReference?.sharepointIds?.listItemUniqueId || !result.title) {
        console.log('Missing data to build edit URL:', result);
        return undefined;
      }
      
      // Step 1: Get hostname from siteId
      const siteIdParts = result.parentReference.siteId.split(',');
      const hostname = siteIdParts[0];
      
      // Step 2: Get site path from webUrl
      const webUrl = result.webUrl;
      const sitePath = '/' + webUrl.split('/').slice(3, 5).join('/');
      
      // Step 3: Get sourcedoc from listItemUniqueId and format it
      const rawId = result.parentReference.sharepointIds.listItemUniqueId;
      const upperId = rawId.toUpperCase();
      const sourcedoc = encodeURIComponent(`{${upperId}}`);
      
      // Step 4: Get file name
      const fileName = result.title;
      
      // Step 5: Assemble final URL
      const finalUrl = `https://${hostname}${sitePath}/_layouts/15/Doc.aspx?sourcedoc=${sourcedoc}&file=${encodeURIComponent(fileName)}&action=edit&mobileredirect=true`;
      
      console.log(`Built edit URL for ${fileName}:`, finalUrl);
      return finalUrl;
    } catch (error) {
      console.error('Error building edit URL:', error);
      return undefined;
    }
  }

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
