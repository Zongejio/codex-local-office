# Mac 签名和公证（维护者）

此流程只用于公开发行。使用者的本机 localhost 证书与开发者签名证书完全不同，不能互相替代。签名不能自动授权系统钥匙串，也不意味着所有系统提示都消失。

## 必要条件

- Apple Developer Program 中可用的 Developer ID Application 证书，且对应私钥在本机钥匙串。
- Xcode 的 `notarytool`、`stapler` 和 Swift 编译器。
- 已通过 Apple 验证并保存到钥匙串的 notarization profile。密码或 API 私钥不写入仓库，不通过聊天传输。

Apple Development、Apple Distribution 证书不能代替 Developer ID Application。本项目发布 `.app` 的 ZIP，不使用需要 Developer ID Installer 的 `.pkg`。

## 构建与提交

先运行 `node scripts/build-macos-app.mjs`。每次构建生成独立目录，保留历史产物。

再运行 `node scripts/notarize-macos.mjs`，参数依次为应用完整路径、Developer ID Application 身份名称、已有钥匙串 profile 名称。脚本依次启用 hardened runtime 签名、检查签名、提交 Apple、确认 Accepted、staple、验证票据并执行 Gatekeeper 评估。

只有全部成功才生成名为 `Office-Local-Editor-<版本>-Mac-Notarized-<时间戳>.zip` 的最终包。不要将签名前的包、Apple 返回 Invalid 的包或等待中的包标记为已公证。提交可能需要等待 Apple 处理。

所有最终发布资产必须重新检查不包含用户文档、私钥、密钥或运行数据。公证仅提交干净应用，用户的文档和本地编辑数据不上传。

官方资料：
- https://developer.apple.com/developer-id/
- https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution
- https://developer.apple.com/help/account/certificates/create-developer-id-certificates/
