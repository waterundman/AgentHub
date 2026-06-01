"""
AgentHub v1.4.0 UI验证脚本 - 完整版
"""
from playwright.sync_api import sync_playwright
import os

def test_agenthub_ui():
    """验证AgentHub UI功能"""
    
    # 截图目录
    screenshot_dir = "W:\\项目仓库\\agenthub\\tests\\screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    
    results = {
        "homepage": False,
        "run_tab": False,
        "config_tab": False,
        "api_tab": False,
        "tools_tab": False,
        "theme_toggle": False,
        "console_errors": []
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        # 收集控制台消息
        page.on("console", lambda msg: results["console_errors"].append(msg.text) if msg.type == "error" else None)
        
        # 1. 访问首页
        print("1. 访问首页...")
        try:
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_timeout(3000)
            page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
            results["homepage"] = True
            print("   [OK] 首页加载成功")
        except Exception as e:
            print(f"   [ERROR] {e}")
        
        # 2. 测试标签页切换
        tabs = ["运行", "配置", "API", "工具"]
        for i, tab_name in enumerate(tabs):
            print(f"{i+2}. 测试{tab_name}标签页...")
            try:
                tab = page.locator(f"text={tab_name}").first
                if tab.is_visible():
                    tab.click()
                    page.wait_for_timeout(500)
                    page.screenshot(path=f"{screenshot_dir}/{i+2:02d}_{tab_name}.png")
                    results[f"{tab_name}_tab"] = True
                    print(f"   [OK] {tab_name}标签页切换成功")
                else:
                    print(f"   [WARN] {tab_name}标签页不可见")
            except Exception as e:
                print(f"   [ERROR] {e}")
        
        # 6. 测试主题切换
        print("6. 测试主题切换...")
        try:
            # 查找主题切换按钮
            theme_btn = page.locator("button").filter(has=page.locator("svg")).first
            if theme_btn.is_visible():
                theme_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path=f"{screenshot_dir}/06_theme.png")
                results["theme_toggle"] = True
                print("   [OK] 主题切换成功")
        except Exception as e:
            print(f"   [WARN] {e}")
        
        # 关闭浏览器
        browser.close()
        
        # 输出结果
        print("\n=== UI验证结果 ===")
        print(f"首页加载: {'PASS' if results['homepage'] else 'FAIL'}")
        for tab in tabs:
            print(f"{tab}标签页: {'PASS' if results.get(f'{tab}_tab') else 'FAIL'}")
        print(f"主题切换: {'PASS' if results['theme_toggle'] else 'FAIL'}")
        print(f"控制台错误: {len(results['console_errors'])}")
        
        if results['console_errors']:
            print("\n控制台错误详情:")
            for err in results['console_errors'][:5]:
                print(f"  - {err[:100]}")
        
        return results

if __name__ == "__main__":
    test_agenthub_ui()
