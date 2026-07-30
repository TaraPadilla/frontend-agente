# Frontend del Agente Empresarial

Interfaz React del Agente Empresarial. Consume exclusivamente el backend
FastAPI y utiliza su `/openapi.json` como contrato autoritativo. La
autenticación OAuth se realiza con Supabase Auth.

## Funcionalidad

- Chat público para empresas con acceso público habilitado.
- Inicio de sesión y registro mediante Google o GitHub.
- Empresa administrativa fija, resuelta por el backend desde la membresía.
- Chat autenticado con el alcance documental autorizado.
- Administración de documentos públicos y privados.
- Estado y sincronización de índices.
- Configuración de acceso público de la empresa.
- Configuración global de LLM y embeddings únicamente para `superadmin`.

El frontend no calcula roles ni autoriza empresas. `platform_role`,
`membership_role`, empresa y permisos provienen de:

```http
GET /api/v1/me/environment
```

## Requisitos

- Node.js 22 o superior.
- npm.
- Backend FastAPI disponible.
- Proyecto Supabase con Google y/o GitHub habilitados.

## Variables de entorno

Copia el archivo de ejemplo:

```powershell
Copy-Item .env.example .env
```

Configura las siguientes variables:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

`VITE_API_BASE_URL` debe incluir el prefijo `/api/v1`.

React solo debe recibir la URL y la publishable key de Supabase. Nunca agregues
al frontend `DATABASE_URL`, claves `service_role`, claves secretas de Supabase,
credenciales OAuth ni claves de proveedores de modelos.

La aplicación valida estas variables al arrancar y muestra un error de
configuración cuando falta alguna.

## Google Analytics 4

El agente comparte con la landing el flujo web de GA4
`G-FN337E83YN`. Esta configuración no pertenece al archivo `.env` local ni al
archivo `compose.yaml`: se administra como variable del repositorio en GitHub:

```text
Nombre: VITE_GA_MEASUREMENT_ID
Valor:  G-FN337E83YN
```

La variable debe crearse en **Settings → Secrets and variables → Actions →
Variables** del repositorio `TaraPadilla/frontend-agente`. No es un secreto,
pero se conserva como variable de repositorio para centralizar la configuración
del despliegue.

### Funcionamiento

El componente está en `src/components/GoogleAnalytics.tsx`, la instrumentación
se centraliza en `src/services/analytics.ts` y se monta desde `src/main.tsx`.
La integración:

- carga `gtag.js` una sola vez;
- valida que el identificador tenga formato `G-*`;
- desactiva el `page_view` automático y envía uno explícito por carga real;
- evita duplicados provocados por `StrictMode`;
- no convierte los paneles `chat`, `files` y `settings` en páginas, porque no
  cambian la URL;
- excluye query string y fragmento de `page_location` para no enviar a GA4
  parámetros del retorno OAuth.

Además del `page_view`, se miden las siguientes etapas del flujo de
autenticación:

| Evento | Tipo | Momento |
| --- | --- | --- |
| `login_start` | Personalizado | Clic en iniciar sesión, antes de OAuth |
| `sign_up_start` | Personalizado | Clic en registrar empresa, antes de OAuth |
| `login` | Recomendado por GA4 | OAuth completado y entorno existente resuelto |
| `sign_up` | Recomendado por GA4 | Empresa creada correctamente |

Los cuatro eventos incluyen únicamente el parámetro `method`, con valor
`google` o `github`. La intención y el proveedor se conservan temporalmente en
`sessionStorage` para relacionar el clic inicial con el retorno OAuth y se
eliminan al completar, cancelar o cerrar sesión.

No se envían correos, nombres, identificadores de usuario o empresa, errores,
contenido del chat, documentos ni configuración administrativa.

Si el registro debe contabilizarse como conversión de negocio, marca
`sign_up` como **key event** en la propiedad de GA4. Recibir el evento no lo
convierte automáticamente en evento clave.

### Compilación y despliegue

Los workflows `.github/workflows/ci.yml` y
`.github/workflows/docker-publish.yml` leen la variable de GitHub. El workflow
de publicación la entrega al `Dockerfile` como argumento de compilación y Vite
la incorpora al bundle.

La imagen resultante no consulta variables en tiempo de ejecución. Por tanto:

- cambiar la variable en GitHub requiere construir y desplegar una imagen
  nueva;
- agregarla al `.env` del servidor o a `compose.yaml` no modifica una imagen ya
  compilada;
- si está ausente o no tiene un formato válido, Analytics no se carga.

Para evitar eventos duplicados, desactiva en el flujo web de GA4 la medición
mejorada de cambios de página basados en el historial del navegador.

### Verificación posterior al despliegue

1. Abre la aplicación en una ventana privada, sin bloqueadores.
2. En la pestaña Network de las herramientas del navegador, confirma una carga
   de `googletagmanager.com/gtag/js?id=G-FN337E83YN`.
3. Recarga la aplicación y comprueba un único evento `page_view` en GA4
   Realtime o DebugView.
