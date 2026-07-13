export function toUuidOrNull(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(text) ? text : null;
}

export function getMissingOrdersColumn(error: { message?: string } | null) {
  const message = String(error?.message ?? '');
  const match = message.match(/column\s+orders\.([a-z_]+)\s+does not exist/i);
  if (match?.[1]) {
    return match[1];
  }

  const schemaCacheMatch = message.match(/could not find the '([a-z_]+)' column of 'orders' in the schema cache/i);
  return schemaCacheMatch?.[1] ?? '';
}

export function getMissingEstateBatchColumn(error: { message?: string } | null) {
  const message = String(error?.message ?? '');
  const match = message.match(/column\s+estate_batches\.([a-z_]+)\s+does not exist/i);
  return match?.[1] ?? '';
}

export function getMissingTableColumn(error: { message?: string } | null, tableName: string) {
  const message = String(error?.message ?? '');
  const regex = new RegExp(`column\\s+${tableName}\\.([a-z_]+)\\s+does not exist`, 'i');
  const match = message.match(regex);
  if (match?.[1]) {
    return match[1];
  }

  const schemaCacheRegex = new RegExp(`could not find the '([a-z_]+)' column of '${tableName}' in the schema cache`, 'i');
  const schemaCacheMatch = message.match(schemaCacheRegex);
  return schemaCacheMatch?.[1] ?? '';
}

export function isMissingTableError(error: { message?: string } | null, tableName: string) {
  const message = String(error?.message ?? '').toLowerCase();
  const schemaCachePattern = `could not find the table 'public.${tableName}' in the schema cache`;
  const relationPattern = `relation \"public.${tableName}\" does not exist`;
  return message.includes(schemaCachePattern) || message.includes(relationPattern);
}

export function resolveOptionalTableResult<T = any>(
  result: { data: T[] | null; error: { message?: string } | null },
  tableName: string
) {
  if (!result.error) {
    return result.data ?? [];
  }

  if (isMissingTableError(result.error, tableName)) {
    return [] as T[];
  }

  throw new Error(result.error.message ?? `Failed to load ${tableName}.`);
}
