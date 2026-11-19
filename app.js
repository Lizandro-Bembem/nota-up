const $=s=>document.querySelector(s),app=$('#app');
const IC={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10H3z"/></svg>',hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',face:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M9 9v1.5M15 9v1.5M12 9v4h-1M9 16.5a4.5 4.5 0 0 0 6 0"/></svg>'};
/* ===== EmailJS (recuperação de senha) =====
   Preencha com os dados do seu painel em https://dashboard.emailjs.com
   - serviceId: Email Services → Service ID
   - templateId: Email Templates → Template ID. No template use: Para (To Email) = {{to_email}};
     no corpo: Olá {{to_name}}, seu código para redefinir a senha do {{app_name}} é {{code}} (vale {{validade}}).
   - publicKey: Account → General → Public Key */
const EMAILJS={serviceId:'',templateId:'',publicKey:''};
let S={user:null,discs:[],grades:[],tasks:[],log:[],target:7,notified:{},notif:false,asked:0,theme:'light',tone:'amigo',sec:{email:'',hash:'',salt:'',cred:'',bio:false},ai:{key:'',model:'gpt-4o-mini'},voice:{on:true,uri:'',rate:1},rst:null},view='home',tab=1,sheet=null,vp=null,rec=null,keep=false,cb=null,cp={y:0,m:0,sel:''},ph={};
try{S=Object.assign(S,JSON.parse(localStorage.getItem('notaup')||'{}'))}catch(e){}
S.sec=Object.assign({email:'',hash:'',salt:'',cred:'',bio:false},S.sec);S.ai=Object.assign({key:'',model:'gpt-4o-mini',prov:'openai',ks:{},ms:{}},S.ai);S.voice=Object.assign({on:true,uri:'',rate:1},S.voice);
let locked=!!(S.user&&S.sec.hash),lk={msg:'',busy:0,tried:0,pw:0,ac:null,rst:null};
const save=()=>{try{localStorage.setItem('notaup',JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=n=>(Math.round(n*10)/10).toFixed(1).replace('.',','),ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),today=()=>ymd(new Date());
const dfmt=d=>d.split('-').reverse().join('/');
const log=m=>{S.log.unshift({t:Date.now(),m});S.log=S.log.slice(0,300);save()};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;app.appendChild(t);setTimeout(()=>t.classList.add('out'),3450);setTimeout(()=>t.remove(),3800)}
// cálculo
function unitAvg(d,u){const g=S.grades.filter(x=>x.d===d&&x.u===u);if(!g.length)return null;const m=g.reduce((a,x)=>a+x.max,0);return m?g.reduce((a,x)=>a+x.s,0)/m*10:null}
function discAvg(d){const a=[1,2,3].map(u=>unitAvg(d,u)).filter(x=>x!==null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function overall(){const a=S.discs.map(d=>discAvg(d.id)).filter(x=>x!==null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function need(d){const u=[1,2,3].map(i=>unitAvg(d,i)),got=u.filter(x=>x!==null),left=3-got.length,sum=got.reduce((a,b)=>a+b,0);
    if(!got.length)return 'Sem notas ainda';const req=S.target*3-sum;if(!left)return req<=0?'Média atingida ✓':'Faltaram '+f(req/3)+' pts na média';
    return req<=0?'Média já garantida ✓':req/left>10?'Não dá mais para atingir a média só com as unidades restantes':'Precisa de '+f(req/left)+' em cada unidade restante'}
const col=v=>v===null?'':v>=S.target?'ok':'warn';
// views
let pgAnim=1,sheetAnim=0,vpAnim=0,aiWait=0;
const go=v=>{view=v;sheet=null;pgAnim=1;render()};
function avatar(){return `<div class="av">${S.user.photo?`<img src="${S.user.photo}" alt="">`:esc(S.user.name[0]||'?').toUpperCase()}</div>`}
function ob(){app.innerHTML=`<main><div class="ob"><div class="logo">${LG()}NotaUp</div><h1 style="margin-top:18px">Suas Notas, Sua Evolução</h1><p class="sub">Crie seu perfil para começar.</p>
<label>Seu nome</label><input class="ac" autocapitalize="sentences" id="n" placeholder="Ex.: Lizandro">
<label>Defina o apelido do app</label><input class="ac" autocapitalize="sentences" id="k" placeholder="Ex.: Jarvis"><p class="sub" style="margin-top:6px">É assim que você chama o assistente por voz: “Oi, Jarvis, adiciona a nota…”</p>
<label>E-mail (para recuperar a senha)</label><input id="em" type="email" inputmode="email" autocomplete="off" autocapitalize="off" placeholder="voce@email.com">
<label>Crie uma senha</label><input id="pw1" type="password" autocomplete="off" placeholder="Mínimo 4 caracteres"><label>Repita a senha</label><input id="pw2" type="password" autocomplete="off">
<label>Foto (opcional)</label><input id="p" type="file" accept="image/*">
<button class="btn" style="margin-top:18px" onclick="reg()">Começar</button></div></main>`}
async function reg(){const name=cap($('#n').value.trim()),nick=cap($('#k').value.trim()),em=$('#em').value.trim().toLowerCase(),p1=$('#pw1').value,p2=$('#pw2').value;if(!name||!nick)return toast('Preencha seu nome e o apelido do app.');
    if(!mailOK(em))return toast('Informe um e-mail válido.');if(p1.length<4)return toast('A senha precisa ter pelo menos 4 caracteres.');if(p1!==p2)return toast('As senhas não conferem.');
    await setPw(p1);S.sec.email=em;
    const fin=photo=>{S.user={name,nick,photo};log('Perfil criado: '+name+' (apelido do app: '+nick+')');save();render();bioOffer(notifPrompt)};
    const fl=$('#p').files[0];if(!fl)return fin('');const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),s=Math.min(im.width,im.height);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,160,160);fin(c.toDataURL('image/jpeg',.8))};im.onerror=()=>{toast('Não consegui abrir essa foto. Você pode trocar depois.');fin('')};im.src=r.result};r.readAsDataURL(fl)}
function home(){const o=overall(),due=S.tasks.filter(t=>!t.graded&&daysTo(t.date)<=3);
    return `${S.sec.hash?'':`<div class="card late" style="margin:0 0 12px" onclick="sheetSec()"><b>Proteja seu app</b><div class="sub">Toque para criar uma senha e ativar o ${bioName}.</div></div>`}<div class="row sp"><div class="logo">${LG()}NotaUp</div><button class="avb" onclick="sheetPhoto()" aria-label="Ajustar foto">${avatar()}</button></div>
 <h1 style="margin-top:18px">Olá, ${esc(S.user.name)}! 👋</h1><p class="sub" style="margin-top:4px">Meu apelido: <b>${esc(S.user.nick)}</b></p><p class="sub">Acompanhe sua evolução acadêmica.</p>
 <div class="g g2" style="margin-top:16px"><div class="card"><div class="sub">Média Geral</div><div class="big" ${o===null?'':`data-n="${o}" data-d="1"`}>${o===null?'–':f(o)}</div><div class="sub ${col(o)}">${o===null?'Sem notas':o>=S.target?'↑ Bom desempenho':'Atenção à média'}</div></div>
 <div class="card"><div class="sub">Disciplinas</div><div class="big" data-n="${S.discs.length}" data-p="2">${String(S.discs.length).padStart(2,'0')}</div><div class="sub">Em acompanhamento</div></div></div>
 ${due.length?`<div class="card" style="margin-top:12px"><h2>Lembretes</h2>${due.map(t=>{const n=daysTo(t.date);return `<div class="it ${n<0?'late':''}"><b>${esc(t.type)}: ${esc(t.title)}</b><div class="sub">${n<0?'Prazo passou · lance a nota':n==0?'Entrega hoje':'Entrega em '+n+' dia(s)'} · ${esc(dn(t.d))} · ${f(t.pts)} pts</div></div>`}).join('')}</div>`:''}
 <div class="card" style="margin-top:12px"><div class="row sp"><h2>Minhas Disciplinas</h2><button class="btn sm alt" onclick="sheetDisc()">+ Nova</button></div>
 ${S.discs.length?S.discs.map(d=>{const a=discAvg(d.id);return `<div class="it" onclick="openDisc('${d.id}')" style="cursor:pointer"><div class="row sp"><b>${esc(d.name)}</b><span class="pill ${col(a)}">${a===null?'–':f(a)}</span></div><div class="bar"><i style="width:${a===null?0:a*10}%"></i></div><div class="sub" style="margin-top:4px">${need(d.id)}</div></div>`}).join(''):'<p class="sub" style="margin-top:10px">Nenhuma disciplina ainda. Toque em “+ Nova” ou diga “'+esc(S.user.nick)+', cria a matéria Matemática”.</p>'}</div>
 <button class="btn" style="margin-top:14px" onclick="sheetGrade()">+ Adicionar Nota</button>`}
const dn=id=>id=='all'?'Todas as matérias':(S.discs.find(d=>d.id==id)||{name:'?'}).name;
const daysTo=d=>Math.round((new Date(d+'T12:00')-new Date(today()+'T12:00'))/864e5);
function hist(){const g=[...S.grades].sort((a,b)=>a.date<b.date?-1:1);
    const bars=S.discs.map(d=>{const a=discAvg(d.id);return a===null?'':`<div class="it"><div class="row sp"><span>${esc(d.name)}</span><b>${f(a)}</b></div><div class="bar"><i style="width:${a*10}%"></i></div></div>`}).join('');
    return `<h1>Histórico</h1><p class="sub">Seu desempenho por disciplina e todas as notas lançadas.</p>
 <div class="card" style="margin-top:14px"><h2>Média por disciplina</h2>${bars||'<p class="sub">Sem dados ainda.</p>'}</div>
 <div class="card" style="margin-top:12px"><h2>Notas lançadas</h2>${[...g].reverse().map(x=>`<div class="it"><div class="row sp"><div><b>${esc(x.name)}</b><div class="sub">${esc(dn(x.d))} · ${x.u}ª unidade · ${x.type} · ${dfmt(x.date)}</div></div><span class="pill">${f(x.s)}/${f(x.max)}</span></div></div>`).join('')||'<p class="sub">Nenhuma nota.</p>'}</div>`}
function cfg(){return `<h1>Configurações</h1>
 <div class="card row" style="margin-top:14px"><button class="avb" onclick="sheetPhoto()" aria-label="Ajustar foto">${avatar()}</button><div><b>${esc(S.user.name)}</b><div class="sub">Apelido do app: ${esc(S.user.nick)}</div></div></div>
 <div class="card" style="margin-top:12px"><label style="margin:0">Média para aprovação</label><input type="number" step="0.5" value="${S.target}" onchange="S.target=Math.min(10,Math.max(0.5,+String(this.value).replace(',','.')||7));log('Média de aprovação alterada para '+S.target);save();render()">
 <label>Apelido do app</label><input class="ac" autocapitalize="sentences" value="${esc(S.user.nick)}" onchange="S.user.nick=cap(this.value.trim())||S.user.nick;log('Apelido alterado para '+S.user.nick);save();render()">
 <div class="row sp" style="margin-top:16px"><span style="font-weight:600">Tema</span><div class="seg"><button class="${S.theme!='dark'?'on':''}" onclick="setTheme('light')">Claro</button><button class="${S.theme=='dark'?'on':''}" onclick="setTheme('dark')">Escuro</button></div></div><div class="row sp" style="margin-top:16px"><span style="font-weight:600">Notificações</span><button class="sw ${S.notif?'on':''}" role="switch" aria-checked="${!!S.notif}" aria-label="Notificações" onclick="setNotif(!S.notif)"></button></div></div>${secCard()}${aiCard()}${voiceCard()}
 <div class="card" style="margin-top:12px"><div class="row sp"><h2>Auditoria</h2><button class="lnk" onclick="ask('Apagar todos os seus dados?',()=>{localStorage.removeItem('notaup');location.reload()},'Apagar')">Apagar meus dados</button></div><p class="sub">Tudo o que foi feito no app.</p>${S.log.map(l=>`<div class="it"><div style="font-size:14px">${esc(l.m)}</div><div class="sub">${new Date(l.t).toLocaleString('pt-BR')}</div></div>`).join('')||'<p class="sub">Sem registros.</p>'}</div>`}
// sheets
const dopts=sel=>S.discs.map(d=>`<option value="${d.id}" ${d.id==sel?'selected':''}>${esc(d.name)}</option>`).join('');
const closeSheet=()=>{sheet=null;render()};
function openSheet(h){sheetAnim=!sheet;sheet=`<div class="sheet" onclick="if(event.target==this)closeSheet()"><div>${h}</div></div>`;render()}
function sheetDisc(){openSheet(`<h2>Nova disciplina</h2><label>Nome</label><input class="ac" autocapitalize="sentences" id="dn" placeholder="Ex.: Matemática"><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addDisc($('#dn').value)">Salvar</button></div>`)}
function openDisc(id){const d=S.discs.find(x=>x.id==id);
    openSheet(`<div class="row sp"><h2>${esc(d.name)}</h2><button class="btn sm alt" onclick="ask('Excluir esta disciplina e todas as notas?',()=>delDisc('${id}'),'Excluir')">Excluir</button></div><div class="tab">${[1,2,3].map(u=>`<button class="${tab==u?'on':''}" onclick="tab=${u};openDisc('${id}')">${u}ª unidade</button>`).join('')}</div>
 <div class="card"><div class="sub">Média da unidade</div><div class="big ${col(unitAvg(id,tab))}">${unitAvg(id,tab)===null?'–':f(unitAvg(id,tab))}</div></div>
 <div class="card" style="margin-top:12px"><div class="sub">Média final</div><b style="font-size:22px">${discAvg(id)===null?'–':f(discAvg(id))}</b><div class="sub">${need(id)}</div></div>
 ${S.grades.filter(g=>g.d==id&&g.u==tab).map(g=>`<div class="it row sp"><div><b>${esc(g.name)}</b><div class="sub">${g.type} · ${dfmt(g.date)}</div></div><div class="row"><span class="pill">${f(g.s)}/${f(g.max)}</span><button class="btn sm alt" onclick="delGrade('${g.id}','${id}')">✕</button></div></div>`).join('')}
 <div class="row" style="margin-top:14px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="sheetGrade('${id}')">+ Adicionar Nota</button></div>`)}
// ações
function addDisc(n){n=cap((n||'').trim());if(!n)return toast('Informe o nome.');const ex=S.discs.find(d=>norm(d.name)==norm(n));if(ex){if(!vp)toast('A disciplina '+ex.name+' já existe.');return ex}const d={id:uid(),name:n};S.discs.push(d);log('Disciplina criada: '+n);save();closeSheet();return d}
function delDisc(id){const n=dn(id);S.discs=S.discs.filter(d=>d.id!=id);S.grades=S.grades.filter(g=>g.d!=id);S.tasks=S.tasks.filter(t=>t.d!=id);log('Disciplina excluída: '+n);save();closeSheet()}
function delGrade(id,d){const g=S.grades.find(x=>x.id==id);if(!g)return openDisc(d);S.grades=S.grades.filter(x=>x.id!=id);log('Nota removida: '+g.name);save();openDisc(d)}
function num(s){const m=s.match(/\d+(?:[.,]\d+)?/g);return m?m.map(x=>parseFloat(x.replace(',','.'))):[]}
// ---------- novas funções ----------
const TYPES=['Atividade','Projeto','Prova','Teste','Trabalho'],cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function render(){applyTheme();
    if(!S.user){return ob()}
    if(locked){return lockView()}
    const v={home,hist,cal,cfg}[view]();
    const pa=pgAnim;pgAnim=0;app.innerHTML=`<main class="${pa?'pg':''}">${v}</main>${vp?vpBox():`<button class="fab" onclick="mic()" aria-label="Falar com ${esc(S.user.nick)}">${IC.mic}</button>`}<nav>${[['home','Início'],['hist','Histórico'],['cal','Calendário'],['cfg','Configurações']].map(([k,l])=>`<button class="${view==k?'on':''}" onclick="go('${k}')">${IC[k]}${l}</button>`).join('')}</nav>${sheetH()}`;if(pa)countUp();vpScroll();
}
function ask(msg,fn,label){cb=fn;openSheet(`<h2>${esc(msg)}</h2><div class="row" style="margin-top:18px"><button class="btn alt" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="const g=cb;closeSheet();g&&g()">${label||'Confirmar'}</button></div>`)}
// calendário / tarefas
function cal(){const late=S.tasks.filter(t=>!t.graded&&daysTo(t.date)<0),up=S.tasks.filter(t=>daysTo(t.date)>=0).sort((a,b)=>a.date<b.date?-1:1),past=S.tasks.filter(t=>t.graded&&daysTo(t.date)<0).sort((a,b)=>a.date<b.date?1:-1);
    const row=t=>{const n=daysTo(t.date),lt=!t.graded&&n<0;return `<div class="it row sp ${lt?'late':''}"><div><b>${esc(t.type)}: ${esc(t.title)}</b><div class="sub">${dfmt(t.date)} · ${esc(dn(t.d))} · ${f(t.pts)} pts${t.graded?' · nota lançada':lt?' · lance a nota':''}</div></div><div class="row">${!t.graded&&n<=0?`<button class="btn sm" onclick="sheetGrade('${t.d}','${t.id}')">Lançar nota</button>`:''}<button class="btn sm alt" aria-label="Excluir" onclick="ask('Excluir esta tarefa?',()=>delTask('${t.id}'),'Excluir')">✕</button></div></div>`};
    return `<div class="row sp"><h1>Calendário</h1><button class="btn sm" onclick="sheetTask()">+ Tarefa</button></div><p class="sub">Trabalhos, provas e atividades.</p>
 ${late.length?`<div class="card" style="margin-top:14px"><h2>Aguardando nota</h2>${late.map(row).join('')}</div>`:''}
 <div class="card" style="margin-top:12px"><h2>Próximos</h2>${up.map(row).join('')||'<p class="sub">Nada agendado.</p>'}</div><div class="card" style="margin-top:12px"><h2>Anteriores</h2>${past.map(row).join('')||'<p class="sub">Vazio.</p>'}</div>`}
function sheetTask(){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    const n=new Date();cp={y:n.getFullYear(),m:n.getMonth(),sel:''};
    openSheet(`<h2>Nova tarefa</h2><label>Data de entrega: <b id="dl">selecione no calendário</b></label><div id="cpw"></div><label>Tipo</label><select id="tp" onchange="tpChg()">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select><label>Descrição</label><input class="ac" autocapitalize="sentences" id="tt" placeholder="Digite aqui a descrição"><label>Matéria</label><select id="td">${dopts()}</select><label>Pontuação (quantos pontos vale)</label><input id="tpt" type="number" step="0.5" inputmode="decimal" placeholder="Ex.: 5"><p class="sub" style="margin-top:8px">Você recebe um aviso 3 dias antes e outro às 18h do dia, para lançar a nota.</p><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addTask({d:$('#td').value,type:$('#tp').value,title:$('#tt').value.trim(),date:cp.sel,pts:parseFloat($('#tpt').value)})">Salvar</button></div>`);drawCal()}
function drawCal(){const el=$('#cpw');if(!el)return;const y=cp.y,m=cp.m,first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),mn=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    let c='';for(let i=0;i<first;i++)c+='<i></i>';for(let d=1;d<=n;d++){const iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');c+=`<button class="${iso==cp.sel?'sel':''} ${iso==today()?'td':''}" onclick="pick('${iso}')">${d}</button>`}
    el.innerHTML=`<div class="row sp"><button class="btn sm alt" onclick="cm(-1)" aria-label="Mês anterior">‹</button><b style="text-transform:capitalize">${mn}</b><button class="btn sm alt" onclick="cm(1)" aria-label="Próximo mês">›</button></div><div class="cg">${'DSTQQSS'.split('').map(x=>`<span>${x}</span>`).join('')}${c}</div>`}
function pick(i){cp.sel=i;drawCal();$('#dl').textContent=dfmt(i)}
function cm(k){const d=new Date(cp.y,cp.m+k,1);cp.y=d.getFullYear();cp.m=d.getMonth();drawCal()}
function addTask(o){if(!o.date)return toast('Selecione a data de entrega.');if(!o.title)return toast('Digite a descrição.');if(isNaN(o.pts))return toast('Informe quantos pontos vale.');
    S.tasks.push({id:uid(),d:o.d,type:o.type,title:cap(o.title),date:o.date,pts:o.pts,graded:false});log(`Tarefa criada: ${o.type} – ${o.title} (${dn(o.d)}, ${f(o.pts)} pts) para ${dfmt(o.date)}`);save();closeSheet();toast('Tarefa salva!');remind()}
function delTask(id){const t=S.tasks.find(x=>x.id==id);if(!t)return render();S.tasks=S.tasks.filter(x=>x.id!=id);log('Tarefa excluída: '+t.title);save();render()}
// notas
function sheetGrade(d,tid){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    const k=S.tasks.find(x=>x.id==tid)||{};
    openSheet(`<h2>Adicionar nota</h2><label>Disciplina</label><select id="gd">${dopts(d)}</select><label>Unidade</label><select id="gu"><option>1</option><option>2</option><option>3</option></select><label>Tipo</label><select id="gt">${TYPES.map(x=>`<option ${x==k.type?'selected':''}>${x}</option>`).join('')}</select><label>Descrição</label><input class="ac" autocapitalize="sentences" id="gn" value="${esc(k.title||'')}" placeholder="Ex.: Prova 1"><div class="row"><div><label>Valia</label><input id="gm" type="number" step="0.1" inputmode="decimal" value="${k.pts||10}"></div><div><label>Tirei</label><input id="gs" type="number" step="0.1" inputmode="decimal"></div></div><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addGrade($('#gd').value,+$('#gu').value,$('#gt').value,$('#gn').value,+$('#gm').value,parseFloat($('#gs').value),'${tid||''}')">Salvar nota</button></div>`)}
function addGrade(d,u,type,name,max,s,tid){if(!d||isNaN(s)||!max)return toast('Informe a nota e o valor.');if(s<0||max<0)return toast('Use apenas valores positivos.');if(s>max)return toast('A nota não pode passar do valor.');
    S.grades.push({id:uid(),d,u,type,name:name?cap(name):type+' de '+dn(d),max,s,date:today()});const t=S.tasks.find(x=>x.id==tid);if(t)t.graded=true;
    log(`Nota lançada: ${type} ${name||''} de ${dn(d)} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();closeSheet();toast('Nota salva!')}
// notificações
function ping(m){toast('⏰ '+m);try{if(S.notif&&Notification.permission=='granted')new Notification('NotaUp',{body:m})}catch(e){}}
function remind(){if(!S.user||locked)return;const h=new Date().getHours();S.tasks.forEach(t=>{if(t.graded)return;const n=daysTo(t.date),a=t.id+'a',b=t.id+'b';
    if(n>=0&&n<=3&&!S.notified[a]){S.notified[a]=1;ping(`${n==0?'Hoje':'Dia '+dfmt(t.date)}: ${t.type.toLowerCase()} de ${dn(t.d)}, vale ${f(t.pts)} pontos.`)}
    if((n<0||(n==0&&h>=18))&&!S.notified[b]){S.notified[b]=1;ping(`Quanto você tirou em “${t.title}” (${dn(t.d)}, vale ${f(t.pts)})? Lance sua nota.`)}});save()}
function notifPrompt(){openSheet(`<h2>NotaUp deseja enviar notificações</h2><p class="sub" style="margin-top:8px">Avisos de provas, trabalhos e lembretes para lançar suas notas.</p><div class="row" style="margin-top:18px"><button class="btn alt" onclick="S.asked=1;save();closeSheet()">Cancelar</button><button class="btn" onclick="setNotif(true)">Permitir</button></div>`)}
function setNotif(on){S.asked=1;if(!on){S.notif=false;log('Notificações desativadas');save();closeSheet();return}
    const done=p=>{S.notif=true;log('Notificações ativadas');save();closeSheet();if(p!='granted')toast('Ativadas no app. Para receber avisos no aparelho, libere as notificações deste site nas configurações do navegador.')};
    if(!('Notification' in window))return done('unsupported');
    try{Notification.requestPermission().then(done,()=>done('denied'))}catch(e){done('denied')}}
// foto de perfil
// voz
// ---------- v3: tema, logo, foto por gestos, voz fluida ----------
const LG=()=>`<img src="${S.theme=='dark'?'logo-dark.png':'logo.png'}" alt="">`;
function applyTheme(){document.documentElement.setAttribute('data-theme',S.theme=='dark'?'dark':'light')}
function setTheme(t){S.theme=t;log('Tema alterado para '+(t=='dark'?'escuro':'claro'));save();render()}
function tpChg(){const t=$('#tp').value,d=$('#td');if(t=='Projeto'){d.innerHTML='<option value="all">Válido para todas as matérias</option>';d.disabled=true}else{d.innerHTML=dopts();d.disabled=false}}
// foto de perfil (arrastar e pinçar)
function sheetPhoto(){ph={img:null,z:1,ox:0,oy:0};
    openSheet(`<h2>Seu perfil</h2><div class="pv"><canvas id="pc"></canvas></div><p class="sub" style="text-align:center">Arraste para mover e use dois dedos para dar zoom.</p><div style="text-align:center;margin-top:10px"><button class="btn sm alt" onclick="$('#pf').click()">Editar foto</button></div><input id="pf" type="file" accept="image/*" style="display:none" onchange="phLoad(this)"><div class="row" style="margin-top:16px"><button class="btn sm alt" style="flex:1" onclick="phRemove()">Remover</button><button class="btn sm alt" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn sm" style="flex:1" onclick="phSave()">Salvar</button></div>`);
    phBind();if(S.user.photo)phImg(S.user.photo);else phDraw($('#pc'),240)}
function phImg(src){const im=new Image();im.onerror=()=>toast('Não consegui abrir essa imagem. Tente JPG ou PNG.');im.onload=()=>{ph.img=im;ph.z=1;ph.ox=0;ph.oy=0;phDraw($('#pc'),240)};im.src=src}
function phLoad(i){const fl=i.files[0];if(!fl)return;const r=new FileReader();r.onload=()=>phImg(r.result);r.readAsDataURL(fl)}
function phDraw(c,size){if(!c)return;c.width=c.height=size;const im=ph.img,x=c.getContext('2d');if(!im||!x)return;const sc=size/Math.min(im.width,im.height)*ph.z,dw=im.width*sc,dh=im.height*sc,cl=(v,m)=>Math.max(m,Math.min(0,v));
    let px=cl((size-dw)/2+ph.ox*size,size-dw),py=cl((size-dh)/2+ph.oy*size,size-dh);ph.ox=(px-(size-dw)/2)/size;ph.oy=(py-(size-dh)/2)/size;x.drawImage(im,px,py,dw,dh)}
function phBind(){const c=$('#pc'),P=new Map(),zm=k=>ph.z=Math.max(1,Math.min(6,ph.z*k));
    c.onpointerdown=e=>{try{c.setPointerCapture(e.pointerId)}catch(_){}P.set(e.pointerId,[e.clientX,e.clientY])};
    c.onpointermove=e=>{if(!P.has(e.pointerId))return;const o=[...P.values()];P.set(e.pointerId,[e.clientX,e.clientY]);const n=[...P.values()],r=c.getBoundingClientRect();
        if(n.length==1){ph.ox+=(n[0][0]-o[0][0])/r.width;ph.oy+=(n[0][1]-o[0][1])/r.height}
        else{const d0=Math.hypot(o[0][0]-o[1][0],o[0][1]-o[1][1]),d1=Math.hypot(n[0][0]-n[1][0],n[0][1]-n[1][1]);if(d0)zm(d1/d0);ph.ox+=((n[0][0]+n[1][0])-(o[0][0]+o[1][0]))/2/r.width;ph.oy+=((n[0][1]+n[1][1])-(o[0][1]+o[1][1]))/2/r.height}
        phDraw(c,240)};
    c.onpointerup=c.onpointercancel=e=>P.delete(e.pointerId);
    c.onwheel=e=>{e.preventDefault();zm(e.deltaY<0?1.08:.93);phDraw(c,240)}}
function phSave(){if(!ph.img)return toast('Toque em “Editar foto” e escolha uma imagem.');const c=document.createElement('canvas');phDraw(c,200);S.user.photo=c.toDataURL('image/jpeg',.85);log('Foto de perfil alterada');save();closeSheet()}
function phRemove(){S.user.photo='';log('Foto de perfil removida');save();closeSheet()}
// voz
const vpBox=()=>{const c=vpAnim?' enter':'';vpAnim=0;return `<div class="vp${c}"><button class="vx" onclick="stopVoice()" aria-label="Fechar">✕</button><div class="orbrow"><div id="orb" class="orb ${orbSt()}"><i></i></div><div class="st" id="vst" style="margin:0">${stHtml()}</div></div><div id="vpm" class="vm">${vpInner()}</div><div class="row" style="margin-top:8px"><input id="vt" placeholder="…ou digite o comando" onkeydown="if(event.key=='Enter')vtype()"><button class="vb vs" onclick="vtype()" aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button><span id="vbtn">${vbtn()}</span></div></div>`};
const vbtn=()=>`<button class="vb ${keep?'on':''}" onclick="toggleMic()" aria-label="${keep?'Parar de ouvir':'Falar'}">${keep?IC.stop:IC.mic}</button>`;
function toggleMic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!vp)return;
    if(keep){keep=false;clearTimeout(rstTimer);clearTimeout(guardT);guardT=null;try{rec&&rec.abort()}catch(e){}vp.live='';vp.st='Parei de ouvir. Toque no microfone para falar.';return vpaint()}
    if(!SR){vp.st='Voz indisponível aqui. Digite o comando.';return vpaint()}
    keep=true;vp.st='Iniciando microfone…';vpaint();listen(SR)}
function vpaint(){if(!vp)return;const e=$('#vpm');if(e){e.innerHTML=vpInner();e.scrollTop=e.scrollHeight}const b=$('#vbtn');if(b)b.innerHTML=vbtn();const o=$('#orb');if(o)o.className='orb '+orbSt();const t=$('#vst');if(t)t.innerHTML=stHtml()}
function vtype(){const i=$('#vt'),v=i.value.trim();i.value='';if(v){ttsUnlock();handle(v,1)}}
let hq=Promise.resolve();
function handle(tx,typed){hq=hq.then(()=>handle1(tx,typed)).catch(e=>console.error(e));return hq}
function localReply(tx){try{return voice(tx)}catch(e){console.error(e);return P('Opa, deu um tropeço aqui. Pode repetir?','Ocorreu um erro. Poderia repetir?')}}
async function handle1(tx,typed){if(!vp)return;log((typed?'Comando digitado: “':'Comando de voz: “')+tx+'”');say('u',tx);let a;vp.chips=null;
    if(S.ai.key){vp.think=1;vp.act='';vpaint();try{a=await aiReply(tx)}catch(e){console.warn(e);a=localReply(tx);if(vp)vp.msgs.push({r:'n',t:'⚠ '+aiP().name+' indisponível: '+e.msg+' Respondi pelo modo local.'});if(!aiWarned[e.kind]){aiWarned[e.kind]=1;toast(e.msg)}log('Assistente IA indisponível: '+e.msg)}if(vp){vp.think=0;vp.act=''}}
    else a=localReply(tx);if(a)say('j',a);if(vp){vp.chips=sugg(tx);vpaint()}}
function say(r,t){if(!vp)return;if(r=='u'){vp.msgs.push({r,t});return vpaint()}speak(t);const m={r,t:''};vp.msgs.push(m);let i=0;const iv=setInterval(()=>{i+=3;m.t=t.slice(0,i);vpaint();if(i>=t.length)clearInterval(iv)},10)}
function mic(){vpAnim=1;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;ttsUnlock();aiHist=[];const g=P(`${cap(hr())}, ${fn1()}! Sou o ${S.user.nick}. O que temos para hoje?`,`${cap(hr())}, ${fn1()}. Sou ${S.user.nick}. Em que posso ajudá-lo?`);vp={msgs:[{r:'j',t:g}],st:SR?'Iniciando microfone…':'Voz indisponível aqui. Digite o comando.',live:''};keep=!!SR;render();speak(g);if(SR)listen(SR)}
// reconhecimento de voz: UMA instância reaproveitada (recriar a cada frase travava o microfone)
let running=false,lastEv=0,lastFin={t:'',at:0},rstTimer=null;
let guardT=null;
function recStart(){if(!keep||!rec||running||speaking)return;try{rec.start()}catch(e){}if(!guardT)guardT=setTimeout(()=>{guardT=null;if(keep&&!running){keep=false;try{rec.abort()}catch(e){}if(vp){vp.st='Toque no microfone para falar.';vpaint()}}},2500)}
function recLater(ms){clearTimeout(rstTimer);rstTimer=setTimeout(recStart,ms)}
function finalText(tx){tx=(tx||'').trim();if(!tx)return;const n=Date.now();if(tx===lastFin.t&&n-lastFin.at<2000)return;lastFin={t:tx,at:n};handle(tx)}
function listen(SR){if(!keep)return;
    if(!rec){let r;try{r=new SR()}catch(e){if(vp){vp.st='Não consegui iniciar o microfone. Digite o comando.';vpaint()}return}rec=r;r.lang='pt-BR';r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
        r.onstart=()=>{clearTimeout(guardT);guardT=null;running=true;lastEv=Date.now();if(vp){vp.st='Ouvindo…';vpaint()}};
        r.onresult=e=>{lastEv=Date.now();let tx='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){tx+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}if(!vp)return;if(fin){vp.live='';finalText(tx)}else{vp.live=tx;vpaint()}};
        r.onerror=e=>{if(!vp)return;const E=e.error;if(E=='not-allowed'||E=='service-not-allowed'){keep=false;vp.st='Microfone bloqueado. Libere nas configurações do navegador ou digite o comando.'}else if(E=='network'){keep=false;vp.st='Sem internet para reconhecer a voz. Digite o comando.'}else if(E=='audio-capture')vp.st='Não achei o microfone.';else if(E=='no-speech')vp.st='Não ouvi nada. Pode falar.';else return;vpaint()};
        r.onend=()=>{running=false;vpaint();if(vp&&vp.live){const tx=vp.live;vp.live='';finalText(tx)}if(keep&&!speaking)recLater(350)}}
    recStart()}
function stopVoice(){keep=false;ttsStop();clearTimeout(rstTimer);clearTimeout(guardT);guardT=null;try{rec&&rec.abort()}catch(e){}vp=null;render()}
setInterval(()=>{if(!keep||!vp||!rec)return;if(running&&Date.now()-lastEv>20000){try{rec.abort()}catch(e){}}},2000);
// ---------- v4: Jarvis conversacional ----------
const hr=()=>{const h=new Date().getHours();return h<12?'bom dia':h<18?'boa tarde':'boa noite'},P=(a,b)=>S.tone=='formal'?b:a,fn1=()=>S.user.name.trim().split(' ')[0];
function lev(a,b){const d=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return d[b.length]}
function findDisc(t){const ds=[...S.discs].sort((a,b)=>b.name.length-a.name.length),e=ds.find(d=>t.includes(norm(d.name)));if(e)return e;const w=t.split(/\s+/);
    return ds.find(d=>{const n=norm(d.name),k=n.split(' ').length;for(let i=0;i+k<=w.length;i++){const x=w.slice(i,i+k).join(' ');if(x.length>3&&lev(x,n)<=Math.max(1,Math.floor(n.length/4)))return true}})}
function agenda(){const L=[],late=S.tasks.filter(t=>!t.graded&&daysTo(t.date)<0),soon=S.tasks.filter(t=>!t.graded&&daysTo(t.date)>=0&&daysTo(t.date)<=3).sort((a,b)=>a.date<b.date?-1:1);
    soon.forEach(t=>{const n=daysTo(t.date);L.push(`${n==0?'Hoje':n==1?'Amanhã':'Em '+n+' dias'} tem ${t.type.toLowerCase()} de ${dn(t.d)} (${f(t.pts)} pts)`)});
    if(late.length)L.push('falta lançar a nota de '+late.map(t=>t.title).join(', '));
    return L.length?P('Tá assim: ','Pendências: ')+L.join('; ')+'.':P('Nada urgente por aqui! Quer adicionar alguma nota ou tarefa?','Não há pendências no momento. Deseja registrar algo?')}
// ---------- v5: assistente completo ----------
const NUM={zero:0,dois:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10},MES={janeiro:0,fevereiro:1,marco:2,abril:3,maio:4,junho:5,julho:6,agosto:7,setembro:8,outubro:9,novembro:10,dezembro:11},SEM={domingo:0,segunda:1,terca:2,quarta:3,quinta:4,sexta:5,sabado:6},rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function words2num(t){t=t.replace(/\b(zero|dois|tres|quatro|cinco|seis|sete|oito|nove|dez)\b/g,w=>NUM[w]).replace(/\b(tirei|tirou|fiz|consegui|nota|valia|valendo|vale|dia|unidade)\s+um\b/g,'$1 1');return t.replace(/(\d+)\s+e\s+meio\b/g,'$1.5')}
function parseDate(t){const n=new Date();n.setHours(12,0,0,0);let m;
    if(/depois de amanha/.test(t)){n.setDate(n.getDate()+2);return ymd(n)}
    if(/\bamanha\b/.test(t)){n.setDate(n.getDate()+1);return ymd(n)}
    if(/\bhoje\b/.test(t))return ymd(n);
    if(m=t.match(/dia\s*(\d{1,2})(?:\s*(?:de|\/)\s*([a-z]+|\d{1,2}))?/)){const d=+m[1];let mo=n.getMonth();if(m[2]){const k=isNaN(m[2])?MES[m[2]]:+m[2]-1;if(k!==undefined)mo=k}const dt=new Date(n.getFullYear(),mo,d,12);if(!m[2]&&d<n.getDate())dt.setMonth(dt.getMonth()+1);else if(m[2]&&dt<n)dt.setFullYear(dt.getFullYear()+1);return ymd(dt)}
    for(const k in SEM)if(new RegExp('\\b'+k+'\\b').test(t)){const dt=new Date(n);dt.setDate(dt.getDate()+((SEM[k]-n.getDay()+7)%7||7));return ymd(dt)}
    return null}
function mkTask(did,T,iso,pts){const d=S.discs.find(x=>x.id==did);S.tasks.push({id:uid(),d:did,type:T,title:T+' de '+d.name,date:iso,pts,graded:false});log(`Tarefa criada por voz: ${T} de ${d.name} para ${dfmt(iso)} (${f(pts)} pts)`);save();render();remind();
    return P(`Combinado! Agendei ${T.toLowerCase()} de ${d.name} pro dia ${dfmt(iso)}, valendo ${f(pts)}.`,`Agendei ${T.toLowerCase()} de ${d.name} para o dia ${dfmt(iso)}, valendo ${f(pts)} pontos.`)}
function finishGrade(d,T,max,s,u){const tk=S.tasks.find(x=>x.d==d.id&&!x.graded&&norm(x.type)==norm(T));max=max||(tk?tk.pts:10);if(s>max)return P(`Ops, ${f(s)} passa do valor ${f(max)}. Quanto foi mesmo?`,`A nota ${f(s)} excede o valor ${f(max)}. Poderia confirmar?`);
    if(tk)tk.graded=true;S.grades.push({id:uid(),d:d.id,u,type:T,name:tk?tk.title:T+' de '+d.name,max,s,date:today()});log(`Nota lançada por voz: ${T} de ${d.name} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();const a=discAvg(d.id);
    return P(`Feito! ${T} de ${d.name}: ${f(s)}/${f(max)} na ${u}ª unidade. Sua média em ${d.name} tá ${f(a)}.`,`Registrado: ${T.toLowerCase()} de ${d.name}, ${f(s)} de ${f(max)} (${u}ª unidade). Média atual: ${f(a)}.`)}
const CH=['O que temos para hoje?','Minha média geral','Quanto falta para passar?','Minhas matérias'];
const vpInner=()=>{const cs=vp.think||vp.live?null:(vp.chips||(vp.msgs.length<2?CH:null));
    const h=vp.msgs.slice(-24).map(m=>`<div class="b ${m.r} ${m.seen?'':'in'}">${esc(m.t)}</div>`).join('')+(vp.live?`<div class="b u live">${esc(vp.live)}</div>`:'')+(vp.think?'<div class="b j dots"><i></i><i></i><i></i></div>':'')+(cs?`<div class="chips">${cs.map(c=>`<button onclick="ttsUnlock();handle('${c}',1)">${c}</button>`).join('')}</div>`:'');vp.msgs.forEach(m=>m.seen=1);return h};
function voice(raw){const n0=norm(raw);let t=words2num(n0).replace(/(\d)\s*(virgula|ponto)\s*(\d)/g,'$1.$3').replace(/(\d),(\d)/g,'$1.$2').replace(new RegExp('\\b'+rx(norm(S.user.nick))+'\\b','g'),' ').replace(/\s+/g,' ').trim();const nm=fn1();
    const A=vp&&vp.ask;if(A){vp.ask=null;const x=num(t);
        if(/^(nao|deixa|cancela|esquece|para)\b/.test(t))return P('Beleza, deixei pra lá.','Certo, cancelado.');
        if(A.kind=='yes'&&/^(sim|pode|claro|confirm\w*|isso|ok|quero|exato)\b/.test(t))return A.fn();
        if(A.kind=='score'&&x.length&&t.split(' ').length<=5&&!/materia|disciplina|prova|trabalho|atividade|projeto|teste/.test(t))return finishGrade(S.discs.find(d=>d.id==A.d),A.T,A.max,x[0],A.u);
        if(A.kind=='date'){const iso=parseDate(t);if(iso)return mkTask(A.d,A.T,iso,A.pts)}}
    const act=/adicion|lanc|registr|tirei|tirou|cri[ae]|cadastr|agend|anot|apag|remov|exclu|delet/.test(t),cmd=/adicion|cri[ae]|cadastr|lanc|registr|agend|apag|remov|exclu|tirei|tirou|nota|materia|disciplina|prova|trabalho|atividade|projeto|teste|dia \d/.test(t),d=findDisc(t);
    if(/(seja|quero|fale|fala|responda|modo|mude|muda|fique).*(formal|corporativ|empresarial|profissional)/.test(t)){S.tone='formal';save();log('Jarvis: tom formal');return 'Entendido. Passarei a me comunicar de forma formal e objetiva.'}
    if(/(seja|quero|fale|fala|responda|modo|mude|muda|fique).*(amig|descontra|informal|casual)/.test(t)){S.tone='amigo';save();log('Jarvis: tom de amigo');return `Fechou, ${nm}! Agora a gente conversa como amigos.`}
    if(/(mud|alter|troc|defin)\w*.*media.*?\d/.test(t)&&!/tirei|tirou/.test(t)){const v=+t.match(/media.*?(\d+(?:\.\d+)?)/)[1];if(v>0&&v<=10){S.target=v;log('Média de aprovação alterada para '+v+' (voz)');save();render();return P(`Fechado! Agora a média pra passar é ${f(v)}.`,`Média de aprovação alterada para ${f(v)}.`)}}
    if(/(modo|tema)\s*(escuro|noturno)/.test(t)){setTheme('dark');return P('Pronto, modo escuro ligado.','Modo escuro ativado.')}
    if(/(modo|tema)\s*claro/.test(t)){setTheme('light');return P('Pronto, modo claro ligado.','Modo claro ativado.')}
    let nv=t.match(/\b(abr|va|vai|ir|mostr|ve)\w*\b.*?(calendario|historico|configuracoes|inicio|auditoria)/);if(nv){const k={calendario:['cal','o calendário'],historico:['hist','o histórico'],configuracoes:['cfg','as configurações'],auditoria:['cfg','a auditoria'],inicio:['home','o início']}[nv[2]];go(k[0]);return P(`Pronto, abri ${k[1]}.`,`Abrindo ${k[1]}.`)}
    if(/^(tchau|ate mais|ate logo|encerrar|fechar|pode fechar|era so isso)/.test(t)){setTimeout(stopVoice,1400);return P(`Falou, ${nm}! Até mais.`,'Até logo. Estarei à disposição.')}
    if(/(o que|que)\s*(temos|tenho|tem)\b.*(hoje|agenda|pendente)|minha agenda|pendencia|o que falta/.test(t))return agenda();
    if(!act){
        if(/(quais|quantas|minhas|liste|listar|mostr\w*)\b.*\b(materias|disciplinas)\b/.test(t))return S.discs.length?P(`Você tem ${S.discs.length}: ${S.discs.map(x=>x.name).join(', ')}.`,`Disciplinas cadastradas (${S.discs.length}): ${S.discs.map(x=>x.name).join(', ')}.`):'Você ainda não tem matérias. Diga “adicionar matéria de …”.';
        if(/\b(quais|qual|quanto|minhas?|mostr\w*|list\w*|ver)\b.*\bnotas?\b/.test(t)){const g=S.grades.filter(x=>!d||x.d==d.id);if(!g.length)return d?`Ainda não há notas em ${d.name}.`:'Ainda não há notas lançadas.';return (d?d.name+': ':P('Suas últimas notas: ','Últimas notas: '))+g.slice(-6).map(x=>`${x.type.toLowerCase()} ${f(x.s)}/${f(x.max)}${d?'':' em '+dn(x.d)}`).join('; ')+'.'}
        if(/desempenho|resumo|situacao|como (eu )?(estou|to) (indo|nas|nos|em)/.test(t)){const o=overall();if(o===null)return 'Ainda não há notas para resumir.';const bad=S.discs.filter(x=>{const a=discAvg(x.id);return a!==null&&a<S.target});return P(`Sua média geral tá em ${f(o)}. `+(bad.length?`Atenção em ${bad.map(x=>x.name).join(', ')}.`:'Tá tudo acima da média, mandou bem!'),`Média geral: ${f(o)}. `+(bad.length?`Disciplinas abaixo da média: ${bad.map(x=>x.name).join(', ')}.`:'Todas as disciplinas estão acima da média.'))}
        if(/\b(melhor|pior|mais alta|mais baixa|maior|menor)\b.*(media|materia|nota|disciplina)/.test(t)){const L=S.discs.map(x=>({x,a:discAvg(x.id)})).filter(o=>o.a!==null).sort((p,q)=>q.a-p.a);if(!L.length)return 'Ainda não há notas lançadas.';const hi=/melhor|mais alta|maior/.test(t),o=hi?L[0]:L[L.length-1];return P(`Sua ${hi?'melhor':'pior'} média é ${o.x.name}, com ${f(o.a)}.`,`${hi?'Maior':'Menor'} média: ${o.x.name}, com ${f(o.a)}.`)}
        if(/\bmedia\b|passar|aprov|reprov|quanto falta|falta (pra|para)/.test(t)){if(d){const a=discAvg(d.id);return a===null?P(`Ainda não tem nota em ${d.name}.`,`Não há notas registradas em ${d.name}.`):`${d.name}: média ${f(a)}. ${need(d.id)}.`}
            const L=S.discs.filter(x=>discAvg(x.id)!==null);if(/falta|passar|aprov|reprov/.test(t))return L.length?L.slice(0,6).map(x=>`${x.name}: ${f(discAvg(x.id))} — ${need(x.id)}`).join('. ')+'.':'Ainda não há notas lançadas.';const o=overall();return o===null?'Ainda não há notas lançadas.':P(`Sua média geral tá em ${f(o)}.`,`Sua média geral é ${f(o)}.`)}}
    if(!cmd){
        if(/obrigad|valeu|brigad/.test(t))return P(`Por nada, ${nm}! Tamo junto.`,'Disponha. Estou à disposição.');
        if(/tudo bem|como (voce|vc) (esta|ta|vai)|como vai/.test(t))return P('Tudo ótimo por aqui! E você, como tá? O que vamos resolver hoje?','Estou bem, obrigado por perguntar. Em que posso ajudá-lo?');
        if(/quem (e|eh) voce|seu nome|o que voce faz|ajuda|o que (voce )?sabe/.test(t))return P(`Sou o ${S.user.nick}, seu parceiro do NotaUp! Lanço notas, crio matérias e tarefas, calculo médias, digo quanto falta pra passar e te aviso do que tá pendente. É só pedir.`,`Sou ${S.user.nick}, assistente do NotaUp. Registro notas, cadastro disciplinas e tarefas, calculo médias, informo quanto falta para aprovação e as pendências.`);
        if(/bom dia|boa tarde|boa noite/.test(t))return P(`${cap(hr())}, ${nm}! Tudo bem? O que temos para hoje?`,`${cap(hr())}, ${nm}. Em que posso ajudá-lo hoje?`);
        if(t===''||/\b(oi|ola|e ai|opa|ei|alo|fala|salve|hey)\b/.test(t))return P(`Oi, ${nm}! E aí, tudo bem? O que temos para hoje?`,`Olá, ${nm}. Como posso ajudar?`)}
    if(!cmd)return SCOPE();
    const m=n0.match(/(?:cri\w*|cadastr\w*|adicion\w*|acrescent\w*|nov[ao])\s+(?:a\s+|uma\s+)?(?:nova\s+)?(?:materia|disciplina)\s+(?:de\s+|da\s+|do\s+)?(.+)$/);
    if(m){const n=cap(raw.slice(raw.length-m[1].length).replace(new RegExp('[\\s,]*'+rx(S.user.nick)+'[\\s.!?]*$','i'),'').replace(/[\s,]*por favor[\s.!?]*$/i,'').replace(/[.!?]+$/,'').trim());if(!n)return P('Qual é o nome da matéria?','Qual o nome da disciplina?');if(S.discs.some(x=>norm(x.name)==norm(n)))return P(`A matéria ${n} já existe, ${nm}.`,`A disciplina ${n} já está cadastrada.`);addDisc(n);return P(`Pronto, ${nm}! Matéria ${n} adicionada.`,`Disciplina ${n} cadastrada com sucesso.`)}
    const noDisc=P(`Hmm, não achei essa matéria, ${nm}. Qual é o nome dela? Se for nova, diga “adicionar matéria de …”.`,'Não localizei essa disciplina. Informe o nome ou diga “adicionar matéria de …”.');
    if(/(apag|remov|exclu|delet)\w*.*(materia|disciplina)/.test(t)){if(!d)return noDisc;if(vp)vp.ask={kind:'yes',fn:()=>{const n=d.name;delDisc(d.id);return P(`Pronto, a matéria ${n} foi excluída.`,`Disciplina ${n} excluída.`)}};return P(`Tem certeza que quer excluir ${d.name} e todas as notas dela?`,`Confirma a exclusão de ${d.name} e de todas as notas?`)}
    if(/(apag|remov|exclu|desfa)\w*.*(ultima|nota)/.test(t)){const g=S.grades.pop();if(!g)return P('Não tem nenhuma nota pra remover.','Não há notas para remover.');log('Nota removida por voz: '+g.name);save();render();return P('Pronto, tirei a última nota.','Última nota removida.')}
    const ty=(t.match(/prova|teste|atividade|projeto|trabalho/)||[''])[0],vm=t.match(/val\w*\s*(\d+(?:\.\d+)?)/),sm=t.match(/(?:tirei|tirou|fiz|consegui|peguei|obtive|ganhei|marquei|nota)\s*(?:de\s*)?(\d+(?:\.\d+)?)/),date=parseDate(t.replace(/(primeira|segunda|terceira)\s*unidade/g,''));
    if(ty&&date&&!sm){if(!d)return noDisc;return mkTask(d.id,cap(ty),date,vm?+vm[1]:10)}
    if(ty&&!sm&&!vm&&/agend|marc|lembr|cri[ae]|tenho|\btem\b/.test(t)){if(!d)return noDisc;const T=cap(ty);if(vp)vp.ask={kind:'date',d:d.id,T,pts:10};return P(`Beleza! Pra quando é ${T.toLowerCase()} de ${d.name}?`,`Para qual data está marcada ${T.toLowerCase()} de ${d.name}?`)}
    if((ty||/nota/.test(t))&&/adicion|lanc|registr|coloc|anot|tirei|tirou|fiz|consegui|peguei/.test(t)){if(!d)return noDisc;const T=cap(ty||'atividade'),
        um=t.match(/(\d)\s*[aºªo]?\s*unidade/)||t.match(/unidade\s*(\d)/),w=t.match(/(primeira|segunda|terceira)\s*unidade/),u=um?+um[1]:w?{primeira:1,segunda:2,terceira:3}[w[1]]:1,max=vm?+vm[1]:null;
        if(!sm){if(vp)vp.ask={kind:'score',d:d.id,T,max,u};return P(`Beleza, ${T.toLowerCase()} de ${d.name}. Quanto você tirou?`,`${T} de ${d.name}. Qual foi a nota obtida?`)}return finishGrade(d,T,max,+sm[1],u)}
    return P(`Não entendi bem, ${nm}. Pode repetir? Ex.: “tirei 8 na prova de Português”, “quanto falta pra passar em Inglês” ou “o que temos para hoje”.`,'Não compreendi a solicitação. Poderia reformular? Exemplo: “quanto falta para passar em Inglês”.')}
document.addEventListener('input',e=>{const t=e.target;if(!t.classList||!t.classList.contains('ac'))return;const v=t.value;if(v&&v[0]!==v[0].toUpperCase()){const s=t.selectionStart;t.value=v[0].toUpperCase()+v.slice(1);try{t.setSelectionRange(s,s)}catch(_){}}});
['gesturestart','gesturechange','gestureend'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault()));
// ================= v6: segurança — senha, Face ID/biometria e recuperação por e-mail =================
const bioName=/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)?'Face ID':'biometria';
let bioOK=false;
try{if(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable)PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(v=>{bioOK=!!v;if(S.user&&!locked&&view=='cfg'&&!sheet)render()},()=>{})}catch(e){}
const mailOK=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e||'');
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0));
async function hashPw(pw,salt){const s=salt+'|'+pw;try{if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}}catch(e){}
    let h=5381;for(let k=0;k<3000;k++)for(let i=0;i<s.length;i++)h=(Math.imul(h,33)^s.charCodeAt(i))>>>0;return 'x'+h.toString(16)}
async function setPw(pw){S.sec.salt=b64(rnd(16));S.sec.hash=await hashPw(pw,S.sec.salt)}
async function checkPw(pw){return !!S.sec.hash&&(await hashPw(pw,S.sec.salt))===S.sec.hash}
// Face ID / biometria via WebAuthn. A credencial é "não descobrível" (residentKey: discouraged) e o pedido
// aponta direto para ela (allowCredentials, só 'internal'): sem lista de chaves, sem QR code, sem outro aparelho.
async function bioEnroll(){if(!bioOK){toast(cap(bioName)+' não está disponível neste aparelho/navegador.');return false}
    try{const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'NotaUp'},user:{id:rnd(16),name:S.sec.email||S.user.name,displayName:S.user.name},
            pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged',requireResidentKey:false},timeout:60000,attestation:'none'}});
        S.sec.cred=b64(c.rawId);S.sec.bio=true;log(cap(bioName)+' ativado');save();toast(cap(bioName)+' ativado! Ele abre sozinho quando você entrar no app.');return true}
    catch(e){console.warn(e);toast(e.name=='NotAllowedError'?'Ativação cancelada.':'Não foi possível ativar o '+bioName+': '+(e.message||e.name));return false}}
async function bioCheck(signal){const a=await navigator.credentials.get({signal,publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:unb64(S.sec.cred),transports:['internal']}],userVerification:'required',timeout:60000}});
    if(!a||b64(a.rawId)!==S.sec.cred)return false;const ad=new Uint8Array(a.response.authenticatorData);return ad.length>32&&!!(ad[32]&4)}
const lkReset=()=>{lk={msg:'',busy:0,tried:0,pw:0,ac:null,rst:null}};
const hasBio=()=>!!(S.sec.bio&&S.sec.cred);
function lockView(){const r=lk.rst;
    app.innerHTML=`<main><div class="ob lock"><div class="logo" style="justify-content:center">${LG()}NotaUp</div><div class="lockav">${avatar()}</div><h1 style="text-align:center">Olá, ${esc(fn1())}!</h1>
 ${r?rstView(r):`${hasBio()?`<button class="fid ${lk.busy?'on':''}" onclick="bioUnlock()" aria-label="Entrar com ${bioName}">${IC.face}</button><p class="sub" id="lkm" style="text-align:center;min-height:18px">${esc(lk.msg||(lk.busy?'Olhe para a tela…':''))}</p>
 ${lk.tried&&!lk.busy?`<button class="btn" id="bioAgain" onclick="bioUnlock()">Tentar novamente com ${bioName}</button>`:''}`:`<p class="sub" id="lkm" style="text-align:center">${esc(lk.msg||'Digite sua senha para entrar.')}</p>`}
 ${lk.pw||!hasBio()?`<input id="lp" type="password" autocomplete="off" placeholder="Sua senha" onkeydown="if(event.key=='Enter')pwUnlock()"><button class="btn" onclick="pwUnlock()">Entrar</button>`:`<button class="btn alt" id="pwBtn" onclick="pwMode()">Digitar senha</button>`}
 <button class="lnk" id="forgotBtn" style="justify-self:center;margin-top:6px" onclick="forgot()">Esqueci minha senha</button>`}</div></main>`}
async function bioUnlock(){if(lk.busy||!hasBio()||!locked)return;lk.busy=1;lk.msg='';lk.pw=0;render();
    const ac=window.AbortController?new AbortController():null;lk.ac=ac;
    try{if(await bioCheck(ac?ac.signal:undefined)){lk.ac=null;return unlock(bioName)}lk.msg='Não reconheci. Tente de novo ou use a senha.'}
    catch(e){if(lk.ac!==ac)return;console.warn(e);lk.msg=e.name=='NotAllowedError'?cap(bioName)+' não reconheceu ou foi cancelado.':e.name=='AbortError'?'':'Não foi possível usar o '+bioName+'.'}
    lk.ac=null;lk.busy=0;lk.tried=1;if(locked)render()}
function pwMode(){const a=lk.ac;lk.ac=null;if(a)try{a.abort()}catch(e){}lk.busy=0;lk.pw=1;lk.msg='';render();setTimeout(()=>{const i=$('#lp');i&&i.focus()},60)}
async function pwUnlock(){const i=$('#lp'),v=i?i.value:'';if(!v)return toast('Digite sua senha.');if(await checkPw(v))return unlock('senha');lk.msg='Senha incorreta.';lk.pw=1;render();const j=$('#lp');j&&j.focus()}
function unlock(how){locked=false;lkReset();log('Entrada no app ('+how+')');save();render();remind()}
function lockNow(){if(!S.sec.hash)return;if(vp){keep=false;ttsStop();try{rec&&rec.abort()}catch(e){}vp=null}sheet=null;locked=true;lkReset();render();if(hasBio())setTimeout(bioUnlock,250)}
const LOCK_MS=2*60*1000;let hidAt=0;
document.addEventListener('visibilitychange',()=>{if(document.hidden){hidAt=Date.now();return}
    if(S.user&&S.sec.hash&&!locked&&hidAt&&Date.now()-hidAt>LOCK_MS)return lockNow();
    if(locked&&hasBio()&&!lk.busy&&!lk.pw&&!lk.rst)return setTimeout(bioUnlock,250);remind()});
// recuperação de senha por e-mail (EmailJS)
const emailCfg=()=>!!(EMAILJS.serviceId&&EMAILJS.templateId&&EMAILJS.publicKey);
const maskMail=e=>{const [u,d]=String(e).split('@');return u.slice(0,2)+'***@'+d};
async function sendMail(params){const r=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:EMAILJS.serviceId,template_id:EMAILJS.templateId,user_id:EMAILJS.publicKey,template_params:params})});
    if(!r.ok){let t='';try{t=await r.text()}catch(e){}throw new Error(t||('HTTP '+r.status))}}
async function forgot(){const a=lk.ac;lk.ac=null;if(a)try{a.abort()}catch(e){}lk.busy=0;
    if(!mailOK(S.sec.email))return toast('Nenhum e-mail de recuperação cadastrado neste aparelho.');
    if(!emailCfg())return toast('O envio de e-mail ainda não foi configurado (EmailJS). Preencha os dados no topo do arquivo app.js.');
    lk.rst={step:'send',msg:'Enviando código para '+maskMail(S.sec.email)+'…'};render();
    const code=String(100000+new Uint32Array(rnd(4).buffer)[0]%900000);
    try{await sendMail({to_email:S.sec.email,to_name:fn1(),code,app_name:'NotaUp',validade:'15 minutos'});
        S.rst={h:await hashPw(code,'rst'),exp:Date.now()+15*60000,tries:0,at:Date.now()};log('Código de recuperação enviado para '+maskMail(S.sec.email));save();
        lk.rst={step:'code',msg:'Enviamos um código de 6 dígitos para '+maskMail(S.sec.email)+'. Confira também o spam.'}}
    catch(e){console.warn(e);lk.rst={step:'err',msg:'Não consegui enviar o e-mail: '+String(e.message||e).slice(0,140)}}
    if(locked)render()}
function rstView(r){return `<h2 style="text-align:center">Redefinir senha</h2><p class="sub" id="rstMsg" style="text-align:center">${esc(r.msg)}</p>
 ${r.step=='code'?`<input id="rc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="Código de 6 dígitos"><input id="r1" type="password" autocomplete="off" placeholder="Nova senha (mín. 4)"><input id="r2" type="password" autocomplete="off" placeholder="Repita a nova senha"><button class="btn" onclick="rstSave()">Salvar nova senha</button><button class="lnk" style="justify-self:center" onclick="resend()">Reenviar código</button>`:r.step=='err'?`<button class="btn" onclick="forgot()">Tentar de novo</button>`:''}
 <button class="btn alt" onclick="lk.rst=null;lk.msg='';render()">Voltar</button>`}
async function rstSave(){const c=$('#rc').value.trim(),p1=$('#r1').value,p2=$('#r2').value,R=S.rst;
    if(!R||Date.now()>R.exp){S.rst=null;save();lk.rst={step:'err',msg:'O código expirou. Peça um novo.'};return render()}
    if(R.tries>=5){S.rst=null;save();lk.rst={step:'err',msg:'Muitas tentativas erradas. Peça um novo código.'};return render()}
    if(p1.length<4)return toast('A nova senha precisa ter pelo menos 4 caracteres.');if(p1!==p2)return toast('As senhas não conferem.');
    if((await hashPw(c,'rst'))!==R.h){R.tries++;save();return toast('Código incorreto.')}
    await setPw(p1);S.rst=null;log('Senha redefinida pelo código do e-mail');save();toast('Senha alterada!');unlock('nova senha')}
function resend(){if(S.rst&&Date.now()-S.rst.at<60000)return toast('Aguarde 1 minuto para pedir outro código.');forgot()}
// configurações de segurança
function secCard(){return `<div class="card" style="margin-top:12px"><h2>Segurança</h2>${S.sec.hash?`<p class="sub" style="margin-top:4px">E-mail de recuperação: ${esc(S.sec.email||'não informado')}</p>
 ${bioOK||S.sec.bio?`<div class="row sp" style="margin-top:14px"><span style="font-weight:600">Entrar com ${bioName}</span><button class="sw ${S.sec.bio?'on':''}" id="bioSw" role="switch" aria-checked="${!!S.sec.bio}" aria-label="Entrar com ${bioName}" onclick="bioToggle()"></button></div>`:`<p class="sub" style="margin-top:10px">${cap(bioName)} indisponível aqui. Abra o app pelo endereço https (ou pelo ícone na tela inicial) num aparelho com ${bioName}.</p>`}
 <div class="row" style="margin-top:14px"><button class="btn sm alt" onclick="sheetSec()">Alterar senha / e-mail</button><button class="btn sm alt" onclick="lockNow()">Bloquear agora</button></div>`
    :`<p class="sub" style="margin-top:4px">Crie uma senha para proteger o app e entrar com ${bioName}.</p><button class="btn sm" style="margin-top:10px" onclick="sheetSec()">Criar senha</button>`}</div>`}
async function bioToggle(){if(S.sec.bio){S.sec.bio=false;S.sec.cred='';log(cap(bioName)+' desativado');save();return render()}if(await bioEnroll())render()}
function sheetSec(){const has=!!S.sec.hash;openSheet(`<h2>${has?'Alterar senha / e-mail':'Criar senha'}</h2>
 <label>E-mail (para recuperar a senha)</label><input id="se" type="email" inputmode="email" autocapitalize="off" autocomplete="off" value="${esc(S.sec.email)}" placeholder="voce@email.com">
 ${has?'<label>Senha atual</label><input id="s0" type="password" autocomplete="off">':''}
 <label>${has?'Nova senha (deixe vazio para manter)':'Senha'}</label><input id="s1" type="password" autocomplete="off" placeholder="Mínimo 4 caracteres"><label>Repita a senha</label><input id="s2" type="password" autocomplete="off">
 <div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="secSave()">Salvar</button></div>`)}
async function secSave(){const has=!!S.sec.hash,em=$('#se').value.trim().toLowerCase(),p0=has?$('#s0').value:'',p1=$('#s1').value,p2=$('#s2').value;
    if(!mailOK(em))return toast('Informe um e-mail válido.');
    if(has&&!(await checkPw(p0)))return toast('Senha atual incorreta.');
    if(!has||p1){if(p1.length<4)return toast('A senha precisa ter pelo menos 4 caracteres.');if(p1!==p2)return toast('As senhas não conferem.');await setPw(p1)}
    S.sec.email=em;log(has?'Senha/e-mail de recuperação atualizados':'Senha criada');save();closeSheet();toast('Salvo!');if(!has)bioOffer()}
function bioOffer(next){if(!bioOK||S.sec.bio){next&&next();return}cb=next;
    openSheet(`<div style="text-align:center"><div class="fid" style="margin:4px auto 10px">${IC.face}</div><h2>Entrar com ${bioName}?</h2><p class="sub" style="margin-top:6px">Ao abrir o app, o ${bioName} é ativado automaticamente. Se não reconhecer, você pode tentar de novo ou digitar a senha.</p></div><div class="row" style="margin-top:18px"><button class="btn alt" onclick="const g=cb;closeSheet();g&&g()">Agora não</button><button class="btn" id="bioYes" onclick="const g=cb;bioEnroll().then(()=>{closeSheet();g&&g()})">Ativar</button></div>`)}

// ================= v6: assistente com IA (OpenAI / ChatGPT) =================
let aiHist=[],aiWarned={};
const AI_P={openai:{name:'ChatGPT',url:'https://platform.openai.com/api-keys',bill:'platform.openai.com → Billing',models:[['gpt-4o-mini','GPT-4o mini (rápido e barato)'],['gpt-4.1-mini','GPT-4.1 mini'],['gpt-4o','GPT-4o (mais caro)']]},
    claude:{name:'Claude',url:'https://console.anthropic.com/settings/keys',bill:'console.anthropic.com → Plans & Billing',models:[['claude-haiku-5-5','Claude Haiku 5.5 (rápido e barato)'],['claude-sonnet-5-5','Claude Sonnet 5.5 (mais inteligente)']]}};
const TOOL_LBL={criar_disciplina:'criando a matéria',excluir_disciplina:'excluindo a matéria',lancar_nota:'lançando a nota',remover_ultima_nota:'removendo a nota',agendar_tarefa:'agendando no calendário',excluir_tarefa:'removendo a tarefa',alterar_media_aprovacao:'ajustando a média',mudar_tema:'trocando o tema',abrir_tela:'abrindo a tela',simular_nota:'calculando o cenário'};
const SCOPE=()=>P(`Opa, ${fn1()}, nesse assunto eu não entro! Tô aqui só pra te ajudar a organizar suas notas e atividades. Quer lançar uma nota ou ver o que tem pra essa semana?`,'Estou aqui apenas para ajudar a organizar suas notas e atividades. Posso registrar uma nota ou consultar suas pendências?');
const DIAS=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const r2=v=>v===null?null:Math.round(v*100)/100;
function aiSys(){const data={hoje:today(),dia_da_semana:DIAS[new Date().getDay()],media_para_aprovacao:S.target,
    disciplinas:S.discs.map(d=>({nome:d.name,media_final:r2(discAvg(d.id)),medias_por_unidade:[1,2,3].map(u=>r2(unitAvg(d.id,u))),situacao:need(d.id)})),
    notas:S.grades.slice(-40).map(g=>({disciplina:dn(g.d),unidade:g.u,tipo:g.type,descricao:g.name,nota:g.s,valia:g.max,data:g.date})),
    tarefas:S.tasks.map(t=>({id:t.id,disciplina:dn(t.d),tipo:t.type,descricao:t.title,entrega:t.date,dias_ate_entrega:daysTo(t.date),pontos:t.pts,nota_lancada:!!t.graded}))};
    return `Você é ${S.user.nick}, o assistente do app NotaUp de ${S.user.name}. Responda sempre em português do Brasil.
ESCOPO: você é uma IA completa e proativa para a vida acadêmica do usuário. Opere o app (disciplinas, notas, unidades, médias, tarefas, calendário, lembretes) e também analise o desempenho, explique as contas, simule cenários (use a ferramenta simular_nota), sugira prioridades e um plano de estudo curto com base nas notas e nos prazos, e motive com honestidade. Não resolva exercícios nem escreva trabalhos. Se o assunto fugir do universo escolar (receitas, política, notícias, programação etc.), recuse em uma frase e ofereça uma ação do app. Cumprimentos e agradecimentos: uma frase.
AÇÕES: para alterar dados use SEMPRE as ferramentas; nunca diga que fez algo sem chamar a ferramenta. Se faltar algo essencial (disciplina, nota obtida, data), pergunte. Antes de excluir uma disciplina, peça confirmação. Unidade padrão: 1. Valor padrão: 10 (ou os pontos da tarefa correspondente). Datas no formato AAAA-MM-DD, calculadas a partir de hoje.
ESTILO: ${S.tone=='formal'?'formal, educado e objetivo':'descontraído, como um amigo, chamando o usuário de '+fn1()}. Respostas naturais e curtas (1 a 3 frases), sem markdown, sem listas e sem emojis, porque o texto é lido em voz alta. Use vírgula decimal (ex.: 7,5). Seja proativo: depois de executar uma ação, diga o efeito na média e sugira o próximo passo. Calcule sempre com os dados do app, nunca invente números.
REGRAS DE NOTA: média da unidade = soma das notas ÷ soma dos valores × 10; média final = média das unidades lançadas; aprovado com média final ≥ ${S.target}.
DADOS ATUAIS DO APP (JSON): ${JSON.stringify(data)}`}
const TT=(name,description,props,req)=>({type:'function',function:{name,description,parameters:{type:'object',properties:props,required:req||[]}}});
const TYPE_E={type:'string',enum:TYPES};
const TOOLS=[
    TT('criar_disciplina','Cadastra uma nova disciplina (matéria).',{nome:{type:'string'}},['nome']),
    TT('excluir_disciplina','Exclui uma disciplina com todas as notas e tarefas dela. Só use depois que o usuário confirmar.',{disciplina:{type:'string'}},['disciplina']),
    TT('lancar_nota','Registra uma nota obtida pelo usuário.',{disciplina:{type:'string'},nota:{type:'number',description:'nota obtida'},valor:{type:'number',description:'quanto a avaliação valia (padrão 10)'},unidade:{type:'integer',enum:[1,2,3]},tipo:TYPE_E,descricao:{type:'string'}},['disciplina','nota']),
    TT('remover_ultima_nota','Remove a última nota lançada.',{}),
    TT('simular_nota','Simula uma nota hipotética SEM salvar e devolve como ficariam as médias.',{disciplina:{type:'string'},nota:{type:'number'},valor:{type:'number',description:'quanto valeria (padrão 10)'},unidade:{type:'integer',enum:[1,2,3]}},['disciplina','nota']),
    TT('agendar_tarefa','Agenda prova, trabalho, atividade, teste ou projeto no calendário.',{disciplina:{type:'string',description:'nome da disciplina, ou "todas" para projeto válido para todas as matérias'},tipo:TYPE_E,data:{type:'string',description:'AAAA-MM-DD'},pontos:{type:'number',description:'quanto vale (padrão 10)'},descricao:{type:'string'}},['disciplina','tipo','data']),
    TT('excluir_tarefa','Exclui uma tarefa do calendário pelo id.',{id:{type:'string'}},['id']),
    TT('alterar_media_aprovacao','Muda a média necessária para aprovação.',{media:{type:'number'}},['media']),
    TT('mudar_tema','Muda o tema do app.',{tema:{type:'string',enum:['claro','escuro']}},['tema']),
    TT('abrir_tela','Abre uma tela do app.',{tela:{type:'string',enum:['inicio','historico','calendario','configuracoes']}},['tela'])];
function discBy(n){if(!n)return null;const k=norm(String(n));return S.discs.find(d=>norm(d.name)==k)||findDisc(k)||null}
function aiTool(name,a){a=a||{};const nf=()=>({erro:'disciplina não encontrada',disciplinas_existentes:S.discs.map(x=>x.name)});
    switch(name){
        case 'criar_disciplina':{const n=cap(String(a.nome||'').trim());if(!n)return {erro:'nome vazio'};if(S.discs.some(x=>norm(x.name)==norm(n)))return {erro:'essa disciplina já existe'};addDisc(n);return {ok:true,disciplina:n}}
        case 'excluir_disciplina':{const d=discBy(a.disciplina);if(!d)return nf();delDisc(d.id);return {ok:true,excluida:d.name}}
        case 'lancar_nota':{const d=discBy(a.disciplina);if(!d)return nf();const T=TYPES.includes(a.tipo)?a.tipo:'Atividade',s=+a.nota,u=[1,2,3].includes(+a.unidade)?+a.unidade:1,
            tk=S.tasks.find(x=>x.d==d.id&&!x.graded&&norm(x.type)==norm(T)),max=+a.valor>0?+a.valor:tk?tk.pts:10;
            if(!(s>=0))return {erro:'nota inválida'};if(s>max)return {erro:`a nota ${s} é maior que o valor ${max}`};if(tk)tk.graded=true;
            S.grades.push({id:uid(),d:d.id,u,type:T,name:a.descricao?cap(String(a.descricao)):tk?tk.title:T+' de '+d.name,max,s,date:today()});
            log(`Nota lançada pelo assistente: ${T} de ${d.name} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();
            return {ok:true,media_unidade:r2(unitAvg(d.id,u)),media_disciplina:r2(discAvg(d.id)),situacao:need(d.id)}}
        case 'simular_nota':{const d=discBy(a.disciplina);if(!d)return nf();const u=[1,2,3].includes(+a.unidade)?+a.unidade:1,mx=+a.valor>0?+a.valor:10,v=+a.nota;if(!(v>=0&&v<=mx))return {erro:'nota inválida'};
            S.grades.push({id:'sim',d:d.id,u,type:'x',name:'x',max:mx,s:v,date:today()});const r={simulacao:true,nao_salvo:true,media_unidade:r2(unitAvg(d.id,u)),media_disciplina:r2(discAvg(d.id)),situacao:need(d.id)};S.grades.pop();return r}
        case 'remover_ultima_nota':{const g=S.grades.pop();if(!g)return {erro:'não há notas'};log('Nota removida pelo assistente: '+g.name);save();render();return {ok:true,removida:g.name}}
        case 'agendar_tarefa':{const all=/^tod/.test(norm(String(a.disciplina||''))),d=all?null:discBy(a.disciplina);if(!all&&!d)return nf();
            if(!/^\d{4}-\d{2}-\d{2}$/.test(a.data||'')||isNaN(new Date(a.data+'T12:00')))return {erro:'data inválida, use AAAA-MM-DD'};
            const T=TYPES.includes(a.tipo)?a.tipo:'Atividade',pts=+a.pontos>0?+a.pontos:10,did=all?'all':d.id;
            S.tasks.push({id:uid(),d:did,type:T,title:a.descricao?cap(String(a.descricao)):T+' de '+dn(did),date:a.data,pts,graded:false});
            log(`Tarefa criada pelo assistente: ${T} de ${dn(did)} para ${dfmt(a.data)} (${f(pts)} pts)`);save();render();remind();return {ok:true,entrega:dfmt(a.data)}}
        case 'excluir_tarefa':{const t=S.tasks.find(x=>x.id==a.id);if(!t)return {erro:'tarefa não encontrada'};S.tasks=S.tasks.filter(x=>x.id!=a.id);log('Tarefa excluída pelo assistente: '+t.title);save();render();return {ok:true}}
        case 'alterar_media_aprovacao':{const v=+a.media;if(!(v>0&&v<=10))return {erro:'use um valor entre 0 e 10'};S.target=v;log('Média de aprovação alterada para '+v+' (assistente)');save();render();return {ok:true}}
        case 'mudar_tema':setTheme(a.tema=='escuro'?'dark':'light');return {ok:true};
        case 'abrir_tela':{const k={inicio:'home',historico:'hist',calendario:'cal',configuracoes:'cfg'}[a.tela];if(!k)return {erro:'tela inválida'};go(k);return {ok:true}}}
    return {erro:'ferramenta desconhecida'}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function aiErr(kind,msg){const e=new Error(msg);e.kind=kind;e.msg=msg;return e}
const aiP=()=>AI_P[S.ai.prov]||AI_P.openai;
function aiToClaude(ms){const out=[];for(const m of ms.slice(1)){
    if(m.role=='tool'){const b={type:'tool_result',tool_use_id:m.tool_call_id,content:m.content},l=out[out.length-1];if(l&&l.role=='user'&&Array.isArray(l.content)&&l.content[0].type=='tool_result')l.content.push(b);else out.push({role:'user',content:[b]})}
    else if(m.role=='assistant'&&m.tool_calls){const c=[];if(m.content)c.push({type:'text',text:m.content});m.tool_calls.forEach(t=>{let i={};try{i=JSON.parse(t.function.arguments||'{}')}catch(e){}c.push({type:'tool_use',id:t.id,name:t.function.name,input:i})});out.push({role:'assistant',content:c})}
    else out.push({role:m.role,content:m.content})}return out}
async function aiCall(messages,opt){opt=opt||{};const cl=S.ai.prov=='claude',P0=aiP(),key=S.ai.key.trim();
    for(let a=0;a<3;a++){let r;
        try{const url=cl?'https://api.anthropic.com/v1/messages':'https://api.openai.com/v1/chat/completions',
            hd=cl?{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}:{'Content-Type':'application/json',Authorization:'Bearer '+key},
            tools=opt.noTools?{}:{tools:cl?TOOLS.map(t=>({name:t.function.name,description:t.function.description,input_schema:t.function.parameters})):TOOLS},
            body=cl?Object.assign({model:S.ai.model,max_tokens:opt.max||600,system:messages[0].content,messages:aiToClaude(messages)},tools):Object.assign({model:S.ai.model||'gpt-4o-mini',messages,max_completion_tokens:opt.max||600},tools);
            r=await fetch(url,{method:'POST',headers:hd,body:JSON.stringify(body)})}
        catch(e){throw aiErr('net','Sem conexão com o '+P0.name+'. Verifique a internet.')}
        if(r.ok){const j=await r.json();if(!cl)return j.choices[0].message;const tx=j.content.filter(b=>b.type=='text').map(b=>b.text).join(' '),tc=j.content.filter(b=>b.type=='tool_use').map(b=>({id:b.id,type:'function',function:{name:b.name,arguments:JSON.stringify(b.input||{})}}));return {content:tx,tool_calls:tc}}
        let j={};try{j=await r.json()}catch(e){}const er=j.error||{},msg=String(er.message||''),code=String(er.code||er.type||''),quota=/insufficient_quota|billing/.test(code)||/quota|billing|credit balance/i.test(msg);
        if((r.status==429||r.status==503||r.status==529)&&!quota&&a<2){await sleep((+r.headers.get('retry-after')||2*(a+1))*1000);continue}
        if(r.status==401)throw aiErr('auth','Chave inválida ou revogada. Gere uma nova em '+P0.url.replace('https://','')+' e conecte de novo em Configurações.');
        if(quota)throw aiErr('quota','Sua conta da API do '+P0.name+' está sem créditos. A assinatura (Plus/Pro/Max) é separada da API: adicione créditos em '+P0.bill+'.');
        if(r.status==429)throw aiErr('rate','Muitas mensagens seguidas. Tente de novo em alguns segundos.');
        if(r.status==404||/model_not_found|not_found/.test(code))throw aiErr('model','O modelo '+S.ai.model+' não está liberado para sua chave. Escolha outro em Configurações.');
        if(r.status==403)throw aiErr('perm','Sua chave não tem permissão para este modelo ou projeto.');
        throw aiErr('other','O '+P0.name+' respondeu com erro '+r.status+(msg?': '+msg.slice(0,120):'')+'.')}}
async function aiReply(tx){aiHist.push({role:'user',content:tx});aiHist=aiHist.slice(-20);while(aiHist.length&&aiHist[0].role!='user')aiHist.shift();const msgs=[{role:'system',content:aiSys()},...aiHist];
    try{for(let i=0;i<6;i++){const m=await aiCall(msgs),calls=m.tool_calls||[];
        if(!calls.length){const t=(m.content||'').trim()||P('Feito!','Concluído.');aiHist.push({role:'assistant',content:t});return t}
        msgs.push({role:'assistant',content:m.content||null,tool_calls:calls});
        for(const c of calls){if(vp){vp.act=(TOOL_LBL[c.function.name]||'executando')+'…';vpaint()}let r;try{r=aiTool(c.function.name,JSON.parse(c.function.arguments||'{}'))}catch(e){r={erro:String(e.message||e)}}msgs.push({role:'tool',tool_call_id:c.id,content:JSON.stringify(r)})}
        if(vp){vp.act='Pensando…';vpaint()}msgs[0]={role:'system',content:aiSys()}}
        return P('Pronto!','Concluído.')}
    catch(e){aiHist.pop();throw e}}
function aiCard(){const k=S.ai.key,p=aiP(),cl=S.ai.prov=='claude';return `<div class="card" style="margin-top:12px"><h2>Assistente com IA</h2>
 <div class="seg" style="margin-top:10px;width:fit-content"><button class="${cl?'':'on'}" onclick="aiProv('openai')">ChatGPT</button><button class="${cl?'on':''}" onclick="aiProv('claude')">Claude</button></div>
 ${k?`<p class="sub" style="margin-top:10px">Conectado ao ${p.name} · chave ${esc(k.slice(0,6)+'…'+k.slice(-4))}</p>`:`<p class="sub" style="margin-top:10px">Sem chave, o assistente usa o modo local (comandos prontos).</p>
 <button class="btn" style="margin-top:10px" onclick="aiGetKey()">Abrir a página da chave do ${p.name}</button><p class="sub" style="margin-top:6px">Crie e copie a chave lá. Ao voltar para o app, ele cola e conecta sozinho.</p>
 <label>Ou cole a chave aqui</label><div class="row"><input id="aik" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${cl?'sk-ant-...':'sk-...'}" style="margin-top:0"><button class="btn sm alt" onclick="aiPaste()">Colar</button></div>`}
 <label>Modelo</label><select onchange="S.ai.model=this.value;S.ai.ms[S.ai.prov]=this.value;save()">${p.models.map(([v,l])=>`<option value="${v}" ${S.ai.model==v?'selected':''}>${l}</option>`).join('')}</select>
 <div class="row" style="margin-top:12px">${k?`<button class="btn sm alt" onclick="aiTest()">Testar conexão</button><button class="btn sm alt" onclick="aiGetKey()">Ver chaves</button><button class="btn sm alt" onclick="aiOff()">Desconectar</button>`:`<button class="btn sm" onclick="aiOn()">Conectar</button>`}</div>
 <p class="sub" id="ais" style="margin-top:8px"></p>
 <p class="sub" style="margin-top:4px">A assinatura (ChatGPT Plus/Pro ou Claude Pro/Max) é separada da API. Créditos: ${p.bill}. A chave fica salva só neste aparelho.</p>
 <label>Estilo de conversa</label><div class="seg" style="margin-top:6px;width:fit-content"><button class="${S.tone!='formal'?'on':''}" onclick="S.tone='amigo';save();render()">Amigo</button><button class="${S.tone=='formal'?'on':''}" onclick="S.tone='formal';save();render()">Formal</button></div></div>`}
function aiProv(v){if(S.ai.prov==v)return;S.ai.ks[S.ai.prov]=S.ai.key;S.ai.ms[S.ai.prov]=S.ai.model;S.ai.prov=v;S.ai.key=S.ai.ks[v]||'';S.ai.model=S.ai.ms[v]||AI_P[v].models[0][0];aiHist=[];aiWarned={};log('Assistente: '+AI_P[v].name);save();render()}
function aiGetKey(){aiWait=1;const u=aiP().url,w=window.open(u,'_blank');if(w){try{w.opener=null}catch(e){}}else location.href=u;toast('Abri o site do '+aiP().name+'. Crie e copie a chave: ao voltar eu conecto sozinho.')}
async function aiPaste(q){let t='';try{t=((await navigator.clipboard.readText())||'').trim()}catch(e){if(!q)toast('Não consegui ler a área de transferência. Cole a chave no campo.');return}
    if(/^sk-[\w-]{20,}$/.test(t)){toast('Chave encontrada! Conectando…');return aiOn(t)}if(!q)toast('Copie a chave primeiro e toque em Colar.')}
async function aiTest(){const st=t=>{const e=$('#ais');if(e)e.textContent=t};st('Testando…');
    try{await aiCall([{role:'system',content:'Seja breve.'},{role:'user',content:'Responda apenas: ok'}],{noTools:1,max:16});st('✓ Conexão funcionando.');aiWarned={};return true}catch(e){st('✗ '+e.msg);return false}}
async function aiOn(v){v=String(v||(($('#aik')||{}).value)||'').trim();const pv=/^sk-ant-/.test(v)?'claude':/^sk-/.test(v)?'openai':'';if(!pv)return toast('Cole a chave da API (começa com sk-).');if(pv!=S.ai.prov)aiProv(pv);S.ai.key=v;S.ai.ks[pv]=v;aiHist=[];aiWarned={};save();render();const ok=await aiTest();log('Assistente IA ('+aiP().name+') conectado'+(ok?'':' (o teste falhou)'))}
function aiOff(){S.ai.ks[S.ai.prov]='';S.ai.key='';aiHist=[];log('Assistente IA desconectado');save();render()}

// ================= v6: voz do assistente (fala as respostas) =================
let speaking=false,ttsOK=false,spkT=null,spkGen=0;
const TTS=()=>window.speechSynthesis||null;
function voices(){const s=TTS();if(!s)return [];const all=s.getVoices()||[],pt=all.filter(v=>/^pt/i.test(v.lang));return pt.length?pt:all}
function pickVoice(){const L=voices();return L.find(v=>v.voiceURI==S.voice.uri)||L.find(v=>/pt[-_]BR/i.test(v.lang))||L[0]||null}
// iPhone/Safari só deixa falar depois de um toque do usuário: este "desbloqueio" é feito no toque do microfone/enviar
function ttsUnlock(){const s=TTS();if(!s||ttsOK)return;try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;s.speak(u);ttsOK=true}catch(e){}}
const ttsClean=t=>String(t).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,'').replace(/[“”"]/g,'').replace(/\s+/g,' ').trim();
function ttsChunks(t){const out=[];let cur='';for(const p of t.split(/(?<=[.!?;:])\s+/)){if(cur&&(cur+' '+p).length>180){out.push(cur);cur=p}else cur=cur?cur+' '+p:p}if(cur)out.push(cur);return out}
function speak(t,force){const s=TTS();if(!s||(!S.voice.on&&!force))return;const txt=ttsClean(t),parts=ttsChunks(txt);if(!parts.length)return;
    const gen=++spkGen;try{s.cancel()}catch(e){}speaking=true;vpaint();if(rec&&running){try{rec.abort()}catch(e){}}
    const v=pickVoice(),rate=S.voice.rate||1,done=()=>{if(gen!==spkGen||!speaking)return;clearTimeout(spkT);speaking=false;vpaint();if(keep&&vp)recLater(300)};
    parts.forEach((p,i)=>{const u=new SpeechSynthesisUtterance(p);u.lang=v?v.lang:'pt-BR';if(v)u.voice=v;u.rate=rate;if(i==parts.length-1){u.onend=done;u.onerror=done}s.speak(u)});
    clearTimeout(spkT);spkT=setTimeout(done,txt.length*110/rate+4000);try{if(s.paused)s.resume()}catch(e){}}
function ttsStop(){spkGen++;clearTimeout(spkT);speaking=false;try{const s=TTS();s&&s.cancel()}catch(e){}}
function voiceOpts(){const L=voices(),cur=pickVoice();return L.length?L.map(v=>`<option value="${esc(v.voiceURI)}" ${cur&&cur.voiceURI==v.voiceURI?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join(''):'<option value="">Voz padrão do aparelho</option>'}
function voiceCard(){return `<div class="card" style="margin-top:12px"><h2>Voz do assistente</h2>${TTS()?`
 <div class="row sp" style="margin-top:12px"><span style="font-weight:600">Falar as respostas</span><button class="sw ${S.voice.on?'on':''}" id="ttsSw" role="switch" aria-checked="${!!S.voice.on}" aria-label="Falar as respostas" onclick="S.voice.on=!S.voice.on;log('Voz do assistente '+(S.voice.on?'ligada':'desligada'));save();if(!S.voice.on)ttsStop();render()"></button></div>
 <label>Voz</label><select id="vsel" onchange="S.voice.uri=this.value;save();voiceTest()">${voiceOpts()}</select>
 <label>Velocidade</label><input type="range" min="0.7" max="1.5" step="0.1" value="${S.voice.rate}" onchange="S.voice.rate=+this.value;save();voiceTest()">
 <button class="btn sm alt" style="margin-top:10px" onclick="voiceTest()">▶ Testar voz</button>`:'<p class="sub" style="margin-top:4px">Este navegador não tem síntese de voz.</p>'}</div>`}
function voiceTest(){ttsUnlock();speak(P(`Oi, ${fn1()}! Eu sou o ${S.user.nick}, e é assim que eu vou falar com você.`,`Olá, ${fn1()}. Sou ${S.user.nick}, seu assistente.`),1)}
(()=>{const s=TTS();if(!s)return;const up=()=>{const e=$('#vsel');if(e)e.innerHTML=voiceOpts()};try{s.addEventListener('voiceschanged',up)}catch(e){s.onvoiceschanged=up}try{s.getVoices()}catch(e){}})();
// ao abrir o app bloqueado, o Face ID/biometria é chamado automaticamente
if(locked&&hasBio())setTimeout(bioUnlock,300);

// ================= v7: animações fluidas e orbe do assistente =================
const sheetH=()=>{if(!sheet)return '';const a=sheetAnim;sheetAnim=0;return a?sheet.replace('class="sheet"','class="sheet up"'):sheet};
function vpScroll(){const m=$('#vpm');if(m)m.scrollTop=m.scrollHeight}
function countUp(){document.querySelectorAll('[data-n]').forEach(el=>{const to=+el.dataset.n,dec=+(el.dataset.d||0),pad=+(el.dataset.p||0),t0=performance.now(),step=t=>{const k=Math.min(1,(t-t0)/850),v=to*(1-Math.pow(1-k,3));el.textContent=dec?v.toFixed(1).replace('.',','):String(Math.round(v)).padStart(pad,'0');if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})}
const orbSt=()=>!vp?'':vp.think?'think':speaking?'talk':(keep&&running)?'listen':'';
const stHtml=()=>vp?`<span class="wave"><i></i><i></i><i></i><i></i></span>${esc(vp.think?(vp.act||'Pensando…'):vp.st)}`:'';
function sugg(tx){const L=[],late=S.tasks.some(t=>!t.graded&&daysTo(t.date)<0);if(late)L.push('Lançar nota pendente');if(overall()!==null){L.push('Quanto falta para passar?');L.push('Como estou indo?')}else L.push(S.discs.length?'Adicionar uma nota':'Criar uma matéria');L.push('O que temos para hoje?');return L.filter(x=>norm(x)!=norm(tx||'')).slice(0,3)}
// ao voltar do site da chave, cola e conecta sozinho
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&aiWait&&!S.ai.key){aiWait=0;setTimeout(()=>aiPaste(1),250)}});
render();remind();setInterval(remind,60000);