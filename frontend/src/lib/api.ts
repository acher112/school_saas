/**
 * Frontend API client communicating with Django REST Framework backend.
 * Tokens are strictly NOT stored in localStorage (preventing XSS token exfiltration).
 * Ready for httpOnly cookie authentication or in-memory access token.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let _inMemoryAccessToken: string | null = null;
let _inMemorySchoolSlug: string | null = null;

export function setAccessToken(token: string | null) {
  _inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('school_access_token', token);
    } else {
      sessionStorage.removeItem('school_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  if (_inMemoryAccessToken) return _inMemoryAccessToken;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('school_access_token');
  }
  return null;
}

export function setSchoolSlug(slug: string | null) {
  _inMemorySchoolSlug = slug;
  if (typeof window !== 'undefined') {
    if (slug) {
      sessionStorage.setItem('school_tenant_slug', slug);
    } else {
      sessionStorage.removeItem('school_tenant_slug');
    }
  }
}

export function getSchoolSlug(): string | null {
  if (_inMemorySchoolSlug) return _inMemorySchoolSlug;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('school_tenant_slug');
  }
  return null;
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

  const slug = schoolSlug || getSchoolSlug();
  if (slug) {
    headers.set('X-School-Slug', slug);
  }

  // Inject access token if available
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Include credentials for httpOnly cookie transmission
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.detail || data.message || 'API request failed');
    error.status = response.status;
    error.data = data;
    throw error;
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
