export const getBaseUrl = () => {
  const environment = process.env.NODE_ENV;

  const baseUrl =
    environment === 'development'
      ? 'http://localhost:3000'
      : 'https://www.swap-space-app.com';

  return baseUrl;
};
