# Frontend del Agente Empresarial

Interfaz React que replica las funciones de la interfaz Streamlit y se comunica
únicamente con la API FastAPI. El pipeline RAG permanece en el backend.

## Requisitos

- Node.js 22 o superior.
- FastAPI disponible localmente en `http://localhost:8000`.

## Ejecución local

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Vite publica la interfaz en `http://localhost:5173`.

En otra terminal, desde la raíz del repositorio, inicia la API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn Agente.api.main:app --host 0.0.0.0 --port 8000 --reload
```

La documentación de la API queda disponible en
`http://localhost:8000/docs`.

## Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:8000
```

Vite incorpora esta variable durante la compilación. Para producción usa:

```env
VITE_API_BASE_URL=https://fastapi.tecnologiaydesarrolloweb.com
```

El backend debe incluir el origen exacto del frontend en
`API_CORS_ORIGINS`. No se debe usar `*`.

## Comprobaciones

```powershell
npm run lint
npm run build
```

## Docker

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://fastapi.tecnologiaydesarrolloweb.com `
  -t agente-frontend .

docker run --rm -p 8080:80 agente-frontend
```

La interfaz queda disponible en `http://localhost:8080` y el healthcheck del
contenedor en `http://localhost:8080/health`.

## Estructura

```text
src/
├── components/   # Interfaz visual y formularios
├── services/     # Cliente HTTP único para FastAPI
├── types/        # Contratos TypeScript de la API
├── App.tsx       # Estado y coordinación de operaciones
└── index.css     # Tema y estilos globales
```

Las conversaciones y el feedback viven en memoria del navegador, igual que en
la primera migración funcional; no se simula persistencia que el backend aún no
ofrece.
