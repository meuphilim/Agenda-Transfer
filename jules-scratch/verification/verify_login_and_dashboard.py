import subprocess
import time
from playwright.sync_api import sync_playwright, expect

def run_verification():
    unique_email = f"testuser_{int(time.time())}@agendatransfer.com"
    password = "password123"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # --- Step 1: Sign up a new user ---
            print(f"Attempting to sign up with new user: {unique_email}")
            page.goto("http://localhost:5173/login")

            page.get_by_role("button", name="Não tem conta? Cadastre-se").click()
            expect(page.get_by_role("heading", name="Criar Conta")).to_be_visible()

            page.get_by_label("Nome Completo").fill("Test User")
            page.get_by_label("Telefone").fill("(11) 98765-4321")
            page.get_by_label("Email").fill(unique_email)
            page.get_by_label("Senha").fill(password)
            page.get_by_role("button", name="Criar Conta").click()

            # --- Step 2: Verify navigation to Pending page ---
            expect(page.get_by_role("heading", name="Conta Pendente")).to_be_visible(timeout=15000)
            print("Successfully navigated to Pending Approval page.")

            # --- Step 3: Activate the user using the Node.js script ---
            print(f"Activating user: {unique_email}")
            result = subprocess.run(
                ['node', 'jules-scratch/verification/activate_user.mjs', unique_email],
                capture_output=True,
                text=True,
                check=True
            )
            print("Activation script output:", result.stdout)

            # --- Step 4: Verify dashboard (auto-redirect) ---
            # The app should now auto-redirect upon activation check
            expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=20000)

            page.screenshot(path="jules-scratch/verification/dashboard_verification.png")
            print("Verification successful: Dashboard loaded.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()