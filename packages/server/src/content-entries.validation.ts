import type { ContentTypeFieldDefinition } from './content-entries.routes.type.js';
import type { MediaFilesLookup } from './content-entries.routes.type.js';
import type { EntryValidationResult } from './content-entries.validation.type.js';

export function validateEntryData(
  fields: readonly ContentTypeFieldDefinition[],
  data: unknown,
  mediaFiles?: MediaFilesLookup,
): EntryValidationResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      error: {
        message: 'Entry data must be an object',
        statusCode: 400,
      },
      value: null,
    };
  }

  const payload = data as Record<string, unknown>;
  const allowedKeys = new Set(fields.map((field) => field.key));

  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) {
      return {
        error: {
          message: `Unknown field: ${key}`,
          statusCode: 400,
        },
        value: null,
      };
    }
  }

  for (const field of fields) {
    const value = payload[field.key];

    if (field.required && isMissingValue(field, value)) {
      return {
        error: {
          message: `Missing required field: ${field.label}`,
          statusCode: 400,
        },
        value: null,
      };
    }

    const error = validateFieldValue(field, value, mediaFiles);
    if (error) {
      return {
        error,
        value: null,
      };
    }
  }

  return {
    error: null,
    value: payload,
  };
}

function validateFieldValue(
  field: ContentTypeFieldDefinition,
  value: unknown,
  mediaFiles?: MediaFilesLookup,
): { message: string; statusCode: 400 } | null {
  if (isMissingValue(field, value)) {
    return null;
  }

  if (field.repeatable) {
    if (!Array.isArray(value)) {
      return {
        message: `Field must be repeatable array: ${field.label}`,
        statusCode: 400,
      };
    }

    for (const item of value) {
      if (!isScalarValue(field.type, item)) {
        return {
          message: `Invalid repeatable field value: ${field.label}`,
          statusCode: 400,
        };
      }

      if (field.type === 'media' && mediaFiles && !mediaFiles.get(String(item))) {
        return {
          message: `Invalid repeatable field value: ${field.label}`,
          statusCode: 400,
        };
      }
    }

    return null;
  }

  if (!isScalarValue(field.type, value)) {
    return {
      message: `Invalid field type: ${field.label}`,
      statusCode: 400,
    };
  }

  if (field.type === 'media' && mediaFiles && !mediaFiles.get(String(value))) {
    return {
      message: `Invalid media field value: ${field.label}`,
      statusCode: 400,
    };
  }

  return null;
}

function isMissingValue(field: ContentTypeFieldDefinition, value: unknown): boolean {
  if (field.repeatable) {
    return value === undefined || value === null;
  }

  return value === undefined || value === null || value === '';
}

function isScalarValue(type: ContentTypeFieldDefinition['type'], value: unknown): boolean {
  switch (type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'date':
      return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
    case 'media':
      return typeof value === 'string' && value.length > 0;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'relation':
    case 'richtext':
    case 'text':
      return typeof value === 'string';
    default:
      return false;
  }
}
