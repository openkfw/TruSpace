import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContextStore {
  requestId: string;
  parentRequestId?: string;
  jobId?: string;
  requestMethod?: string;
  requestPath?: string;
  workspaceId?: string;
  docId?: string;
  cid?: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export const getRequestContext = (): RequestContextStore | undefined => {
  return requestContextStorage.getStore();
};

export const runWithRequestContext = <T>(
  context: RequestContextStore,
  callback: () => T,
): T => {
  return requestContextStorage.run(context, callback);
};

export const setRequestContext = (
  context: Partial<RequestContextStore>,
): RequestContextStore | undefined => {
  const currentContext = requestContextStorage.getStore();

  if (!currentContext) {
    return undefined;
  }

  Object.assign(currentContext, context);
  return currentContext;
};

export const createRequestContext = (
  context: Partial<RequestContextStore>,
): RequestContextStore | undefined => {
  const currentContext = requestContextStorage.getStore();

  if (!currentContext) {
    return undefined;
  }

  return {
    ...currentContext,
    ...context,
  };
};
