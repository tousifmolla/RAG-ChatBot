const $ = id => document.getElementById(id);
let sessionId = crypto.randomUUID();
const addMessage = (text, role, sources=[]) => {
  const bubble = document.createElement('div'); bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  if (sources.length) {
    const foot = document.createElement('div'); foot.className='sources';
    const unique = [...new Set(sources.map(s=>`${s.filename} — page ${s.page}`))];
    foot.textContent = 'Retrieved pages: ' + unique.join(' • '); bubble.appendChild(foot);
  }
  $('messages').appendChild(bubble); $('messages').scrollTop = $('messages').scrollHeight;
  return bubble;
};
async function api(path, options={}) {
  const res=await fetch(path, options); const data=await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`); return data;
}
async function refreshDocs(){
  const {documents}=await api('/api/documents'); $('documents').replaceChildren();
  documents.forEach(d=>{
    const row=document.createElement('div'); row.className='doc';
    const name=document.createElement('span'); name.textContent='📄 '+d.filename;
    const del=document.createElement('button'); del.textContent='×'; del.title='Remove document';
    del.onclick=async()=>{if(!confirm(`Remove ${d.filename}?`))return; await api(`/api/documents/${encodeURIComponent(d.document_id)}`,{method:'DELETE'}); await refreshDocs();};
    row.append(name,del); $('documents').appendChild(row);
  });
}
$('file').onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  $('uploadStatus').textContent='Indexing PDF (first run may take a while)...';
  const body=new FormData(); body.append('file',file);
  try{const data=await api('/api/upload',{method:'POST',body}); $('uploadStatus').textContent=`Indexed ${data.pages} pages, ${data.chunks} chunks.`; await refreshDocs();}
  catch(err){$('uploadStatus').textContent='Error: '+err.message;} finally{e.target.value='';}
};
$('chatForm').onsubmit=async e=>{
  e.preventDefault(); const question=$('message').value.trim(); if(!question)return;
  $('message').value=''; addMessage(question,'user'); $('send').disabled=true;
  const pending=addMessage('Thinking...','bot');
  try{const data=await api('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,session_id:sessionId})}); pending.textContent=data.answer; if(data.sources.length){const foot=document.createElement('div');foot.className='sources';foot.textContent='Retrieved pages: '+[...new Set(data.sources.map(s=>`${s.filename} — page ${s.page}`))].join(' • ');pending.appendChild(foot);}}
  catch(err){pending.textContent='Error: '+err.message;}finally{$('send').disabled=false;}
};
$('newChat').onclick=async()=>{await api('/api/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:sessionId})});sessionId=crypto.randomUUID();$('messages').replaceChildren();addMessage('New conversation started.','bot');};
$('theme').onclick=()=>document.body.classList.toggle('dark');
refreshDocs().catch(err=>{$('uploadStatus').textContent='Startup error: '+err.message;});
