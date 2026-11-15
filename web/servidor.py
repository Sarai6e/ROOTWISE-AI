import io
import json
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError
import numpy as np

CARPETA = Path(__file__).resolve().parent
MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELES = 32_000_000
TAMANO = (160, 160)

NOMBRES_ES = {
    "Tomato___Bacterial_spot": "Mancha bacteriana",
    "Tomato___Early_blight": "Tizón temprano",
    "Tomato___Late_blight": "Tizón tardío",
    "Tomato___Leaf_Mold": "Moho de la hoja",
    "Tomato___Septoria_leaf_spot": "Mancha foliar por septoria",
    "Tomato___Spider_mites Two-spotted_spider_mite": "Araña roja de dos manchas",
    "Tomato___Target_Spot": "Mancha diana",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Virus del rizado amarillo del tomate",
    "Tomato___Tomato_mosaic_virus": "Virus del mosaico del tomate",
    "Tomato___healthy": "Hoja sana",
}


def preparar_foto(contenido):
    with Image.open(io.BytesIO(contenido)) as foto:
        if foto.format not in {"JPEG", "PNG", "WEBP"}:
            raise ValueError("Formato de imagen incompatible.")
        if foto.width * foto.height > MAX_PIXELES:
            raise ValueError("La foto excede 32 megapíxeles.")
        rgb = ImageOps.exif_transpose(foto).convert("RGB")
        return np.asarray(rgb.resize(TAMANO, Image.Resampling.BILINEAR), dtype=np.float32)[None, ...]


class Predictor:
    def __init__(self, modelo, clases):
        self.modelo = modelo
        self.clases = clases
        self.lock = threading.Lock()

    def __call__(self, entrada):
        with self.lock:
            puntajes = np.asarray(self.modelo(entrada, training=False))[0]
        return [
            {"class": self.clases[i], "label": NOMBRES_ES[self.clases[i]], "score": float(puntajes[i])}
            for i in np.argsort(puntajes)[-3:][::-1]
        ]


class Servidor(ThreadingHTTPServer):
    def __init__(self, direccion, predictor):
        super().__init__(direccion, Handler)
        self.predictor = predictor


class Handler(BaseHTTPRequestHandler):
    def responder(self, status, cuerpo, mime):
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(cuerpo)

    def responder_json(self, status, datos):
        self.responder(status, json.dumps(datos, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_GET(self):
        if self.path in {"/", "/index.html"}:
            self.responder(200, (CARPETA / "index.html").read_bytes(), "text/html; charset=utf-8")
        else:
            self.responder_json(404, {"error": "Ruta desconocida."})

    def do_POST(self):
        if self.path != "/predict":
            self.responder_json(404, {"error": "Ruta desconocida."})
            return

        cantidad = self.headers.get("Content-Length", "")
        if not cantidad.isascii() or not cantidad.isdecimal() or len(cantidad) > 12:
            self.responder_json(400, {"error": "No se recibió una imagen válida."})
            return
        cantidad = int(cantidad)
        if not 0 < cantidad <= MAX_BYTES:
            self.responder_json(413, {"error": "El archivo debe pesar entre 1 byte y 10 MB."})
            return

        try:
            self.connection.settimeout(15)
            contenido = self.rfile.read(cantidad)
            if len(contenido) != cantidad:
                raise ValueError("La imagen llegó incompleta.")
            entrada = preparar_foto(contenido)
        except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError):
            self.responder_json(422, {"error": "No se pudo abrir la foto. Usa JPG, PNG o WebP de hasta 32 megapíxeles."})
            return

        try:
            predicciones = self.server.predictor(entrada)
        except Exception as error:
            self.log_error("Error de inferencia: %s", error)
            self.responder_json(500, {"error": "Falló la inferencia. Revisa la consola del servidor."})
            return
        self.responder_json(200, {"predictions": predicciones})


def main():
    from tensorflow import keras

    ruta_modelo = CARPETA / "agrovision_rgb.keras"
    if not ruta_modelo.is_file():
        ruta_modelo = CARPETA.parent / ruta_modelo.name

    clases = json.loads((CARPETA / "clases.json").read_text(encoding="utf-8"))
    if len(clases) != len(NOMBRES_ES) or set(clases) != NOMBRES_ES.keys():
        raise ValueError("clases.json no coincide con las clases de AgroVision RGB.")

    print("Cargando el modelo RGB...", flush=True)
    modelo = keras.models.load_model(ruta_modelo, compile=False)
    if modelo.input_shape[1:] != (*TAMANO, 3) or modelo.output_shape[-1] != len(clases):
        raise ValueError("El modelo no coincide con la configuración de AgroVision RGB.")

    with Servidor(("127.0.0.1", 8765), Predictor(modelo, clases)) as servidor:
        url = "http://127.0.0.1:8765"
        print(f"AgroVision AI abierto en {url}. Ctrl+C para cerrar.", flush=True)
        threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        servidor.serve_forever()


if __name__ == "__main__":
    main()
