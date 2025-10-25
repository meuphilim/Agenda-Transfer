
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Navega para a página de login
        page.goto("http://localhost:5173/")

        # 2. Aguarda um seletor estável (o campo de e-mail) aparecer
        email_input = page.get_by_placeholder("voce@exemplo.com")
        expect(email_input).to_be_visible(timeout=15000)

        # 3. Dá um tempo extra para as animações de entrada terminarem
        page.wait_for_timeout(1000)

        # 4. Tira a captura de tela da página inteira
        page.screenshot(path="jules-scratch/verification/premium_design_verification.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    run_verification()
