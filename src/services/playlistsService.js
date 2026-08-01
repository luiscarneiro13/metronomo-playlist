import { apiRequest } from '../api/client';

const DEFAULT_ERROR_MESSAGE = 'No se pudieron cargar las playlists.';
const DEFAULT_DETAIL_ERROR_MESSAGE = 'No se pudo cargar la playlist.';
const DEFAULT_CREATE_ERROR_MESSAGE = 'No se pudo crear la playlist.';
const DEFAULT_ADD_SONG_ERROR_MESSAGE = 'No se pudo agregar la canción a la playlist.';
const DEFAULT_REORDER_ERROR_MESSAGE = 'No se pudo reordenar la playlist.';
const DEFAULT_REMOVE_SONG_ERROR_MESSAGE = 'No se pudo quitar la canción de la playlist.';

export async function listPlaylists() {
  const body = await apiRequest('/api/v3/playlists-user');

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_ERROR_MESSAGE);
}

export async function getPlaylist(id) {
  const body = await apiRequest(`/api/v3/playlists-user/${id}`);

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_DETAIL_ERROR_MESSAGE);
}

export async function createPlaylist({ name, description }) {
  const body = await apiRequest('/api/v3/playlists-user', {
    method: 'POST',
    body: { name, description },
  });

  if (body?.success === true) {
    return body.data;
  }

  const message =
    body?.errors?.name?.[0] || body?.errors?.message?.[0] || body?.message || DEFAULT_CREATE_ERROR_MESSAGE;
  throw new Error(message);
}

export async function addSongToPlaylist(playlistId, metronomeId) {
  const body = await apiRequest(`/api/v3/playlists-user/${playlistId}/metronomes/${metronomeId}`, {
    method: 'POST',
  });

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_ADD_SONG_ERROR_MESSAGE);
}

export async function removeSongFromPlaylist(playlistId, metronomeId) {
  const body = await apiRequest(`/api/v3/playlists-user/${playlistId}/metronomes/${metronomeId}`, {
    method: 'DELETE',
  });

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_REMOVE_SONG_ERROR_MESSAGE);
}

export async function reorderPlaylist(playlistId, order) {
  const body = await apiRequest(`/api/v3/playlists-user/${playlistId}/reorder`, {
    method: 'POST',
    body: { order },
  });

  if (body?.success === true) {
    return body.data;
  }

  throw new Error(body?.message || DEFAULT_REORDER_ERROR_MESSAGE);
}
