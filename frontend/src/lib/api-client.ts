import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: ApiError['details'],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    const data = err.response?.data;
    if (data && data.success === false) {
      throw new ApiClientError(data.statusCode ?? err.response?.status ?? 500, data.error, data.details);
    }
    throw new ApiClientError(err.response?.status ?? 500, err.message);
  },
);

export async function swrFetcher<T>(url: string): Promise<T> {
  const res = await http.get<{ success: true; data: T }>(url);
  return res.data.data;
}

export const apiClient = {
  get: async <T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> => {
    const res = await http.get<{ success: true; data: T }>(path, { params });
    return res.data.data;
  },
  post: async <T>(path: string, body?: unknown): Promise<T> => {
    const res = await http.post<{ success: true; data: T }>(path, body);
    return res.data.data;
  },
};
