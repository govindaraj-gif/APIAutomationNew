import OpenAI from 'openai';
import { z } from 'zod';
import { Request } from '../types';

// Schema for test cases
const TestCaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['positive', 'negative', 'boundary', 'invalid_value', 'invalid_type', 'semantic']),
  request: z.object({
    method: z.string(),
    url: z.string(),
    headers: z.record(z.string()),
    params: z.record(z.string()),
    body: z.string().optional(),
  }),
  expectedResponse: z.object({
    status: z.number(),
    validation: z.array(z.object({
      path: z.string(),
      condition: z.string(),
      value: z.any(),
    })).optional(),
  }),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Helper function to create a test case
export function createTestCase(
  name: string,
  description: string,
  type: TestCase['type'],
  request: Request,
  expectedStatus: number,
  validation?: TestCase['expectedResponse']['validation']
): TestCase {
  return {
    name,
    description,
    type,
    request: {
      method: request.method,
      url: request.url,
      headers: { ...request.headers },
      params: { ...request.params },
      body: request.body
    },
    expectedResponse: {
      status: expectedStatus,
      validation
    }
  };
}

// Generate positive test cases
export function generatePositiveTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  // Basic success case
  tests.push(createTestCase(
    'Basic Success',
    'Verify successful request with valid data',
    'positive',
    request,
    200
  ));

  // If request has body, test with minimum required fields
  if (request.body) {
    try {
      const body = JSON.parse(request.body);
      const minimalBody = Object.keys(body).reduce((acc, key) => {
        if (body[key] !== null && body[key] !== undefined) {
          acc[key] = body[key];
        }
        return acc;
      }, {});

      tests.push(createTestCase(
        'Minimal Valid Data',
        'Verify request succeeds with minimum required fields',
        'positive',
        { ...request, body: JSON.stringify(minimalBody) },
        200
      ));
    } catch (e) {
      // Invalid JSON body, skip this test
    }
  }

  return tests;
}

// Generate negative test cases
export function generateNegativeTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  // Invalid auth
  if (request.auth?.type !== 'none') {
    tests.push(createTestCase(
      'Invalid Authentication',
      'Verify request fails with invalid authentication',
      'negative',
      { ...request, auth: { type: 'bearer', token: 'invalid_token' } },
      401
    ));
  }

  // Missing required parameters
  if (Object.keys(request.params).length > 0) {
    const withoutParams = { ...request, params: {} };
    tests.push(createTestCase(
      'Missing Required Parameters',
      'Verify request fails when required parameters are missing',
      'negative',
      withoutParams,
      400
    ));
  }

  // Invalid request body
  if (request.body) {
    tests.push(createTestCase(
      'Invalid Request Body',
      'Verify request fails with malformed body data',
      'negative',
      { ...request, body: 'invalid_json' },
      400
    ));
  }

  return tests;
}

// Generate boundary test cases
export function generateBoundaryTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  if (request.body) {
    try {
      const body = JSON.parse(request.body);
      
      // Test string length boundaries
      Object.entries(body).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Empty string
          const emptyBody = { ...body, [key]: '' };
          tests.push(createTestCase(
            `Empty String - ${key}`,
            `Test with empty string for field ${key}`,
            'boundary',
            { ...request, body: JSON.stringify(emptyBody) },
            400
          ));

          // Very long string
          const longBody = { ...body, [key]: 'a'.repeat(1000) };
          tests.push(createTestCase(
            `Long String - ${key}`,
            `Test with very long string for field ${key}`,
            'boundary',
            { ...request, body: JSON.stringify(longBody) },
            400
          ));
        }
        
        // Test numeric boundaries
        if (typeof value === 'number') {
          // Maximum value
          const maxBody = { ...body, [key]: Number.MAX_SAFE_INTEGER };
          tests.push(createTestCase(
            `Maximum Number - ${key}`,
            `Test with maximum safe integer for field ${key}`,
            'boundary',
            { ...request, body: JSON.stringify(maxBody) },
            400
          ));

          // Minimum value
          const minBody = { ...body, [key]: Number.MIN_SAFE_INTEGER };
          tests.push(createTestCase(
            `Minimum Number - ${key}`,
            `Test with minimum safe integer for field ${key}`,
            'boundary',
            { ...request, body: JSON.stringify(minBody) },
            400
          ));
        }
      });
    } catch (e) {
      // Invalid JSON body, skip these tests
    }
  }

  return tests;
}

// Generate invalid value test cases
export function generateInvalidValueTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  if (request.body) {
    try {
      const body = JSON.parse(request.body);
      
      Object.entries(body).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Test with special characters
          const specialCharsBody = { ...body, [key]: '!@#$%^&*()' };
          tests.push(createTestCase(
            `Special Characters - ${key}`,
            `Test with special characters for field ${key}`,
            'invalid_value',
            { ...request, body: JSON.stringify(specialCharsBody) },
            400
          ));

          // Test with SQL injection attempt
          const sqlInjectionBody = { ...body, [key]: "' OR '1'='1" };
          tests.push(createTestCase(
            `SQL Injection - ${key}`,
            `Test with SQL injection attempt for field ${key}`,
            'invalid_value',
            { ...request, body: JSON.stringify(sqlInjectionBody) },
            400
          ));
        }

        if (typeof value === 'number') {
          // Test with negative numbers
          const negativeBody = { ...body, [key]: -1 };
          tests.push(createTestCase(
            `Negative Number - ${key}`,
            `Test with negative number for field ${key}`,
            'invalid_value',
            { ...request, body: JSON.stringify(negativeBody) },
            400
          ));
        }
      });
    } catch (e) {
      // Invalid JSON body, skip these tests
    }
  }

  return tests;
}

