# Feature: Metrónomo + Playlists — Especificación funcional y de datos

> Documento generado a partir del backend Laravel actual (`servidor/vemitienda`), pensado para
> entregarlo a una IA/equipo que va a diseñar la **app móvil** de esta funcionalidad.
> Cubre: modelos de datos, reglas de negocio, autorización, endpoints actuales (solo web) y
> comportamiento detallado del reproductor, incluyendo lo que falta para exponerlo como API.

---

## 1. Resumen del feature

Un usuario autenticado puede:

1. Crear **metrónomos** (canciones con un BPM asociado, para practicar con ellas).
2. Agrupar esos metrónomos en **playlists** (listas ordenadas de canciones).
3. Reproducir cada canción con un **motor de metrónomo por audio** (click generado por software,
   no archivos de audio) a su BPM configurado, con control de play/pause/stop/reset y ajuste
   manual de BPM en vivo.
4. Compartir una playlist públicamente mediante una **URL con slug**, accesible sin login, donde
   cualquiera puede reproducir las canciones y reordenarlas (sin poder agregar/quitar canciones
   ni editar datos).

Actualmente **todo esto vive solo en el panel web (Blade + jQuery), autenticado por sesión**
(`guard: web`). **No existe ningún endpoint en `routes/api.php`** para metrónomos/playlists — la
app móvil necesitará que se construya una API nueva (ver sección 7).

---

## 2. Modelo de datos

### 2.1 Tabla `metronomes`

| Campo        | Tipo                              | Constraints / Notas                                                                 |
|--------------|------------------------------------|----------------------------------------------------------------------------------------|
| `id`         | bigint, PK, autoincrement          |                                                                                          |
| `user_id`    | unsignedBigInteger                 | FK → `users.id`, `onDelete('cascade')`. Dueño del metrónomo.                          |
| `title`      | string(150)                        | Requerido. Título de la canción.                                                       |
| `artist`     | string(150), nullable              | Opcional.                                                                               |
| `bpm`        | unsignedSmallInteger, **nullable** | Rango de negocio: 20–300. Sin default (antes tenía default 120, se quitó).            |
| `created_at` / `updated_at` | timestamps                 |                                                                                          |

**Por qué `bpm` es nullable:** hay canciones que se agregan a una playlist solo para llevar el
listado (referencia/orden), sin que se les pueda dar "Play" como metrónomo. El modelo expone un
accessor calculado:

```php
$metronome->has_metronome // true si bpm no es null
```

La UI usa `has_metronome` para decidir si muestra el botón de Play o la etiqueta "Sin metrónomo".

### 2.2 Tabla `playlists`

| Campo         | Tipo                        | Constraints / Notas                                                                 |
|---------------|------------------------------|------------------------------------------------------------------------------------|
| `id`          | bigint, PK, autoincrement    |                                                                                       |
| `user_id`     | unsignedBigInteger           | FK → `users.id`, `onDelete('cascade')`. Dueño de la playlist.                       |
| `name`        | string(150)                  | Requerido.                                                                           |
| `slug`        | string(170), **unique**, not null | Autogenerado desde `name` (kebab-case). Si hay colisión se agrega sufijo `-2`, `-3`... Es la clave de la URL pública `/playlist/{slug}`. Se regenera en cada `update` si cambia el nombre. |
| `description` | text, nullable               | Opcional, máx. 1000 caracteres (validado en el request, no en columna).             |
| `created_at` / `updated_at` | timestamps      |                                                                                       |

### 2.3 Tabla pivote `playlist_metronome` (relación N:M)

| Campo           | Tipo                    | Constraints / Notas                                                    |
|-----------------|--------------------------|--------------------------------------------------------------------------|
| `id`            | bigint, PK               |                                                                            |
| `playlist_id`   | unsignedBigInteger        | FK → `playlists.id`, `onDelete('cascade')`.                              |
| `metronome_id`  | unsignedBigInteger        | FK → `metronomes.id`, `onDelete('cascade')`.                             |
| `position`      | unsignedInteger, default 0 | Orden de la canción dentro de la playlist (drag & drop persiste acá).   |
| `created_at` / `updated_at` | timestamps  |                                                                            |
| — | `unique(['playlist_id', 'metronome_id'])` | Una canción no puede estar dos veces en la misma playlist. |

