export const YOURFORM_TOKEN_KEY = "yourform.session";

export const getAuthToken = () => {
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem(YOURFORM_TOKEN_KEY) ?? undefined;
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(YOURFORM_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(YOURFORM_TOKEN_KEY);
};
