function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export const env = {
  apiUrl: require("API_URL"),
  apiKey: require("API_KEY"),
  userId: require("USER_ID"),
};
