# Checklist de entrega

## Código y repositorio
- [ ] Repositorio público en GitHub con el nombre `rootwise-ai`.
- [ ] `README.md` con descripción, stack, ejecución, pruebas y enlaces.
- [ ] `.gitignore` funcionando (sin `.venv`, `node_modules`, `dist`, `.db`).
- [ ] Licencia o declaración de uso académico.
- [ ] Historial de commits coherente.

## Funcionalidad exigida
- [ ] Flask con API REST y SQLite.
- [ ] CRUD visible de al menos 3 entidades (fincas, parcelas, campañas, suelo).
- [ ] Registro, login, logout y roles (agricultor/técnico/admin).
- [ ] Control de acceso: un usuario no ve datos de otro.
- [ ] Pruebas automatizadas con pytest en verde.
- [ ] App desplegada en Render y saludable (`/healthz`).

## Reto NASA
- [ ] Reto descrito con problema y solución.
- [ ] Uso real de datos NASA (POWER verificado con datos devueltos).
- [ ] Atribución de fuentes y límites declarados.
- [ ] Registro y envío en la plataforma Space Apps.
- [ ] Certificado o constancia descargada.

## Documento PDF
- [ ] Portada con nombre, curso, reto y enlaces.
- [ ] Descripción del reto y solución.
- [ ] Arquitectura y módulos.
- [ ] Capturas: landing, registro, login, panel, parcela 3D, dibujo de polígono,
      clima, simulador, campañas, sanidad, NASA Earth, admin, offline.
- [ ] Evidencias de usuarios y CRUD.
- [ ] Captura de `pytest -q` y `pytest --cov` (59 pruebas, 75 % de cobertura).
- [ ] Capturas de idioma: inglés, quechua, kichwa amazónico, asháninka (beta) y panel en quechua.
- [ ] Verificar que el idioma se conserva al recargar y **sin conexión**.
- [ ] Enlace de GitHub.
- [ ] Enlace de Render.
- [ ] Capturas de la app desplegada.
- [ ] Certificado de participación.
- [ ] Anexo del modelo AgroVision (F1 88.30 %, exactitud 91.43 %).
- [ ] PDF único, nombre `ROOTWISE_AI_Entrega_Final.pdf`.

## Capturas sugeridas (guardar en docs/evidencias/capturas)
1. `01-landing.png`
2. `02-dashboard.png`
3. `03-parcela.png`
4. `04-dibujo-parcela.png` — `/app/parcelas/nueva`
5. `05-clima.png` — pestaña Clima NASA
6. `06-simulador.png` — simulación con 3 cultivos
7. `07-campanas.png` — campaña creada + evento
8. `08-sanidad.png` — resultado del modelo o aviso de módulo inactivo
9. `09-nasa.png` — Worldview + CMR + EPIC
10. `10-admin.png` — usuarios y auditoría con `admin`
11. `11-offline.png` — navegador en modo offline + banner
12. `12-registro.png` — formulario de registro
13. `13-pytest.png` — terminal con 48 pruebas
14. `14-render.png` — app desplegada

## Comandos útiles

```bash
cd backend && pytest -q
cd backend && pytest --cov=api --cov=services --cov-report=term-missing
cd frontend && npm run build
```

## Variables de entorno en Render
- `SECRET_KEY` (generada)
- `JWT_SECRET_KEY` (generada)
- `DATABASE_URL=sqlite:////opt/render/project/src/backend/data/rootwise.db`
- `ML_ENABLED=0`
- `AUTO_SEED=1`
- `FRONTEND_DIST=/opt/render/project/src/frontend/dist`
- Opcional: `NASA_API_KEY`, `FIRMS_MAP_KEY`
