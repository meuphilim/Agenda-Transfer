# jules-scratch/verification/verify_agency_onboarding_flow.py
import time
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    """
    Verifies the full agency onboarding flow.
    """
    # Use a unique email for each run to avoid conflicts
    unique_email = f"test-agency-{int(time.time())}@example.com"

    # 1. Navigate to the registration page
    page.goto("http://localhost:5173/cadastro-agencia")

    # 2. Fill out the form with valid data
    # Agency Info
    page.get_by_label("Nome da Agência *").fill("Agência de Teste Playwright")
    page.get_by_label("CNPJ").fill("00.000.000/0001-00")
    page.get_by_label("Endereço").fill("Rua dos Testes, 123")
    page.get_by_label("Pessoa de Contato").fill("Teste da Silva")
    page.get_by_label("Telefone da Agência").fill("(99) 99999-9999")
    page.get_by_label("E-mail da Agência").fill("contato@agenciadeteste.com")

    # User Info
    page.get_by_label("Seu Nome Completo *").fill("Usuário de Teste")
    page.get_by_label("Seu Telefone").fill("(88) 88888-8888")
    page.get_by_label("Seu E-mail (para login) *").fill(unique_email)

    # Corrected selectors for password fields
    page.get_by_label("Senha *", exact=True).fill("password123")
    page.get_by_label("Confirmar Senha *").fill("password123")


    # 3. Submit the form
    page.get_by_role("button", name="Finalizar Cadastro").click()

    # 4. Assert that the user is redirected to the agency portal
    # The redirection might take a moment, so we wait for the URL to change.
    expect(page).to_have_url("http://localhost:5173/agency-portal", timeout=10000)

    # 5. Assert that the portal page shows a welcome message
    # Updated to a more generic welcome message that is likely to appear
    welcome_header = page.get_by_role("heading", name="Bem-vindo ao Portal da Agência")
    expect(welcome_header).to_be_visible()

    # 6. Take a screenshot for visual confirmation
    page.screenshot(path="jules-scratch/verification/agency_onboarding_success.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
