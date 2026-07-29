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

Las variables `VITE_*` se incorporan durante la compilación:

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://api.ejemplo.com/api/v1 `
  --build-arg VITE_SUPABASE_URL=https://proyecto.supabase.co `
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=clave_publica `
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
