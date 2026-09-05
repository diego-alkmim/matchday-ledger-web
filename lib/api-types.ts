import axios from "axios";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type ApiErrorBody = {
  message?: unknown;
};

type ValidationIssue = {
  code?: string;
  minimum?: number;
  path?: readonly unknown[];
  validation?: string;
};

function getValidationMessage(issue: ValidationIssue): string | null {
  const firstPathSegment = issue.path?.[0];
  const field = typeof firstPathSegment === "string" ? firstPathSegment : undefined;

  if (field === "email" && issue.validation === "email") {
    return "Informe um e-mail válido.";
  }

  if (field === "password" && issue.code === "too_small") {
    const minimum = typeof issue.minimum === "number" ? issue.minimum : 8;
    return `A senha deve ter pelo menos ${minimum} caracteres.`;
  }

  return null;
}

function parseValidationMessage(message: unknown): string | null {
  const parsedMessage =
    typeof message === "string" && (message.startsWith("[") || message.startsWith("{"))
      ? safeJsonParse(message)
      : message;

  const issues = Array.isArray(parsedMessage) ? parsedMessage : [parsedMessage];

  for (const issue of issues) {
    if (issue && typeof issue === "object") {
      const validationMessage = getValidationMessage(issue as ValidationIssue);
      if (validationMessage) return validationMessage;
    }
  }

  return null;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;

  const message = error.response?.data?.message;
  const validationMessage = parseValidationMessage(message);
  if (validationMessage) return validationMessage;

  if (Array.isArray(message)) {
    const firstMessage = message.find((item): item is string => typeof item === "string");
    return firstMessage ?? fallback;
  }

  return typeof message === "string" ? message : fallback;
}