"""
AgentHub v1.4.0 UI验证脚本 - 详细错误检查版
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
        
        # 收集网络请求
        failed_requests = []
        page.on("requestfailed", lambda request: failed_requests.append(f"{request.url} - {request.failure}"))
        
        # 访问首页
        print("访问首页...")
        page.goto("http://localhost:5173", timeout=30000)
        page.wait_for_timeout(10000)  # 等待更长时间
        
        # 截图
        page.screenshot(path=f"{screenshot_dir}/01_homepage.png", full_page=True)
        
        # 获取页面HTML
        html = page.content()
        with open(f"{screenshot_dir}/page_content.html", "w", encoding="utf-8") as f:
            f.write(html)
        
        # 检查页面内容
        print(f"页面HTML长度: {len(html)}")
        
        # 检查是否有错误覆盖层
        error_overlay = page.locator("vite-error-overlay")
        if error_overlay.count() > 0:
            print("发现Vite错误覆盖层！")
            # 获取错误信息
            error_text = page.evaluate("""
                () => {
                    const overlay = document.querySelector('vite-error-overlay');
                    if (overlay && overlay.shadowRoot) {
                        const pre = overlay.shadowRoot.querySelector('pre');
                        return pre ? pre.textContent : 'No error text found';
                    }
                    return 'No overlay found';
                }
            """)
            print(f"错误信息: {error_text[:500]}")
        
        # 打印失败的网络请求
        print("\n失败的网络请求:")
        for req in failed_requests[:5]:
            print(f"  {req[:200]}")
        
        # 打印控制台消息
        print("\n控制台消息:")
        for msg in console_messages:
            print(f"  {msg}")
        
        # 打印页面错误
        print("\n页面错误:")
        for err in page_errors:
            print(f"  {err[:200]}")
        
        # 关闭浏览器
        browser.close()

if __name__ == "__main__":
    test_agenthub_ui()
