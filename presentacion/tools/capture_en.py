"""Capture the ROOTWISE AI app in English at 1920x1080 for the deck and the video."""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:5055"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "screens"
OUT.mkdir(parents=True, exist_ok=True)

VIEWPORT = {"width": 1920, "height": 1080}


def login_token() -> str:
    import urllib.request

    req = urllib.request.Request(
        f"{BASE}/api/auth/login",
        data=json.dumps({"username": "demo", "password": "rootwise2026"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["access_token"]


def main() -> None:
    token = login_token()
    shots: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome", headless=True, args=["--force-device-scale-factor=1"]
        )
        ctx = browser.new_context(
            viewport=VIEWPORT, locale="en-US", device_scale_factor=1,
            extra_http_headers={"Accept-Language": "en-US,en"},
        )
        page = ctx.new_page()

        page.goto(BASE, wait_until="networkidle")
        page.evaluate(
            """([tok]) => {
                localStorage.setItem('rootwise_locale', 'en');
                localStorage.setItem('rootwise_token', tok);
            }""",
            [token],
        )

        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(3500)
        page.screenshot(path=str(OUT / "01-landing.png"))
        shots.append("01-landing")

        for route, name, wait in [
            ("/app", "02-dashboard", 4000),
            ("/app/parcelas/1", "03-parcel", 4500),
            ("/app/simulador", "04-simulator", 4000),
            ("/app/nasa", "05-nasa", 6000),
        ]:
            page.goto(BASE + route, wait_until="networkidle")
            page.wait_for_timeout(wait)
            if name == "05-nasa":
                page.locator('input[type="date"]').fill("2026-11-15")
                page.wait_for_timeout(6000)
            page.screenshot(path=str(OUT / f"{name}.png"))
            shots.append(name)

        # Plant health with a real diagnosis from the AgroVision model.
        page.goto(BASE + "/app/sanidad", wait_until="networkidle")
        page.wait_for_timeout(3000)
        page.set_input_files('input[type="file"]', str(ROOT / "assets" / "leaf.jpg"))
        page.wait_for_timeout(1200)
        page.get_by_role("button", name="Analyse leaf", exact=False).click()
        page.wait_for_timeout(9000)
        page.screenshot(path=str(OUT / "06-health.png"))
        shots.append("06-health")

        # Simulator with real results: pick three crops and evaluate.
        page.goto(BASE + "/app/simulador", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.fill('input[placeholder*="Quinoa"]', "Tomate")
        page.wait_for_timeout(900)
        page.get_by_role("button", name="Tomate", exact=False).first.click()
        page.wait_for_timeout(500)
        page.fill('input[placeholder*="Quinoa"]', "Maíz amarillo duro")
        page.wait_for_timeout(900)
        page.get_by_role("button", name="Maíz amarillo duro", exact=False).first.click()
        page.wait_for_timeout(500)
        page.fill('input[placeholder*="Quinoa"]', "Arroz")
        page.wait_for_timeout(900)
        page.get_by_role("button", name="Arroz", exact=False).first.click()
        page.wait_for_timeout(600)
        page.get_by_role("button", name="Evaluate", exact=False).click()
        page.wait_for_timeout(9000)
        page.screenshot(path=str(OUT / "04-simulator.png"))
        shots.append("04-simulator")

        # Offline banner: load the page, then cut the network and try a write.
        page.goto(BASE + "/app/parcelas/1", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.get_by_role("button", name="Soil", exact=True).click()
        page.wait_for_timeout(1200)
        ctx.set_offline(True)
        try:
            page.get_by_role("button", name="Save analysis").click(timeout=5000)
        except Exception:
            try:
                page.get_by_role("button", name="Guardar análisis").click(timeout=5000)
            except Exception as exc:  # noqa: BLE001
                print("offline click failed:", exc)
        page.wait_for_timeout(2500)
        page.screenshot(path=str(OUT / "07-offline.png"))
        shots.append("07-offline")
        ctx.set_offline(False)

        browser.close()

    print("captured:", ", ".join(shots))


if __name__ == "__main__":
    sys.exit(main())
