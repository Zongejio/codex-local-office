# 第三方组件

本项目的桥接代码按 AGPL-3.0-only 发布，完整文本见 LICENSE。它不代表获得 OpenAI、Microsoft 或 ONLYOFFICE 的官方认证。

- ONLYOFFICE Docs Community 10.0.0-169：安装器从官方签名 APT 源下载，不在本仓库重新打包。上游为 AGPL-3.0，并有品牌/界面法律声明等附加要求；保留上游界面、标识和法律说明。参见 https://github.com/ONLYOFFICE/DocumentServer 及其 LICENSE。不要将本项目解释为闭源转售许可。
- Lima：Apache-2.0，https://github.com/lima-vm/lima 。通过 Homebrew 安装，不分发修改版二进制。
- Ubuntu：由 Ubuntu 官方镜像提供，各组件分别适用其许可。镜像下载地址和 SHA-256 固定在 packaging/office.yaml。
- Node.js、OpenSSL、Homebrew：分别适用各自许可，通过使用者的包管理器安装。
- npm 依赖固定在 package-lock.json，包括 MCP SDK、MCP Apps、OpenAI MCP extensions、fflate、zod、esbuild。依赖中的 LICENSE/NOTICE 必须随其分发保留；本仓库发布源码，不附带 node_modules。
- 不分发 Microsoft/WPS 的私有字体、用户文档或维护者的运行证书。

商业发行、修改 ONLYOFFICE 品牌或闭源集成前，应另行核对其适用许可与商用授权。这里没有授予任何第三方商标权。
