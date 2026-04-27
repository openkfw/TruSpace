import FormData from 'form-data';

import { File } from '../../../types/interfaces/truspace';

type MetadataValue = string | number | boolean | null | undefined;

interface BuildMetadataQueryOptions {
  encodeAllValues?: boolean;
  encodeValueKeys?: string[];
}

interface CreateJsonFormDataOptions {
  contentType?: string;
  filename?: string;
}

export function buildMetadataQuery<T extends object>(
  metadata: T,
  options: BuildMetadataQueryOptions = {},
): string {
  const { encodeAllValues = false, encodeValueKeys = [] } = options;
  const encodedKeys = new Set(encodeValueKeys);

  return Object.entries(metadata as Record<string, MetadataValue>).reduce((query, [key, value]) => {
    const metadataValue = String(value);
    const formattedValue =
      encodeAllValues || encodedKeys.has(key) ? encodeURIComponent(metadataValue) : metadataValue;

    return `${query}&meta-${key}=${formattedValue}`;
  }, '');
}

export function createJsonFormData(payload: unknown, options: CreateJsonFormDataOptions = {}): FormData {
  const form = new FormData();
  const { contentType = 'application/json', filename } = options;

  form.append('file', JSON.stringify(payload, null), {
    contentType,
    ...(filename ? { filename } : {}),
  });

  return form;
}

export function createFileFormData(file: File): FormData {
  const form = new FormData();

  form.append('file', file.data, {
    filename: file.name,
    contentType: file.mimetype,
  });

  return form;
}
