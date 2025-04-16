
import { appConfig } from '../config/appConfig';

interface Container {
  id: string;
  displayName: string;
  description: string;
  containerTypeId: string;
  createdDateTime: string;
}

interface File {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  webUrl: string;
  folder?: { childCount: number };
  isFolder: boolean;
}

class SharePointService {
  private async getHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Container operations
  async createContainer(accessToken: string, displayName: string, description: string = ""): Promise<Container> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.containers}`;
    const body = {
      displayName,
      description,
      containerTypeId: appConfig.containerTypeId
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(accessToken),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to create container: ${response.statusText}`);
    }

    return await response.json();
  }

  async listContainers(accessToken: string): Promise<Container[]> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.containers}?$select=id,displayName,description,containerTypeId,createdDateTime&$filter=containerTypeId eq ${appConfig.containerTypeId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to list containers: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value;
  }

  async getContainer(accessToken: string, containerId: string): Promise<Container> {
    const url = `${appConfig.endpoints.graphBaseUrl}/beta/storage/fileStorage/containers/${containerId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to get container: ${response.statusText}`);
    }

    return await response.json();
  }

  // File operations
  async listFiles(accessToken: string, driveId: string, folderId: string = 'root'): Promise<File[]> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${folderId}/children?$expand=listItem($expand=fields)`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value.map((item: any) => ({
      ...item,
      isFolder: !!item.folder
    }));
  }

  async uploadFile(accessToken: string, driveId: string, folderId: string = 'root', file: File): Promise<any> {
    const folderPath = folderId === 'root' ? 'root:' : `${folderId}:`;
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${folderPath}/${file.name}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type,
      },
      body: file
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return await response.json();
  }

  async getFilePreview(accessToken: string, driveId: string, itemId: string): Promise<string> {
    const url = `${appConfig.endpoints.graphBaseUrl}${appConfig.endpoints.drives}/${driveId}/items/${itemId}/preview`;

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to get file preview: ${response.statusText}`);
    }

    const data = await response.json();
    return `${data.getUrl}&nb=true`;
  }
}

export const sharePointService = new SharePointService();
