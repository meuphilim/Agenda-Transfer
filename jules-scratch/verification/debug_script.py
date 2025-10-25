
from playwright.sync_api import sync_playwright

def run_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navega para a página de login
        page.goto("http://localhost:5173/")

        # 2. Aguarda 3 segundos para dar tempo à página de renderizar ou falhar
        page.wait_for_timeout(3000)

        # 3. Tira uma captura de tela para diagnóstico
        page.screenshot(path="jules-scratch/verification/debug_screenshot.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run_debug()
