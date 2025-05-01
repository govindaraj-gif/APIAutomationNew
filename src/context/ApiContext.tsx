import React, { createContext, useContext, useState, ReactNode } from 'react';
import apiService from '../services/common/apiService';

// Define types for the state
interface Tenant {
  id: string;
  name: string;
  plan: string;
  created: string;
}

interface Workspace {
  id: string;
  name: string;
  tenantId: string;
  created: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  avatarUrl: string | null;
}

interface Request {
  method: string;
  url: string;
  params: any[];
  headers: any[];
  auth: { type: string };
  body: string;
  bodyType: string;
  rawFormat: string;
  scripts: {
    preRequest: string;
    tests: string;
  };
  settings: {
    followRedirects: boolean;
    timeout: number;
    sslVerification: boolean;
  };
}

interface Response {
  status: number;
  statusText: string;
  body: string;
  headers: any;
  cookies: any[];
  error: boolean;
}

interface TestData {
  parameters: string[];
  rows: TestRow[];
}

interface TestRow {
  id: number;
  values: { [key: string]: string };
  status: string;
  response: any | null;
}

interface ApiContextType {
  request: Request;
  response: Response | null;
  responseData: Response | null;
  isLoading: boolean;
  currentTab: string;
  viewMode: string;
  lastRequestStatus: { code: number; status: string; size: string | null } | null;
  lastRequestTime: string | null;
  currentTenant: Tenant;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  currentUser: User;
  testData: TestData;

  updateRequest: (updates: Partial<Request>) => void;
  loadRequest: (reqData: Request) => void;
  // executeRequest: (customRequest?: Request | null) => Promise<Response | null>;
  // executeChainRequest: (chainRequests: any[]) => Promise<any[]>;
  setCurrentTab: (tab: string) => void;
  setViewMode: (mode: string) => void;
  switchWorkspace: (workspaceId: string) => void;

