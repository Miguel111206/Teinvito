# Invitaciones interactivas

Constructor visual de invitaciones para salir, con panel privado, enlace público por destinatario, seguimiento de envíos y visor de respuestas.

**Stack:** React 18 + TypeScript + Vite, Tailwind CSS 4, React Router 6, Motion, Supabase (Auth, Postgres, Storage) y Netlify.

## 1. Instalación local

```bash
npm install
cp .env.example .env     # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
npm run build            # tsc + vite build
```

## 2. Configurar Supabase

1. Crea un proyecto en Supabase.
2. En **SQL Editor** ejecuta, en orden, `supabase/migrations/001_schema.sql` y `supabase/migrations/002_security_rpc.sql`.
3. Ejecuta también `supabase/migrations/003_open_signup.sql`: permite que **cualquier usuario registrado** use el panel; cada uno ve únicamente sus invitaciones, respuestas y archivos (RLS por `owner_id`).
4. En **Authentication → Sign In / Providers → Email**: deja **activado "Allow new users to sign up"** y, recomendado, **"Confirm email"** (el registro enviará un correo de confirmación). Activa **CAPTCHA** (Authentication → Attack Protection) para frenar registros automatizados.
5. En **Authentication → URL Configuration** añade tu dominio de Netlify como *Site URL* y `https://TU-SITIO.netlify.app/admin` en *Redirect URLs*.
6. Copia **Project URL** y la clave **anon public** (Settings → API). Nunca uses la `service_role` en el frontend ni en las variables `VITE_*`.

### Cuentas
Cada persona crea su cuenta en `/admin/login` → **"Regístrate"** (correo + contraseña de 8+ caracteres). No hay usuarios ni contraseñas incrustados. La tabla `admin_users` quedó en desuso.

## 3. Despliegue en Netlify

1. Sube el repositorio y créalo en Netlify. `netlify.toml` ya define build (`npm run build`), carpeta `dist`, funciones y la redirección SPA (`/*` → `/index.html`), por lo que `/admin` y `/invite/:token` funcionan al abrirse o recargarse directamente.
2. En **Site settings → Environment variables** añade:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (públicas por diseño).
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `KEEP_ALIVE_ENABLED` (solo para la función keep alive).
3. Despliega. Entra en `/admin/login`.

## 4. Flujo de uso

1. **Invitaciones → Crear** (o "Crear invitación de ejemplo", que genera la de Hellen/Miguel desde la configuración, no desde código).
2. En el editor: **Pasos** (añadir, eliminar, duplicar, reordenar, ocultar, obligatorios, opciones con emoji/foto), **Tono**, **General** (nombres, textos de interfaz, pantalla final), **Apariencia**, **Música**, **Animaciones**, **Botón No**.
3. Revisa en la **vista previa** (celular/escritorio). No registra aperturas, respuestas ni confirmaciones.
4. **Guardar borrador** no cambia lo público. **Publicar cambios** crea una versión inmutable y conserva el enlace.
5. Copia el enlace, envíalo y pulsa **Marcar como enviada** (canal + nota). Lo registras tú: copiar el enlace o abrir WhatsApp no prueba el envío.
6. **Invitaciones enviadas** y el detalle muestran aperturas, estado del recorrido, respuestas por sesión y confirmación.

Para varias personas: **Duplicar** genera una invitación nueva con otro token y respuestas separadas.

### Transformar una cena romántica en un picnic divertido
Tono → Divertido; General → nombres; Pasos → cambia textos, opciones (Pizza → Sándwiches 🥪, etc.) y añade pasos; Apariencia → tema "Picnic menta"; Música → sube otra canción; Animaciones → ajusta. Todo desde el panel.

## 5. Modelo de datos

| Tabla | Propósito |
|---|---|
| `admin_users` | En desuso (registro abierto) |
| `invitations` | Invitación, token aleatorio (96 bits), estado de publicación, borrador (`draft_config`) |
| `invitation_versions` | Instantáneas publicadas (pasos y opciones viven en el JSON versionado) |
| `invitation_sends` | Envíos registrados manualmente por el administrador |
| `invite_sessions` | Sesión de invitado, anclada a una versión |
| `invite_answers` | Respuesta por paso: `step_id`, copia del texto de la pregunta y de las opciones elegidas |

**Sesión en curso y nuevas publicaciones:** cada sesión queda anclada a la versión que abrió; una publicación posterior solo afecta a sesiones nuevas, por lo que nunca se mezclan preguntas de versiones distintas. Como se guardan ids y copia del texto, las respuestas siguen siendo legibles aunque luego se edite o elimine una opción.

## 6. Seguridad

