import { Response, ResponseAssertions, AssertionResults, BodyAssertion } from '../types';
import { getValueFromPath } from './jsonPaths';

export function validateResponse(
  response: Response,
  assertions: ResponseAssertions
): AssertionResults {
  const results: AssertionResults = {
    passed: true,
    details: {
      status: true,
      responseTime: true,
      headers: {},
      body: {}
    },
    failureMessages: []
  };

  // Validate status
  if (assertions.status !== undefined) {
    results.details.status = response.status === assertions.status;
    if (!results.details.status) {
      results.passed = false;
      results.failureMessages.push(
        `Expected status ${assertions.status}, but got ${response.status}`
      );
    }
  }

  // Validate response time
  if (assertions.responseTime !== undefined && 'responseTime' in response) {
    const actualTime = (response as any).responseTime;
    results.details.responseTime = actualTime <= assertions.responseTime;
    if (!results.details.responseTime) {
      results.passed = false;
      results.failureMessages.push(
        `Expected response time <= ${assertions.responseTime}s, but got ${actualTime.toFixed(2)}s`
      );
    }
  }

  // Validate headers
  if (assertions.headers) {
    Object.entries(assertions.headers).forEach(([key, expectedValue]) => {
      const actualValue = response.headers[key.toLowerCase()];
      results.details.headers![key] = actualValue === expectedValue;
      if (!results.details.headers![key]) {
        results.passed = false;
        results.failureMessages.push(
          `Expected header "${key}" to be "${expectedValue}", but got "${actualValue || 'undefined'}"`
        );
      }
    });
  }

  // Validate body
  if (assertions.body && response.data) {
    assertions.body.forEach((assertion: BodyAssertion) => {
      const actualValue = getValueFromPath(response.data, assertion.path);
      let passed = false;

      switch (assertion.operator) {
        case 'equals':
          passed = actualValue === assertion.value;
          break;
        case 'notEquals':
          passed = actualValue !== assertion.value;
          break;
        case 'contains':
          passed = Array.isArray(actualValue) 
            ? actualValue.includes(assertion.value)
            : String(actualValue).includes(String(assertion.value));
          break;
        case 'notContains':
          passed = Array.isArray(actualValue) 
            ? !actualValue.includes(assertion.value)
            : !String(actualValue).includes(String(assertion.value));
          break;
        case 'exists':
          passed = actualValue !== undefined;
          break;
        case 'notExists':
          passed = actualValue === undefined;
          break;
        case 'greaterThan':
          passed = Number(actualValue) > Number(assertion.value);
          break;
        case 'lessThan':
          passed = Number(actualValue) < Number(assertion.value);
          break;
        case 'matches':
          try {
            const regex = new RegExp(assertion.value);
            passed = regex.test(String(actualValue));
          } catch (e) {
            passed = false;
          }
          break;
      }

      results.details.body![assertion.path] = passed;
      if (!passed) {
        results.passed = false;
        results.failureMessages.push(
          `Assertion failed for "${assertion.path}": ${assertion.operator} ${assertion.value}`
        );
      }
    });
  }

  return results;
}