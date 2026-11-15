# Guía: GitHub + Render + Space Apps

## 1. Publicar en GitHub

```bash
cd rootwise-ai
git init
git add .
git commit -m "ROOTWISE AI: Flask + SQLite + React + NASA Earthdata"
git branch -M main
git remote add origin https://github.com/USUARIO/rootwise-ai.git
git push -u origin main
```

Verifica que no se suban `.venv`, `node_modules`, `dist` ni archivos `.db`.
El modelo `backend/ml/agrovision_rgb.keras` puede superar 25 MB; GitHub acepta archivos
menores a 100 MB, pero si molesta puedes usar Git LFS:

```bash
git lfs install
git lfs track "backend/ml/*.keras"
```

## 2. Desplegar en Render

### Opción A — Blueprint (recomendada)

1. Sube `render.yaml` al repo.
2. En Render: **New → Blueprint** y selecciona el repositorio.
3. Render crea el Web Service con:
   - build: `pip install -r backend/requirements.txt && cd frontend && npm install --include=dev && npm run build`
   - start: `cd backend && gunicorn --workers 1 --threads 4 --bind 0.0.0.0:$PORT wsgi:app`
4. Revisa las variables de entorno y pulsa **Deploy**.

### Opción B — Manual

1. **New → Web Service**, conecta el repo.
2. Runtime: Python 3.11.
3. Build command:
   ```bash
   pip install --upgrade pip && pip install -r backend/requirements.txt && cd frontend && npm install --include=dev --no-audit --no-fund && npm run build
   ```
4. Start command:
   ```bash
   cd backend && gunicorn --workers 1 --threads 4 --timeout 120 --bind 0.0.0.0:$PORT wsgi:app
   ```
5. Health check path: `/healthz`.
6. Variables:
   - `SECRET_KEY` (Generate)
   - `JWT_SECRET_KEY` (Generate)
   - `DATABASE_URL=sqlite:////opt/render/project/src/backend/data/rootwise.db`
   - `ML_ENABLED=0`
   - `AUTO_SEED=1`
   - `FRONTEND_DIST=/opt/render/project/src/frontend/dist`
   - `NASA_API_KEY` (opcional, `DEMO_KEY` por defecto)
   - `FIRMS_MAP_KEY` (opcional)

### Persistencia

El plan gratuito usa disco efímero: **la base SQLite se resiembra en cada deploy**.
Para conservar datos entre despliegues, agrega un **disco persistente** en Render y monta
`/data`, luego usa:

```
DATABASE_URL=sqlite:////data/rootwise.db
```

### Verificación posterior

```bash
curl https://TU-APP.onrender.com/healthz
curl https://TU-APP.onrender.com/api/crops?limit=2
```

Abre la URL, inicia sesión con `demo / rootwise2026`, crea una parcela y ejecuta una
simulación. Revisa los logs si el primer arranque tarda (instalación de dependencias).

## 3. Registrar el proyecto en NASA Space Apps

1. Crea/entra a tu cuenta en <https://www.spaceappschallenge.org/>.
2. Regístrate en el evento 2026 y elige el reto *“Cambio de rumbo: adaptando las granjas
   con datos de la NASA”*.
3. Completa la ficha del proyecto:
   - **Nombre:** ROOTWISE AI
   - **Frase:** Cultiva decisiones, cosecha futuro.
   - **Descripción corta:** herramienta de apoyo a la decisión que combina datos abiertos
     de la NASA con información local para recomendar rotaciones de cultivos explicables.
   - **Tags:** Earth Observation, Agriculture, Climate Resilience, Open Data, PWA.
   - **Enlaces:** repo de GitHub, demo en Render y video (opcional).
4. Envía el proyecto antes del cierre y **descarga el certificado/constancia**.
5. Inserta el certificado en `docs/entrega/informe-rootwise.md` (sección 7) y en el PDF final.

## 4. Video corto sugerido (60–90 s)

1. Landing y propuesta (10 s).
2. Registro sin correo ni DNI (10 s).
3. Dibujo de parcela + 3D (15 s).
4. Clima NASA + satélite Worldview (15 s).
5. Simulación con 3 cultivos y explicación (20 s).
6. Campaña, PDF y modo offline (15 s).
7. Cierre con enlaces (5 s).

## 5. Problemas frecuentes

| Síntoma | Solución |
|---|---|
| 404 en `/api/...` | Verifica que el start command use `wsgi:app` y que `FRONTEND_DIST` apunte a `frontend/dist`. |
| La app abre pero sin estilos | El build de React no se ejecutó; revisa el build command y la carpeta `dist`. |
| Error de CORS en local | Usa `npm run dev` (proxy `/api`) o define `CORS_ORIGINS=http://localhost:5173`. |
| NASA POWER falla | Es un servicio externo; la app degrada a datos en caché o sin clima y lo informa. |
| Se pierden datos al redeploy | Disco efímero del plan gratuito; agrega disco persistente. |
| TensorFlow no está | Es intencional (`ML_ENABLED=0`); el módulo de IA muestra aviso y el resto sigue. |
| `pytest` no encuentra módulos | Ejecuta desde `backend/`; `conftest.py` agrega el path. |
