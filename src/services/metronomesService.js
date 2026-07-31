import { apiRequest } from '../api/client';

const DEFAULT_ERROR_MESSAGE = 'No se pudieron cargar los metrónomos.';

export async function listMetronomes() {
  const body = await apiRequest('/api/v3/metronomes-user');

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_ERROR_MESSAGE);
}