  // sendRequest: (parameterizedRequest: Request) => Promise<Response | null>;
  updateTestData: (newTestData: TestData) => void;
  addTestParameter: (parameter: string) => void;
  removeTestParameter: (parameter: string) => void;
  addTestRow: () => void;
  removeTestRow: (rowId: number) => void;
  updateTestRow: (rowId: number, values: { [key: string]: string }, status?: string, response?: any) => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider = ({ children }: ApiProviderProps) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant>({
    id: 'tenant-001',
    name: 'TestOrg',
    plan: 'Enterprise',
    created: '2023-01-15',
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'workspace-001', name: 'Development', tenantId: 'tenant-001', created: '2023-01-15' },
    { id: 'workspace-002', name: 'Testing', tenantId: 'tenant-001', created: '2023-01-15' },
    { id: 'workspace-003', name: 'Production', tenantId: 'tenant-001', created: '2023-01-15' },
  ]);

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-001',
    name: 'Test User',
    email: 'testuser@example.com',
    role: 'Admin',
    tenantId: 'tenant-001',
    avatarUrl: null,
  });

  const [request, setRequest] = useState<Request>({
    method: 'GET',
    url: 'https://reqres.in/api/users',
    params: [],
    headers: [],
    auth: { type: 'none' },
    body: '',
    bodyType: 'none',
    rawFormat: 'JSON',
    scripts: { preRequest: '', tests: '' },
    settings: { followRedirects: true, timeout: 0, sslVerification: true },
  });

  const [response, setResponse] = useState<Response | null>(null);
  const [responseData, setResponseData] = useState<Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('params');
  const [viewMode, setViewMode] = useState('response');

  const [testData, setTestData] = useState<TestData>({
    parameters: ['URL', 'Headers', 'Body'],
    rows: [{ id: 1, values: { URL: '', Headers: '', Body: '' }, status: 'pending', response: null }],
  });

  const [lastRequestStatus, setLastRequestStatus] = useState<{ code: number; status: string; size: string | null } | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(workspaces[0]);

  const updateRequest = (updates: Partial<Request>) => {
    setRequest((prev) => ({ ...prev, ...updates }));
  };

  const loadRequest = (reqData: Request) => {
    setRequest(reqData);
    setResponse(null);
    setCurrentTab('params');
    setViewMode('response');
  };

  // const executeRequest = async (customRequest: Request | null = null): Promise<Response | null> => {
  //   let isMounted = true;
  //   const requestToExecute = customRequest || request;

  //   try {
  //     setIsLoading(true);
  //     const startTime = performance.now();
  //     const res = await apiService.executeRequest(requestToExecute);
  //     const endTime = performance.now();
  //     const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

  //     if (isMounted) {
  //       setResponse(res);
  //       setResponseData(res);
  //       setLastRequestStatus({
  //         code: res.status,
  //         status: res.statusText,
  //         size: res.size ? (res.size / 1024).toFixed(2) : null,
  //       });
  //       setLastRequestTime(timeTaken);
  //     }

  //     return res;
  //   } catch (error:any) {
  //     console.error('Error executing request:', error);
  //     if (isMounted) {
  //       const errorResponse: Response = {
  //         status: 0,
  //         statusText: 'Error',
  //         body: error.message,
  //         headers: {},
  //         cookies: [],
  //         error: true,
  //       };
  //       setResponse(errorResponse);
  //       setResponseData(errorResponse);
  //       setLastRequestStatus({
  //         code: 0,
  //         status: 'Error',
  //         size: null,
  //       });
  //     }

  //     return null;
  //   } finally {
  //     if (isMounted) {
  //       setIsLoading(false);
  //     }

  //     return () => {
  //       isMounted = false;
  //     };
  //   }
  // };

  // const executeChainRequest = async (chainRequests: any[]): Promise<any[]> => {
  //   let isMounted = true;
  //   try {
  //     setIsLoading(true);
  //     const results = await apiService.executeChainRequest(chainRequests);
  //     return results;
  //   } catch (error:any) {
  //     console.error('Error executing chain request:', error);
  //     return [{ success: false, error: error.message }];
  //   } finally {
  //     if (isMounted) {
  //       setIsLoading(false);
  //     }
  //     return () => {
  //       isMounted = false;
  //     };
  //   }
  // };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  return (
    <ApiContext.Provider
      value={{
        request,
        response,
        responseData,
        isLoading,
        currentTab,
        viewMode,
        lastRequestStatus,
        lastRequestTime,
        currentTenant,
        workspaces,
        currentWorkspace,
        currentUser,
        testData,

        updateRequest,
        loadRequest,
        // executeRequest,
        // executeChainRequest,
        setCurrentTab,
        setViewMode,
        switchWorkspace,

        // sendRequest: executeRequest,
        updateTestData: setTestData,
        addTestParameter: (parameter) => {
          if (!testData.parameters.includes(parameter)) {
            const newParameters = [...testData.parameters, parameter];
            const newRows = testData.rows.map((row) => ({
              ...row,
              values: { ...row.values, [parameter]: '' },
            }));
            setTestData({ parameters: newParameters, rows: newRows });
          }
        },
        removeTestParameter: (parameter) => {
          if (parameter !== 'URL' && testData.parameters.includes(parameter)) {
            const newParameters = testData.parameters.filter((p) => p !== parameter);
            const newRows = testData.rows.map((row) => {
              const newValues = { ...row.values };
              delete newValues[parameter];
              return { ...row, values: newValues };
            });
            setTestData({ parameters: newParameters, rows: newRows });
          }
        },
        addTestRow: () => {
          const newId = Math.max(0, ...testData.rows.map((row) => row.id)) + 1;
          const values = testData.parameters.reduce<Record<string, string>>((obj, param) => {
            obj[param] = '';
            return obj;
          }, {});
          
          const newRow = { id: newId, values, status: 'pending', response: null };
          setTestData({ ...testData, rows: [...testData.rows, newRow] });
        },
        removeTestRow: (rowId) => {
          if (testData.rows.length > 1) {
            setTestData({
              ...testData,
              rows: testData.rows.filter((row) => row.id !== rowId),
            });
          }
        },
        updateTestRow: (rowId, values, status = 'pending', response = null) => {
          const updatedRows = testData.rows.map((row) => {
            if (row.id === rowId) {
              return { ...row, values, status, response };
            }
            return row;
          });
          setTestData({ ...testData, rows: updatedRows });
        },
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};
