import { envConfig } from "@/config";
import axios, { AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { parseMessage } from "@/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSession } from "next-auth/react";

type ApiResult<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: {
        message: string;
        status: number;
        details?: Record<string, unknown>;
      };
    };

export class ApiClient {
  static async request<T>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
    try {
      const isServer = typeof window === "undefined";
      const session = isServer
        ? await getServerSession(authOptions)
        : await getSession();

      const isFormData = config.data instanceof FormData;

      const client = axios.create({
        baseURL: envConfig.apiUrl,
        headers: {
          ...(config.data && !isFormData
            ? { "Content-Type": "application/json" }
            : {}),
          Authorization: `Bearer ${session?.user?.token}`,
        },
        // Add reasonable timeout to prevent long-hanging requests
        timeout: 15000, // 15 seconds
      });
      const response: AxiosResponse<T> = await client.request(config);
      return { data: response.data };
    } catch (err) {
      if (isAxiosError(err)) {
        return {
          error: {
            message: parseMessage(err.response?.data.message),
            details: err.response?.data.data,
            status: err.response?.status || 500,
          },
        };
      }
      console.log(err);
      return {
        error: {
          message: "An unknown error occurred",
          status: 500,
        },
      };
    }
  }

  static async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: Omit<AxiosRequestConfig, "method" | "url" | "params">,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "GET", url, params, ...config });
  }

  static async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: Omit<AxiosRequestConfig, "method" | "url" | "data">,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "POST", url, data, ...config });
  }

  static async put<T, D = unknown>(
    url: string,
    data?: D,
    config?: Omit<AxiosRequestConfig, "method" | "url" | "data">,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  static async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: Omit<AxiosRequestConfig, "method" | "url" | "data">,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "PATCH", url, data, ...config });
  }

  static async delete<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: Omit<AxiosRequestConfig, "method" | "url" | "params">,
  ): Promise<ApiResult<T>> {
    return this.request<T>({ method: "DELETE", url, params, ...config });
  }
}
