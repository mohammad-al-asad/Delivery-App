const INVALID_TOKEN_VALUES = new Set([
  "",
  "undefined",
  "null",
  "false",
  "true",
  "[object object]",
]);

const normalizeToken = (token) => {
  if (typeof token !== "string") return "";
  return token.trim();
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payload.padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      "=",
    );
    const decodedPayload = atob(paddedPayload);

    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
};

export const isValidAccessToken = (token) => {
  const normalizedToken = normalizeToken(token);

  if (INVALID_TOKEN_VALUES.has(normalizedToken.toLowerCase())) {
    return false;
  }

  const payload = decodeJwtPayload(normalizedToken);
  if (!payload) {
    return false;
  }

  if (payload.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return true;
};

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const getValidAccessToken = (...tokens) => {
  const validToken = tokens.find(isValidAccessToken);
  return validToken ? normalizeToken(validToken) : null;
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userData");
};
