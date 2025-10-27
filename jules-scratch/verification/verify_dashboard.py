
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navegar diretamente para a dashboard
        page.goto("http://localhost:5173/")

        # Aguardar o carregamento da dashboard
        expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=15000)

        # Verificar o card "Motoristas Disponíveis"
        available_drivers_card = page.get_by_text("Motoristas Disponíveis")
        expect(available_drivers_card).to_be_visible()

        # Tirar screenshot
        page.screenshot(path="jules-scratch/verification/dashboard.png")

        print("Screenshot da dashboard salvo em jules-scratch/verification/dashboard.png")

    except Exception as e:
        print(f"Ocorreu um erro: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
