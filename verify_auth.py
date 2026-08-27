import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Start server in background just in case it's not running
        # Wait, I'll just load the local file URL for now, it's easier and avoids server issues.
        # Actually, using a server is better for ES modules.

        # Let's start a server
        import subprocess
        import time
        server_process = subprocess.Popen(["python3", "-m", "http.server", "8080"])
        time.sleep(1) # wait for server to start

        try:
            await page.goto('http://localhost:8080/index.html')

            # Wait for auth section to be visible
            await page.wait_for_selector('#auth-section')

            # Take screenshot of login page
            await page.screenshot(path='/home/jules/verification/login_page.png')
            print("Login page screenshot saved to /home/jules/verification/login_page.png")

            # Click signup link
            await page.click('#show-signup')
            await page.wait_for_timeout(500) # Wait for animation/toggle

            # Take screenshot of signup page
            await page.screenshot(path='/home/jules/verification/signup_page.png')
            print("Signup page screenshot saved to /home/jules/verification/signup_page.png")

        finally:
            server_process.terminate()
            await browser.close()

asyncio.run(verify())
