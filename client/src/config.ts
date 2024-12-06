const getBaseUrl = () => {
  // In production, use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '';
  }

  // In development, use the proxy configuration
  return '';
};

export const getApiUrl = () => {
  const baseUrl = getBaseUrl();
  console.log('API Base URL:', baseUrl);
  return baseUrl;
};

export const config = {
  getApiUrl
};

export default config;
