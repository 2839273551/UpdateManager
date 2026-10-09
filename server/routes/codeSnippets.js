const express = require('express');
const router = express.Router();
const appService = require('../services/appService');

router.get('/:appId', async (req, res) => {
  const { appId } = req.params;
  const app = await appService.getApp(appId);
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const serverUrl = `${protocol}://${host}`;

  const webhookUrl = `${serverUrl}/api/webhook/github/${appId}`;
  const webhookSecret = app ? app.webhook_secret : 'your-webhook-secret';

  const snippets = {
    webhook: {
      url: webhookUrl,
      secret: webhookSecret,
      events: ['Releases'],
      contentType: 'application/json'
    },
    python: `import os
import sys
import hashlib
import requests
import subprocess

UPDATE_SERVER = "${serverUrl}"
APP_ID = "${appId}"
CURRENT_VERSION = "1.0.0"  # 你的本地版本号
PLATFORM = "windows_x64"   # windows_x64 / mac_arm64 / linux_x64 等

def check_for_update():
    url = f"{UPDATE_SERVER}/api/v1/update/check"
    params = {
        "app_id": APP_ID,
        "version": CURRENT_VERSION,
        "platform": PLATFORM,
        "channel": "stable"
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        if not data.get("has_update"):
            print("当前已是最新版本")
            return None
        print(f"发现新版本: {data['latest_version']}")
        print(f"更新日志:\\n{data.get('changelog', '')}")
        return data
    except Exception as e:
        print(f"检查更新失败: {e}")
        return None

def verify_sha256(file_path, expected_hash):
    if not expected_hash:
        return True
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest().lower() == expected_hash.lower()

def download_and_update(update_info):
    asset = update_info.get("asset")
    if not asset:
        print("未找到适配当前平台的安装包")
        return

    download_url = asset["download_url"]
    filename = asset["file_name"]
    expected_hash = asset.get("file_sha256")
    
    print(f"正在下载新版本: {filename} ...")
    resp = requests.get(download_url, stream=True, timeout=300)
    with open(filename, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=1024*64):
            if chunk:
                f.write(chunk)
                
    if not verify_sha256(filename, expected_hash):
        print("SHA256校验失败，安装包可能损坏或被篡改！")
        return

    print("下载完成，开始执行更新安装程序...")
    if sys.platform == "win32" and filename.endswith(".exe"):
        # 启动安装包并退出当前程序
        subprocess.Popen([filename])
        sys.exit(0)
    else:
        print(f"新版本已保存至 {filename}")

if __name__ == "__main__":
    info = check_for_update()
    if info:
        download_and_update(info)
`,
    nodejs: `const https = require('https');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const CONFIG = {
  server: '${serverUrl}',
  appId: '${appId}',
  currentVersion: '1.0.0',
  platform: process.platform === 'win32' ? 'windows_x64' : (process.platform === 'darwin' ? 'mac_x64' : 'linux_x64')
};

async function checkUpdate() {
  const url = \`\${CONFIG.server}/api/v1/update/check?app_id=\${CONFIG.appId}&version=\${CONFIG.currentVersion}&platform=\${CONFIG.platform}\`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.has_update) {
    console.log(\`发现新版本: \${data.latest_version}\`);
    console.log('更新说明:\\n', data.changelog);
    if (data.mandatory) {
      console.warn('注意: 这是一个关键强制更新！');
    }
    return data;
  } else {
    console.log('当前已是最新版本');
    return null;
  }
}

// 检查更新示例
checkUpdate().catch(console.error);
`,
    golang: `package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
)

type UpdateResponse struct {
	HasUpdate     bool   \`json:"has_update"\`
	LatestVersion string \`json:"latest_version"\`
	Changelog     string \`json:"changelog"\`
	Mandatory     bool   \`json:"mandatory"\`
	Asset         *struct {
		FileName   string \`json:"file_name"\`
		DownloadURL string \`json:"download_url"\`
		FileSHA256 string \`json:"file_sha256"\`
	} \`json:"asset"\`
}

func checkUpdate(server, appId, currentVer string) (*UpdateResponse, error) {
	platform := fmt.Sprintf("%s_%s", runtime.GOOS, runtime.GOARCH)
	url := fmt.Sprintf("%s/api/v1/update/check?app_id=%s&version=%s&platform=%s", server, appId, currentVer, platform)
	
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result UpdateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func main() {
	server := "${serverUrl}"
	appId := "${appId}"
	currentVersion := "1.0.0"

	fmt.Println("正在检查更新...")
	update, err := checkUpdate(server, appId, currentVersion)
	if err != nil {
		fmt.Printf("检查更新失败: %v\\n", err)
		return
	}

	if !update.HasUpdate {
		fmt.Println("当前已是最新版本")
		return
	}

	fmt.Printf("发现新版本: %s\\n", update.LatestVersion)
	fmt.Printf("更新日志:\\n%s\\n", update.Changelog)
	// 可在此处下载并自替换可执行文件
}
`,
    csharp: `using System;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Diagnostics;

public class AutoUpdater
{
    private static readonly string ServerUrl = "${serverUrl}";
    private static readonly string AppId = "${appId}";
    private static readonly string CurrentVersion = "1.0.0";

    public static async Task CheckAndApplyUpdateAsync()
    {
        using var client = new HttpClient();
        string checkUrl = $"{ServerUrl}/api/v1/update/check?app_id={AppId}&version={CurrentVersion}&platform=windows_x64";
        
        string json = await client.GetStringAsync(checkUrl);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.GetProperty("has_update").GetBoolean())
        {
            string newVer = root.GetProperty("latest_version").GetString();
            Console.WriteLine($"发现新版本: {newVer}");
            
            if (root.TryGetProperty("asset", out var asset) && asset.ValueKind != JsonValueKind.Null)
            {
                string downloadUrl = asset.GetProperty("download_url").GetString();
                string fileName = asset.GetProperty("file_name").GetString();
                
                Console.WriteLine($"开始下载更新文件: {fileName}...");
                byte[] fileBytes = await client.GetByteArrayAsync(downloadUrl);
                await File.WriteAllBytesAsync(fileName, fileBytes);
                
                Console.WriteLine("下载完成，准备启动更新程序...");
                Process.Start(new ProcessStartInfo { FileName = fileName, UseShellExecute = true });
                Environment.Exit(0);
            }
        }
        else
        {
            Console.WriteLine("当前已是最新版本");
        }
    }
}
`
  };

  res.json(snippets);
});

module.exports = router;
