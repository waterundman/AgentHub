"""
AgentHub v1.4.0 UI验证脚本 - 控制台检查版
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
        
        # 收集所有控制台消息
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        # 访问首页
        print("访问首页...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_timeout(5000)  # 等待更长时间
        
        # 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        
        # 获取页面内容
        content = page.content()
        print(f"页面内容长度: {len(content)}")
        
        # 检查root元素内容
        root = page.locator("#root")
        if root.count() > 0:
            inner_html = root.inner_html()
            print(f"Root元素内容长度: {len(inner_html)}")
            if len(inner_html) > 0:
                print(f"Root内容前100字符: {inner_html[:100]}")
            else:
                print("Root元素内容为空！")
        
        # 打印所有控制台消息
        print("\n控制台消息:")
        for msg in console_messages:
            print(f"  {msg}")
        
        # 检查是否有网络请求失败
        print("\n检查网络请求...")
        
        # 关闭浏览器
        browser.close()

if __name__ == "__main__":
    test_agenthub_ui()
