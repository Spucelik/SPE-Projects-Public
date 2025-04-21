
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
        
        console.log('Fetching container details for:', containerId);
        const containerDetails = await sharePointService.getContainerDetails(token, containerId);
        console.log('Container details retrieved:', containerDetails);
        
        // Store the site URL without any trailing slashes
        const normalizedUrl = containerDetails.webUrl.replace(/\/+$/, '');
        setSiteUrl(normalizedUrl);
        setSiteName(containerDetails.name);
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
  }, [containerId, getAccessToken]);

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
