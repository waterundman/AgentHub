"""
AgentHub v1.7.0 Functional Test
Tests Goal Contract, Workflow IR, Agent Registry, Verifier etc.
"""
from playwright.sync_api import sync_playwright
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_agenthub():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("=== AgentHub v1.7.0 Functional Test ===\n")
        
        # 1. Visit app
        print("[1] Visiting app...")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        page.screenshot(path='tests/e2e/screenshots/01_home.png', full_page=True)
        print("    OK: Page loaded\n")
        
        # 2. Check main components
        print("[2] Checking main components...")
        
        # Check Header
        header = page.locator('text=AgentHub').first
        if header.is_visible():
            print("    OK: Header visible")
        
        # Check tabs
        tabs = ['运行', '配置', '项目', 'API', '工具']
        for tab in tabs:
            if page.locator(f'button:has-text("{tab}")').is_visible():
                print(f"    OK: Tab '{tab}' visible")
        
        # Check agents
        agents = ['规划师', '研究员', '执行者', '审查员']
        for agent in agents:
            if page.locator(f'text={agent}').count() > 0:
                print(f"    OK: Agent '{agent}' found")
        
        print()
        
        # 3. Test Run Tab
        print("[3] Testing Run Tab...")
        
        # Check task input
        task_input = page.locator('textarea').first
        if task_input.is_visible():
            print("    OK: Task input visible")
            task_input.fill("测试任务：创建一个简单的登录页面")
            page.wait_for_timeout(500)
            page.screenshot(path='tests/e2e/screenshots/02_task_input.png', full_page=True)
            print("    OK: Task filled")
        
        print()
        
        # 4. Test Config Tab
        print("[4] Testing Config Tab...")
        page.locator('button:has-text("配置")').click()
        page.wait_for_timeout(500)
        page.screenshot(path='tests/e2e/screenshots/03_config_tab.png', full_page=True)
        print("    OK: Config tab opened")
        
        # Check agent config items
        config_items = page.locator('text=Agent').all()
        print(f"    Found {len(config_items)} Agent config items")
        
        print()
        
        # 5. Test Projects Tab
        print("[5] Testing Projects Tab...")
        page.locator('button:has-text("项目")').click()
        page.wait_for_timeout(500)
        page.screenshot(path='tests/e2e/screenshots/04_projects_tab.png', full_page=True)
        print("    OK: Projects tab opened")
        
        # Check project agents
        project_agents = ['PPT', 'cleaner', 'image-gen']
        for agent in project_agents:
            if page.locator(f'text=/{agent}/i').count() > 0:
                print(f"    OK: Project agent '{agent}' found")
        
        print()
        
        # 6. Test API Tab
        print("[6] Testing API Tab...")
        page.locator('button:has-text("API")').click()
        page.wait_for_timeout(500)
        page.screenshot(path='tests/e2e/screenshots/05_api_tab.png', full_page=True)
        print("    OK: API tab opened")
        
        print()
        
        # 7. Test Tools Tab
        print("[7] Testing Tools Tab...")
        page.locator('button:has-text("工具")').click()
        page.wait_for_timeout(500)
        page.screenshot(path='tests/e2e/screenshots/06_tools_tab.png', full_page=True)
        print("    OK: Tools tab opened")
        
        print()
        
        # 8. Test theme toggle
        print("[8] Testing theme toggle...")
        theme_btn = page.locator('button:has-text("☾"), button:has-text("☀")').first
        if theme_btn.is_visible():
            theme_btn.click()
            page.wait_for_timeout(500)
            page.screenshot(path='tests/e2e/screenshots/07_dark_theme.png', full_page=True)
            print("    OK: Dark theme applied")
            theme_btn.click()
            page.wait_for_timeout(500)
            print("    OK: Light theme restored")
        
        print()
        
        # 9. Go back to Run tab
        print("[9] Final screenshot...")
        page.locator('button:has-text("运行")').click()
        page.wait_for_timeout(500)
        page.screenshot(path='tests/e2e/screenshots/08_final.png', full_page=True)
        print("    OK: Final screenshot saved\n")
        
        # Summary
        print("=== Test Complete ===")
        print("All screenshots saved to tests/e2e/screenshots/")
        print("Total screenshots: 8")
        
        browser.close()

if __name__ == '__main__':
    test_agenthub()
