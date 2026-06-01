"""
AgentHub v1.4.0 UI验证脚本 - 调试版
"""
from playwright.sync_api import sync_playwright
import os

def test_agenthub_ui():
    """验证AgentHub UI功能"""
    
    # 截图目录
    screenshot_dir = "W:\\项目仓库\\agenthub\\tests\\screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 显示浏览器以便调试
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        # 收集控制台消息
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
        
        # 1. 访问首页
        print("1. 访问首页...")
        try:
            page.goto("http://localhost:5173", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)
            page.wait_for_timeout(3000)  # 额外等待渲染
            page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
            print("   [OK] 首页加载成功")
        except Exception as e:
            print(f"   [ERROR] 首页加载失败: {e}")
            page.screenshot(path=f"{screenshot_dir}/01_error.png")
            browser.close()
            return False
        
        # 2. 获取页面标题和内容
        print("2. 检查页面内容...")
        title = page.title()
        print(f"   页面标题: {title}")
        
        # 获取页面HTML
        content = page.content()
        print(f"   页面内容长度: {len(content)} 字符")
        
        # 检查是否有React根元素
        root = page.locator("#root")
        if root.count() > 0:
            print("   [OK] 找到React根元素")
            inner_html = root.inner_html()
            print(f"   根元素内容长度: {len(inner_html)} 字符")
        else:
            print("   [WARN] 未找到React根元素")
        
        # 3. 查找所有可见的文本
        print("3. 查找页面元素...")
        all_buttons = page.locator("button").all()
        print(f"   找到 {len(all_buttons)} 个按钮")
        
        all_links = page.locator("a").all()
        print(f"   找到 {len(all_links)} 个链接")
        
        all_inputs = page.locator("input").all()
        print(f"   找到 {len(all_inputs)} 个输入框")
        
        # 4. 打印控制台消息
        print("4. 控制台消息:")
        for msg in console_messages[:10]:
            print(f"   {msg}")
        
        # 5. 尝试点击各个元素
        print("5. 测试交互...")
        
        # 查找包含特定文本的元素
        for text in ["运行", "配置", "API", "工具", "Agent"]:
            try:
                elem = page.locator(f"text={text}").first
                if elem.is_visible():
                    print(f"   找到可见元素: {text}")
            except:
                pass
        
        # 关闭浏览器
        browser.close()
        
        print("\n=== UI验证完成 ===")
        return True

if __name__ == "__main__":
    test_agenthub_ui()
