import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {root,dataDir} from '../src/paths.mjs';
import {ensureRuntime} from './runtime.mjs';
const exec=promisify(execFile);
const cli=path.join(root,'node_modules/@openai/codex/bin/codex.js');
const run=async args=>{const result=await exec(process.execPath,[cli,...args],{timeout:120000,maxBuffer:1024*1024});return result.stdout;};
await run(['plugin','add','--help']);
await ensureRuntime();
const codexHome=path.resolve(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'));
await fs.mkdir(codexHome,{recursive:true,mode:0o700});
const backup=path.join(dataDir,'install-backups',String(Date.now()));
for(const name of ['config.toml','plugins/config.json']){
 const original=path.join(codexHome,name);
 try{await fs.access(original);}catch(e){if(e.code==='ENOENT')continue;throw e;}
 const copy=path.join(backup,name);await fs.mkdir(path.dirname(copy),{recursive:true,mode:0o700});await fs.copyFile(original,copy);await fs.chmod(copy,0o600);
}
await run(['plugin','marketplace','add',path.join(dataDir,'marketplace'),'--json']);
const result=JSON.parse(await run(['plugin','add','codex-local-office@codex-local-office','--json']));
await fs.writeFile(path.join(dataDir,'last-install.json'),JSON.stringify({version:'0.5.0',installedAt:new Date().toISOString(),appDirectory:root,registered:true},null,2),{mode:0o600});
console.log('本地引擎与安全连接已就绪，Codex 插件注册完成。');
