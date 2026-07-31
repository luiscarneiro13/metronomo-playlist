const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// La API de Vemitienda siempre responde HTTP 200 (éxito y error). El body
// completo se devuelve tal cual para que cada servicio decida el resultado
// a partir de "success"/"errors", nunca del status HTTP.
export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}
