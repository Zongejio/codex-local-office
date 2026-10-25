# Receives this machine's JWT on stdin. Never prints it.
import sys,json,pathlib,shutil,datetime
secret=sys.stdin.read().strip()
if len(secret)!=64 or any(c not in '0123456789abcdef' for c in secret):raise SystemExit('Invalid secret')
p=pathlib.Path('/etc/onlyoffice/documentserver/local.json')
d=json.loads(p.read_text());shutil.copy2(p,p.with_name('local.json.before-codex-'+datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')))
co=d.setdefault('services',{}).setdefault('CoAuthoring',{})
co.setdefault('token',{}).setdefault('enable',{}).update({'browser':True,'request':{'inbox':True,'outbox':True}})
for k in ['inbox','outbox','session']:co.setdefault('secret',{})[k]={'string':secret}
co.setdefault('request-filtering-agent',{}).update({'allowPrivateIPAddress':True,'allowMetaIPAddress':False})
p.write_text(json.dumps(d,indent=2)+'\n')
