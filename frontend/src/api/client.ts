import axios, { type AxiosError, type AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const config = error.config as any;
    
    // Retry logic for network errors and 5xx errors
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    const shouldRetry = 
      (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
      config.retry < 3 &&
      !config.__isRetryRequest;
    
    if (shouldRetry) {
      config.retry += 1;
      config.__isRetryRequest = true;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, config.retry - 1) * 1000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(config);
    }
    
    const errorMessage = getErrorMessage(error);
    
    // Only show toast for non-401/403 errors (auth errors handled separately)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

function getErrorMessage(error: AxiosError<ApiError>): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data) {
    // Try to extract message from error object
    const data = error.response.data as unknown;
    if (typeof data === 'string') {
      return data;
    }
    if (typeof data === 'object' && data !== null && 'message' in data) {
      return String((data as { message: unknown }).message);
    }
  }
  
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in.';
      case 403:
        return 'Access denied. You don\'t have permission.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. This resource already exists.';
      case 422:
        return 'Validation error. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Error ${error.response.status}: ${error.response.statusText || 'Unknown error'}`;
    }
  }
  
  if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  }
  
  // Something else happened
  return error.message || 'An unexpected error occurred';
}

// Helper function to show success toast
export const showSuccessToast = (message: string) => {
  toast.success(message);
};

// Helper function to show error toast
export const showErrorToast = (message: string) => {
  toast.error(message);
};


