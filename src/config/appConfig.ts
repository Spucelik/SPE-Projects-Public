
// Configuration for SharePoint Embedded application
export const appConfig = {
  // These values should be updated with your actual values
  clientId: "YOUR_CLIENT_ID", // Replace with your application client ID
  tenantId: "YOUR_TENANT_ID", // Replace with your tenant ID
  containerTypeId: "YOUR_CONTAINER_TYPE_ID", // Replace with your container type ID
  
  // MSAL configuration
  msalConfig: {
    auth: {
      clientId: "YOUR_CLIENT_ID", // Same as above
      authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Will be updated with actual tenant ID
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  },
  
  // API endpoints
  endpoints: {
    graphBaseUrl: "https://graph.microsoft.com/v1.0",
    containers: "/storage/fileStorage/containers",
    drives: "/drives",
  }
};
