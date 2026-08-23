const ALLOWED_RETURN_TO_PATHS = new Set(["/connect-line"]);

export function getSafeReturnTo(returnTo: string | string[] | undefined) {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  if (!value || !ALLOWED_RETURN_TO_PATHS.has(value)) {
    return null;
  }

  return value;
}
