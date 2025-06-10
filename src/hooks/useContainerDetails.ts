
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';

export const useContainerDetails = (containerId: string | undefined) => {
  const [containerDetails, setContainerDetails] = useState<{ webUrl: string, name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, getAccessToken } = useAuth();

  useEffect(() => {
    // If no container ID provided, don't do anything
    if (!isAuthenticated || !containerId) return;

    const fetchContainerDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = await getAccessToken();
        if (!token) {
          setError('Failed to get access token');
          return;
        }
        
        console.log('Fetching container details for containerId:', containerId);
        
        // Try to normalize the container ID - handle different formats
        let normalizedContainerId = containerId;
        
        // If it contains commas, it might be a site ID format, extract the site ID part
        if (containerId.includes(',')) {
          const parts = containerId.split(',');
          if (parts.length >= 2) {
            // Use the full site ID format for container operations
            normalizedContainerId = containerId;
          }
        }
        
        // Add b! prefix if not already present for Graph API calls
        if (!normalizedContainerId.startsWith('b!')) {
          normalizedContainerId = `b!${normalizedContainerId}`;
        }
        
        console.log('Using normalized container ID:', normalizedContainerId);
        
        const details = await sharePointService.getContainerDetails(token, normalizedContainerId);
        setContainerDetails(details);
        console.log('Container details fetched successfully:', details);
      } catch (error: any) {
        console.error('Error fetching container details:', error);
        setError(error.message || 'Failed to fetch container details');
        
        // Set fallback values to prevent UI breaking
        setContainerDetails({
          webUrl: '',
          name: 'Project Container'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContainerDetails();
  }, [isAuthenticated, getAccessToken, containerId]);

  return { 
    containerDetails, 
    loading, 
    error 
  };
};
