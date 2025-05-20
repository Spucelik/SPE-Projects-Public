
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';

export const useContainerDetails = (containerId: string | undefined) => {
  const [containerDetails, setContainerDetails] = useState<{ webUrl: string, name: string } | null>(null);
  const { isAuthenticated, getAccessToken } = useAuth();

  useEffect(() => {
    // If no container ID provided, don't do anything
    if (!isAuthenticated || !containerId) return;

    const fetchContainerDetails = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        
        const details = await sharePointService.getContainerDetails(token, containerId);
        setContainerDetails(details);
        console.log('Container details:', details);
      } catch (error) {
        console.error('Error fetching container details:', error);
      }
    };

    fetchContainerDetails();
  }, [isAuthenticated, getAccessToken, containerId]);

  return containerDetails;
};
