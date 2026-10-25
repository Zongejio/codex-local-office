import Cocoa

final class InstallerDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    private var window: NSWindow!
    private var button: NSButton!
    private var output: NSTextView!
    private var task: Process?
    private var pipe: Pipe?

    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 720, height: 480), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Office 本地编辑器 · 安装"
        window.delegate = self
        let root = window.contentView!
        let title = NSTextField(labelWithString: "在 Codex 中编辑 Office，保存回本地原文件")
        title.font = NSFont.boldSystemFont(ofSize: 20)
        title.frame = NSRect(x: 24, y: 416, width: 680, height: 32)
        root.addSubview(title)
        let subtitle = NSTextField(wrappingLabelWithString: "自动准备运行环境并注册插件。首次下载可能数 GB，请保持联网。仅在需要系统授权时提示；不会启动 Docker。")
        subtitle.frame = NSRect(x: 24, y: 350, width: 670, height: 56)
        root.addSubview(subtitle)
        let scroll = NSScrollView(frame: NSRect(x: 24, y: 78, width: 672, height: 260))
        scroll.hasVerticalScroller = true
        scroll.autoresizingMask = [.width, .height]
        output = NSTextView(frame: scroll.bounds)
        output.isEditable = false
        output.font = NSFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        output.autoresizingMask = [.width]
        scroll.documentView = output
        root.addSubview(scroll)
        button = NSButton(title: "开始安装", target: self, action: #selector(start))
        button.bezelStyle = .rounded
        button.frame = NSRect(x: 550, y: 24, width: 145, height: 34)
        root.addSubview(button)
        append("点击开始后，请保留此窗口直到安装结束。\n")
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApplication.shared.activate(ignoringOtherApps: true)
    }
    private func append(_ value: String) {
        output.textStorage?.append(NSAttributedString(string: value))
        output.scrollToEndOfDocument(nil)
    }
    @objc private func start() {
        guard task == nil else { return }
        guard let resources = Bundle.main.resourceURL else { return }
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/bin/bash")
        process.arguments = [resources.appendingPathComponent("payload/Install.command").path]
        var environment = ProcessInfo.processInfo.environment
        environment["CODEX_OFFICE_INSTALL_CONFIRMED"] = "1"
        environment.removeValue(forKey: "CODEX_OFFICE_INSTALL_TEST")
        process.environment = environment
        let stream = Pipe()
        pipe = stream
        process.standardOutput = stream
        process.standardError = stream
        process.standardInput = FileHandle.nullDevice
        stream.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if data.isEmpty { handle.readabilityHandler = nil; return }
            let value = String(decoding: data, as: UTF8.self)
            DispatchQueue.main.async { self?.append(value) }
        }
        process.terminationHandler = { [weak self] finished in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.task = nil
                self.button.isEnabled = true
                self.button.title = finished.terminationStatus == 0 ? "安装完成 · 可重试" : "重试安装"
                self.append(finished.terminationStatus == 0 ? "\n流程已结束。请查看完成提示。\n" : "\n安装未完成，已有文件保留。可重试。\n")
            }
        }
        do {
            try process.run()
            task = process
            button.isEnabled = false
            button.title = "正在安装…"
        } catch { append("无法开始安装：\(error.localizedDescription)\n") }
    }
    func windowShouldClose(_ sender: NSWindow) -> Bool {
        return applicationShouldTerminate(NSApplication.shared) == .terminateNow
    }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        if task != nil {
            let alert = NSAlert()
            alert.messageText = "安装仍在进行"
            alert.informativeText = "请等待安装结束，避免中断下载或引擎配置。"
            alert.addButton(withTitle: "继续等待")
            alert.runModal()
            return .terminateCancel
        }
        return .terminateNow
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
let app = NSApplication.shared
let delegate = InstallerDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
