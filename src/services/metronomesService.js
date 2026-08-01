import { apiRequest } from '../api/client';

const DEFAULT_ERROR_MESSAGE = 'No se pudieron cargar los metrónomos.';
const DEFAULT_CREATE_ERROR_MESSAGE = 'No se pudo crear el metrónomo.';
const DEFAULT_UPDATE_ERROR_MESSAGE = 'No se pudo actualizar el metrónomo.';
const DEFAULT_DELETE_ERROR_MESSAGE = 'No se pudo eliminar el metrónomo.';

export async function listMetronomes() {
  const body = await apiRequest('/api/v3/metronomes-user');

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_ERROR_MESSAGE);
}

export async function createMetronome({ title, artist, bpm }) {
  const body = await apiRequest('/api/v3/metronomes-user', {
    method: 'POST',
    body: { title, artist: artist || null, bpm: bpm || null },
  });

  if (body?.success === true) {
    return body.data;
  }

  const message =
    body?.errors?.title?.[0] || body?.errors?.message?.[0] || body?.message || DEFAULT_CREATE_ERROR_MESSAGE;
  throw new Error(message);
}

export async function updateMetronome(id, { title, artist, bpm }) {
  const body = await apiRequest(`/api/v3/metronomes-user/${id}`, {
    method: 'PUT',
    body: { title, artist: artist || null, bpm: bpm || null },
  });

  if (body?.success === true) {
    return body.data;
  }

  const message =
    body?.errors?.title?.[0] || body?.errors?.message?.[0] || body?.message || DEFAULT_UPDATE_ERROR_MESSAGE;
  throw new Error(message);
}

export async function deleteMetronome(id) {
  const body = await apiRequest(`/api/v3/metronomes-user/${id}`, {
    method: 'DELETE',
  });

  if (body?.success === true) {
    return true;
  }

  throw new Error(body?.message || DEFAULT_DELETE_ERROR_MESSAGE);
}
