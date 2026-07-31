const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

let authToken = null;
let sessionExpiredHandler = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// Llamado por AuthContext para reaccionar a un token vencido (único caso en
// el que el cliente sí mira el status HTTP, según las reglas de la API).
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
}

// La API de Vemitienda siempre responde HTTP 200 (éxito y error). El body
// completo se devuelve tal cual para que cada servicio decida el resultado
// a partir de "success"/"errors", nunca del status HTTP — salvo 401, que
// indica token vencido y dispara el logout de sesión.
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

  if (response.status === 401) {
    sessionExpiredHandler?.();
    throw new Error('Sesión vencida. Volvé a iniciar sesión.');
  }

  return response.json();
}
