
// Configuration for SharePoint Embedded application
export const appConfig = {
  // These values should be updated with your actual values
  clientId: "fb7cf520-cb33-45bf-a238-ae51d316665f", // Replace with your application client ID
  tenantId: "153a6ebe-ff62-4bce-b1bc-a1eda3bc6645", // Replace with your tenant ID
  containerTypeId: "ee469b9e-3451-0e71-1384-0fbc70aa001a", // Replace with your container type ID
  
  // MSAL configuration
  msalConfig: {
    auth: {
      clientId: "fb7cf520-cb33-45bf-a238-ae51d316665f", // Same as above
      authority: "https://login.microsoftonline.com/153a6ebe-ff62-4bce-b1bc-a1eda3bc6645", // Will be updated with actual tenant ID
      redirectUri: window.location.origin, // Dynamic redirect URI based on current origin
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  },
  
  // API endpoints
  endpoints: {
    graphBaseUrl: "https://graph.microsoft.com/v1.0",
    fileStorage: "/storage/fileStorage",
    containers: "/containers",
    containerTypes: "/containerTypes",
    drives: "/drives",
  }
};
