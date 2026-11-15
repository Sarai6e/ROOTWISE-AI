# Idiomas y accesibilidad — ROOTWISE AI

ROOTWISE AI incluye un sistema de internacionalización (i18n) propio, sin dependencias
externas, que funciona **sin conexión** porque los diccionarios viajan en el bundle y se
cachean con el service worker.

## Idiomas disponibles

| Código | Idioma | Endónimo | Ámbito | Estado |
|---|---|---|---|---|
| `es` | Español | Español | Perú | Validado (idioma base) |
| `en` | Inglés | English | Global | Validado |
| `qu` | Quechua | Runasimi | Andes | Beta, en revisión con hablantes |
| `kwa` | Kichwa amazónico | Kichwa | Amazonía | Beta, en revisión comunitaria |
| `ash` | Asháninka | Asháninka | Selva central | Beta, glosario inicial + respaldo español |

## Dónde se elige

- **Landing**, barra de navegación.
- **Login** y **registro** (el idioma elegido se envía al crear la cuenta).
- **Barra lateral** del panel (siempre visible).
- **Mi cuenta → Idioma y accesibilidad**, con el estado de cada traducción.

La preferencia se guarda en `localStorage` (`rootwise_locale`) y, si hay sesión, se
sincroniza con el campo `users.language` mediante `PATCH /api/auth/me`.

## Arquitectura

```
frontend/src/lib/i18n.tsx          # diccionarios, provider, hook useI18n
frontend/src/components/LanguageSwitcher.tsx
```

- `t("clave", { variables })` con interpolación (`{name}`, `{count}`).
- Cadena de respaldo: idioma activo → español → clave.
- `document.documentElement.lang` se actualiza para lectores de pantalla.
- Las traducciones incompletas **no se presentan como validadas**: el selector y la
  pantalla de cuenta muestran `beta`.

## Cobertura actual

| Ámbito | es | en | qu | kwa | ash |
|---|---|---|---|---|---|
| Navegación y sesión | ✅ | ✅ | ✅ | ✅ | respaldo |
| Landing (hero, CTAs, títulos) | ✅ | ✅ | ✅ | ✅ | respaldo |
| Registro / login | ✅ | ✅ | ✅ | ✅ | respaldo |
| Panel, parcelas, simulador | ✅ | ✅ | ✅ | ✅ | respaldo |
| Sanidad, cuenta, offline | ✅ | ✅ | ✅ | ✅ | respaldo |

Las traducciones son de interfaz. Los textos legales y las explicaciones agronómicas
detalladas siguen en español hasta su revisión técnica y lingüística, tal como exige la
regla de veracidad del proyecto.

## Glosario Asháninka (borrador para validación)

| Concepto | Término propuesto | Estado |
|---|---|---|
| agua | nija | por validar |
| suelo / tierra | kipatsi | por validar |
| bueno | kameetsa | por validar |
| buscar | nokoy | por validar |

> Este glosario **no debe publicarse como traducción validada** hasta contar con revisión
> de hablantes de la comunidad. El producto muestra español como respaldo mientras tanto.

## Cómo añadir o completar un idioma

1. Agrega el código en `LOCALES` y un diccionario en `frontend/src/lib/i18n.tsx`.
2. Copia las claves faltantes; las que no existan caen automáticamente a español.
3. Prueba en los tres tamaños (móvil, tablet, escritorio) y con textos largos.
4. Cuando un hablante revise el contenido, cambia `status` de `beta` a `validado`.
5. Registra el revisor y la fecha en este documento.

## Accesibilidad

- Selector con etiqueta `aria-label` y nombres en su propia lengua.
- Contraste AA, foco visible, tamaños táctiles ≥ 40 px.
- El idioma no se infiere por ubicación, apellido ni DNI: siempre lo elige la persona.
- El cambio de idioma no pierde formularios, parcelas ni datos guardados.
