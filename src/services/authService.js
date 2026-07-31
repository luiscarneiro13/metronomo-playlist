import { apiRequest } from '../api/client';

const DEFAULT_ERROR_MESSAGE = 'No se pudo iniciar sesión. Intenta nuevamente.';

// El endpoint /api/v3/login siempre responde HTTP 200. La única forma válida
// de saber si funcionó es el campo "success" del body: su ausencia (junto
// con la presencia de "errors") indica que las credenciales fallaron.
export async function login(email, password) {
  const body = await apiRequest('/api/v3/login', {
    method: 'POST',
    body: { email, password },
  });

  if (body?.success === true) {
    return body.data;
  }

  const message = body?.errors?.message?.[0] || body?.errors?.email?.[0] || DEFAULT_ERROR_MESSAGE;
  throw new Error(message);
}

export async function logout() {
  await apiRequest('/api/v3/logout', { method: 'POST' });
}