Un mismo metrónomo puede pertenecer a **varias playlists** a la vez.

### 2.4 Relaciones Eloquent

```
Metronome
 ├─ belongsTo(User)          // user_id
 └─ belongsToMany(Playlist)  // vía playlist_metronome, withTimestamps

Playlist
 ├─ belongsTo(User)                        // user_id
 └─ belongsToMany(Metronome)                // vía playlist_metronome
     ->withPivot('position')
     ->withTimestamps()
     ->orderBy('playlist_metronome.position')   // siempre viene ordenada
```

---

## 3. Reglas de validación (Form Requests)

### `MetronomeRequest`
- `title`: requerido, string, máx. 150.
- `artist`: opcional, string, máx. 150.
- `bpm`: opcional, entero, **mín. 20, máx. 300**.

### `PlaylistRequest`
- `name`: requerido, string, máx. 150.
- `description`: opcional, string, máx. 1000.

(El `slug` no se valida por request: se genera automáticamente en el repositorio a partir de
`name`, no es editable directamente por el usuario.)

---

## 4. Autorización (ownership, por policy)

- `MetronomePolicy`: `view` / `update` / `delete` → solo si `metronome.user_id === auth()->id()`.
- `PlaylistPolicy`: `view` / `update` / `delete` → solo si `playlist.user_id === auth()->id()`.
- No hay policy de `create` (cualquier usuario autenticado puede crear).
- Un usuario **solo puede agregar a una playlist metrónomos que él mismo posee** (se valida
  `authorize('view', $metronome)` en `attach`/`detach`).
- La vista pública por slug (`/playlist/{slug}`) **no pasa por policy**: es de solo lectura +
  reorder, sin scope de usuario (cualquiera con el link puede verla y reordenarla, pero no puede
  agregar/quitar canciones ni editar nombre/descripción).

---

## 5. Funcionalidades (panel actual)

### 5.1 Metrónomos (CRUD privado, requiere login)
- **Listado** paginado (9 por página) de metrónomos del usuario autenticado, orden descendente
  por `id` (más reciente primero).
- **Crear**: título, artista (opcional), BPM (opcional).
- **Editar**: mismos campos.
- **Eliminar**: con confirmación.
- No hay endpoint de "ver detalle" individual (`show` está excluido de la resource route).

### 5.2 Playlists (CRUD privado, requiere login)
- **Listado** paginado (9 por página) de playlists del usuario, con conteo de canciones
  (`withCount('metronomes')`), orden descendente por `id`.
- **Crear**: nombre + descripción opcional → genera slug único automáticamente.
- **Ver detalle** (`show`): playlist + sus metrónomos ordenados por `position`, más el listado de
  "metrónomos disponibles" del usuario que aún no están en esa playlist (para el selector de
  "agregar canción").
- **Editar**: nombre (regenera slug) + descripción.
- **Eliminar**: con confirmación, cascada elimina también las filas del pivote.
- **Agregar canción** (`attach`): agrega un metrónomo propio al final de la playlist
  (`position` = máximo actual + 1). Usa `syncWithoutDetaching`, así que si ya estaba, no la
  duplica ni pierde el resto.
- **Quitar canción** (`detach`): elimina la relación (no borra el metrónomo, solo lo saca de esa
  playlist).
- **Reordenar** (`reorder`, vía drag & drop con jQuery UI Sortable): recibe un array de IDs de
  metrónomos en el nuevo orden y reescribe `position` de forma secuencial (1, 2, 3...).
  Ignora silenciosamente cualquier ID que no pertenezca a esa playlist.

### 5.3 Playlist pública (sin login)
- URL: `/playlist/{slug}`.
- Solo lectura de datos (nombre, descripción, canciones) + **reproducir** + **reordenar**
  (el reorder público sí persiste en la base, es la única escritura permitida sin login).
