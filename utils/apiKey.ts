

/**
 * Retrieves the Gemini API key from the environment variables.
 */
export const getApiKey = (): string => {
  // FIX: Per coding guidelines, the API key must be obtained from process.env.API_KEY.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API key not found. Please ensure API_KEY is set as an environment variable.");
    // This will cause the API calls to fail with a clear "invalid API key" error,
    // which is the expected behavior when the key is missing.
    return "";
  }
  
  return apiKey;
};
