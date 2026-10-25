import {build} from 'esbuild';import fs from 'node:fs/promises';
await fs.mkdir('plugin/dist',{recursive:true});
const result=await build({entryPoints:['src/app.mjs'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
await fs.writeFile('plugin/dist/editor.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>body{margin:0;font:14px system-ui;color:#333}</style><div id="status">正在打开 Office 本地编辑器…</div><div id="editor"></div><script type="module">${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></html>`);
console.log('Plugin UI built');
