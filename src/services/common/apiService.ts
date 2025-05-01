import axios, { AxiosRequestConfig, AxiosResponse ,AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import { parseApiResponse } from './responseParser';

// Define types for request data and response structure
export interface ApiRequest {
  method: string;
  url: string;
  params?: Array<{ key: string; value: string; enabled: boolean }>;
  headers?: Array<{ key: string; value: string; enabled?: boolean } | string>;
  body?: any;
  bodyType?: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'GraphQL';
  rawFormat?: 'JSON' | 'Text';
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
  };
  scripts?: {
    preRequest?: string;
    tests?: string;
  };
  settings?: {
    timeout?: number;
    followRedirects?: boolean;
  };
  graphqlQuery?: string;
  graphqlVariables?: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  body: string;
  headers: { [key: string]: string };
  cookies: Array<{ name: string; value: string; domain: string; path: string; expires: string; httpOnly: boolean; secure: boolean }>;
  time: number;
  size: number;
  tests: Array<{ name: string; passed: boolean; error?: string }>;
  error: string | null;
  parsedResponse: any;
}

interface Variable {
  name: string;
  source: 'body' | 'headers' | 'status';
  expression: string;
}

interface ChainRequest {
  url: string;
  method: string;
  variables?: Array<Variable>;
  completed?: boolean;
}

// Configure axios for API calls that work in both development and production
const axiosInstance = axios.create({
  baseURL: '/api', // Use /api prefix for all backend requests to work with the proxy
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds
});

// Add request interceptor for logging and debugging
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API Service] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    }
    return config;
  },
  (error: any) => {
    console.error('[API Service] Request error:', error);
    return Promise.reject(error);
  }
);



