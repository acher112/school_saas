/**
 * Frontend API client communicating with Django REST Framework backend.
 * Tokens are strictly NOT stored in localStorage (preventing XSS token exfiltration).
 * Ready for httpOnly cookie authentication or in-memory access token.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let _inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return _inMemoryAccessToken;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    preferred_language: string;
    school: {
      id: string;
      name: string;
      slug: string;
      brand_primary_color: string;
      brand_accent_color: string;
    } | null;
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schoolSlug?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');

  if (schoolSlug) {
    headers.set('X-School-Slug', schoolSlug);
  }

  // Inject in-memory access token if available
  if (_inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${_inMemoryAccessToken}`);
  }

  // Include credentials for httpOnly cookie transmission
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'API request failed');
  }

  return data;
}

export async function loginUser(credentials: { username: string; password: string }): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Store access token strictly in memory (never in localStorage)
  setAccessToken(result.access);

  return result;
}
