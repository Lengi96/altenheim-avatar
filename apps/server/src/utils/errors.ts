type ErrorLike = {
  code?: unknown;
  message?: unknown;
};

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as ErrorLike;
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message : '';

  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === '57P01' ||
    message.includes('ECONNREFUSED') ||
    message.includes('connect')
  );
}
