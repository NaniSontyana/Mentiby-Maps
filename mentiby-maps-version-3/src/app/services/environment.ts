const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const hostname = window.location.hostname;
    // If we're not running on localhost, use the production backend URL
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      return 'https://mentiby-maps.onrender.com';
    }
  }
  return 'http://localhost:3000';
};

export const environment = {
  baseUrl: getBaseUrl(),
  googleMapsApiKey: 'AIzaSyC4C_dKqHiT9MjiD27PONHsNicFqKhdfn8' // Replace with your RESTRICTED api key
}; 