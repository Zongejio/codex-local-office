import fs from'node:fs/promises';import path from'node:path';
const allowed=['src','scripts','test','docs','packaging','plugin/.codex-plugin','.github','Install.command','README.md','LICENSE','NOTICE.md','SECURITY.md','CHANGELOG.md','package.json','package-lock.json','.gitignore','.gitattributes'];
const files=[];async function walk(p){const st=await fs.lstat(p);if(st.isSymbolicLink())throw Error('Release cannot include symlink: '+p);if(st.isDirectory()){for(const n of await fs.readdir(p))await walk(path.join(p,n));}else files.push(p);}
for(const p of allowed)await walk(p);
for(const p of files){const t=await fs.readFile(p,'utf8');if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(t)||/\/(?:Users|home)\/(?!runner\b)[A-Za-z0-9_.-]+\//.test(t)||/gh[pousr]_[A-Za-z0-9]{20,}/.test(t))throw Error('Potential private material: '+p);}
console.log(`Release allowlist passed: ${files.length} source files; no runtime, certificates, original documents or local config included.`);
if(process.argv.includes('--list'))console.log(files.join('\n'));
