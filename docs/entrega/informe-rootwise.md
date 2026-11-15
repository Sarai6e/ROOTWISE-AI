# ROOTWISE AI — Informe de entrega

**Curso:** Desarrollo de Aplicación Web con Python Flask y SQLite
**Proyecto:** ROOTWISE AI — plataforma de aptitud y rotación de cultivos con datos de la NASA
**Reto:** NASA Space Apps Challenge 2026 — *“Cambio de rumbo: adaptando las granjas con datos de la NASA”* (Ciencias de la Tierra · Software · Artes y multimedia)
**Ámbito:** Perú · acceso gratuito · enfoque offline-first
**Autor(es):** _[completar]_
**Fecha:** _[completar]_
**Repositorio:** _[pegar enlace de GitHub]_
**Aplicación desplegada:** _[pegar enlace de Render]_

> Reemplaza cada marcador `[...]` y pega las capturas indicadas antes de exportar a PDF.

---

## 1. Descripción del reto y solución propuesta

### 1.1 Problema

Los agricultores de todo el mundo enfrentan cambios en temperatura, lluvias irregulares,
escasez de agua, fenómenos extremos y deterioro de la salud del suelo. Elegir una rotación
de cultivos que proteja el campo, conserve el agua y sostenga la productividad se vuelve
una decisión difícil sin datos técnicos disponibles en campo.

### 1.2 Solución

ROOTWISE AI es una herramienta de apoyo a la decisión que integra:

1. **Observación de la Tierra de la NASA** (POWER, GIBS, Worldview, CMR, EPIC, FIRMS).
2. **Información local del suelo** (laboratorio, campo o declarada).
3. **Características del catálogo de cultivos** (55 fichas con requerimientos y fuentes).
4. **Prioridades del productor** (fecha de siembra, disponibilidad de agua, objetivo).

y devuelve alternativas de rotación clasificadas como **recomendable**, **viable con
restricciones**, **riesgo alto** o **información insuficiente**, con explicación por
criterio, datos faltantes y nivel de confianza.

### 1.3 Diferenciadores

- Lenguaje claro y trazabilidad visible en cada dato.
- Registro inclusivo: sin correo electrónico ni DNI obligatorios.
- PWA con caché y cola de sincronización para conectividad intermitente.
- Regla de veracidad: lo satelital se presenta como contexto, nunca como medición parcelaria.
- Visualización 3D del relieve y del polígono de la parcela.

![Landing](evidencias/capturas/01-landing.png)

---

## 2. Arquitectura y módulos

### 2.1 Stack

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11, Flask 3, Flask-SQLAlchemy, Flask-JWT-Extended |
| Base de datos | SQLite (archivo local, 15 tablas) |
| Frontend | React 18, TypeScript, Vite, TailwindCSS, TanStack Query |
| Mapas | Leaflet + CARTO |
| 3D | Three.js, React Three Fiber, Drei |
| Reportes | ReportLab (PDF) |
| Pruebas | pytest, pytest-cov, GitHub Actions |
| Despliegue | Render (Web Service único), GitHub |

### 2.2 Módulos

| Módulo | Responsabilidad |
|---|---|
| ROOTWISE ID | Registro, login, perfiles, roles y auditoría |
| ROOTWISE LAND | Fincas, parcelas, polígono, área, centroide, visor 3D |
| ROOTWISE EARTH | Integración y proxy de APIs NASA |
| ROOTWISE SOIL | Análisis de suelo con procedencia |
| ROOTWISE CLIMATE | Historial y estacionalidad de NASA POWER |
| ROOTWISE ROTATION | Motor de aptitud y rotación explicable |
| ROOTWISE PLANT | Campañas, siembra real y eventos |
| ROOTWISE HEALTH | Triage de hojas y observaciones sanitarias |
| ROOTWISE OFFLINE | Service worker + cola de sincronización |
| ROOTWISE REPORT | Ficha PDF de parcela |

### 2.3 Modelo de datos (resumen)

`users`, `farms`, `parcels`, `parcel_crop_history`, `soil_analyses`, `crop_catalog`,
`crop_rotation_rules`, `crop_campaigns`, `crop_events`, `simulation_runs`,
`simulation_results`, `climate_cache`, `leaf_diagnoses`, `pest_observations`, `audit_logs`.

Reglas de integridad: el área y el centroide se calculan en el servidor desde la geometría;
las recomendaciones guardan `inputs_json` y versión de reglas; las observaciones del
productor nunca se sobrescriben con estimaciones satelitales.

