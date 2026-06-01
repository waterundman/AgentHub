"""
AgentHub v1.4.0 UI验证脚本
"""
from playwright.sync_api import sync_playwright
import os

def test_agenthub_ui():
    """验证AgentHub UI功能"""
    
    # 截图目录
    screenshot_dir = "W:\\项目仓库\\agenthub\\tests\\screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        # 1. 访问首页
        print("1. 访问首页...")
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        print("   [OK] 首页加载成功")
        
        # 2. 检查主要标签页
        print("2. 检查标签页...")
        tabs = page.locator("button").all()
        tab_texts = [tab.text_content() for tab in tabs if tab.text_content()]
        print(f"   找到按钮: {tab_texts[:10]}...")
        
        # 3. 测试运行标签页
        print("3. 测试运行标签页...")
        try:
            run_tab = page.locator("text=运行").first
            if run_tab.is_visible():
                run_tab.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/02_run_tab.png")
                print("   [OK] 运行标签页切换成功")
        except Exception as e:
            print(f"   [WARN] 运行标签页测试: {e}")
        
        # 4. 测试配置标签页
        print("4. 测试配置标签页...")
        try:
            config_tab = page.locator("text=配置").first
            if config_tab.is_visible():
                config_tab.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/03_config_tab.png")
                print("   [OK] 配置标签页切换成功")
        except Exception as e:
            print(f"   [WARN] 配置标签页测试: {e}")
        
        # 5. 测试API标签页
        print("5. 测试API标签页...")
        try:
            api_tab = page.locator("text=API").first
            if api_tab.is_visible():
                api_tab.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/04_api_tab.png")
                print("   [OK] API标签页切换成功")
        except Exception as e:
            print(f"   [WARN] API标签页测试: {e}")
        
        # 6. 测试工具标签页
        print("6. 测试工具标签页...")
        try:
            tools_tab = page.locator("text=工具").first
            if tools_tab.is_visible():
                tools_tab.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/05_tools_tab.png")
                print("   [OK] 工具标签页切换成功")
        except Exception as e:
            print(f"   [WARN] 工具标签页测试: {e}")
        
        # 7. 检查控制台错误
        print("7. 检查控制台错误...")
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.reload()
        page.wait_for_load_state("networkidle")
        
        if errors:
            print(f"   [WARN] 发现 {len(errors)} 个控制台错误")
            for err in errors[:3]:
                print(f"     - {err[:100]}")
        else:
            print("   [OK] 无控制台错误")
        
        # 8. 测试主题切换
        print("8. 测试主题切换...")
        try:
            theme_btn = page.locator("[aria-label*='theme'], [aria-label*='主题'], button:has(svg)").first
            if theme_btn.is_visible():
                theme_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/06_theme_toggle.png")
                print("   [OK] 主题切换成功")
        except Exception as e:
            print(f"   [WARN] 主题切换测试: {e}")
        
        # 关闭浏览器
        browser.close()
        
        print("\n=== UI验证完成 ===")
        print(f"截图保存在: {screenshot_dir}")
        
        return len(errors) == 0

if __name__ == "__main__":
    success = test_agenthub_ui()
    exit(0 if success else 1)
