Necesito que implementes el módulo de Metrónomos y Playlists contra la API de
Vemitienda. Estos son los endpoints exactos — todos requieren autenticación
(mismo Bearer token que devuelve /api/v3/login) y siguen la misma convención
de respuesta que el resto de la API: casi siempre HTTP 200, y el éxito/error
se determina por el campo "success" del body, NO por el status code HTTP
(excepto 401 si el token falta/expiró, y 403 en violaciones de autorización).

Headers en TODAS las peticiones:
  Authorization: Bearer {token}
  Accept: application/json
  Content-Type: application/json   (en POST/PUT con body)

Base URL: {BASE_URL}/api/v3

================================================================================
METRÓNOMOS (canciones con o sin BPM)
================================================================================

## Listar mis metrónomos
GET /metronomes-user

Respuesta (200, success:true):
{
  "status": 200,
  "message": "Operación exitosa",
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "title": "Knockin' On Heaven's Door",
      "artist": "Guns N' Roses",
      "bpm": 65,
      "has_metronome": true,
      "created_at": "...",
      "updated_at": "..."
    },
    {
      "id": 7,
      "title": "Solo listada",
      "artist": null,
      "bpm": null,
      "has_metronome": false,
      ...
    }
  ]
}

- "has_metronome" es la bandera clave: si es false, la canción NO tiene BPM
  (se agregó solo para llevar el listado dentro de una playlist) — no mostrar
  botón de Play ni campo BPM en la UI para esos casos.
- Solo devuelve los metrónomos del usuario autenticado (scoping automático,
  no hace falta mandar user_id).

## Crear un metrónomo
POST /metronomes-user

Body:
{
  "title": "Bohemian Rhapsody",   // requerido, string, máx 150
  "artist": "Queen",              // opcional, string, máx 150
  "bpm": 120                      // opcional (20-300). Omitir o null = "sin metrónomo"
}

Éxito (200): mismo shape que un objeto de la lista de arriba, en "data".

Error de validación (200, pero success ausente / hay "errors"):
{
  "errors": {
    "title": ["El título de la canción es obligatorio"],
    "message": ["Datos erróneos"]
  },
  "status": 400
}
- Detectá error de validación por la presencia de la clave "errors" en el body
  (no hay "success" en este shape).

## Editar un metrónomo propio
PUT /metronomes-user/{id}
Body: igual que crear (title, artist, bpm).
Éxito: mismo shape, "data" con el registro actualizado.
Si el {id} no es tuyo: {"status":200,"message":"This action is unauthorized.","success":false,"error":null}

## Eliminar un metrónomo propio
DELETE /metronomes-user/{id}
Éxito: {"status":200,"message":"Operación exitosa","success":true,"data":null}

================================================================================
PLAYLISTS
================================================================================

## Listar mis playlists
GET /playlists-user

Respuesta:
{
  "status": 200, "message": "Operación exitosa", "success": true,
  "data": [
    {
      "id": 4, "user_id": 2,
      "name": "Ensayo banda", "slug": "ensayo-banda",
      "description": "...",
      "metronomes_count": 3,
      "created_at": "...", "updated_at": "..."
    }
  ]
}
- "metronomes_count" viene precalculado, no hace falta pedir el detalle para
  mostrar la cantidad de canciones en un listado.
- "slug" sirve para armar el link público de solo-lectura de la playlist
  (no requiere login): {WEB_BASE_URL}/playlist/{slug}

## Crear una playlist
POST /playlists-user
Body:
{
  "name": "Ensayo banda",              // requerido, string, máx 150
  "description": "Para el sábado"      // opcional, string, máx 1000
}
Éxito: "data" con la playlist creada (sin "metronomes" todavía, recién creada).

## Ver una playlist con sus canciones (ya ordenadas)
GET /playlists-user/{id}

Respuesta:
{
  "status": 200, "success": true,
  "data": {
    "id": 4, "name": "...", "description": "...", "slug": "...",
    "metronomes": [
      {
        "id": 6, "title": "...", "artist": "...", "bpm": 150,
        "has_metronome": true,
        "pivot": { "playlist_id": 4, "metronome_id": 6, "position": 1, ... }
      },
      { "id": 7, "title": "Solo listada", "bpm": null, "has_metronome": false,
        "pivot": { "position": 2, ... } }
    ]
  }
}
- El array "metronomes" ya viene ORDENADO por "pivot.position" — no hace falta
  reordenar en el cliente, solo respetar el orden del array para pintar la
  lista y para el reorder (ver más abajo).

## Editar nombre/descripción de una playlist propia
PUT /playlists-user/{id}
Body: { "name": "...", "description": "..." }

## Eliminar una playlist propia
DELETE /playlists-user/{id}
Éxito: {"success":true,"data":null}

## Agregar una canción propia a una playlist propia
POST /playlists-user/{playlistId}/metronomes/{metronomeId}
Sin body.
Éxito: "data" = la playlist completa con "metronomes" actualizado (incluye la
recién agregada al final, con su "pivot.position").
- Si {metronomeId} no es tuyo, o {playlistId} no es tuya: error de
  autorización (mismo shape que arriba, "success":false).

## Quitar una canción de una playlist propia
DELETE /playlists-user/{playlistId}/metronomes/{metronomeId}
Sin body. Éxito: igual que attach, "data" con el listado actualizado.

## Reordenar canciones (drag & drop) de una playlist propia
POST /playlists-user/{id}/reorder
Body:
{
  "order": [7, 6, 12]   // array de ids de metrónomo, en el orden final deseado
}
- Mandá TODOS los ids visibles en la playlist en el nuevo orden tras el
  drag & drop del usuario (no hace falta mandar posición, solo el orden del
  array).
- Cualquier id que no pertenezca a esa playlist se ignora silenciosamente en
  el servidor (no rompe la llamada).
Éxito: "data" = la playlist con "metronomes" ya reordenado según lo enviado.

================================================================================
REGLAS GENERALES PARA EL CLIENTE
================================================================================

1. Todo es scoped al usuario autenticado automáticamente — nunca vas a ver ni
   modificar metrónomos/playlists de otro usuario. Si lo intentás (ids de
   otro usuario), la respuesta es un error de autorización, no un 404 con
   datos ajenos.

2. Para detectar éxito: body.success === true. Para detectar error de
   autorización/negocio: body.success === false. Para detectar error de
   VALIDACIÓN de formulario: presencia de body.errors (sin "success").
   Nunca decidas por el status code HTTP salvo 401 (token vencido → volver a
   /api/v3/login) o errores de red.

3. "has_metronome": false es un estado válido y esperado — son canciones que
   el usuario agregó a una playlist solo para tener el listado, sin capacidad
   de reproducir metrónomo. Ocultá el botón de Play y el campo BPM para esas.

4. El reproductor de metrónomo en sí (Web Audio API, click generado sin
   archivos de audio) es lógica 100% de cliente — el backend solo guarda
   title/artist/bpm, no genera ni sirve audio.