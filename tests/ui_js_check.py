"""
AgentHub v1.4.0 UI验证脚本 - JavaScript检查版
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
        
        # 收集页面错误
        page_errors = []
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        
        # 访问首页
        print("访问首页...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_timeout(5000)  # 等待更长时间
        
        # 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        
        # 执行JavaScript检查
        print("执行JavaScript检查...")
        
        # 检查React是否加载
        react_loaded = page.evaluate("typeof React !== 'undefined'")
        print(f"React已加载: {react_loaded}")
        
        # 检查ReactDOM是否加载
        reactdom_loaded = page.evaluate("typeof ReactDOM !== 'undefined'")
        print(f"ReactDOM已加载: {reactdom_loaded}")
        
        # 检查root元素
        root_content = page.evaluate("document.getElementById('root').innerHTML")
        print(f"Root内容长度: {len(root_content)}")
        
        # 检查是否有任何元素
        all_elements = page.evaluate("document.querySelectorAll('*').length")
        print(f"页面元素总数: {all_elements}")
        
        # 打印所有控制台消息
        print("\n控制台消息:")
        for msg in console_messages:
            print(f"  {msg}")
        
        # 打印页面错误
        print("\n页面错误:")
        for err in page_errors:
            print(f"  {err}")
        
        # 关闭浏览器
        browser.close()

if __name__ == "__main__":
    test_agenthub_ui()