4. Cambia entre `chat`, `files` y `settings`; estos cambios no deben generar
   nuevos `page_view`.
5. Después de un retorno OAuth, confirma que `page_location` no contenga
   parámetros ni fragmentos de autenticación.
6. Comprueba las secuencias `login_start` → `login` y
   `sign_up_start` → `sign_up`, junto con el parámetro `method`.

## Configuración de Supabase

En el panel del proyecto:

1. Habilita los proveedores Google y GitHub.
2. Configura en cada proveedor sus credenciales OAuth.
3. Define la Site URL del frontend.
4. Agrega la URL exacta del frontend a las Redirect URLs permitidas.
5. Copia la URL del proyecto y su publishable key al archivo `.env`.

Para desarrollo, la URL habitual es:

```text
http://localhost:5173/
```

La redirección OAuth vuelve al origen y ruta desde donde se inició el flujo.

## Ejecución local

Instala dependencias e inicia Vite:

```powershell
npm install
npm run dev
```

La interfaz queda disponible normalmente en:

```text
http://localhost:5173
```

El backend debe estar accesible desde la URL configurada en
`VITE_API_BASE_URL`. Su contrato puede inspeccionarse en:

```text
http://localhost:8000/openapi.json
http://localhost:8000/docs
```

## Flujos y permisos

### Viewer

- Obtiene el catálogo con `GET /api/v1/companies`.
- Usa estrictamente el `default_company` retornado por el backend.
- Consulta con `POST /api/v1/queries` sin Bearer y enviando `company`.
- Puede ver respuesta, fuentes públicas, fragmentos, modelo y tiempo.
- No puede listar ni administrar documentos o índices.

Si la empresa predeterminada no existe o no es pública, la interfaz muestra el
error y no selecciona otra empresa como fallback.

### Admin

- La sesión se resuelve mediante `GET /api/v1/me/environment`.
- No dispone de selector de empresa.
- Consulta con Bearer y sin enviar `company`.
- Puede administrar documentos e índices de su propia empresa.
- Puede modificar `public_access_enabled`.

### Superadmin

Mantiene el mismo alcance documental sobre su propia empresa y además puede:

- consultar la configuración global;
- cambiar el LLM;
- cambiar el modelo de embeddings;
- probar el modelo.

El cambio de embeddings advierte que las empresas deben reindexarse. El cambio
de LLM no muestra esa advertencia. Los embeddings no se muestran como métrica
del chat público ni del chat de un admin empresarial.

## Registro de empresa

Cuando `/me/environment` indica que el usuario autenticado aún no tiene
empresa, la interfaz solicita:

- nombre;
- acceso público habilitado o deshabilitado.

El registro se envía a:

```http
POST /api/v1/companies
```

El frontend no solicita ni genera `knowledge_key`. Las colisiones y demás
errores se muestran usando el contrato `RespuestaError` del backend.

## Cliente de API y errores

El cliente HTTP centralizado se encuentra en `src/services/api.ts`.

- Agrega Bearer solo a endpoints autenticados.
- Nunca envía Bearer en consultas viewer.
- Aplica timeout a consultas, cargas y sincronizaciones.
- Maneja `401`, `403`, `409` y `422`.
- Interpreta el formato:

```json
{
  "error": {
    "codigo": "...",
    "mensaje": "..."
  }
}
```

Un `401` administrativo limpia la sesión local cuando corresponde y muestra un
mensaje explícito; no degrada silenciosamente al usuario dentro del área
administrativa.

## Comandos de calidad

```powershell
npm run test
npm run lint
npm run build
```

La suite utiliza Vitest, Testing Library y jsdom.

## Docker

Las variables `VITE_*` se incorporan durante la compilación. El siguiente
ejemplo corresponde únicamente a una compilación manual; el
despliegue normal obtiene `VITE_GA_MEASUREMENT_ID` desde GitHub Actions.

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://api.ejemplo.com/api/v1 `
  --build-arg VITE_SUPABASE_URL=https://proyecto.supabase.co `
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=clave_publica `
  --build-arg VITE_GA_MEASUREMENT_ID=G-FN337E83YN `
  -t agente-frontend .

docker run --rm -p 8080:80 agente-frontend
```

La interfaz queda disponible en `http://localhost:8080` y el healthcheck del
contenedor en `http://localhost:8080/health`.

No uses secretos como argumentos de compilación.

## Estructura

```text
src/
├── components/       # Chat, navegación y áreas administrativas
├── services/
│   ├── api.ts        # Cliente único de FastAPI
│   └── supabase.ts   # Sesión y OAuth
├── test/             # Preparación de Vitest y Testing Library
├── types/
│   └── api.ts        # Tipos centralizados del contrato
├── App.tsx           # Coordinación de sesión, permisos y operaciones
├── config.ts         # Validación de variables públicas
├── main.tsx          # Arranque y error de configuración
└── index.css         # Tema y estilos globales
```

Las conversaciones permanecen en memoria del navegador. El frontend no simula
persistencia que el backend no ofrece ni realiza llamadas directas a
PostgreSQL.
