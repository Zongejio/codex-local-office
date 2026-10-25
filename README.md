# Office 本地编辑器

在 Codex 中可直接打开 Word、Excel、PPT 进行修改，并将修改保存回本地原文件。

无需租用云服务器。编辑引擎和文件保存服务都运行在使用者自己的电脑上。首次安装需要联网下载软件；正常的本地编辑、转换与保存不依赖外网。Codex 的 AI 对话仍需要网络。

## 支持范围

- 当前安装器：**Apple 芯片 Mac（arm64）**，使用 Lima 的 macOS 虚拟化驱动；要求 macOS 14 或更新系统。
- Codex 桌面版需要支持 MCP 文件入口和宿主本地路径元数据；旧版 Codex 不支持时会拒绝打开，不会猜测文件路径。
- 文件类型：本地 `.docx`、`.xlsx`、`.pptx`，当前单文件上限 **20 MB**。
- Windows、Intel Mac、云端文件、旧格式 `.doc/.xls/.ppt` **尚未支持或验证**。
- 编辑器为 ONLYOFFICE Docs Community，不是 Microsoft Office 或 WPS，复杂排版、宏和特殊功能不能保证完全兼容。本项目禁用宏与额外插件。

Word 文本修改、Excel 单元格修改、PPT 新增幻灯片，以及本地保存后重新打开已在开发机器验证。发布代码的 11 项自动测试和 GitHub macOS/Linux 检查通过；另在新建的本地虚拟环境验证了三种格式的引擎转换、签名回调和原文件写回。**本发布安装器尚未完成第二台干净 Mac 的端到端安装验收**。自动检查不等于所有系统和 Office 功能均已验证。

## 安装

下载 [最新发布页](https://github.com/Zongejio/codex-local-office/releases/latest) 中的 **ZIP 安装包**，解压后双击 **Office Local Editor Installer.app**，点击“开始安装”。

环境准备、引擎安装和插件注册会自动完成，不需要自己输命令或安装 Homebrew。只在系统证书确认等必要环节提示。安装窗口会显示下载进度，请等待完成。

需要事先安装兼容的 Codex 桌面版。建议至少 8 GB 内存和 40 GB 可用磁盘空间；首次下载可能数 GB。0.6.0 安装应用已通过 Apple Developer ID 签名和公证，公证票据已附加并通过 Gatekeeper 检查。首次打开下载应用、本机证书授权等系统确认仍可能出现。

安装完成后保存工作并重开 Codex 一次；首次打开三类文件时各选择一次 **Office 本地编辑器**。下载包可以移走，运行程序已经复制到固定位置。安装器不会自动关闭 Codex。

[完整安装说明与系统提示](docs/INSTALLATION.md)

## 日常使用

点击本地文件 → 在 Codex 浏览器标签页打开完整版编辑器 → 修改 → 点击顶部 **保存到文件** → 等待“已保存到本地原文件”。

启动页可能仍会保留；它只负责启动编辑器，可以关闭，不承担文件保存。保存由本机后台负责，不需要维持两个标签页连接。当前没有可用接口让插件自动关闭这个启动页。

请以顶部“保存到文件”的确认提示为准，不要仅以编辑器内部自动保存提示判断磁盘文件已更新。原文件若已被另一个程序修改，会拒绝覆盖，并保留本次编辑版本。

## 本地数据与资源

密钥、配置、日志和文档版本保存在：

```text
~/Library/Application Support/CodexLocalOffice/
```

专用虚拟机单独保存在 `~/.codex-office-vm/`，避免 macOS 对虚拟机套接字路径长度的限制。正常编辑不占外网下载带宽，主要消耗 CPU、内存和磁盘。引擎启动后会继续运行；不使用时可参考 [运维说明](docs/OPERATIONS.md) 停止。

**不会自动删除历史版本**，因此长期使用会增加磁盘占用。仓库和发布包不包含任何用户证书、密钥、原文件、私人字体或虚拟机镜像。

## 检查与开发

```bash
npm ci --ignore-scripts
npm run build
npm test
npm run release:check
node scripts/setup.mjs --dry-run
npm run doctor
```

`--dry-run` 只显示安装计划，不安装软件、不生成密钥、不修改证书信任、不启动虚拟机。`doctor` 只读检查，不输出密钥。

- [隐私与安全边界](SECURITY.md)
- [运维、更新与停止](docs/OPERATIONS.md)
- [架构与验证范围](docs/ARCHITECTURE.md)
- [第三方组件与许可](NOTICE.md)

本项目与 OpenAI、Microsoft、WPS、ONLYOFFICE 均无官方隶属或认证关系。项目代码使用 AGPL-3.0-only；第三方软件保留各自许可及商标要求。