- Registro abierto con RLS en todas las tablas: cada usuario solo accede a filas con `owner_id = auth.uid()` (y a su carpeta de Storage). `anon` no tiene acceso directo a ninguna tabla.
- Al ser abierto, el riesgo es el abuso (spam de cuentas, almacenamiento): usa confirmación de correo y CAPTCHA de Supabase, y vigila el uso de Storage.
- El invitado solo usa RPC `security definer` con validación: `get_public_invitation`, `start_invite_session`, `resume_invite_session`, `mark_session_started`, `save_answer`, `confirm_session`. Solo operan sobre invitaciones **publicadas**; el id de sesión es un UUID aleatorio (secreto) y nunca se pueden leer respuestas ajenas.
- Validaciones en servidor: paso existente en la versión de la sesión, tamaño máximo de respuesta, máximo de respuestas por sesión, máximo de 120 sesiones nuevas por invitación por hora, confirmación solo si los pasos obligatorios visibles están respondidos, upserts idempotentes (doble toque/recarga/reintento no duplican).
- Los textos se renderizan siempre como texto (React escapa); no hay `dangerouslySetInnerHTML`.
- Storage: bucket `invitation-media` de lectura pública (los invitados deben ver fotos y audio) y escritura/borrado solo para usuarios autenticados dentro de `/{su_user_id}/…`. Los nombres de archivo son aleatorios, pero **quien tenga la URL de un archivo puede verlo**.
- Antiindexación: `<meta robots>` y cabecera `X-Robots-Tag`. La vista previa al compartir es genérica ("Tienes una invitación 💌"). Nota: los metadatos son estáticos de `index.html`; no exponen contenido privado.

## 7. Keep alive

- **Hosting estático de Netlify:** no se duerme; no necesita keep alive.
- **Funciones de Netlify:** se ejecutan bajo demanda; tampoco.
- **Supabase:** según fuentes secundarias consultadas (no pude abrir la documentación oficial), los proyectos del plan gratuito se pausan tras ~1 semana sin actividad; el plan Pro no se pausa. **Verifica la política vigente en la documentación oficial de Supabase.**

Se incluye `netlify/functions/keep-alive.mts`, una **Scheduled Function** (cron en UTC, mínimo 1 minuto, límite de ejecución de 30 s según la documentación de Netlify) que llama a la RPC `health_check` (no toca datos privados) y registra solo el código HTTP.

- **Frecuencia:** `netlify.toml` → `[functions."keep-alive"] schedule` (por defecto `0 12 */3 * *`, cada 3 días). El cron no puede venir de una variable de entorno.
- **Activar/desactivar:** `KEEP_ALIVE_ENABLED=true|false`.
- **Secretos:** `SUPABASE_URL` y `SUPABASE_ANON_KEY` (la función no necesita `service_role`).
- **Límites:** solo corre en deploys publicados (no en previews); no se puede invocar por URL; no es una garantía contra la pausa, solo genera actividad de API periódica. Ver logs en Netlify → Functions → keep-alive.

## 8. Música y fotos

- Fotos: JPG, PNG, WebP, GIF; máx. 12 MB; se redimensionan a 1600 px y se recomprimen a WebP/JPG en el navegador; barra de progreso y errores visibles; encuadre (ajuste, posición, zoom).
- Audio: MP3, M4A, AAC, OGG, WAV; máx. 15 MB. El navegador no permite audio automático: arranca al tocar un botón (sobre, primer avance o "Sí", según configures). Si el archivo no es compatible, el reproductor se oculta y la invitación sigue funcionando.

## 9. Estado de verificación

**Comprobado:** `tsc --noEmit` y `vite build` sin errores.

**No comprobado (requiere tu entorno):**
- Migraciones SQL y políticas RLS ejecutadas en un Supabase real.
- Subida a Storage, login, publicación y respuestas de punta a punta.
- Pruebas en Safari iPhone y Chrome Android (botón "No", audio, diseño sin desplazamiento horizontal).
- Ejecución de la Scheduled Function en Netlify.
- Registro y confirmación de correo, y el aislamiento entre dos cuentas distintas.
- Recuperar contraseña: no está implementado todavía.
- Las referencias de `invitacionessalidas.vercel.app` no pude abrirlas; el diseño sigue tus requisitos, no esas páginas.

**Checklist de pruebas manuales:** ver sección 18 de tu especificación; recomendado probar primero con una invitación de ejemplo publicada y abierta en incógnito desde el celular.

**Conocido / pendiente:**
- Los textos de "enlace desactivado / no encontrada" usan valores por defecto (no hay configuración disponible sin exponer la invitación).
- El bucket de medios es público por diseño.
- La vista previa del enlace (Open Graph) es genérica y estática.
- Sin integración de WhatsApp: no se muestra entrega ni lectura.
- La interfaz está solo en español.
