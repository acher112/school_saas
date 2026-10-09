/**
 * Frontend API client communicating with Django REST Framework backend.
 * Provides strict tenant isolation, session purging, and transparent 401 refresh handling.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let _inMemoryAccessToken: string | null = null;
let _inMemorySchoolSlug: string | null = null;
let _isRefreshing = false;

/**
 * Completely purges all session state, in-memory tokens, cached keys, and storage.
 * Guarantees zero cross-school session leakage.
 */
export function clearAllSessionData() {
  _inMemoryAccessToken = null;
  _inMemorySchoolSlug = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('school_access_token');
      sessionStorage.removeItem('school_tenant_slug');
      sessionStorage.removeItem('current_user_profile');
      // Purge any remaining session storage keys
      sessionStorage.clear();
      // Purge local storage
      localStorage.removeItem('school_tenant_slug');
      localStorage.removeItem('school_access_token');
    } catch (e) {
      console.warn('Storage purge warning:', e);
    }
  }
}

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
    const stored = sessionStorage.getItem('school_access_token');
    if (stored) {
      _inMemoryAccessToken = stored;
      return stored;
    }
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
    const stored = sessionStorage.getItem('school_tenant_slug');
    if (stored) {
      _inMemorySchoolSlug = stored;
      return stored;
    }
  }
  return null;
}

export interface LoginResponse {
  access: string;
  refresh?: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    preferred_language: string;
    school_id?: string;
    school_name?: string;
    school_slug?: string;
    school?: {
      id: string;
      name: string;
      slug: string;
      brand_primary_color: string;
      brand_accent_color: string;
    } | null;
  };
}

/**
 * Standard API request wrapper with:
 * 1. Automatic JWT Bearer token injection
 * 2. Automatic tenant header injection
 * 3. Silent 401 token refresh with transparent retry
 * 4. Automatic session purge and hard redirect to /login if unauthenticated
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  schoolSlug?: string,
  retryCount = 0
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const slug = schoolSlug || getSchoolSlug();
  if (slug) {
    headers.set('X-School-Slug', slug);
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Handle 401 Unauthorized with silent refresh
  if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/signup/')) {
    if (!_isRefreshing) {
      _isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access) {
            setAccessToken(refreshData.access);
            _isRefreshing = false;
            // Retry the original request once
            return apiRequest<T>(endpoint, options, schoolSlug, retryCount + 1);
          }
        }
      } catch (refreshErr) {
        // Refresh failed
      } finally {
        _isRefreshing = false;
      }
    }

    // Refresh failed or not possible -> purge session cleanly and hard navigate to login
    clearAllSessionData();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = { detail: response.statusText };
  }

  if (!response.ok) {
    let errMsg = data.detail || data.message;
    if (!errMsg && data.errors && typeof data.errors === 'object') {
      const fieldErrors = Object.entries(data.errors).map(([field, errs]) => {
        const msg = Array.isArray(errs) ? errs.join(', ') : (typeof errs === 'object' ? JSON.stringify(errs) : String(errs));
        const cleanField = field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `${cleanField}: ${msg}`;
      });
      errMsg = fieldErrors.join(' | ');
    } else if (!errMsg && typeof data === 'object' && data !== null) {
      const entries = Object.entries(data).filter(([k]) => k !== 'success' && k !== 'error');
      if (entries.length > 0) {
        errMsg = entries.map(([field, errs]) => {
          const msg = Array.isArray(errs) ? errs.join(', ') : (typeof errs === 'object' ? JSON.stringify(errs) : String(errs));
          const cleanField = field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
          return `${cleanField}: ${msg}`;
        }).join(' | ');
      }
    }

    const error: any = new Error(errMsg || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Securely signs out the user:
 * 1. Calls the backend logout endpoint to clear the httpOnly cookie
 * 2. Wipes in-memory tokens, session storage, and local storage
 * 3. Executes a hard navigation to /login to flush Next.js module state
 */
export async function performLogout() {
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Ignore network error on logout
  }
  clearAllSessionData();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function loginUser(credentials: { username: string; password: string; school_code?: string }): Promise<LoginResponse> {
  // Clear any existing session before logging in
  clearAllSessionData();

  const result = await apiRequest<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  setAccessToken(result.access);

  const slug = result.user?.school?.slug || result.user?.school_slug;
  if (slug) {
    setSchoolSlug(slug);
  }

  return result;
}