### 2.4 Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro manual sin correo/DNI obligatorio |
| POST | `/api/auth/login` | Login, devuelve JWT |
| GET/PATCH | `/api/auth/me` | Perfil y cambio de contraseña |
| GET/PATCH/DELETE | `/api/users/:id` | Administración de usuarios y roles |
| CRUD | `/api/farms`, `/api/parcels` | Fincas y parcelas |
| CRUD | `/api/parcels/:id/soil` | Análisis de suelo |
| GET | `/api/crops` | Catálogo y búsqueda |
| POST | `/api/parcels/:id/simulations` | Ejecutar simulación |
| CRUD | `/api/parcels/:id/campaigns`, `/api/campaigns/:id/events` | Campañas y eventos |
| GET | `/api/parcels/:id/climate` | NASA POWER con caché |
| POST | `/api/health/diagnose` | Diagnóstico de hoja (opcional) |
| GET | `/api/parcels/:id/report.pdf` | Reporte PDF |
| GET | `/api/nasa/*` | Proxy de APIs NASA |
| GET | `/api/admin/stats`, `/api/admin/audit` | Métricas y auditoría |

---

## 3. Capturas de la aplicación

| # | Pantalla | Archivo |
|---|---|---|
| 1 | Landing y propuesta de valor | `evidencias/capturas/01-landing.png` |
| 2 | Panel del productor | `evidencias/capturas/02-dashboard.png` |
| 3 | Ficha de parcela con visor 3D | `evidencias/capturas/03-parcela.png` |
| 4 | Dibujo de polígono | `evidencias/capturas/04-dibujo-parcela.png` |
| 5 | Clima NASA POWER | `evidencias/capturas/05-clima.png` |
| 6 | Simulador de aptitud | `evidencias/capturas/06-simulador.png` |
| 7 | Campañas y eventos | `evidencias/capturas/07-campanas.png` |
| 8 | Sanidad asistida | `evidencias/capturas/08-sanidad.png` |
| 9 | NASA Earth (Worldview / CMR / EPIC) | `evidencias/capturas/09-nasa.png` |
| 10 | Panel de administración | `evidencias/capturas/10-admin.png` |
| 11 | Modo offline / cola de sincronización | `evidencias/capturas/11-offline.png` |
| 12 | Registro manual | `evidencias/capturas/12-registro.png` |
| 13 | Interfaz en inglés | `evidencias/capturas/13-idioma-ingles.png` |
| 14 | Interfaz en quechua (Runasimi) | `evidencias/capturas/14-idioma-quechua.png` |
| 15 | Interfaz en kichwa amazónico | `evidencias/capturas/15-idioma-kichwa-amazonico.png` |
| 16 | Opción asháninka (beta) | `evidencias/capturas/16-idioma-ashaninka.png` |
| 17 | Panel en quechua | `evidencias/capturas/17-panel-quechua.png` |
| 18 | Quechua disponible sin conexión | `evidencias/capturas/18-offline-quechua.png` |
| 19 | Selector de idiomas en Mi cuenta | `evidencias/capturas/19-idiomas-cuenta.png` |

> Capturas pendientes: 4 a 12. Tomarlas con la app desplegada y guardarlas en la ruta indicada.

### 3.1 Idiomas (español, inglés, quechua y Amazonía)

El selector de idioma está en la landing, el login, el registro, la barra lateral y
**Mi cuenta**. La preferencia se guarda en el dispositivo y en el perfil (`users.language`),
y los diccionarios viajan en el bundle, por lo que **también funcionan sin Internet**.

| Idioma | Estado |
|---|---|
| Español | Validado |
| English | Validado |
| Runasimi (quechua) | Beta, revisión con hablantes |
| Kichwa amazónico | Beta, revisión comunitaria |
| Asháninka | Beta, glosario inicial con respaldo en español |

Las traducciones beta muestran su estado y no se presentan como validadas. El detalle está
en `docs/idiomas.md`.

---

## 4. Evidencias de gestión de usuarios y CRUD

### 4.1 Registro e inicio de sesión

- Registro con usuario, nombre y contraseña; **no** se exige correo ni DNI.
- El rol inicial es `agricultor`; no se puede autoasignar `admin`.
- Login devuelve JWT con expiración de 12 horas.
- Contraseña almacenada con hash de Werkzeug.

_[captura: registro + login]_

### 4.2 Roles y permisos

| Rol | Permisos |
|---|---|
| agricultor | CRUD de sus fincas, parcelas, suelo, campañas, simulaciones y observaciones |
| tecnico | Lectura de todas las fincas y parcelas; escritura solo en las propias |
| admin | Gestión de usuarios y roles, métricas y auditoría |

_[captura: panel de administración con cambio de rol]_

### 4.3 CRUD verificable

| Operación | Endpoint | Evidencia |
|---|---|---|
| Crear finca | `POST /api/farms` | Captura del formulario |
| Crear parcela con polígono | `POST /api/parcels` | Área calculada por el servidor |
| Leer parcelas | `GET /api/parcels` | Listado del panel |
| Actualizar parcela | `PATCH /api/parcels/:id` | Modal de edición |
| Eliminar parcela | `DELETE /api/parcels/:id` | Confirmación y listado actualizado |
| Suelo | `POST/PATCH/DELETE /api/parcels/:id/soil` | Pestaña Suelo |
| Campañas y eventos | `POST/PATCH/DELETE /api/campaigns` | Pestaña Campañas |
| Diagnóstico de hoja | `POST /api/health/diagnose` | Módulo Sanidad |

