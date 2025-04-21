
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';

export const useCopilotSite = (containerId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  useEffect(() => {
    if (!containerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError('Authentication token not available');
          return;
        }
        
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        console.log('Container details retrieved:', containerDetails);
        setSiteUrl(containerDetails.webUrl);
        setSiteName(containerDetails.name);
      } catch (err) {
        console.error('Error fetching site info:', err);
        setError('Failed to load site information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSiteInfo();
  }, [containerId, getAccessToken]);

  const sharePointHostname = siteUrl ? 
    (() => {
      try {
        // Normalize URL to ensure no trailing slash
        let normalizedUrl = siteUrl;
        // Remove trailing slash if present
        if (normalizedUrl.endsWith('/')) {
          normalizedUrl = normalizedUrl.slice(0, -1);
        }
        
        const url = new URL(normalizedUrl);
        // Return protocol and hostname without any trailing slashes
        return `${url.protocol}//${url.hostname}`.replace(/\/+$/, '');
      } catch (e) {
        console.error('Error parsing site URL:', e);
        return "https://pucelikenterprise.sharepoint.com";
      }
    })() : 
    "https://pucelikenterprise.sharepoint.com";

  return {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
  };
};
