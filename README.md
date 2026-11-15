# 🌱 ROOTWISE AI

**Cultiva decisiones, cosecha futuro.**
Plataforma web de apoyo a la decisión agrícola para el reto **NASA Space Apps Challenge 2026 — “Cambio de rumbo: adaptando las granjas con datos de la NASA”**.

> Un productor dibuja su parcela, registra su suelo y recibe alternativas de rotación explicadas, con clima observado por la NASA, satélite de su zona y un motor agronómico que nunca oculta sus límites.

![Estado](https://img.shields.io/badge/estado-funcional-brightgreen)
![Backend](https://img.shields.io/badge/Flask-3.x-0E2A20)
![DB](https://img.shields.io/badge/SQLite-SQLAlchemy-1F6A4A)
![Frontend](https://img.shields.io/badge/React-18%20%2B%20Vite%20%2B%20TS-C9E68F)
![3D](https://img.shields.io/badge/3D-Three.js-000000)
![Tests](https://img.shields.io/badge/pytest-59%20passed-success)
![Cobertura](https://img.shields.io/badge/cobertura-75%25-brightgreen)

---

## 1. El reto

Los agricultores enfrentan temperaturas cambiantes, lluvias irregulares, escasez de agua y
suelos degradados. Elegir una rotación de cultivos se vuelve una decisión de alto riesgo,
muchas veces sin datos a mano.

ROOTWISE AI combina **observación de la Tierra de la NASA** + **suelo local** +
**características del cultivo** + **prioridades del productor** para devolver:

- `Recomendable`
- `Viable con restricciones`
- `Riesgo alto`
- `Información insuficiente`

con explicación por criterio, datos faltantes, fuente, fecha y confianza.

## 2. Módulos implementados

| Módulo | Qué hace |
|---|---|
| **ROOTWISE ID** | Registro manual sin correo ni DNI obligatorio, login JWT, roles `agricultor` / `tecnico` / `admin`, auditoría. |
| **ROOTWISE LAND** | Fincas y parcelas con dibujo de polígono, área y centroide calculados en el servidor, visor 3D. |
| **ROOTWISE EARTH** | NASA POWER, Worldview, GIBS, CMR, EPIC y FIRMS mediante proxy backend. |
| **ROOTWISE SOIL** | Análisis de laboratorio/campo/declarado con procedencia explícita. |
| **ROOTWISE CLIMATE** | Promedios de 5 años, gráfico mensual de lluvia y metadatos de resolución. |
| **ROOTWISE ROTATION** | Motor de restricciones críticas + puntuación multicriterio explicable y versionada. |
| **ROOTWISE PLANT** | Campañas, confirmación de siembra real, eventos y línea de tiempo. |
| **ROOTWISE HEALTH** | Triage de hojas de tomate con el modelo AgroVision (opcional), MIP y observaciones. |
| **ROOTWISE OFFLINE** | PWA con caché de app/datos y cola de sincronización de escrituras. |
| **ROOTWISE IDIOMAS** | Interfaz en español, inglés, quechua, kichwa amazónico y asháninka (beta), también offline. |
| **ROOTWISE REPORT** | PDF de parcela con datos, clima y última simulación. |

## 3. Stack

- **Backend:** Python 3.11 · Flask 3 · Flask-SQLAlchemy · Flask-JWT-Extended · SQLite · ReportLab · Requests
- **Frontend:** React 18 · TypeScript · Vite · TailwindCSS · React Router · TanStack Query · Recharts · Leaflet
- **3D:** Three.js · React Three Fiber · Drei (globo terráqueo y relieve de parcela)
- **Pruebas:** pytest (59 pruebas, 75 % de cobertura) + GitHub Actions
- **Despliegue:** Render (Web Service único que sirve API + build de React)

## 4. Arquitectura

```
rootwise-ai/
├── backend/
│   ├── app.py, wsgi.py, config.py, extensions.py, models.py, cli.py
│   ├── api/           # auth, users, farms, parcels, soil, crops,
│   │                  # simulations, campaigns, climate, health,
│   │                  # reports, admin, nasa
│   ├── services/      # geo, nasa_power, nasa_earth, suitability,
│   │                  # rotation, leaf_model, pdf
│   ├── data/          # crops.seed.json (55 cultivos), rotation_rules.json
│   ├── ml/            # agrovision_rgb.keras + clases.json (opcional)
│   └── tests/
├── frontend/
│   ├── src/pages/     # Landing, Login, Register, Dashboard, Parcels,
│   │                  # ParcelNew, ParcelDetail, Simulator, Campaigns,
│   │                  # Health, Nasa, Admin, Account
│   ├── src/components/# HeroScene (3D), ParcelScene (3D), MapPicker,
│   │                  # SimulatorPanel, OfflineBar, AuthedImage, ui
│   ├── public/sw.js   # service worker (PWA offline)
│   └── public/manifest.webmanifest
├── docs/
│   ├── entrega/informe-rootwise.md
│   ├── entrega/checklist-entrega.md
│   ├── guia-render-github.md
│   └── evidencias/    # métricas del modelo y capturas
├── render.yaml
└── .github/workflows/tests.yml
```

### Flujo de una decisión

1. El productor crea su cuenta (usuario + contraseña, sin correo obligatorio).
2. Crea finca y dibuja la parcela en el mapa.
3. Registra altitud, agua, riego y análisis de suelo.
4. El backend consulta NASA POWER por coordenada (caché SQLite de 24 h).
5. El motor aplica restricciones críticas y puntúa clima, suelo, agua, terreno,
   calendario y rotación.
6. El frontend muestra comparación, badges, explicación y datos faltantes.
7. La mejor alternativa se convierte en campaña; los eventos se registran.

## 5. Motor de aptitud

```
S = 0.30·clima + 0.20·suelo + 0.20·agua + 0.10·terreno + 0.10·calendario + 0.10·rotación
```

Antes de puntuar se aplican **filtros críticos no compensables**: altitud fuera de rango,
heladas históricas, demanda hídrica alta con disponibilidad baja, pH fuera de rango y
violación del intervalo de rotación. El resultado guarda `inputs_json`, la versión del
ruleset (`1.0.0`) y la fuente de cada variable para poder reproducirse.

## 6. APIs de NASA integradas

| API | Uso | Nota |
|---|---|---|
| NASA POWER | Clima diario y agroclimático | Promedio de 5 años por coordenada, caché local. |
| Worldview Snapshots | Imagen satelital de la parcela | Proxy backend, `image/jpeg`. |
| GIBS WMS | Capas ráster por fecha | Proxy backend. |
| CMR + CMR-STAC | Catálogo de colecciones y gránulos | Búsqueda por palabra clave. |
| EPIC / DSCOVR | Última imagen de la Tierra | `DEMO_KEY` o `NASA_API_KEY`. |
| FIRMS | Incendios activos | Requiere `FIRMS_MAP_KEY` gratuita. |
| AppEEARS / Harmony / earthaccess | Subsetting avanzado | Fuera del MVP; documentado como fase futura. |

Todas las claves viven en el servidor. El navegador nunca recibe credenciales de NASA.

## 7. Ejecutar en local

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements-dev.txt

flask --app wsgi seed-db        # catálogo + usuarios demo
flask --app wsgi run --port 5000
```

Usuarios de demostración:

| Usuario | Clave | Rol |
|---|---|---|
| `demo` | `rootwise2026` | agricultor |
| `admin` | `rootwise2026` | admin |

### Frontend

```bash
cd frontend
npm install --include=dev
npm run dev        # http://localhost:5173 con proxy /api → 5000
npm run build      # genera dist/ y Flask lo sirve en /
```

### Pruebas

```bash
cd backend
pytest -q
pytest --cov=api --cov=services --cov-report=term-missing
```

## 8. Despliegue en Render

El repo incluye `render.yaml`. En resumen:

```yaml
buildCommand: pip install -r backend/requirements.txt && cd frontend && npm install --include=dev && npm run build
startCommand: cd backend && gunicorn --workers 1 --threads 4 --bind 0.0.0.0:$PORT wsgi:app
```

Variables: `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `ML_ENABLED=0`, `AUTO_SEED=1`,
`FRONTEND_DIST=/opt/render/project/src/frontend/dist`.

> **Nota honesta:** en el plan gratuito el disco es efímero; SQLite se recrea y resiembra
> en cada despliegue. Para persistencia real se necesita un disco de Render. El módulo de
> IA queda desactivado (`ML_ENABLED=0`) por el peso de TensorFlow; la app lo informa y
> sigue funcionando.

La guía detallada está en [`docs/guia-render-github.md`](docs/guia-render-github.md).

## 9. Modo offline

- Service worker cachea el shell, los assets y las respuestas `GET /api/*` en buckets por
  token (nunca mezcla datos entre cuentas).
- Las escrituras (`POST/PATCH/DELETE` JSON) que fallan por falta de red se guardan en una
  cola local con `localStorage` y un banner muestra el estado.
- Al volver Internet se sincronizan automáticamente, o con el botón **Sincronizar**.
- La app se puede instalar como PWA desde el navegador.
- Los datos aún no sincronizados viven en el dispositivo; el producto lo advierte.

El simulador funciona offline con el catálogo cacheado y advierte que no incluye clima nuevo.

## 9.1 Idiomas y accesibilidad

El sistema i18n es propio y viaja en el bundle, por lo que **las traducciones también
funcionan sin Internet**. El idioma se elige en la landing, el login, el registro, la barra
lateral y «Mi cuenta», y se guarda en el dispositivo y en el perfil (`users.language`).

| Idioma | Estado |
|---|---|
| Español | Validado |
| English | Validado |
| Runasimi (quechua) | Beta, en revisión con hablantes |
| Kichwa amazónico | Beta, en revisión comunitaria |
| Asháninka | Beta, glosario inicial con respaldo en español |

Las traducciones beta se muestran con su estado y no se presentan como validadas. El plan
de revisión, el glosario y la guía para añadir lenguas están en
[`docs/idiomas.md`](docs/idiomas.md).

## 10. Seguridad y privacidad

- Contraseñas con hash de Werkzeug; tokens JWT con expiración de 12 h.
- Autorización por rol y por propiedad del recurso en cada endpoint.
- Validación de geometría y cálculo de área en el servidor.
- DNI opcional, sin verificación automática ni servicios no autorizados.
- Auditoría de registro, login, cambios y eliminaciones.
- Sin correo obligatorio, sin códigos de verificación, sin RENIEC en el flujo básico.

## 11. Documento de entrega

El esqueleto completo del PDF está en
[`docs/entrega/informe-rootwise.md`](docs/entrega/informe-rootwise.md) y la lista de
verificación en [`docs/entrega/checklist-entrega.md`](docs/entrega/checklist-entrega.md).
Las capturas de la app se guardan en `docs/evidencias/capturas/`.

## 12. Créditos

- Datos: **NASA POWER**, **NASA GIBS**, **NASA Worldview**, **NASA CMR**, **NASA EPIC**,
  **NASA FIRMS**, **NASA Earthdata**.
- Referencias agronómicas: **FAO/FAOSTAT**, **INIA**, **MIDAGRI**, **SENAMHI**, **SENASA**.
- Fotografía: **Unsplash** (uso libre).
- Modelo de hojas: **AgroVision RGB** (MobileNetV2, PlantVillage) — F1 macro 88.30 %,
  exactitud 91.43 % en el conjunto de prueba del proyecto.
- Proyecto académico y participación en **NASA Space Apps Challenge 2026**.

> ROOTWISE AI es una herramienta de apoyo. No acredita propiedad de terrenos, no garantiza
> cosechas ni rendimientos y no sustituye el diagnóstico de un agrónomo.
