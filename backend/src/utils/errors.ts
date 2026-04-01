// Custom error classes for the Gestor Milhas API
// Error messages are in Portuguese (BR) as per project conventions

export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly code: string;
  readonly field?: string;
  readonly details?: Record<string, string>;

  constructor(
    message: string,
    code: string,
    options?: { field?: string; details?: Record<string, string> }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.field = options?.field;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(
    message: string,
    code: string = "VALIDATION_ERROR",
    options?: { field?: string; details?: Record<string, string> }
  ) {
    super(message, code, options);
  }
}

export class AuthenticationError extends AppError {
  readonly statusCode = 401;

  constructor(
    message: string = "Email ou senha inválidos",
    code: string = "AUTHENTICATION_ERROR"
  ) {
    super(message, code);
  }
}

export class AuthorizationError extends AppError {
  readonly statusCode = 403;

  constructor(
    message: string = "Acesso negado",
    code: string = "AUTHORIZATION_ERROR"
  ) {
    super(message, code);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(
    message: string = "Recurso não encontrado",
    code: string = "NOT_FOUND"
  ) {
    super(message, code);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(
    message: string,
    code: string = "CONFLICT",
    options?: { field?: string; details?: Record<string, string> }
  ) {
    super(message, code, options);
  }
}

export class BusinessRuleError extends AppError {
  readonly statusCode = 422;

  constructor(
    message: string,
    code: string = "BUSINESS_RULE_ERROR",
    options?: { field?: string; details?: Record<string, string> }
  ) {
    super(message, code, options);
  }
}

export class InternalError extends AppError {
  readonly statusCode = 500;

  constructor(
    message: string = "Erro interno do servidor",
    code: string = "INTERNAL_ERROR"
  ) {
    super(message, code);
  }
}