- No se puede agregar, quitar, editar ni eliminar canciones/playlist desde acá.
- No requiere que el visitante sea el dueño; el slug es la única "seguridad" (URL no listada
  públicamente, tipo "compartir por link").

### 5.4 Buscador y orden visual (client-side, no persisten en servidor)
En la vista de playlist (privada o pública) hay, además del drag & drop:
- **Búsqueda en vivo** por título o artista (filtra filas visibles, sin llamada al servidor).
- **Orden visual** por nombre o por BPM (botones "Nombre"/"BPM"), ascendente/descendente,
  alternando cada click. Esto es solo un reordenamiento del DOM: si el usuario luego arrastra una
  fila, ahí sí se persiste el nuevo orden real.

### 5.5 Reproductor de metrónomo (motor de audio)

Es una barra flotante (`<x-metronome-player />`) fija al fondo de la pantalla, compartida por
todas las vistas de playlist (privada y pública), que controla **una sola canción sonando a la
vez**.

**Motor de audio** (`MetronomeEngine`, Web Audio API en el navegador):
- No usa archivos de audio: genera el "click" con un `OscillatorNode` (tono de 1000 Hz) +
  `GainNode` con envolvente rápida (ataque a 0.6, decaimiento exponencial a ~0.001 en 50ms), para
  simular el sonido percusivo de un metrónomo.
- **Scheduler tipo "lookahead"** (patrón de Chris Wilson, "A Tale of Two Clocks"): en vez de usar
  `setInterval` directo para cada beat (impreciso porque el hilo JS puede bloquearse), corre un
  chequeo cada 25ms (`lookahead`) que programa en el `AudioContext` todos los clicks que caen
  dentro de los próximos 100ms (`scheduleAheadTime`), usando el reloj de precisión del
  `AudioContext` (no `Date.now()`). Esto mantiene el tempo estable aunque el hilo principal se
  frene brevemente (ej. scroll pesado).
- BPM válido: entero entre **20 y 300** (se clampa en el propio motor).
- Al cambiar de canción mientras suena otra, detiene el motor antes de cargar la nueva (para que
  el próximo play arranque limpio con el BPM correcto).

**Controles de la barra**:
- Título + artista de la canción actual.
- Indicador visual ("dot") que parpadea en cada beat (feedback visual sincronizado al audio).
- BPM: input numérico editable + botones -/+ (ajuste en vivo, sin detener la reproducción).
- Play/Pausa (botón principal), Detener, Reiniciar (stop + play inmediato), Cerrar (oculta la
  barra y detiene todo).
- Al reproducir una canción desde el listado, la fila correspondiente se resalta visualmente y el
  botón de esa fila cambia de ícono "play" a "stop" (toggle: si tocás play en una fila que ya está
  sonando, la detiene).
- Diseño responsive: en mobile agrega padding inferior para no quedar tapado por la barra de
  gestos del sistema (`env(safe-area-inset-bottom)`).

> **Importante para el diseño mobile:** esta lógica de audio (oscilador + scheduler lookahead) es
> específica de Web Audio API / navegador. En una app nativa/Flutter/React Native habría que
> reimplementarla con las APIs de audio de la plataforma (p. ej. `AVAudioEngine` en iOS,
> `AudioTrack`/`SoundPool` + timers de alta precisión en Android, o librerías como
> `just_audio`/`flutter_soundpool` en Flutter), replicando el mismo patrón de "lookahead
> scheduling" para evitar que el tempo se desincronice — es el punto técnico más delicado de todo
> el feature.

---

## 6. Rutas actuales (solo web, sesión)

```
GET    /playlist/{slug}                          PlaylistController@show      (público, sin login)
POST   /playlist/{slug}/reorder                  PlaylistController@reorder   (público, sin login)

# Dentro de /admin, middleware 'auth' (guard web, por sesión):
GET|POST /admin/metronomos ...                   Admin\MetronomesController   (resource, sin 'show')
GET|POST /admin/playlists ...                     Admin\PlaylistsController    (resource completo)
POST     /admin/playlists/{playlist}/metronomos/{metronome}   ...@attach
DELETE   /admin/playlists/{playlist}/metronomos/{metronome}   ...@detach
POST     /admin/playlists/{playlist}/reorder                  ...@reorder
```

