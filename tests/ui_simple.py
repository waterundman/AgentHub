"""
AgentHub v1.4.0 UI验证脚本 - 简化版
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
        
        # 收集控制台消息
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        # 1. 访问首页
        print("1. 访问首页...")
        try:
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_timeout(5000)  # 等待渲染
            page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
            print("   [OK] 首页加载成功")
        except Exception as e:
            print(f"   [ERROR] 首页加载失败: {e}")
            browser.close()
            return False
        
        # 2. 获取页面标题
        print("2. 检查页面内容...")
        title = page.title()
        print(f"   页面标题: {title}")
        
        # 3. 查找元素
        print("3. 查找页面元素...")
        all_buttons = page.locator("button").all()
        print(f"   找到 {len(all_buttons)} 个按钮")
        
        for i, btn in enumerate(all_buttons[:5]):
            try:
                text = btn.text_content()
                print(f"   按钮 {i}: {text}")
            except:
                pass
        
        # 4. 打印控制台消息
        print("4. 控制台消息:")
        for msg in console_messages[:5]:
            print(f"   {msg}")
        
        # 关闭浏览器
        browser.close()
        
        print("\n=== UI验证完成 ===")
        return True

if __name__ == "__main__":
    test_agenthub_ui()
