import axios from "axios";

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type ApiErrorBody = {
  message?: string | string[];
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return fallback;

  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message[0] ?? fallback;
  return message || fallback;
}
