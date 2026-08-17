import { router } from 'expo-router';
import { clearSession, getToken } from './auth';

export const API_BASE_URL =
  'https://my-fitness-api-123-f5gcbyb0bzaggwdm.italynorth-01.azurewebsites.net/api';

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  redirectOnUnauthorised?: boolean;
};

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, redirectOnUnauthorised = true } = options;

  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    const text = await response.text();

    if (redirectOnUnauthorised) {
      await clearSession();
      router.replace('/login');
      throw new ApiError(401, 'Your session has expired. Please log in again.');
    }

    throw new ApiError(401, text);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function apiGet<T = any>(path: string) {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T = any>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'POST', body });
}

export function apiPut<T = any>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'PUT', body });
}
