
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
              "itemId"
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
          const resource = hit.resource;
          if (resource) {
            searchResults.push({
              id: resource.itemId || resource.id || '',
              title: resource.Title || resource.name || 'Untitled',
              createdBy: (resource.CreatedBy && resource.CreatedBy.user && resource.CreatedBy.user.displayName) || 'Unknown',
              createdDateTime: resource.Created || resource.createdDateTime || '',
              preview: resource.preview || resource.summary || '',
              driveId: resource.driveId || '',
              itemId: resource.itemId || resource.id || '',
              webUrl: resource.webUrl || ''
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
