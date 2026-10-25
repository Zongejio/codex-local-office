import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {root} from '../src/paths.mjs';
if(process.platform!=='darwin')throw Error('Build the Mac installer on macOS.');
const version=JSON.parse(await fs.readFile(path.join(root,'package.json'))).version;
// Keep the signing staging tree outside iCloud-synced folders; Finder metadata can invalidate signatures.
const out=await fs.mkdtemp(path.join(os.tmpdir(),'codex-office-mac-'));
execFileSync(process.execPath,[path.join(root,'scripts/release-check.mjs')],{cwd:root,stdio:'inherit'});
const app=path.join(out,'Office Local Editor Installer.app');
const contents=path.join(app,'Contents');
await fs.mkdir(path.join(contents,'MacOS'),{recursive:true});
await fs.mkdir(path.join(contents,'Resources/payload'),{recursive:true});
for(const entry of ['src','scripts','plugin/.codex-plugin','packaging','package.json','package-lock.json','Install.command','LICENSE','NOTICE.md']){
 await fs.cp(path.join(root,entry),path.join(contents,'Resources/payload',entry),{recursive:true,errorOnExist:true,force:false});
}
await fs.writeFile(path.join(contents,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>io.github.zongejio.codex-local-office.installer</string><key>CFBundleName</key><string>Office Local Editor Installer</string><key>CFBundleDisplayName</key><string>Office 本地编辑器安装</string><key>CFBundleExecutable</key><string>OfficeInstaller</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>${version}</string><key>CFBundleVersion</key><string>${version}</string><key>LSMinimumSystemVersion</key><string>14.0</string><key>NSHighResolutionCapable</key><true/></dict></plist>`);
execFileSync('xcrun',['swiftc','-module-cache-path',path.join(out,'module-cache'),'-swift-version','5','-O','-target','arm64-apple-macos14.0','-framework','Cocoa',path.join(root,'packaging/macos/Installer.swift'),'-o',path.join(contents,'MacOS/OfficeInstaller')],{stdio:'inherit'});
console.log(app);
console.log('Built only. Not Developer ID signed or notarized.');
