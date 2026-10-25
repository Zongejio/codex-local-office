# Office 本地编辑器

在 Codex 标签页里打开、修改 Word、Excel、PPT，并保存回电脑上的原文件。

**适用：Apple 芯片 Mac（M1、M2、M3 等），macOS 14 或更新系统。** Windows、Intel Mac 暂不支持。请先安装支持插件文件打开方式的 Codex 桌面版。

## 1. 下载哪个？

👉 **[下载 Mac 安装包（0.6.0）](https://github.com/Zongejio/codex-local-office/releases/download/v0.6.0/Office-Local-Editor-0.6.0-Mac-Notarized-1792921268283.zip)**

这是已通过 Apple 签名和公证的安装包。普通用户不用下载 `Source code` 或 `.sha256` 文件。

## 2. 怎么安装？

1. 双击下载的 ZIP 解压。
2. 双击 **Office Local Editor Installer**（可能显示 `.app` 后缀），点击 **开始安装**。
3. 等待安装完成；遇到系统打开确认、本机证书授权时，按提示确认。
4. 保存手头工作，退出并重新打开 Codex 一次。

不需要输入命令、配置密钥或租服务器。安装器会自动下载需要的组件，首次下载可能数 GB，请保持联网、不要关闭安装窗口。建议至少 8 GB 内存、40 GB 可用空间。

## 3. 怎么打开文件？

在 Codex 聊天中点击生成的本地 Word、Excel 或 PPT 文件。

**第一次使用：** 如果出现 Codex 自带预览，点文件的 **打开方式 → Office 本地编辑器**。三种格式首次使用时各选一次。编辑器会在 Codex 的浏览器标签页打开。

以后直接点击文件；如果 Codex 仍打开只读预览，再从“打开方式”选择本插件。默认打开方式由 Codex 管理，不保证所有版本都会记住。

## 4. 怎么保存？

修改完成 → 点击页面顶部 **保存到文件** → 等待 **已保存到本地原文件**。

保存的是电脑上原来的那个文件，不需要下载、上传或另存一份。**不要只看编辑器内部的“自动保存”提示**，要看到页面顶部的保存成功提示。

若同时出现启动页和编辑器两个标签页，启动页可以关闭；保留编辑器即可继续编辑和保存。

## 常见问题

- **需要云服务器吗？** 不需要。编辑和保存都在自己的电脑上完成。首次安装需要联网；Codex 的 AI 对话仍需要联网。
- **支持哪些文件？** `.docx`、`.xlsx`、`.pptx`，单个文件不超过 20 MB；不支持旧格式 `.doc/.xls/.ppt`。
- **和 Office/WPS 完全一样吗？** 使用 ONLYOFFICE 编辑器，复杂排版及特殊功能可能有差异；宏已禁用。
- **提示文件冲突怎么办？** 原文件可能被其他软件修改过。插件会拒绝覆盖并保留本次编辑版本，先核对内容。
- **安装中断怎么办？** 重新打开安装应用重试。已有文件和旧版本不会自动删除。

[详细安装与排查](docs/INSTALLATION.md) · [停止后台服务与更新](docs/OPERATIONS.md) · [隐私与安全](SECURITY.md)

## 验证情况与开发资料

安装包签名、公证票据和 macOS 安全检查已通过；本机 Word、Excel、PPT 编辑保存与重新打开已验证，11 项自动测试及 GitHub Mac/Linux 检查通过。**第二台干净 Mac 上的完整安装、Codex 打开与编辑保存验收尚未完成。**

[架构与验证范围](docs/ARCHITECTURE.md) · [维护者签名流程](docs/SIGNING.md) · [第三方许可](NOTICE.md)

运行数据保存在 `~/Library/Application Support/CodexLocalOffice/`，虚拟机保存在 `~/.codex-office-vm/`。后台会使用内存和磁盘，历史副本不会自动清理。发布包不包含维护者的私钥或私人文档。

本项目与 OpenAI、Microsoft、WPS、ONLYOFFICE 均无官方隶属或认证关系。项目代码采用 AGPL-3.0-only。
