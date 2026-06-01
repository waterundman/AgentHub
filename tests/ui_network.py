"""
AgentHub v1.4.0 UI验证脚本 - 网络请求检查版
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
        
        # 收集网络请求
        failed_requests = []
        page.on("requestfailed", lambda request: failed_requests.append(f"{request.url} - {request.failure}"))
        
        # 收集控制台消息
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        # 访问首页
        print("访问首页...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_timeout(5000)
        
        # 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        
        # 打印失败的请求
        print("\n失败的网络请求:")
        for req in failed_requests:
            print(f"  {req}")
        
        # 打印控制台消息
        print("\n控制台消息:")
        for msg in console_messages:
            print(f"  {msg}")
        
        # 关闭浏览器
        browser.close()

if __name__ == "__main__":
    test_agenthub_ui()
