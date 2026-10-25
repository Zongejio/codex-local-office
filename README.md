# Office 本地编辑器

在 Codex 中可直接打开 Word、Excel、PPT 进行修改，并将修改保存回本地原文件。

无需租用云服务器。编辑引擎和文件保存服务都运行在使用者自己的电脑上。首次安装需要联网下载软件；正常的本地编辑、转换与保存不依赖外网。Codex 的 AI 对话仍需要网络。

## 支持范围

- 当前安装器：**Apple 芯片 Mac（arm64）**，使用 Lima 的 macOS 虚拟化驱动；建议 macOS 14 或更新系统。
- Codex 桌面版需要支持 MCP 文件入口和宿主本地路径元数据；旧版 Codex 不支持时会拒绝打开，不会猜测文件路径。
- 文件类型：本地 `.docx`、`.xlsx`、`.pptx`，当前单文件上限 **20 MB**。
- Windows、Intel Mac、云端文件、旧格式 `.doc/.xls/.ppt` **尚未支持或验证**。
- 编辑器为 ONLYOFFICE Docs Community，不是 Microsoft Office 或 WPS，复杂排版、宏和特殊功能不能保证完全兼容。本项目禁用宏与额外插件。

Word 文本修改、Excel 单元格修改、PPT 新增幻灯片，以及本地保存后重新打开已在开发机器验证。**本发布安装器尚未完成第二台干净 Mac 的端到端安装验收**。自动检查不等于所有系统和 Office 功能均已验证。

## 安装

### 1. 准备

需要 Codex 桌面版、支持 `codex plugin` 的 Codex CLI，以及 [Homebrew](https://brew.sh)。建议电脑至少 8 GB 内存，并准备 40 GB 可用磁盘空间。虚拟环境默认分配 2 核 CPU、4 GB 内存和上限 40 GB 的虚拟磁盘；首次下载可能数 GB。

下载源码后放到一个**长期保留**的目录，不要放在临时下载清理目录。可以通过 Git 克隆，也可以下载 ZIP 并解压。

### 2. 运行安装器

在终端进入解压目录，运行：

```bash
bash Install.command
```

安装器会检查 Node.js、Lima 和 OpenSSL。缺失时先征求同意，再通过 Homebrew 安装；不会安装或启动 Docker。

随后会：

1. 为此电脑生成独立密钥和只用于 `localhost` 的连接证书。
2. 下载带 SHA-256 校验的 Ubuntu 镜像，创建没有主机文件夹挂载的专用虚拟环境。
3. 在虚拟环境中通过官方签名软件源安装固定版本 ONLYOFFICE Docs。
4. 提示是否将本机证书加入登录钥匙串。**此步骤需要你明确同意，不能无感跳过。**它不是通用 CA。
5. 在你的应用数据目录生成这台电脑专用的 Codex 插件配置。

不需要提供任何 API Key，不需要填写服务器地址，不需要上传文档。如果安装软件包期间提示第三方协议，请自己阅读并决定是否接受。

### 3. 安装 Codex 插件

安装器完成后运行：

```bash
codex plugin marketplace add "$HOME/Library/Application Support/CodexLocalOffice/marketplace"
codex plugin add codex-local-office@codex-local-office
```

如果当前 Codex 会话没有加载新插件，完整退出并重新打开一次 Codex。然后在 Word、Excel、PPT 文件的“打开方式”中，各选择一次 **Office 本地编辑器**。当前兼容的 Codex 会记住每种文件的选择；不能仅靠修改配置文件来保证默认入口已经生效。

> 只在 Codex 中添加 GitHub 仓库，不能代替本地引擎安装。必须先运行上述安装器。注册时添加的是安装器生成的本地 marketplace。

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
