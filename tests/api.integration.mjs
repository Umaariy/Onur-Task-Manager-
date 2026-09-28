import assert from 'node:assert/strict';
const base='http://localhost:5173';
const headers={'Cookie':'__sites_local_auth=1','Content-Type':'application/json','Origin':base};
let d;let passed=0;
async function read(){const r=await fetch(base+'/api/v1/workspace',{headers});assert.equal(r.status,200,await r.clone().text());d=await r.json();return d}
async function action(action,payload,status=200,version=d.version){const r=await fetch(base+'/api/v1/actions',{method:'POST',headers,body:JSON.stringify({workspaceId:d.workspaceId,version,action,payload})});const out=await r.json();assert.equal(r.status,status,JSON.stringify(out));passed++;if(r.ok)d=out;return out}
assert.equal((await fetch(base+'/api/v1/workspace')).status,401);passed++;
await read();assert.ok(d.state.cards.length>=10);passed++;
const s=d.state.cards[0];const beforeVersion=d.version;
await action('card.save',{...s,title:s.title+' — API sinov'});
await action('card.save',{...s,title:'stale overwrite'},409,beforeVersion);
await read();assert.equal(d.state.cards[0].title,s.title+' — API sinov');passed++;
await action('card.save',s);
await action('card.acl',{...d.state.cards[0],locked:true});
await action('card.save',{...d.state.cards[0],title:'locked bypass'},403);
await action('card.acl',{...d.state.cards[0],locked:false});
const cross=await fetch(base+'/api/v1/actions',{method:'POST',headers:{...headers,Origin:'https://evil.example'},body:'{}'});assert.equal(cross.status,403);passed++;
await action('card.create',{...s,id:'',number:'',title:'API persistent test',assignees:[d.userId],checklist:[],comments:[],files:[]});
const created=d.state.cards.find(c=>c.title==='API persistent test');assert.ok(created);passed++;
await action('comment.add',{id:created.id,text:'Sinov izohi'});
await read();assert.equal(d.state.cards.find(c=>c.id===created.id).comments[0].text,'Sinov izohi');passed++;
await action('card.delete',{id:created.id});
await action('card.save',{...s,title:''},400);
assert.ok(d.activity.some(a=>a.action==='denied:card.save'));passed++;
console.log(JSON.stringify({passed,workspaceId:d.workspaceId,version:d.version,cards:d.state.cards.length}));