Tabla de prueba manual:

| Tabla | Registros creados | Registros consultados | Actualizados | Eliminados |
|---|---|---|---|---|
| users | _[n]_ | _[n]_ | _[n]_ | _[n]_ |
| farms | _[n]_ | _[n]_ | _[n]_ | _[n]_ |
| parcels | _[n]_ | _[n]_ | _[n]_ | _[n]_ |
| soil_analyses | _[n]_ | _[n]_ | _[n]_ | _[n]_ |
| crop_campaigns | _[n]_ | _[n]_ | _[n]_ | _[n]_ |

---

## 5. Pruebas automatizadas

### 5.1 Ejecución

```text
$ cd backend
$ pytest -q
..........................................................               [100%]
59 passed
```

_[captura: terminal con pytest -q · salida completa en `docs/evidencias/pytest.txt`]_

### 5.2 Cobertura

```text
$ pytest --cov=api --cov=services --cov-report=term-missing
TOTAL                      1418    358    75%
59 passed
```

La cobertura se concentra en la lógica de negocio y los endpoints principales
(autenticación, parcelas, suelo, simulaciones, campañas, clima y NASA). Los proxies a
servicios externos se prueban con mocks para no depender de Internet.

_[pegar captura de cobertura]_

### 5.3 Casos cubiertos

| Archivo | Qué verifica |
|---|---|
| `test_auth.py` | Registro sin email/DNI, duplicados, login, 401/403, cambio de contraseña |
| `test_parcels.py` | CRUD, área calculada, geometría inválida, aislamiento entre usuarios |
| `test_crops.py` | Búsqueda por nombre común/científico, categorías, detalle con fuente |
| `test_suitability.py` | Restricciones críticas, score, información insuficiente, pesos |
| `test_simulations.py` | Persistencia, reproducibilidad, aislamiento |
| `test_campaigns.py` | Ciclo de campaña, siembra real, eventos |
| `test_climate.py` | NASA POWER mockeado, caché, fallback sin red |
| `test_health.py` | Modelo ausente (503), modelo mockeado, observaciones |
| `test_reports.py` | PDF válido y control de acceso |
| `test_nasa.py` | Proxy Worldview, CMR, EPIC, FIRMS y errores 502 |
| `test_admin.py` | Métricas, cambios de rol, auditoría, healthcheck |

_[captura: pytest -v]_

---

## 6. Enlaces

- **GitHub:** _[enlace]_
- **Render:** _[enlace]_
- **Healthcheck:** `https://[app].onrender.com/healthz`

### 6.1 Funcionamiento de la app desplegada

_[captura: landing en Render con la URL visible]_
_[captura: panel tras login en Render]_
_[captura: simulación ejecutada en Render]_
_[captura: reporte PDF descargado]_

---

## 7. Participación en NASA Space Apps Challenge 2026

- Registro en la plataforma: _[fecha]_
- Reto seleccionado: *Cambio de rumbo: adaptando las granjas con datos de la NASA*
- Envío del proyecto: _[fecha]_
- Enlace del proyecto en Space Apps: _[enlace]_

_[Insertar certificado o constancia de inscripción/envío]_

---

## 8. Anexo A — Modelo de hojas (AgroVision)

| Variante | F1 macro | Exactitud |
|---|---|---|
| RGB (usada) | 88.30 % | 91.43 % |
| HSV | 85.58 % | 88.90 % |

- Arquitectura: MobileNetV2, entrada 160×160, 10 clases de tomate.
- Conjunto: PlantVillage.
- El módulo es **opcional** (`ML_ENABLED`); si TensorFlow no está disponible, la API
  responde `503 ml_unavailable` y la interfaz lo explica sin romper el flujo.
- Evidencias: `docs/evidencias/comparacion.csv`, `confusion_rgb.png`,
  `metricas_por_clase_rgb.csv`.

## 9. Anexo B — Fuentes y límites

- NASA POWER: resolución ~0.5°, promedio de 5 años; contexto regional.
- Worldview/GIBS: composición de reflectancia por fecha; nubosidad variable.
- CMR/EPIC/FIRMS: catálogo y observación, no pronóstico parcelario.
- Catálogo de cultivos: FAO/FAOSTAT, INIA, MIDAGRI; validación local pendiente.
- ROOTWISE AI no acredita propiedad, no garantiza rendimiento y no reemplaza al agrónomo.

## 10. Anexo C — Instrucciones de reproducción

```bash
git clone [URL_DEL_REPO]
cd rootwise-ai/backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
flask --app wsgi seed-db
flask --app wsgi run --port 5000

cd ../frontend
npm install --include=dev
npm run build     # Flask sirve dist/
# o npm run dev   # http://localhost:5173
```

Credenciales demo: `demo / rootwise2026` y `admin / rootwise2026`.
