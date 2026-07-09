import {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

import logger from "../config/winston";
import { getRequestContext } from "./request-context";

type LoggedRequestMetadata = {
  startedAt: number;
  requestId?: string;
  parentRequestId?: string;
  targetService: string;
};

type LoggedRequestConfig = InternalAxiosRequestConfig & {
  metadata?: LoggedRequestMetadata;
};

const REQUEST_ID_HEADER = "X-Request-ID";
const PARENT_REQUEST_ID_HEADER = "X-Parent-Request-ID";

const setHeader = (
  config: InternalAxiosRequestConfig,
  name: string,
  value: string,
) => {
  if (!config.headers) {
    config.headers = AxiosHeaders.from({
      [name]: value,
    });
    return;
  }

  if (typeof config.headers.set === "function") {
    config.headers.set(name, value);
    return;
  }

  (config.headers as Record<string, string>)[name] = value;
};

const getRequestUrl = (config: InternalAxiosRequestConfig): string | undefined => {
  const { baseURL, url } = config;

  if (!url) {
    return baseURL;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!baseURL) {
    return url;
  }

  try {
    return new URL(url, baseURL).toString();
  } catch {
    return `${baseURL}${url}`;
  }
};

const getDurationMs = (config?: LoggedRequestConfig): number | undefined => {
  const startedAt = config?.metadata?.startedAt;

  if (!startedAt) {
    return undefined;
  }

  return Date.now() - startedAt;
};

const getRequestMetadata = (config?: LoggedRequestConfig) => {
  return {
    requestId: config?.metadata?.requestId,
    parentRequestId: config?.metadata?.parentRequestId,
    targetService: config?.metadata?.targetService,
  };
};

export const attachHttpClientLogging = (
  client: AxiosInstance,
  targetService: string,
) => {
  client.interceptors.request.use(
    (config) => {
      const requestContext = getRequestContext();
      const requestConfig = config as LoggedRequestConfig;

      requestConfig.metadata = {
        startedAt: Date.now(),
        requestId: requestContext?.requestId,
        parentRequestId: requestContext?.parentRequestId,
        targetService,
      };

      if (requestContext?.requestId) {
        setHeader(config, REQUEST_ID_HEADER, requestContext.requestId);
      }

      if (requestContext?.parentRequestId) {
        setHeader(
          config,
          PARENT_REQUEST_ID_HEADER,
          requestContext.parentRequestId,
        );
      }

      logger.debug("outbound_request_started", {
        ...getRequestMetadata(requestConfig),
        method: (config.method || "get").toUpperCase(),
        url: getRequestUrl(config),
      });

      return config;
    },
    (error: AxiosError | Error) => {
      logger.warn("outbound_request_setup_failed", {
        targetService,
        error,
      });
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => {
      const requestConfig = response.config as LoggedRequestConfig;

      logger.debug("outbound_request_completed", {
        ...getRequestMetadata(requestConfig),
        method: (response.config.method || "get").toUpperCase(),
        url: getRequestUrl(response.config),
        statusCode: response.status,
        durationMs: getDurationMs(requestConfig),
      });

      return response;
    },
    (error: AxiosError | Error) => {
      const responseError = error as AxiosError;
      const requestConfig = responseError.config as LoggedRequestConfig | undefined;

      logger.warn("outbound_request_failed", {
        ...getRequestMetadata(requestConfig),
        method: requestConfig?.method?.toUpperCase(),
        url: requestConfig ? getRequestUrl(requestConfig) : undefined,
        statusCode: responseError.response?.status,
        durationMs: getDurationMs(requestConfig),
        error,
      });

      return Promise.reject(error);
    },
  );
};
