# ROOTWISE AI — material de presentación

Todo lo necesario para la entrega del demo, según la guía de NASA Space Apps Challenge
(`NASA Space Apps Challenge.pdf`).

## Entregables

| Archivo | Qué es | Requisito de la guía |
|---|---|---|
| `../ROOTWISE_AI_-_Project_Demo_7slides_EN.pptx` | Demo en diapositivas, inglés | Máximo 7 diapositivas, incluida portada e intro |
| `../ROOTWISE_AI_-_Demo_30s_EN.mp4` | Video de 30 s con locución y subtítulos en inglés | 30 s o menos; audio en inglés con subtítulos |
| `assets/screens/*.png` | Capturas de la app en inglés | Mostrar el producto y la experiencia de uso |
| `video/GUION.md` | Guion con las marcas de tiempo 0:00 / 0:02 / 0:05 / 0:10 / 0:20 | Estructura pedida para el video |

La presentación anterior (`../ROOTWISE_AI_-_Project_Presentation_EN.pptx`, 13 diapositivas)
se conserva como material de apoyo, pero **no** es válida como demo para jueces porque
excede el límite de 7 diapositivas.

## Cómo se regenera

Cada carpeta tiene su propio entorno; nada se instala en el proyecto.

```bash
# Diapositivas y capturas
presentacion/.venv/Scripts/python.exe presentacion/tools/capture_en.py      # capturas en inglés
presentacion/.venv/Scripts/python.exe presentacion/tools/build_deck.py      # genera el .pptx
powershell -File presentacion/tools/export_slides.ps1 -Pptx <archivo.pptx> -OutDir <carpeta>

# Video
powershell -File presentacion/tools/tts.ps1 -OutDir presentacion/video/audio
presentacion/.venv-video/Scripts/python.exe presentacion/tools/build_video.py
presentacion/.venv-video/Scripts/python.exe presentacion/tools/build_video.py --stills
```

Las capturas se toman de la app real en `http://127.0.0.1:5055` con `iniciar-rootwise.cmd`
en marcha, forzando `locale=en` en el navegador y un diagnóstico real del modelo AgroVision.

## Declaración de uso de IA (SI)

La guía exige indicar dónde se usó inteligencia artificial generativa:

- **Video:** la locución se generó con texto-a-voz; el video lo declara en pantalla y en
  los metadatos del archivo.
- **Diapositivas:** el texto se redactó con asistencia de IA y fue revisado por el equipo;
  la última diapositiva lo indica.
- **Capturas:** son del producto real, sin retoques de contenido.
- **Contenido generado:** no se usan logos, banderas ni identificadores de NASA.
