import { parse, validate, buildSchema, GraphQLError } from 'graphql';
import { GraphQLValidationResult } from '../types';

export function validateGraphQLQuery(query: string): GraphQLValidationResult {
  try {
    // Try to parse the query
    const ast = parse(query);
    return {
      isValid: true,
      ast
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof GraphQLError ? error.message : 'Invalid GraphQL query'
    };
  }
}

export function validateGraphQLVariables(variables: string): GraphQLValidationResult {
  try {
    // Try to parse the variables as JSON
    JSON.parse(variables);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid JSON format for variables'
    };
  }
}

export function formatGraphQLQuery(query: string): string {
  try {
    const ast = parse(query);
    return print(ast);
  } catch {
    return query;
  }
}