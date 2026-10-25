import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store,secret,equal,sign,verify,exportUrl,LIMIT} from './store.mjs';
import {dataDir, root} from './paths.mjs';
const privateDir=path.join(dataDir,'private');await fs.mkdir(privateDir,{recursive:true,mode:0o700});
const tokenPath=path.join(privateDir,'bridge-token');let master;try{master=await fs.readFile(tokenPath,'utf8');}catch{master=secret();await fs.writeFile(tokenPath,master,{flag:'wx',mode:0o600});}
const jwt=await fs.readFile(path.join(privateDir,'jwt-secret'),'utf8');
const store=new Store(path.join(dataDir,'documents'));await store.init();
const origin='http://127.0.0.1:43232',docs='http://127.0.0.1:43228',guest='http://host.lima.internal:43232';
const info=s=>({id:s.id,token:s.token,hostToken:s.hostToken,name:s.name,revision:s.revision,sourcePath:s.sourcePath,url:`${origin}/editor/${s.id}#${s.token}`});
async function body(req){let length=0,chunks=[];for await(const c of req){length+=c.length;if(length>LIMIT*1.4+4096)throw Error('请求过大');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
const send=(res,status,data,type='application/json')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(data):data);};
async function command(s){const payload={c:'forcesave',key:s.key,userdata:secret()};const r=await fetch(docs+'/coauthoring/CommandService.ashx',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,token:sign(payload,jwt)}),signal:AbortSignal.timeout(15000)});return r.json();}
const server=http.createServer(async(req,res)=>{try{
 if(!['127.0.0.1:43232','localhost:43232','host.lima.internal:43232','192.168.5.2:43232'].includes(req.headers.host))return send(res,403,{error:'拒绝未知主机'});
 const u=new URL(req.url,origin);const segments=u.pathname.split('/').filter(Boolean);const token=req.headers.authorization?.replace(/^Bearer /,'')||u.searchParams.get('token');
 if(u.pathname==='/health')return send(res,200,{ready:true,service:'codex-local-office',version:'0.6.0'});
 if(u.pathname==='/api/create'){
  if(req.method!=='POST'||!equal(token,master))return send(res,403,{error:'未授权'});
  const args=await body(req);if(!path.isAbsolute(args.sourcePath||'')||!/^[a-f0-9]{64}$/.test(args.expectedHash||''))throw Error('需要原文件路径及内容校验');const s=await store.create(args);return send(res,200,info(s));
 }
 if(segments[0]==='editor'&&req.method==='GET'){return send(res,200,await fs.readFile(path.join(root,'src/editor.html')),'text/html; charset=utf-8');}
 if(segments[0]==='document'){
  const s=store.get(segments[1],u.searchParams.get('token'));res.setHeader('Content-Disposition',`attachment; filename="document.${s.ext}"`);return send(res,200,await fs.readFile(path.join(store.dir(s),'original.'+s.ext)),'application/octet-stream');
 }
 if(segments[0]==='callback'){
  const s=store.get(segments[1],u.searchParams.get('token'));let data=await body(req);const signed=verify(data.token||req.headers.authorization?.replace(/^Bearer /,''),jwt);data=signed.payload||signed;
  if(data.key!==s.key)throw Error('文档会话不匹配');
  if([2,6].includes(data.status)){
   const r=await fetch(exportUrl(data.url),{redirect:'error',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('无法取得编辑后的文件');
   if(Number(r.headers.get('content-length'))>LIMIT)throw Error('保存文件过大');const chunks=[];let n=0;for await(const c of r.body){n+=c.length;if(n>LIMIT)throw Error('保存文件过大');chunks.push(c);}await store.accept(s,Buffer.concat(chunks));
  }
  if([3,7].includes(data.status)){s.error='编辑器导出失败，请重试';await store.persist(s);}
  return send(res,200,{error:0});
 }
 if(segments[0]==='api'){
  const s=store.get(segments[2],token),op=segments[1];
  if(op==='config'){
   const config={documentType:{docx:'word',xlsx:'cell',pptx:'slide'}[s.ext],width:'100%',height:'100%',document:{fileType:s.ext,key:s.key,title:s.name,url:`${guest}/document/${s.id}?token=${s.token}`,permissions:{edit:true,download:false,print:true}},editorConfig:{mode:'edit',lang:'zh-CN',callbackUrl:`${guest}/callback/${s.id}?token=${s.token}`,user:{id:'local-owner',name:'我'},customization:{forcesave:true,autosave:true,plugins:false,macros:false,help:false,feedback:false}}};config.token=sign(config,jwt);return send(res,200,config);
  }
  if(op==='status')return send(res,200,{revision:s.revision,savedAt:s.savedAt,error:s.error,hostSavedRevision:s.hostSavedRevision,hostError:s.hostError,hostConnected:Date.now()-(s.hostSeenAt||0)<10000});
  if(op==='bytes')return send(res,200,{base64:(await store.bytes(s)).toString('base64'),revision:s.revision});
  if(op==='force'&&req.method==='POST'){const start=s.revision;const result=await command(s);if(result.error!==0&&result.error!==4)throw Error('编辑器尚未就绪或保存失败（'+result.error+'）');return send(res,200,{start,noChanges:result.error===4});}
  if(op==='commit'&&req.method==='POST')return send(res,200,await store.commit(s));
 }
 const proxy=http.request({hostname:'127.0.0.1',port:43228,path:req.url,method:req.method,headers:{...req.headers,'x-forwarded-host':req.headers['x-forwarded-host']==='localhost:43233'?'localhost:43233':req.headers.host,'x-forwarded-proto':req.headers['x-forwarded-host']==='localhost:43233'?'https':'http'}},up=>{res.writeHead(up.statusCode,up.headers);up.pipe(res);});proxy.on('error',()=>send(res,502,{error:'本机编辑器暂不可用'}));req.pipe(proxy);return;
 }catch(e){console.error(new Date().toISOString(),e.message);if(!res.headersSent)send(res,400,{error:e.message});else res.end();}
});
server.on('upgrade',(req,socket,head)=>{if(!['127.0.0.1:43232','localhost:43232'].includes(req.headers.host)){socket.end();return;}const upstream=net.connect(43228,'127.0.0.1',()=>{upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n`+Object.entries(req.headers).map(([k,v])=>`${k}: ${v}`).join('\r\n')+'\r\n\r\n');if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);});upstream.on('error',()=>socket.end());socket.on('error',()=>upstream.end());});
server.listen(43232,'127.0.0.1',()=>console.log('本机 Office 文件服务已就绪：43232'));
