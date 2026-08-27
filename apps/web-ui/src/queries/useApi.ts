import axios from "axios";
import type { AxiosInstance } from "axios";
import TokenService from "./token/tokenService";

interface ApiError {
    message: string;
    status?: number;
    code?: string;
    [key: string]: unknown;  // allow extra fields like existingSchedule
}

// Service types for different microservices
type ServiceType = "auth" | "user" | "platform" | "academics" | "transport" | "payment" | "chat" | "notification";

// Get base URL for each service from environment variables
const getServiceUrl = (service: ServiceType): string => {
    switch (service) {
        case "auth":
            return import.meta.env.VITE_AUTH_API_URL || "http://localhost:5001";
        case "user":
            return import.meta.env.VITE_USER_API_URL || "http://localhost:5002";
        case "platform":
            return import.meta.env.VITE_PLATFORM_API_URL || "http://localhost:5000";
        case "academics":
            return import.meta.env.VITE_ACADEMICS_API_URL || "http://localhost:5003";
        case "transport":
            return import.meta.env.VITE_TRANSPORT_API_URL || "http://localhost:5004";
        case "payment":
            return import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:5005";
        case "chat":
            return import.meta.env.VITE_CHAT_API_URL || "http://localhost:5007";
        case "notification":
            return import.meta.env.VITE_NOTIF_API_URL || "http://localhost:5008";
        default:
            return import.meta.env.VITE_PLATFORM_API_URL || "http://localhost:5000";
    }
};

/**
 * Auto-detect service based on API path
 * - /api/auth/* → auth service
 * - /api/academics/* → academics service (timetable, etc.)
 * - /api/school/* → user service (teachers, students, parents)
 * - /api/admin/* → platform service (schools, school admins)
 * - /api/chat/* → chat service
 * - /push/* or /api/push/* → notification service
 * - *contains /fees* → payment service
 */
const detectServiceFromPath = (path: string): ServiceType => {
    if (path.includes("/fees")) {
        return "payment";
    }
    if (path.startsWith("/api/chat")) {
        return "chat";
    }
    if (path.startsWith("/api/push") || path.startsWith("/push")) {
        return "notification";
    }
    if (path.startsWith("/api/auth")) {
        return "auth";
    }
    // Check for academics paths (timetable, homework, etc.)
    if (path.startsWith("/api/academics")) {
        return "academics";
    }
    if (path.startsWith("/api/school")) {
        return "user";
    }
    if (path.startsWith("/api/transport")) {
        return "transport";
    }
    if (path.startsWith("/api/roles")) {
        return "user";
    }
    // Default: /api/admin/* and others go to platform
    return "platform";
};

// URL Normalizer — ensures valid protocol to prevent relative URL requests in production (e.g. Vercel)
const normalizeUrl = (url: string): string => {
    let trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        trimmed = `https://${trimmed}`;
    }
    return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

// Create axios instance with interceptor
const createApiInstance = (baseURL: string): AxiosInstance => {
    const normalizedBaseUrl = normalizeUrl(baseURL);

    const instance = axios.create({
        baseURL: normalizedBaseUrl,
        headers: {
            "Content-Type": "application/json",
        },
    });

    // Add request interceptor to include auth token
    instance.interceptors.request.use(
        (config) => {
            const token = TokenService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    return instance;
};

// Cache for axios instances per service
const apiInstances: Partial<Record<ServiceType, AxiosInstance>> = {};

// Get or create axios instance for a service
const getApiInstance = (service: ServiceType): AxiosInstance => {
    if (!apiInstances[service]) {
        apiInstances[service] = createApiInstance(getServiceUrl(service));
    }
    return apiInstances[service]!;
};

/**
 * Make API request - automatically routes to correct service based on path
 * 
 * @param method - HTTP method
 * @param path - API path (service is auto-detected from path)
 * @param data - Request body
 * @param params - Query parameters
 * 
 * Path Routing:
 * - /api/auth/*  → AUTH service (login, verify-token)
 * - /api/school/* → USER service (teachers, students, parents)
 * - /api/admin/* → PLATFORM service (schools, school admins)
 * 
 * Examples:
 * useApi("POST", "/api/auth/login", data)           → auth service
 * useApi("GET", "/api/school/SCHL00001/teachers")   → user service
 * useApi("GET", "/api/admin/school")                → platform service
 */
import { useGlobalErrorStore } from "../stores/globalErrorStore";

const useApi = async <T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    data?: unknown,
    params?: Record<string, unknown>
): Promise<T> => {
    try {
        const service = detectServiceFromPath(path);
        const api = getApiInstance(service);

        const response = await api.request<T>({
            method,
            url: path,
            data,
            params,
        });

        // Record successful API call to clear any error counts
        useGlobalErrorStore.getState().recordSuccess();

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Check for network/CORS errors (no response)
            if (!error.response) {
                console.error("Network/CORS error:", error.message);
                const networkError = {
                    message: "Unable to connect to server. Please check your network connection.",
                    status: 0
                };
                useGlobalErrorStore.getState().recordFailure(networkError, path);
                throw networkError;
            }
            const responseData = error.response?.data || {};
            const apiError: ApiError = {
                ...responseData,                                          // forward all backend fields (code, existingSchedule, etc.)
                message: responseData?.message || "An error occurred",
                status: error.response?.status,
            };
            useGlobalErrorStore.getState().recordFailure(apiError, path);
            throw apiError;
        }
        const genericError = { message: "An error occurred", status: 500 };
        useGlobalErrorStore.getState().recordFailure(genericError, path);
        throw genericError;
    }
};

export default useApi;