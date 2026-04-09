export interface PinningResponse {
  count: number;
  results: Array<PinRequest>;
}

export interface PinRequest {
  requestid: string;
  status: "queued" | "pinning" | "pinned" | "failed";
  created: string;
  pin: Pin;
  delegates: string[];
  info: PinInfo;
}

export interface Pin {
  cid: string;
  name: string;
  origins: string[];
  meta: {
    app_id: string;
    [key: string]: string;
  };
}

export interface DocumentPinningResponse {
  count: number;
  results: Array<DocumentPinRequest>;
}

export interface DocumentPinRequest {
  requestid: string;
  status: "queued" | "pinning" | "pinned" | "failed";
  created: string;
  pin: DocumentPin;
  delegates: string[];
  info: PinInfo;
}

export interface DocumentPin {
  cid: string;
  docId: string;
  name: string;
  origins: string[];
  meta: {
    app_id: string;
    timestamp: string;
    [key: string]: string;
  };
}

export interface PinInfo {
  status_details: string;
  [key: string]: string;
}
