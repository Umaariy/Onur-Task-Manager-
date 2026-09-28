import assert from 'node:assert/strict';
const base='http://localhost:5173';
const headers={'Cookie':'__sites_local_auth=1','Origin':base};
let r=await fetch(base+'/api/v1/workspace',{headers});let d=await r.json();let checks=0;
const fixture=d.state.cards.find(c=>c.title==='Interfeys sinovi')??d.state.cards[0];
const form=new FormData();form.set('workspaceId',d.workspaceId);form.set('cardId',fixture.id);form.set('version',String(d.version));form.set('file',new File(['Oqim file access test'],'oqim-test.txt',{type:'text/plain'}));
r=await fetch(base+'/api/v1/files',{method:'POST',headers,body:form});let out=await r.json();assert.equal(r.status,200,JSON.stringify(out));d=out;checks++;
const file=d.state.cards.find(c=>c.id===fixture.id).files.at(-1);assert.equal(file.name,'oqim-test.txt');checks++;
r=await fetch(base+'/api/v1/files?'+new URLSearchParams({workspace:d.workspaceId,card:fixture.id,file:file.id}),{headers});out=await r.json();assert.equal(r.status,200,JSON.stringify(out));assert.equal(out.expiresIn,300);checks++;
r=await fetch(base+out.url,{headers});assert.equal(r.status,200);assert.equal(await r.text(),'Oqim file access test');assert.match(r.headers.get('content-disposition'),/^attachment/);checks++;
r=await fetch(base+'/api/v1/download?token=invalid',{headers});assert.equal(r.status,403);checks++;
const bad=new FormData();bad.set('workspaceId',d.workspaceId);bad.set('cardId',fixture.id);bad.set('version',String(d.version));bad.set('file',new File(['MZ malicious'],'test.exe'));r=await fetch(base+'/api/v1/files',{method:'POST',headers,body:bad});assert.equal(r.status,400);checks++;
r=await fetch(base+'/api/v1/cards?'+new URLSearchParams({workspace:d.workspaceId,page:'1',pageSize:'2',sort:'title',order:'asc'}),{headers});out=await r.json();assert.equal(r.status,200);assert.equal(out.data.length,2);assert.ok(out.pagination.total>=10);checks++;
r=await fetch(base+'/api/v1/cards?'+new URLSearchParams({workspace:d.workspaceId,pageSize:'101'}),{headers});assert.equal(r.status,400);checks++;
r=await fetch(base+'/api/v1/export?'+new URLSearchParams({workspace:d.workspaceId,board:'product'}),{headers});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/csv/);checks++;
r=await fetch(base+'/api/v1/openapi');out=await r.json();assert.equal(r.status,200);assert.equal(out.openapi,'3.1.0');checks++;
if(fixture.title==='Interfeys sinovi'){r=await fetch(base+'/api/v1/actions',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({workspaceId:d.workspaceId,version:d.version,action:'card.delete',payload:{id:fixture.id}})});assert.equal(r.status,200);checks++;}
console.log(JSON.stringify({passed:checks}));
