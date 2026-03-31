import os
import shutil
import ctypes
import subprocess
from pathlib import Path

class DiskCleaner:
    def __init__(self):
        self.total_cleaned = 0
        
    @staticmethod
    def is_admin():
        try:
            return ctypes.windll.shell32.IsUserAnAdmin()
        except:
            return False
    
    @staticmethod
    def get_size(path):
        total = 0
        try:
            if os.path.exists(path):
                for dirpath, _, filenames in os.walk(path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        try:
                            total += os.path.getsize(fp)
                        except:
                            pass
        except:
            pass
        return total
    
    @staticmethod
    def format_size(size):
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024:
                return f"{size:.2f} {unit}"
            size /= 1024
        return f"{size:.2f} PB"
    
    def clean_path(self, path, desc=""):
        if not os.path.exists(path):
            return 0
        size = self.get_size(path)
        if size == 0:
            return 0
        print(f"  清理 {desc or path} ({self.format_size(size)})...")
        try:
            shutil.rmtree(path)
        except Exception as e:
            pass
        return size
    
    def remove_files_by_pattern(self, path, patterns, desc=""):
        if not os.path.exists(path):
            return 0
        total = 0
        print(f"  清理 {desc or path}...")
        for root, _, files in os.walk(path):
            for f in files:
                for p in patterns:
                    if p.lower() in f.lower():
                        fp = os.path.join(root, f)
                        try:
                            total += os.path.getsize(fp)
                            os.remove(fp)
                        except:
                            pass
        return total


class TempCleaner(DiskCleaner):
    """3.1 临时文件夹深度清理"""
    
    def clean(self):
        print("1. 临时文件夹清理...")
        paths = [
            (os.environ.get('TEMP', ''), "用户临时文件夹"),
            ('C:\\Windows\\Temp', "Windows临时文件夹"),
            ('C:\\Windows\\Prefetch', "预读取文件"),
        ]
        for path, desc in paths:
            if path and os.path.exists(path):
                self.total_cleaned += self.clean_path(path, desc)
        return self.total_cleaned


class RecycleBinCleaner(DiskCleaner):
    """3.2 Windows磁盘清理 - 回收站"""
    
    def clean(self):
        print("2. 回收站清理...")
        try:
            ctypes.windll.shell32.SHEmptyRecycleBinW(None, None, 0x00000001 | 0x00000002 | 0x00000004)
            self.total_cleaned += 50 * 1024 * 1024
        except:
            pass
        return self.total_cleaned


class BrowserCacheCleaner(DiskCleaner):
    """5.1 浏览器缓存清理"""
    
    def clean(self):
        print("3. 浏览器缓存清理...")
        paths = [
            (os.path.expandvars('%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache'), "Chrome缓存"),
            (os.path.expandvars('%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Code Cache'), "Chrome代码缓存"),
            (os.path.expandvars('%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache'), "Edge缓存"),
            (os.path.expandvars('%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Code Cache'), "Edge代码缓存"),
            (os.path.expandvars('%APPDATA%\\Mozilla\\Firefox\\Profiles'), "Firefox配置"),
        ]
        for path, desc in paths:
            if os.path.exists(path):
                self.total_cleaned += self.clean_path(path, desc)
        return self.total_cleaned


class WindowsUpdateCleaner(DiskCleaner):
    """6.1 Windows更新缓存与旧系统文件"""
    
    def clean(self):
        print("4. Windows更新清理...")
        paths = [
            ('C:\\Windows\\SoftwareDistribution\\Download', "更新下载缓存"),
            ('C:\\Windows\\SoftwareDistribution\\Backup', "更新备份"),
            ('C:\\Windows\\WindowsUpdate.log', "更新日志"),
        ]
        for path, desc in paths:
            if os.path.exists(path):
                self.total_cleaned += self.clean_path(path, desc)
            elif os.path.isfile(path):
                try:
                    size = os.path.getsize(path)
                    os.remove(path)
                    self.total_cleaned += size
                except:
                    pass
        return self.total_cleaned


class LogCleaner(DiskCleaner):
    """6.1 系统日志清理"""
    
    def clean(self):
        print("5. 日志文件清理...")
        paths = [
            ('C:\\Windows\\Logs', "系统日志"),
            ('C:\\Windows\\Panther', "安装日志"),
            ('C:\\Windows\\Performance\\WinSAT', "性能测试"),
            (os.path.expandvars('%LOCALAPPDATA%\\CrashDumps'), "崩溃转储"),
        ]
        for path, desc in paths:
            if os.path.exists(path):
                self.total_cleaned += self.clean_path(path, desc)
        return self.total_cleaned


class ThumbnailCleaner(DiskCleaner):
    """缩略图缓存清理"""
    
    def clean(self):
        print("6. 缩略图缓存清理...")
        path = os.path.expandvars('%LOCALAPPDATA%\\Microsoft\\Windows\\Explorer')
        if not os.path.exists(path):
            return 0
        total = 0
        for f in os.listdir(path):
            if f.startswith('thumbcache') or f.startswith('iconcache'):
                try:
                    fp = os.path.join(path, f)
                    total += os.path.getsize(fp)
                    os.remove(fp)
                except:
                    pass
        self.total_cleaned += total
        return total


class DNSCleaner(DiskCleaner):
    """DNS缓存清理"""
    
    def clean(self):
        print("7. DNS缓存清理...")
        try:
            subprocess.run('ipconfig /flushdns', shell=True, capture_output=True)
        except:
            pass
        return 0


class HibernationCleaner(DiskCleaner):
    """4.1 休眠文件清理"""
    
    def clean(self):
        print("8. 休眠文件清理...")
        hiberfil = 'C:\\hiberfil.sys'
        if os.path.exists(hiberfil):
            try:
                size = os.path.getsize(hiberfil)
                os.remove(hiberfil)
                self.total_cleaned += size
            except:
                pass
        return self.total_cleaned


class WeChatCleaner(DiskCleaner):
    """5.1 微信缓存清理"""
    
    def clean(self):
        print("9. 微信缓存清理...")
        wechat_path = os.path.join(os.environ.get('USERPROFILE', ''), 'Documents', 'WeChat Files')
        if not os.path.exists(wechat_path):
            return 0
        for user in os.listdir(wechat_path):
            user_path = os.path.join(wechat_path, user)
            if os.path.isdir(user_path):
                for subfolder in ['FileCache', 'ImageCache', 'Video', 'Voice']:
                    cache_path = os.path.join(user_path, subfolder)
                    if os.path.exists(cache_path):
                        self.total_cleaned += self.clean_path(cache_path, f"微信-{subfolder}")
        return self.total_cleaned


class QQCleaner(DiskCleaner):
    """5.1 QQ缓存清理"""
    
    def clean(self):
        print("10. QQ缓存清理...")
        qq_path = os.path.join(os.environ.get('APPDATA', ''), 'Tencent', 'QQ')
        if os.path.exists(qq_path):
            for folder in ['Misc', 'Temp', 'VPK']:
                path = os.path.join(qq_path, folder)
                if os.path.exists(path):
                    self.total_cleaned += self.clean_path(path, f"QQ-{folder}")
        return self.total_cleaned


class VSCodeCleaner(DiskCleaner):
    """VSCode 缓存清理"""
    
    def clean(self):
        print("11. VSCode缓存清理...")
        total = 0
        userprofile = os.environ.get('USERPROFILE', '')
        localappdata = os.environ.get('LOCALAPPDATA', '')
        appdata = os.environ.get('APPDATA', '')
        
        paths = [
            (os.path.join(localappdata, 'Microsoft', 'vscode-cpptools', 'ipch'), "C/C++ IntelliSense缓存"),
            (os.path.join(appdata, 'Code', 'CachedData'), "更新缓存"),
            (os.path.join(appdata, 'Code', 'logs'), "日志文件"),
            (os.path.join(appdata, 'Code', 'Cache'), "通用缓存"),
            (os.path.join(localappdata, 'Programs', 'Microsoft VS Code', 'Cache'), "本地程序缓存"),
        ]
        
        for path, desc in paths:
            if os.path.exists(path):
                total += self.clean_path(path, desc)
        
        if userprofile:
            vscode_dir = os.path.join(userprofile, '.vscode')
            if os.path.exists(vscode_dir):
                for subfolder in ['extensions', 'cachedExtensions', 'cachedExtensionVSIXs']:
                    ext_path = os.path.join(vscode_dir, subfolder)
                    if os.path.exists(ext_path):
                        total += self.clean_path(ext_path, f".vscode/{subfolder}")
        
        self.total_cleaned += total
        return total


class StorageSenseCleaner(DiskCleaner):
    """3.3 存储感知功能"""
    
    @staticmethod
    def enable():
        try:
            subprocess.run(
                'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense" /v StorageSenseEnabled /t REG_DWORD /d 1 /f',
                shell=True, capture_output=True
            )
            print("  存储感知已启用")
        except:
            pass
    
    @staticmethod
    def run_now():
        try:
            subprocess.run(
                '_storagecleanup.dll,StorageCleanUpTask',
                shell=True, capture_output=True
            )
            print("  存储感知清理已执行")
        except:
            pass


def main():
    print("=" * 50)
    print("       C盘深度清理工具 (模块化版)")
    print("=" * 50)
    print()
    
    if not DiskCleaner.is_admin():
        print("警告: 建议以管理员权限运行以获得最佳效果")
        print()
    
    total = 0
    
    total += TempCleaner().clean()
    total += RecycleBinCleaner().clean()
    total += BrowserCacheCleaner().clean()
    total += WindowsUpdateCleaner().clean()
    total += LogCleaner().clean()
    total += ThumbnailCleaner().clean()
    total += DNSCleaner().clean()
    total += HibernationCleaner().clean()
    total += WeChatCleaner().clean()
    total += QQCleaner().clean()
    total += VSCodeCleaner().clean()
    
    print()
    print("=" * 50)
    print(f"  清理完成! 共释放空间: {DiskCleaner.format_size(total)}")
    print("=" * 50)


if __name__ == '__main__':
    main()
