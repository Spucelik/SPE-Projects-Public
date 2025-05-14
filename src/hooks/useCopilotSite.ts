
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { appConfig } from '../config/appConfig';

export const useCopilotSite = (containerId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  // Normalize container ID to handle different formats
  const normalizedContainerId = useMemo(() => {
    if (!containerId) return '';
    
    // If it already starts with b!, keep it as is
    if (containerId.startsWith('b!')) {
      return containerId;
    }
    
    // Otherwise, add the b! prefix
    return `b!${containerId}`;
  }, [containerId]);

  useEffect(() => {
    if (!normalizedContainerId) return;
    
    const fetchSiteInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError('Authentication token not available');
          return;
        }
        
        console.log('Fetching container details for:', normalizedContainerId);
        const containerDetails = await sharePointService.getContainerDetails(token, normalizedContainerId);
        console.log('Container details retrieved:', containerDetails);
        
        if (!containerDetails || !containerDetails.webUrl) {
          setError('Failed to retrieve container details');
          return;
        }
        
        // Store the site URL without any trailing slashes
        const normalizedUrl = containerDetails.webUrl.replace(/\/+$/, '');
        setSiteUrl(normalizedUrl);
        setSiteName(containerDetails.name || 'Unknown Site');
      } catch (err) {
        console.error('Error fetching site info:', err);
        setError('Failed to load site information');
        
        // Fallback to using the default SharePoint hostname
        if (!siteUrl) {
          const fallbackUrl = appConfig.sharePointHostname.replace(/\/+$/, '');
          console.log('Using fallback SharePoint URL:', fallbackUrl);
          setSiteUrl(fallbackUrl);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSiteInfo();
  }, [normalizedContainerId, getAccessToken, siteUrl]);

  // Get the base SharePoint hostname (without any paths or trailing slashes)
  // This is used for authentication and CSP compatibility
  const sharePointHostname = useMemo(() => {
    try {
      // If no site URL yet, use the default from config
      if (!siteUrl) {
        const defaultHostname = appConfig.sharePointHostname.replace(/\/+$/, '');
        console.log('Using default SharePoint hostname:', defaultHostname);
        return defaultHostname;
      }
      
      // Parse only the hostname part from the URL with protocol
      const url = new URL(siteUrl);
      const hostname = `${url.protocol}//${url.hostname}`;
      console.log('Extracted SharePoint hostname from URL:', hostname);
      return hostname;
    } catch (e) {
      console.error('Error parsing site URL:', e);
      // Return default from config as fallback
      const fallback = appConfig.sharePointHostname.replace(/\/+$/, '');
      console.log('Using fallback SharePoint hostname after error:', fallback);
      return fallback;
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
