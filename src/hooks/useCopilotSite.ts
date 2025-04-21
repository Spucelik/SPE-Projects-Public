
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
        
        // Store the site URL without any trailing slashes
        const normalizedUrl = containerDetails.webUrl.replace(/\/+$/, '');
        setSiteUrl(normalizedUrl);
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

  // Normalize the SharePoint hostname for CSP compatibility
  const sharePointHostname = siteUrl ? 
    (() => {
      try {
        // Extract just the protocol and hostname, ensuring no trailing slashes
        const url = new URL(siteUrl);
        return `${url.protocol}//${url.hostname}`;
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
