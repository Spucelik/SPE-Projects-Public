import { appConfig } from "../config/appConfig";

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
    isFolder?: boolean; // Add this computed property
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
    private readonly graphBaseUrl: string = appConfig.endpoints.graphBaseUrl;
    private readonly containerTypeId: string = appConfig.containerTypeId;

    // Helper function to enhance FileItem with isFolder property
    private enhanceFileItem(item: any): FileItem {
        return {
            ...item,
            isFolder: !!item.folder,
            createdByName: item.createdBy?.user?.displayName || 'Unknown',
            childCount: item.folder?.childCount || 0
        };
    }

    // Helper to determine the correct API endpoint based on container ID format
    private getApiEndpoint(containerId: string, path: string): string {
        // If container ID contains commas, it's a SharePoint site ID format
        if (containerId.includes(',')) {
            // For SharePoint site IDs, use the sites endpoint
            return `${this.graphBaseUrl}/sites/${containerId}${path}`;
        } else {
            // For container IDs, use the containers endpoint
            return `${this.graphBaseUrl}/containers/${containerId}${path}`;
        }
    }

    async listFiles(accessToken: string, containerId: string, folderId: string = ''): Promise<FileItem[]> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            let url: string;
            
            if (containerId.includes(',')) {
                // SharePoint site ID format - use sites endpoint
                if (folderId) {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/items/${folderId}/children`;
                } else {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/root/children`;
                }
            } else {
                // Container ID format - use containers endpoint
                if (folderId) {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${folderId}/children`;
                } else {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/root/children`;
                }
            }

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

            return (data.value || []).map((item: any) => this.enhanceFileItem(item));
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
            const url = this.getApiEndpoint(containerId, `/drive/items/${fileId}`);
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

    async uploadFile(accessToken: string, containerId: string, folderId: string, file: File, onProgress?: (progress: number) => void): Promise<FileItem> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': file.type || 'application/octet-stream'
        };

        try {
            let url: string;
            
            if (containerId.includes(',')) {
                // SharePoint site ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/items/${folderId}:/${file.name}:/content`;
                } else {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/root:/${file.name}:/content`;
                }
            } else {
                // Container ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${folderId}:/${file.name}:/content`;
                } else {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/root:/${file.name}:/content`;
                }
            }
            
            console.log(`Uploading file to URL: ${url}`);

            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: file
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('File uploaded successfully:', data);
            return this.enhanceFileItem(data);
        } catch (error: any) {
            console.error('Error in uploadFile:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async createFolder(accessToken: string, containerId: string, folderId: string, folderName: string): Promise<FileItem> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            let url: string;
            
            if (containerId.includes(',')) {
                // SharePoint site ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/items/${folderId}/children`;
                } else {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/root/children`;
                }
            } else {
                // Container ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${folderId}/children`;
                } else {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/root/children`;
                }
            }
            
            console.log(`Creating folder at URL: ${url}`);

            const requestBody = JSON.stringify({
                name: folderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: requestBody
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Folder created successfully:', data);
            return this.enhanceFileItem(data);
        } catch (error: any) {
            console.error('Error in createFolder:', error);
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }

    async createOfficeFile(accessToken: string, containerId: string, folderId: string, fileName: string, fileType: 'word' | 'excel' | 'powerpoint'): Promise<FileItem> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            // Add extension based on file type
            const extensions = {
                'word': '.docx',
                'excel': '.xlsx', 
                'powerpoint': '.pptx'
            };
            
            const fullFileName = fileName + extensions[fileType];
            
            let url: string;
            
            if (containerId.includes(',')) {
                // SharePoint site ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/items/${folderId}:/${fullFileName}:/content`;
                } else {
                    url = `${this.graphBaseUrl}/sites/${containerId}/drive/root:/${fullFileName}:/content`;
                }
            } else {
                // Container ID format
                if (folderId && folderId !== 'root') {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/items/${folderId}:/${fullFileName}:/content`;
                } else {
                    url = `${this.graphBaseUrl}/containers/${containerId}/drive/root:/${fullFileName}:/content`;
                }
            }
            
            console.log(`Creating Office file at URL: ${url}`);

            // Create empty content based on file type
            let content = '';
            let contentType = 'application/octet-stream';
            
            if (fileType === 'word') {
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (fileType === 'excel') {
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            } else if (fileType === 'powerpoint') {
                contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': contentType
                },
                body: new Blob([content], { type: contentType })
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to create Office file: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Office file created successfully:', data);
            return this.enhanceFileItem(data);
        } catch (error: any) {
            console.error('Error in createOfficeFile:', error);
            throw new Error(`Failed to create Office file: ${error.message}`);
        }
    }

    async getFilePreview(accessToken: string, containerId: string, fileId: string): Promise<string> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        };

        try {
            const url = this.getApiEndpoint(containerId, `/drive/items/${fileId}/preview`);
            console.log(`Getting file preview from URL: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: headers
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to get file preview: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('File preview data:', data);
            return data.getUrl || data.previewUrl || '';
        } catch (error: any) {
            console.error('Error in getFilePreview:', error);
            throw new Error(`Failed to get file preview: ${error.message}`);
        }
    }

    async shareFile(accessToken: string, containerId: string, fileId: string, recipients: string[], role: 'read' | 'write', message?: string): Promise<string> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            const url = this.getApiEndpoint(containerId, `/drive/items/${fileId}/invite`);
            console.log(`Sharing file at URL: ${url}`);

            const requestBody = JSON.stringify({
                recipients: recipients.map(email => ({ email })),
                message: message || '',
                requireSignIn: true,
                sendInvitation: true,
                roles: [role === 'read' ? 'read' : 'write']
            });

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: requestBody
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                const errorText = await response.text();
                console.error('Response body:', errorText);
                throw new Error(`Failed to share file: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('File shared successfully:', data);
            return data.value?.[0]?.link?.webUrl || '';
        } catch (error: any) {
            console.error('Error in shareFile:', error);
            throw new Error(`Failed to share file: ${error.message}`);
        }
    }

    async getContainerDetails(accessToken: string, containerId: string): Promise<{ webUrl: string; name: string }> {
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        try {
            let url: string;
            
            if (containerId.includes(',')) {
                // SharePoint site ID format
                url = `${this.graphBaseUrl}/sites/${containerId}`;
            } else {
                // Container ID format
                url = `${this.graphBaseUrl}/containers/${containerId}`;
            }
            
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

            // Handle both container and site response formats
            return { 
                webUrl: data.webUrl, 
                name: data.displayName || data.name || 'Unknown'
            };
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

            // Since the containers endpoint is not working (400 errors), we'll use an alternative approach
            // Instead of validating individual containers, we'll create container objects from the search results
            const containersFromSearch: Container[] = [];
            const processedContainerIds = new Set<string>();

            for (const hit of searchResults) {
                const resource = hit._source || hit.resource;
                if (resource?.parentReference?.siteId && !processedContainerIds.has(resource.parentReference.siteId)) {
                    processedContainerIds.add(resource.parentReference.siteId);
                    
                    // Extract container info from the search result
                    const containerId = resource.parentReference.siteId;
                    const driveId = resource.parentReference.driveId;
                    
                    // Create a container object based on available information
                    const container: Container = {
                        id: containerId,
                        displayName: this.extractDisplayNameFromDriveId(driveId) || 'Unknown Project',
                        description: '',
                        containerTypeId: this.containerTypeId,
                        createdDateTime: resource.createdDateTime || new Date().toISOString(),
                        webUrl: resource.webUrl ? this.extractBaseUrlFromWebUrl(resource.webUrl) : undefined
                    };
                    
                    containersFromSearch.push(container);
                }
            }

            console.log(`Created ${containersFromSearch.length} container objects from search results`);
            return containersFromSearch;

        } catch (error: any) {
            console.error('Error in listContainersUsingSearch:', error);
            throw new Error(`Failed to search for containers: ${error.message}`);
        }
    }

    // Helper method to extract display name from drive ID
    private extractDisplayNameFromDriveId(driveId: string): string | null {
        try {
            // Drive IDs often contain encoded information, try to extract meaningful names
            if (driveId && driveId.includes('CSP_')) {
                // Extract the part after CSP_ which might contain project info
                const parts = driveId.split('CSP_');
                if (parts.length > 1) {
                    return `Project ${parts[1].substring(0, 8)}`;
                }
            }
            return `Project ${driveId.substring(0, 8)}`;
        } catch (error) {
            console.error('Error extracting display name from drive ID:', error);
            return null;
        }
    }

    // Helper method to extract base URL from web URL
    private extractBaseUrlFromWebUrl(webUrl: string): string {
        try {
            const url = new URL(webUrl);
            // Extract the base container URL without the specific file path
            const pathParts = url.pathname.split('/');
            const containerIndex = pathParts.findIndex(part => part.includes('CSP_'));
            if (containerIndex > 0) {
                const basePath = pathParts.slice(0, containerIndex + 1).join('/');
                return `${url.protocol}//${url.host}${basePath}`;
            }
            return `${url.protocol}//${url.host}`;
        } catch (error) {
            console.error('Error extracting base URL:', error);
            return webUrl;
        }
    }
}

export const sharePointService = new SharePointService();

}