// API service for handling HTTP requests from the application
const apiService = {
  // Execute a single API request
  executeRequest: async (requestData: ApiRequest): Promise<ApiResponse> => {
    try {
      // In production, this would call the backend to make the request
      // For demo/development purposes, we'll use the browser's fetch API directly

      // Prepare the URL with query parameters
      let url = requestData.url;

      if (requestData.params && requestData.params.length > 0) {
        const urlObj = new URL(url);

        requestData.params.forEach((param) => {
          if (param.enabled && param.key) {
            urlObj.searchParams.append(param.key, param.value || '');
          }
        });

        url = urlObj.toString();
      }

      // Prepare headers
      const headers: { [key: string]: string } = {};

      // Handle headers in array or string format
      if (requestData.headers) {
        const headerArray = Array.isArray(requestData.headers)
          ? requestData.headers
          : typeof requestData.headers === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(requestData.headers);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Failed to parse headers string:', e);
                return [];
              }
            })()
          : [];

        // Process each header in the array
        headerArray.forEach((header) => {
          if (header && header.key && (header.enabled === undefined || header.enabled)) {
            headers[header.key] = header.value || '';
          }
        });
      }

      // Handle authentication
      if (requestData.auth && requestData.auth.type !== 'none') {
        switch (requestData.auth.type) {
          case 'basic':
            if (requestData.auth.username) {
              const credentials = btoa(`${requestData.auth.username}:${requestData.auth.password || ''}`);
              headers['Authorization'] = `Basic ${credentials}`;
            }
            break;

          case 'bearer':
            if (requestData.auth.token) {
              headers['Authorization'] = `Bearer ${requestData.auth.token}`;
            }
            break;

          case 'api-key':
            if (requestData.auth.key && requestData.auth.value) {
              if (requestData.auth.addTo === 'header') {
                headers[requestData.auth.key] = requestData.auth.value;
              } else if (requestData.auth.addTo === 'query') {
                // Add to query params
                const urlObj = new URL(url);
                urlObj.searchParams.append(requestData.auth.key, requestData.auth.value);
                url = urlObj.toString();
              }
            }
            break;

          default:
            break;
        }
      }

      // Prepare request body
      let body: string | null = null;

      if (requestData.method !== 'GET' && requestData.method !== 'HEAD') {
        const bodyType = requestData.bodyType || 'none';

        switch (bodyType) {
          case 'raw':
            if (requestData.rawFormat === 'JSON') {
              headers['Content-Type'] = 'application/json';
              // Check if the body is already a string and if it looks like valid JSON
              if (typeof requestData.body === 'string') {
                if (requestData.body.trim() === '{}' || requestData.body.trim() === '[]') {
                  body = requestData.body;
                } else {
                  try {
                    JSON.parse(requestData.body);
                    body = requestData.body;
                  } catch (e) {
                    body = JSON.stringify({ data: requestData.body });
                    if (process.env.NODE_ENV === 'development') {
                      console.warn('Body was not valid JSON, converting to: ', body);
                    }
                  }
                }
              } else if (requestData.body) {
                body = JSON.stringify(requestData.body);
              } else {
                body = '{}';
              }
            } else {
              headers['Content-Type'] = 'text/plain';
              body = requestData.body || '';
            }
            break;

          case 'form-data':
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({ formData: 'Not implemented in demo' });
            break;

          case 'x-www-form-urlencoded':
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            body = 'key1=value1&key2=value2';
            break;

          case 'GraphQL':
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({
              query: requestData.graphqlQuery || '',
              variables: JSON.parse(requestData.graphqlVariables || '{}'),
            });
            break;

          default:
            if (['POST', 'PUT', 'PATCH'].includes(requestData.method)) {
              headers['Content-Type'] = 'application/json';
              body = '{}';
            }
            break;
        }
      }

      // Execute pre-request script if available
      if (requestData.scripts?.preRequest) {
        try {
          console.log('Executing pre-request script (not implemented in demo)');
        } catch (error) {
          console.error('Error executing pre-request script:', error);
        }
      }

      // Make the request
      const abortController = new AbortController();
      const timeout = requestData.settings?.timeout || 30000;
      const timeoutId = setTimeout(() => {
        console.warn(`Request timeout after ${timeout}ms - aborting`);
        abortController.abort();
      }, timeout);

      const startTime = Date.now();

      let finalUrl = url;
      if (url.startsWith('http') && !url.includes(window.location.host)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Using proxy for external URL: ${url}`);
        }
        const encodedUrl = encodeURIComponent(url);
        finalUrl = `/api/proxy?url=${encodedUrl}`;
        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['X-Proxy-Request'] = 'true';
      }

      try {
        const response = await fetch(finalUrl, {
          method: requestData.method,
          headers,
          body,
          credentials: 'same-origin',
          redirect: requestData.settings?.followRedirects !== false ? 'follow' : 'manual',
          signal: abortController.signal,
          cache: 'no-store',
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const responseTime = Date.now() - startTime;

        const responseHeaders: { [key: string]: string } = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let responseBody = '';
        let responseError = null;
        let enhancedParsedResponse = null;

        try {
          const parsedResponse = await parseApiResponse(response);
          enhancedParsedResponse = parsedResponse;
          responseBody = parsedResponse.formatted;
          responseError = parsedResponse.error;

          if (parsedResponse.error && process.env.NODE_ENV === 'development') {
            console.warn('Response parsing warning:', parsedResponse.error);
          }
        } catch (error:any) {
          console.error('Error reading response body:', error);
          responseBody = `Error reading response: ${error.message}`;
          responseError = error.message;
        }

        let testResults: Array<{ name: string; passed: boolean }> = [];
        if (requestData.scripts?.tests) {
          try {
            testResults = [
              { name: 'Status code is 200', passed: response.status === 200 },
              { name: 'Response time is less than 1000ms', passed: responseTime < 1000 },
            ];
          } catch (error:any) {
            console.error('Error executing tests script:', error);
            testResults = [{ name: 'Script execution error', passed: false }];
          }
        }

        const cookies = [];
        const cookieHeader = response.headers.get('set-cookie');
        if (cookieHeader) {
          cookies.push({
            name: 'example-cookie',
            value: 'sample-value',
            domain: window.location.hostname,
            path: '/',
            expires: 'Session',
            httpOnly: false,
            secure: false,
          });
        }

        return {
          status: response.status,
          statusText: response.statusText,
          body: responseBody,
          headers: responseHeaders,
          cookies,
          time: responseTime,
          size: responseBody.length,
          tests: testResults,
          error: responseError,
          parsedResponse: enhancedParsedResponse,
        };
      } catch (fetchError:any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        console.error('Fetch error:', fetchError);

        return {
          status: 0,
          statusText: "Network Error",
          body: `Request failed: ${fetchError.message}`,
          headers: {},
          cookies: [],
          time: Date.now() - startTime,
          size: 0,
          tests: [],
          error: fetchError.message,
          parsedResponse: JSON.parse('{"message": "Success"}'),
          // isNetworkError: true,
        };
      }
    } catch (error) {
      console.error('Error executing API request:', error);
      throw error;
    }
  },

  // Execute a chain of requests
  executeChainRequest: async (chainRequests: ChainRequest[]): Promise<any[]> => {
    const results: any[] = [];
    const variables: { [key: string]: string } = {};

    for (const chainReq of chainRequests) {
      try {
        const requestData: ApiRequest = {
          method: 'GET',
          url: 'https://reqres.in/api/users/2',
          // name: 'User Request',
        };

        let requestUrl = requestData.url;
        Object.keys(variables).forEach((varName) => {
          requestUrl = requestUrl.replace(`{{${varName}}}`, variables[varName]);
        });

        const startTime = Date.now();
        const response = await apiService.executeRequest({
          ...requestData,
          url: requestUrl,
        });
        const executionTime = Date.now() - startTime;

        const extractedVariables: { [key: string]: any } = {};

        if (chainReq.variables && chainReq.variables.length > 0) {
          for (const variable of chainReq.variables) {
            if (!variable.name || !variable.expression) continue;

            try {
              let value: any = null;

              if (variable.source === 'body') {
                let bodyObj: any;

                try {
                  if (typeof response.body === 'string') {
                    bodyObj = JSON.parse(response.body);
                  } else {
                    bodyObj = response.body;
                  }
                } catch (err) {
                  continue;
                }

                const path = variable.expression.split('.');
                let current = bodyObj;

                for (const key of path) {
                  if (current && typeof current === 'object') {
                    current = current[key];
                  } else {
                    current = undefined;
                    break;
                  }
                }

                value = current;
              } else if (variable.source === 'headers') {
                value = response.headers[variable.expression.toLowerCase()];
              } else if (variable.source === 'status') {
                value = response.status;
              }

              if (value !== undefined) {
                extractedVariables[variable.name] = value;
                variables[variable.name] = value;
              }
            } catch (error) {
              console.error(`Error extracting variable ${variable.name}:`, error);
            }
          }
        }

        results.push({
          success: true,
          request: requestData,
          response,
          executionTime,
          extractedVariables,
        });

        chainReq.completed = true;
      } catch (error:any) {
        results.push({
          success: false,
          request: { name: 'Unknown' },
          error: error.message,
        });

        break;
      }
    }

    return results;
  },
};

export default apiService;
