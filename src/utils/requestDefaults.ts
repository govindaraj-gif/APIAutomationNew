// Custom error class for request errors
export class RequestError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: Response,
    public type?: string
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

// Default headers that will be applied to all requests
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// Merge custom headers with defaults, allowing custom headers to override defaults
export const mergeHeaders = (customHeaders: Record<string, string> = {}, isGraphQL = false): Record<string, string> => {
  return {
    ...DEFAULT_HEADERS,
    ...(isGraphQL ? { 'Content-Type': 'application/graphql' } : {}),
    ...customHeaders,
  };
};

// Prepare request body based on method and content
export const prepareRequestBody = (request: { body: string; method: string; isGraphQL?: boolean; graphQLQuery?: string; graphQLVariables?: string }): string | undefined => {
  const { method, body, isGraphQL, graphQLQuery, graphQLVariables } = request;
  
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return undefined;
  
  if (isGraphQL) {
    try {
      return JSON.stringify({
        query: graphQLQuery,
        variables: graphQLVariables ? JSON.parse(graphQLVariables) : undefined
      });
    } catch (e) {
      throw new RequestError('Invalid GraphQL variables format', undefined, undefined, undefined, 'GRAPHQL_ERROR');
    }
  }

  if (!body.trim()) return undefined;

  try {
    // If it's already valid JSON, parse and stringify to ensure proper format
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed);
  } catch (e) {
    // If it's not valid JSON, return as is for non-JSON payloads
    return body;
  }
};

// Create URL with query parameters
export const createUrlWithParams = (baseUrl: string, params: Record<string, string> = {}): string => {
  try {
    // Handle relative URLs by prepending the current origin
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      // If URL parsing fails, try prepending the current origin
      url = new URL(baseUrl, window.location.origin);
    }

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    return url.toString();
  } catch (error) {
    throw new RequestError(`Invalid URL: ${baseUrl}`, undefined, undefined, undefined, 'URL_ERROR');
  }
};

// Prepare request options
export const prepareRequestOptions = (
  method: string,
  headers: Record<string, string>,
  body?: string,
  isGraphQL = false
): RequestInit => {
  const isSameOrigin = (url: string) => {
    try {
      return new URL(url).origin === window.location.origin;
    } catch {
      return true; // Relative URLs are same-origin
    }
  };

  return {
    method,
    headers: mergeHeaders(headers, isGraphQL),
    body,
    mode: 'cors',
    credentials: isSameOrigin(window.location.href) ? 'same-origin' : 'omit',
    cache: 'no-cache',
    redirect: 'follow',
    referrerPolicy: 'no-referrer'
  };
};

// Handle fetch with timeout and retries
export const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeout = 30000,
  retries = 2
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // Add exponential backoff delay for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorType = 'HTTP_ERROR';

        // Try to parse error response
        try {
          const errorData = await response.clone().json();
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
        } catch {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.clone().text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // If both fail, use default message
          }
        }

        throw new RequestError(
          errorMessage,
          response.status,
          response.statusText,
          response,
          errorType
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's a client error (4xx)
      if (error instanceof RequestError && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Don't retry if it's the last attempt
      if (attempt === retries) {
        break;
      }

      // Don't retry certain errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new RequestError('Request timed out', undefined, undefined, undefined, 'TIMEOUT');
        }
      }
    }
  }

  // If we get here, all retries failed
  if (lastError instanceof RequestError) {
    throw lastError;
  }

  if (lastError instanceof Error) {
    if (lastError.name === 'AbortError') {
      throw new RequestError('Request timed out', undefined, undefined, undefined, 'TIMEOUT');
    }

    // Handle network errors
    if (lastError.name === 'TypeError' && lastError.message === 'Failed to fetch') {
      throw new RequestError(
        'Network error: Unable to connect to the server. Please check your internet connection.',
        undefined,
        undefined,
        undefined,
        'NETWORK_ERROR'
      );
    }

    throw new RequestError(lastError.message, undefined, undefined, undefined, 'UNKNOWN_ERROR');
  }

  throw new RequestError('An unknown error occurred', undefined, undefined, undefined, 'UNKNOWN_ERROR');
};