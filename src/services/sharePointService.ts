import { graphConfig } from "../authConfig";

export interface FileItem {
    createdDateTime: string;
    eTag: string;
    id: string;
    lastModifiedDateTime: string;
    name: string;
    webUrl: string;
    size: number;
    createdBy?: {
        user?: {
            displayName?: string;
        };
    };
    lastModifiedBy?: {
        user?: {
            displayName?: string;
        };
    };
    parentReference?: {
        id: string;
        path: string;
        driveId: string;
        driveType: string;
    };
    file?: {
        mimeType: string;
        hashes: {
            quickXorHash: string;
            sha1Hash: string;
        };
    };
    folder?: {
        childCount: number;
    };
    createdByName?: string;
    childCount?: number;
}

export interface Container {
    id: string;
    displayName: string;
    description: string;
    containerTypeId: string;
    createdDateTime: string;
    webUrl?: string;
}

export class SharePointService {
    private readonly graphBaseUrl: string = graphConfig.graphEndpoint;
    private readonly containerTypeId: string = graphConfig.containerTypeId;

    async listFiles(accessToken: string, containerId: string, folderId: string = ''): Promise<FileItem[]> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            let url = `${this.graphBaseUrl}/containers/${containerId}/drive/root:`;
            if (folderId) {
                url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${folderId}:`;
            }
            url += `/children`;

            console.log(`Fetching files from URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Files data:', data);

            return data.value || [];
        } catch (error: any) {
            console.error('Error in listFiles:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    async deleteFile(accessToken: string, containerId: string, fileId: string): Promise<void> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    
        try {
            const url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${fileId}`;
            console.log(`Deleting file from URL: ${url}`);
    
            const response = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });
    
            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
            }
    
            console.log('File deleted successfully.');
        } catch (error: any) {
            console.error('Error in deleteFile:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async getContainerDetails(accessToken: string, containerId: string): Promise<{ webUrl: string; name: string }> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            const url = `${this.graphBaseUrl}/containers/${containerId}`;
            console.log(`Fetching container details from URL: ${url}`);

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to fetch container details: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Container details data:', data);

            return { webUrl: data.webUrl, name: data.displayName };
        } catch (error: any) {
            console.error('Error in getContainerDetails:', error);
            throw new Error(`Failed to get container details: ${error.message}`);
        }
    }

    async createContainer(accessToken: string, displayName: string, description: string): Promise<Container> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    
        try {
            const url = `${this.graphBaseUrl}/containers`;
            console.log(`Creating container at URL: ${url}`);
    
            const requestBody = JSON.stringify({
                displayName: displayName,
                description: description,
                containerTypeId: this.containerTypeId
            });
    
            console.log('Request body:', requestBody);
    
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: requestBody
            });
    
            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to create container: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Container creation response:', data);
    
            return data as Container;
        } catch (error: any) {
            console.error('Error in createContainer:', error);
            throw new Error(`Failed to create container: ${error.message}`);
        }
    }

    async getContainer(accessToken: string, containerId: string): Promise<Container> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    
        try {
            const url = `${this.graphBaseUrl}/containers/${containerId}`;
            console.log(`Fetching container from URL: ${url}`);
    
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
    
            if (!response.ok) {
                console.error('Response status:', response.status);
                console.error('Response headers:', response.headers);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to get container: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            console.log('Container data:', data);
    
            return data as Container;
        } catch (error: any) {
            console.error('Error in getContainer:', error);
            throw new Error(`Failed to get container: ${error.message}`);
        }
    }

  async listContainersUsingSearch(accessToken: string): Promise<Container[]> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    try {
      console.log('Starting container search...');
      
      // Search for containers by ContainerTypeId
      const searchUrl = `${this.graphBaseUrl}/search/query`;
      const searchBody = {
        requests: [{
          entityTypes: ["driveItem"],
          query: {
            queryString: `ContainerTypeId:${this.containerTypeId}`
          },
          from: 0,
          size: 500
        }]
      };

      console.log('Search request:', searchBody);
      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(searchBody)
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search response error:', errorText);
        throw new Error(`Search request failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      console.log('Search response:', searchData);

      const searchResults = searchData.value?.[0]?.hitsContainers?.[0]?.hits || [];
      console.log(`Partial ContainerType Search found ${searchResults.length} hits`);

      // Extract unique container IDs from search results
      const containerIds = new Set<string>();
      for (const hit of searchResults) {
        const resource = hit._source || hit.resource;
        if (resource?.parentReference?.siteId) {
          containerIds.add(resource.parentReference.siteId);
        }
      }

      const uniqueContainerIds = Array.from(containerIds);
      console.log('Total unique containers found:', uniqueContainerIds.length);
      console.log('Container IDs found:', uniqueContainerIds);

      // Validate each container to ensure it still exists (filter out deleted ones)
      const validContainers: Container[] = [];
      
      for (const containerId of uniqueContainerIds) {
        try {
          console.log(`Validating container ${containerId}...`);
          const container = await this.getContainer(accessToken, containerId);
          
          // If we can successfully fetch the container, it exists
          validContainers.push(container);
          console.log(`Container ${containerId} is valid`);
        } catch (error: any) {
          // If we get a 404 or similar error, the container was deleted
          console.log(`Container ${containerId} appears to be deleted:`, error.message);
          // Skip this container - it's been deleted but still in search index
        }
      }

      console.log(`Validated ${validContainers.length} existing containers out of ${uniqueContainerIds.length} found in search`);
      return validContainers;

    } catch (error: any) {
      console.error('Error in listContainersUsingSearch:', error);
      throw new Error(`Failed to search for containers: ${error.message}`);
    }
  }
}

export const sharePointService = new SharePointService();
