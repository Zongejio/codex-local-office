import fs from'node:fs/promises';import os from'node:os';import path from'node:path';import net from'node:net';import{spawn}from'node:child_process';import{randomBytes}from'node:crypto';import{createInterface}from'node:readline/promises';import{root,dataDir,runtimeFile,limaHome}from'../src/paths.mjs';
const args=new Set(process.argv.slice(2)),dry=args.has('--dry-run');
if(dry){console.log(JSON.stringify({platform:'macOS Apple Silicon',dataLocation:'~/Library/Application Support/CodexLocalOffice',ports:[43228,43232,43233],downloads:['Ubuntu image (SHA-256 pinned)','ONLYOFFICE 10.0.0-169 (signed APT)'],changes:['dedicated VM without host mounts','per-machine secrets and localhost leaf certificate','generated Codex marketplace'],manualApproval:['trust localhost certificate','install Codex plugin'],cloudUpload:false,docker:false},null,2));process.exit(0);}
if(process.platform!=='darwin'||process.arch!=='arm64')throw Error('此安装器目前仅支持 Apple 芯片 Mac。没有执行安装。');
function run(command,argv,{input,env,quiet=false}={}){return new Promise((resolve,reject)=>{const p=spawn(command,argv,{cwd:root,env:{...process.env,...env},stdio:[input===undefined?'inherit':'pipe',quiet?'ignore':'inherit','inherit']});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`${path.basename(command)} 未完成（${code}）`)));if(input!==undefined)p.stdin.end(input);});}
async function findCommand(n){for(const folder of (process.env.PATH||'').split(path.delimiter)){const p=path.join(folder,n);try{await fs.access(p,1);return p}catch{}}throw Error('未找到 '+n+'，请先完成 README 中的依赖安装。');}
if(Buffer.byteLength(path.join(limaHome,'codex-office','ssh.sock.1234567890123456'))>=104)throw Error('虚拟机目录过长，请用 CODEX_OFFICE_LIMA_HOME 指定更短的专用目录。');
const limactl=await findCommand('limactl'),openssl=await findCommand('openssl');
const rl=createInterface({input:process.stdin,output:process.stdout});
try{
if(!args.has('--yes')){const answer=await rl.question('将下载并安装本机 Office 引擎（可能数 GB），创建 4 GB 内存/40 GB 虚拟磁盘的独立环境。不会启动 Docker，也不会上传文档。继续？[y/N] ');if(!/^y(es)?$/i.test(answer))process.exit(0);}
await fs.mkdir(dataDir,{recursive:true,mode:0o700});await fs.mkdir(path.join(dataDir,'private'),{recursive:true,mode:0o700});await fs.chmod(path.join(dataDir,'private'),0o700);
const prior=await fs.readFile(runtimeFile,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e});
if(!prior){for(const port of [43228,43232,43233])await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',()=>reject(Error(`本机端口 ${port} 已被占用，未修改其他服务。`)));s.listen(port,'127.0.0.1',()=>s.close(resolve));});}
for(const name of ['jwt-secret','bridge-token']){const p=path.join(dataDir,'private',name);try{await fs.writeFile(p,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600})}catch(e){if(e.code!=='EEXIST')throw e}}
const key=path.join(dataDir,'private/localhost-key.pem'),cert=path.join(dataDir,'private/localhost-cert.pem');
const exists=async p=>fs.access(p).then(()=>true,()=>false);
if(await exists(key)!==await exists(cert))throw Error('本机证书文件不完整，请保留现有文件并参考故障说明。');
if(!await exists(cert)){
 const conf=path.join(dataDir,'private/localhost-openssl.cnf');await fs.writeFile(conf,'[req]\ndistinguished_name=dn\nx509_extensions=ext\nprompt=no\n[dn]\nCN=localhost\n[ext]\nsubjectAltName=DNS:localhost\nbasicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n',{mode:0o600});
 await run(openssl,['req','-x509','-newkey','rsa:2048','-nodes','-days','365','-sha256','-keyout',key,'-out',cert,'-config',conf],{quiet:true});await fs.chmod(key,0o600);
}else await run(openssl,['x509','-checkend','86400','-noout','-in',cert],{quiet:true});
await fs.writeFile(runtimeFile,JSON.stringify({version:1,limactl,limaHome,node:process.execPath},null,2),{mode:0o600});
const env={LIMA_HOME:limaHome};
let vmExists=false;try{await fs.access(path.join(env.LIMA_HOME,'codex-office','lima.yaml'));vmExists=true}catch{}
await run(limactl,vmExists?['start','codex-office','--tty=false']:['start','--name=codex-office','--tty=false',path.join(root,'packaging/office.yaml')],{env});
await run(limactl,['shell','codex-office','bash','-s'],{env,input:await fs.readFile(path.join(root,'packaging/install-guest.sh'),'utf8')});
await run(limactl,['shell','codex-office','sudo','python3','-c',await fs.readFile(path.join(root,'packaging/configure-guest.py'),'utf8')],{env,input:await fs.readFile(path.join(dataDir,'private/jwt-secret'),'utf8'),quiet:true});
await run(limactl,['shell','codex-office','sudo','systemctl','restart','ds-docservice','ds-converter'],{env});
console.log('需要信任只用于 localhost 的本机证书，才能在 Codex 中打开。证书不是通用 CA。');
await run(openssl,['x509','-in',cert,'-noout','-fingerprint','-sha256']);
const trust=await rl.question('是否添加此证书到你的登录钥匙串？系统可能要求确认。[y/N] ');
if(/^y(es)?$/i.test(trust))await run('/usr/bin/security',['add-trusted-cert','-r','trustRoot','-p','ssl','-k',path.join(os.homedir(),'Library/Keychains/login.keychain-db'),cert]);
else console.log('已保留安装；尚未授予证书信任，编辑器暂不可用。重新运行安装器可继续。');
const {generateMarketplace}=await import('./configure-plugin.mjs');await generateMarketplace();
console.log('安装配置完成。请按 README 的“安装 Codex 插件”步骤完成注册。');
}finally{rl.close();}