// Generate invalid type test cases
export function generateInvalidTypeTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  if (request.body) {
    try {
      const body = JSON.parse(request.body);
      
      Object.entries(body).forEach(([key, value]) => {
        // String to number
        if (typeof value === 'string') {
          const numericBody = { ...body, [key]: 123 };
          tests.push(createTestCase(
            `Wrong Type (Number) - ${key}`,
            `Test with number instead of string for field ${key}`,
            'invalid_type',
            { ...request, body: JSON.stringify(numericBody) },
            400
          ));
        }

        // Number to string
        if (typeof value === 'number') {
          const stringBody = { ...body, [key]: 'not_a_number' };
          tests.push(createTestCase(
            `Wrong Type (String) - ${key}`,
            `Test with string instead of number for field ${key}`,
            'invalid_type',
            { ...request, body: JSON.stringify(stringBody) },
            400
          ));
        }

        // Any type to null
        const nullBody = { ...body, [key]: null };
        tests.push(createTestCase(
          `Null Value - ${key}`,
          `Test with null value for field ${key}`,
          'invalid_type',
          { ...request, body: JSON.stringify(nullBody) },
          400
        ));

        // Any type to array
        const arrayBody = { ...body, [key]: [] };
        tests.push(createTestCase(
          `Array Value - ${key}`,
          `Test with array value for field ${key}`,
          'invalid_type',
          { ...request, body: JSON.stringify(arrayBody) },
          400
        ));
      });
    } catch (e) {
      // Invalid JSON body, skip these tests
    }
  }

  return tests;
}

// Generate semantic test cases
export function generateSemanticTests(request: Request): TestCase[] {
  const tests: TestCase[] = [];

  if (request.body) {
    try {
      const body = JSON.parse(request.body);
      
      // Test date fields
      Object.entries(body).forEach(([key, value]) => {
        if (typeof value === 'string' && /date|time/i.test(key)) {
          // Future date
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 1);
          const futureBody = { ...body, [key]: futureDate.toISOString() };
          
          tests.push(createTestCase(
            `Future Date - ${key}`,
            `Test with future date for field ${key}`,
            'semantic',
            { ...request, body: JSON.stringify(futureBody) },
            400
          ));

          // Past date
          const pastDate = new Date();
          pastDate.setFullYear(pastDate.getFullYear() - 1);
          const pastBody = { ...body, [key]: pastDate.toISOString() };
          
          tests.push(createTestCase(
            `Past Date - ${key}`,
            `Test with past date for field ${key}`,
            'semantic',
            { ...request, body: JSON.stringify(pastBody) },
            400
          ));
        }

        // Test email fields
        if (typeof value === 'string' && /email/i.test(key)) {
          const invalidEmailBody = { ...body, [key]: 'invalid.email' };
          tests.push(createTestCase(
            `Invalid Email Format - ${key}`,
            `Test with invalid email format for field ${key}`,
            'semantic',
            { ...request, body: JSON.stringify(invalidEmailBody) },
            400
          ));
        }
      });
    } catch (e) {
      // Invalid JSON body, skip these tests
    }
  }

  return tests;
}

// Generate all manual test cases
export function generateManualTestCases(request: Request): TestCase[] {
  return [
    ...generatePositiveTests(request),
    ...generateNegativeTests(request),
    ...generateBoundaryTests(request),
    ...generateInvalidValueTests(request),
    ...generateInvalidTypeTests(request),
    ...generateSemanticTests(request)
  ];
}

// Original AI-based test generation
export async function generateTestCases(request: Request): Promise<TestCase[]> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.');
    }

    const requestAnalysis = analyzeRequest(request);

    const prompt = `Generate comprehensive test cases for the following API request:

${requestAnalysis}

Create test cases for:
1. Positive cases (valid inputs, expected behavior)
2. Negative cases (error handling)
3. Boundary cases (edge conditions)
4. Invalid value cases (wrong values but correct types)
5. Invalid type cases (wrong data types)
6. Semantic cases (business logic validation)

For each test case, provide:
- Name
- Description
- Type (one of: positive, negative, boundary, invalid_value, invalid_type, semantic)
- Modified request details (method, url, headers, params, body)
- Expected response (status code and validation rules)

Format the response as a JSON array of test cases.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-json",
      messages: [
        {
          role: "system",
          content: "You are a QA automation expert who generates comprehensive API test cases. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from AI');

    const testCases = JSON.parse(response).testCases;
    return testCases.map((testCase: any) => TestCaseSchema.parse(testCase));
  } catch (error) {
    console.error('Error generating test cases:', error);
    throw error;
  }
}

export function validateTestCase(testCase: TestCase, response: any): boolean {
  // Validate status code
  if (response.status !== testCase.expectedResponse.status) {
    return false;
  }

  // Validate response data if validation rules exist
  if (testCase.expectedResponse.validation) {
    for (const rule of testCase.expectedResponse.validation) {
      const value = getValueByPath(response.data, rule.path);
      
      switch (rule.condition) {
        case 'equals':
          if (value !== rule.value) return false;
          break;
        case 'notEquals':
          if (value === rule.value) return false;
          break;
        case 'contains':
          if (!String(value).includes(String(rule.value))) return false;
          break;
        case 'greaterThan':
          if (!(value > rule.value)) return false;
          break;
        case 'lessThan':
          if (!(value < rule.value)) return false;
          break;
        case 'matches':
          if (!new RegExp(rule.value).test(String(value))) return false;
          break;
        case 'type':
          if (typeof value !== rule.value) return false;
          break;
      }
    }
  }

  return true;
}

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, part) => current?.[part], obj);
}