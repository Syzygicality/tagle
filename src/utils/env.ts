function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const env = {
  get apiUrl() {
    return require("API_URL");
  },
  get webUrl() {
    return require("WEB_URL");
  },
  get apiKey() {
    return require("API_KEY");
  },
  get userId() {
    return require("USER_ID");
  },
};
