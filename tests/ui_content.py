"""
AgentHub v1.4.0 UI验证脚本 - 内容检查版
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
        except Exception as e:
            print(f"   [ERROR] 首页加载失败: {e}")
            browser.close()
            return False
        
        # 2. 获取HTML内容
        print("2. 检查HTML内容...")
        content = page.content()
        
        # 保存HTML到文件
        html_file = f"{screenshot_dir}/page_content.html"
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"   HTML已保存到: {html_file}")
        
        # 检查关键元素
        if "root" in content:
            print("   [OK] 找到root元素")
        if "AgentHub" in content or "agenthub" in content.lower():
            print("   [OK] 找到AgentHub相关内容")
        if "script" in content:
            print("   [OK] 找到script标签")
        
        # 3. 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        print("   截图已保存")
        
        # 4. 打印控制台消息
        print("3. 控制台消息:")
        for msg in console_messages:
            print(f"   {msg}")
        
        # 关闭浏览器
        browser.close()
        
        print("\n=== UI验证完成 ===")
        return True

if __name__ == "__main__":
    test_agenthub_ui()
