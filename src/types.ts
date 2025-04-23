import { DocumentNode } from 'graphql';

export interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
  isGraphQL?: boolean;
  graphQLQuery?: string;
  graphQLVariables?: string;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    username?: string;
    password?: string;
    token?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
  };
  assertions?: ResponseAssertions;
}

export interface ChainRequest extends Request {
  id: string;
  name: string;
  variables?: Record<string, string>;
  dependsOn?: string[];
  extractAuth?: {
    tokenPath?: string;
    headerName?: string;
  };
}

export interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  error?: string;
  errorDetails?: {
    code?: string;
    message?: string;
    details?: any;
    type?: string;
  };
  assertions?: AssertionResults;
}

export interface ChainResponse extends Response {
  requestId: string;
  responseTime?: number;
  extractedAuth?: {
    token?: string;
    headerValue?: string;
  };
}

export interface ResponseAssertions {
  status?: number;
  responseTime?: number;
  headers?: Record<string, string>;
  body?: BodyAssertion[];
}

export interface BodyAssertion {
  path: string;
  operator: AssertionOperator;
  value: any;
}

export type AssertionOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'exists'
  | 'notExists'
  | 'greaterThan'
  | 'lessThan'
  | 'matches';

export interface AssertionResults {
  passed: boolean;
  details: {
    status?: boolean;
    responseTime?: boolean;
    headers?: Record<string, boolean>;
    body?: Record<string, boolean>;
  };
  failureMessages: string[];
}

export interface VariableState {
  requestId: string;
  path: string;
  isSelecting: boolean;
  name: string;
  isValid?: boolean;
}

export interface AuthExtractionState {
  requestId: string;
  tokenPath: string;
  headerName: string;
  isSelectingPath: boolean;
}

export interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
}

export type DataVariableType = 
  | 'string' 
  | 'number' 
  | 'singleDigit'
  | 'boolean' 
  | 'object'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'emailWithDomain'
  | 'staticPassword'
  | 'dynamicPassword'
  | 'phoneNumber'
  | 'date'
  | 'pastDate'
  | 'futureDate'
  | 'city'
  | 'state'
  | 'country'
  | 'countryCode'
  | 'zipCode'
  | 'uuid'
  | 'color'
  | 'url'
  | 'ipv4'
  | 'ipv6'
  | 'alphanumeric';

export interface DataVariable {
  name: string;
  type: DataVariableType;
  value: string;
  isDynamic?: boolean;
  config?: {
    emailDomain?: string;
    passwordLength?: number;
    specialChars?: string;
    staticValue?: string;
  };
}

export interface GraphQLValidationResult {
  isValid: boolean;
  error?: string;
  ast?: DocumentNode;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isImportant?: boolean;
  folders: CollectionFolder[];
  requests: CollectionRequest[];
  createdAt: string;
  updatedAt: string;
  changelog: ChangelogEntry[];
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  requests: CollectionRequest[];
  folders: CollectionFolder[];
}

export interface CollectionRequest {
  id: string;
  name: string;
  request: Request;
  description?: string;
  createdAt: string;
  updatedAt: string;
  collectionId?: string;
  folderId?: string;
}

export interface ChangelogEntry {
  id: string;
  action: 'create' | 'update' | 'delete' | 'move';
  itemType: 'collection' | 'folder' | 'request';
  itemId: string;
  itemName: string;
  timestamp: string;
  details?: string;
}

export interface ImportResult {
  collections: Collection[];
  errors?: string[];
  warnings?: string[];
}