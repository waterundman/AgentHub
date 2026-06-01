"""
AgentHub v1.7.0 - Page Structure Inspector
"""
from playwright.sync_api import sync_playwright
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Get page title
        print(f"Title: {page.title()}\n")
        
        # Get all buttons
        print("=== BUTTONS ===")
        buttons = page.locator('button').all()
        for i, btn in enumerate(buttons):
            text = btn.text_content()
            if text:
                print(f"[{i}] {text.strip()[:50]}")
        
        print("\n=== LINKS ===")
        links = page.locator('a').all()
        for i, link in enumerate(links[:10]):
            text = link.text_content()
            if text:
                print(f"[{i}] {text.strip()[:50]}")
        
        print("\n=== INPUTS ===")
        inputs = page.locator('input, textarea').all()
        for i, inp in enumerate(inputs):
            inp_type = inp.get_attribute('type') or 'textarea'
            placeholder = inp.get_attribute('placeholder') or ''
            print(f"[{i}] type={inp_type} placeholder={placeholder[:30]}")
        
        print("\n=== TAB-LIKE ELEMENTS ===")
        # Look for elements that might be tabs
        tab_candidates = page.locator('[class*="tab"], [role="tab"], [class*="Tab"]').all()
        for i, el in enumerate(tab_candidates[:10]):
            text = el.text_content()
            if text:
                print(f"[{i}] {text.strip()[:50]}")
        
        # Get visible text content
        print("\n=== VISIBLE TEXT (first 500 chars) ===")
        body_text = page.locator('body').text_content()
        if body_text:
            print(body_text[:500])
        
        browser.close()

if __name__ == '__main__':
    inspect_page()
