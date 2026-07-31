// Values are read as static `process.env.X` expressions so they survive the
// Edge runtime used by the proxy, which cannot resolve dynamic lookups.
function required(key: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const env = {
  get apiUrl() {
    return required("API_URL", process.env.API_URL);
  },
  get webUrl() {
    return required("WEB_URL", process.env.WEB_URL);
  },
  get apiKey() {
    return required("API_KEY", process.env.API_KEY);
  },
  get userId() {
    return required("USER_ID", process.env.USER_ID);
  },
  get appPassword() {
    return required("APP_PASSWORD", process.env.APP_PASSWORD);
  },
  get cookieSecret() {
    return required("COOKIE_SECRET", process.env.COOKIE_SECRET);
  },
};
