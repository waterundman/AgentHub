"""
AgentHub v1.4.0 UI验证脚本 - 最终版
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
        
        # 访问首页
        print("1. 访问首页...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_timeout(10000)  # 等待更长时间让React渲染
        
        # 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        
        # 检查页面内容
        content = page.content()
        print(f"   页面内容长度: {len(content)}")
        
        # 检查root元素
        root = page.locator("#root")
        if root.count() > 0:
            inner_html = root.inner_html()
            print(f"   Root内容长度: {len(inner_html)}")
            
            # 检查是否有按钮
            buttons = page.locator("button").all()
            print(f"   找到 {len(buttons)} 个按钮")
            
            # 检查是否有输入框
            inputs = page.locator("input, textarea").all()
            print(f"   找到 {len(inputs)} 个输入框")
            
            # 打印按钮文本
            for i, btn in enumerate(buttons[:5]):
                try:
                    text = btn.text_content()
                    print(f"   按钮 {i}: {text}")
                except:
                    pass
        
        # 打印控制台消息
        print("\n2. 控制台消息:")
        for msg in console_messages:
            print(f"   {msg}")
        
        # 关闭浏览器
        browser.close()
        
        print("\n=== UI验证完成 ===")

if __name__ == "__main__":
    test_agenthub_ui()
