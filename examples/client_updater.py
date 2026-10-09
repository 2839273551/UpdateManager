#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitDist 客户端自动更新示例程序 (Python 版)
功能：
1. 向更新平台发起更新检测
2. 解析更新日志与下载地址
3. 多线程/分块流式下载新版本安装包
4. SHA256 完整性哈希防篡改校验
5. 启动安装程序并安全退出当前程序
"""

import os
import sys
import hashlib
import requests
import subprocess

# ================= 配置项 =================
UPDATE_SERVER = "http://103.231.59.78:3000"  # 云端更新分发服务地址
APP_ID = "wk"                               # 平台对应的应用标识 (App ID)
CURRENT_VERSION = "8.5.0"                    # 当前本地运行的程序版本
PLATFORM = "universal"                       # 运行平台: universal, windows_x64, mac_arm64, linux_x64
CHANNEL = "stable"                           # 更新渠道: stable, beta
# ==========================================

def check_for_update():
    """向更新平台查询是否有新版本"""
    url = f"{UPDATE_SERVER}/api/v1/update/check"
    params = {
        "app_id": APP_ID,
        "version": CURRENT_VERSION,
        "platform": PLATFORM,
        "channel": CHANNEL
    }
    print(f"[*] 正在向更新服务器检测更新: {url} (当前版本: v{CURRENT_VERSION})...")
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if not data.get("has_update"):
            print("[+] 当前已是最新版本，无需更新。")
            return None

        print(f"[!] 发现新版本: v{data['latest_version']} ({data.get('release_name', '')})")
        if data.get("mandatory"):
            print("[⚠️] 注意: 此版本为【强制更新】，旧版本将无法继续使用！")

        print("-------------------- 更新说明 --------------------")
        print(data.get("changelog") or "暂无详细说明")
        print("-------------------------------------------------")
        return data
    except Exception as e:
        print(f"[-] 检查更新失败: {e}")
        return None

def verify_file_sha256(file_path, expected_sha256):
    """校验下载文件的 SHA256 哈希值"""
    if not expected_sha256:
        print("[!] 服务端未配置哈希，跳过 SHA256 校验。")
        return True

    print(f"[*] 正在校验文件 SHA256 校验和...")
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    actual_hash = sha256.hexdigest().lower()
    if actual_hash == expected_sha256.lower():
        print("[+] SHA256 校验通过，文件完整且未被篡改！")
        return True
    else:
        print(f"[-] 校验失败! 预期: {expected_sha256}, 实际: {actual_hash}")
        return False

def download_and_install(update_info):
    """下载并执行更新"""
    asset = update_info.get("asset")
    if not asset:
        print("[-] 未找到适用于当前平台的安装包资产。")
        return

    download_url = asset["download_url"]
    file_name = asset["file_name"]
    expected_hash = asset.get("file_sha256")
    file_size = asset.get("file_size", 0)

    print(f"[*] 准备下载: {file_name} (约 {file_size / 1024 / 1024:.2f} MB)")
    print(f"[*] 下载地址: {download_url}")

    save_path = os.path.join(os.getcwd(), f"update_{file_name}")
    try:
        with requests.get(download_url, stream=True, timeout=300) as r:
            r.raise_for_status()
            total_downloaded = 0
            with open(save_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
                        total_downloaded += len(chunk)

        print(f"[+] 下载完成，已保存至: {save_path}")

        # 校验哈希
        if not verify_file_sha256(save_path, expected_hash):
            print("[-] 更新文件哈希校验失败，中止更新以防运行受损文件。")
            if os.path.exists(save_path):
                os.remove(save_path)
            return

        # 执行安装或自启动
        print("[*] 正在启动安装/更新程序...")
        if sys.platform == "win32":
            subprocess.Popen([save_path], shell=True)
            print("[+] 更新进程已拉起，退出旧主程序。")
            sys.exit(0)
        else:
            print(f"[+] 新版本已就绪，请手动运行: {save_path}")

    except Exception as e:
        print(f"[-] 下载或更新执行过程中发生错误: {e}")

def main():
    info = check_for_update()
    if info:
        download_and_install(info)

if __name__ == "__main__":
    main()
