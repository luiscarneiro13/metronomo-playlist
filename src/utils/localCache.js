// Cache local de datos de negocio (metrónomos, playlists) para el modo
// offline: JSON plano por clave en el directorio de documentos de la app.
// A diferencia de assets/sounds cacheados en beepSynth.js (Paths.cache, que
// el SO puede purgar bajo presión de espacio), acá usamos Paths.document
// porque este cache tiene que sobrevivir para que la app sea usable sin
// conexión en un show en vivo.
import { Directory, File, Paths } from 'expo-file-system';

const cacheDir = new Directory(Paths.document, 'sync-cache');

function ensureDir() {
  if (!cacheDir.exists) {
    cacheDir.create({ intermediates: true });
  }
}

export function writeCache(key, data) {
  ensureDir();
  const file = new File(cacheDir, `${key}.json`);
  if (!file.exists) {
    file.create();
  }
  file.write(JSON.stringify({ syncedAt: new Date().toISOString(), data }));
}

export function readCache(key) {
  const file = new File(cacheDir, `${key}.json`);
  if (!file.exists) {
    return null;
  }
  try {
    return JSON.parse(file.textSync());
  } catch {
    return null;
  }
}

export function hasCache(key) {
  return new File(cacheDir, `${key}.json`).exists;
}

export function clearCache() {
  if (cacheDir.exists) {
    cacheDir.delete();
  }
}