No hay rate limiting ni CORS específico para estas rutas (heredan la configuración global de
`web.php`, con CSRF token requerido en cada POST/DELETE).

---

## 7. Qué falta para la app móvil (gap actual → recomendaciones)

El backend **no tiene ninguna API para este feature**. El resto de la app (usuarios, planes,
productos) sí expone API bajo `routes/api.php` con **Laravel Passport** (`guard: api`, tokens
Bearer), agrupada en `v1`/`v3`. Lo consistente sería agregar un grupo nuevo (ej. `v3` o `v4`) con
endpoints REST equivalentes a las acciones de la sección 5, protegidos por `auth:api`:

| Acción                          | Método/ruta sugerida                                   |
|----------------------------------|---------------------------------------------------------|
| Listar mis metrónomos            | `GET /api/v3/metronomes`                                |
| Crear metrónomo                  | `POST /api/v3/metronomes`                               |
| Editar metrónomo                 | `PUT /api/v3/metronomes/{id}`                            |
| Eliminar metrónomo               | `DELETE /api/v3/metronomes/{id}`                         |
| Listar mis playlists             | `GET /api/v3/playlists`                                 |
| Ver playlist + canciones         | `GET /api/v3/playlists/{id}`                             |
| Crear playlist                   | `POST /api/v3/playlists`                                |
| Editar playlist                  | `PUT /api/v3/playlists/{id}`                             |
| Eliminar playlist                | `DELETE /api/v3/playlists/{id}`                          |
| Agregar canción a playlist       | `POST /api/v3/playlists/{id}/metronomes/{metronomeId}`  |
| Quitar canción de playlist       | `DELETE /api/v3/playlists/{id}/metronomes/{metronomeId}`|
| Reordenar canciones              | `POST /api/v3/playlists/{id}/reorder` (`order: [id,...]`)|
| Ver playlist pública por slug    | `GET /api/v3/playlist/{slug}` (sin auth)                 |
| Reordenar playlist pública       | `POST /api/v3/playlist/{slug}/reorder` (sin auth)        |

La lógica de negocio ya existe casi completa y reutilizable en `PlaylistsRepository` y
`MetronomesRepository` (`app/Repositories/`) — para la API solo haría falta envolverla en
controllers nuevos que devuelvan JSON en vez de vistas/redirects, y aplicar las mismas policies.

**Campos que el JSON de la app móvil necesitaría, como mínimo:**

```jsonc
// Metronome
{ "id": 1, "title": "...", "artist": "...", "bpm": 128, "has_metronome": true }

// Playlist
{
  "id": 1,
  "name": "...",
  "slug": "mi-playlist",
  "description": "...",
  "metronomes_count": 5,        // en listados
  "metronomes": [                // en detalle, ya ordenados por position
    { "id": 1, "title": "...", "artist": "...", "bpm": 128, "has_metronome": true, "position": 1 }
  ]
}
```

---

## 8. Resumen ejecutivo para quien diseñe la app móvil

- Dos entidades: **Metrónomo** (canción + BPM) y **Playlist** (colección ordenada de metrónomos).
- Relación N:M con **orden persistente** (`position`), reordenable por drag & drop.
- BPM opcional (20–300); si no tiene, la canción se lista pero no se puede "tocar" como
  metrónomo.
- Cada playlist tiene una **URL pública compartible** (por `slug`) de solo lectura + reproducir +
  reordenar, sin necesidad de cuenta.
- El corazón del feature es el **reproductor de metrónomo por click de audio generado**, con play
  único global (una canción a la vez), control de BPM en vivo, y un scheduler de precisión que hay
  que replicar cuidadosamente en la plataforma móvil elegida.
- Todo hoy es **solo web por sesión**; para mobile hace falta construir la API REST equivalente
  (tabla de endpoints sugeridos arriba) reutilizando los repositorios existentes.
