
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { toast } from '@/hooks/use-toast';
import { appConfig } from '../config/appConfig';

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

  // Get the base SharePoint hostname (without any paths or trailing slashes)
  // This is used for authentication and CSP compatibility
  const sharePointHostname = useMemo(() => {
    // If no site URL yet, use the default from config
    if (!siteUrl) {
      const defaultHostname = appConfig.sharePointHostname.replace(/\/+$/, '');
      return defaultHostname;
    }
    
    try {
      // Parse only the hostname part from the URL
      const url = new URL(siteUrl);
      return `${url.protocol}//${url.hostname}`;
    } catch (e) {
      console.error('Error parsing site URL:', e);
      // Return default from config as fallback
      return appConfig.sharePointHostname.replace(/\/+$/, '');
    }
  }, [siteUrl]);

  return {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
  };
};
