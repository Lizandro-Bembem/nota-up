const $=s=>document.querySelector(s),app=$('#app');
const IC={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10H3z"/></svg>',hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'};
let S={user:null,discs:[],grades:[],tasks:[],log:[],target:7,notified:{},notif:false,asked:0,theme:'light',tone:'amigo'},view='home',tab=1,sheet=null,vp=null,rec=null,keep=false,cb=null,cp={y:0,m:0,sel:''},ph={};
try{S=Object.assign(S,JSON.parse(localStorage.getItem('notaup')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('notaup',JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=n=>(Math.round(n*10)/10).toFixed(1).replace('.',','),ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),today=()=>ymd(new Date());
const dfmt=d=>d.split('-').reverse().join('/');
const log=m=>{S.log.unshift({t:Date.now(),m});S.log=S.log.slice(0,300);save()};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;app.appendChild(t);setTimeout(()=>t.remove(),3800)}
// cálculo
function unitAvg(d,u){const g=S.grades.filter(x=>x.d===d&&x.u===u);if(!g.length)return null;const m=g.reduce((a,x)=>a+x.max,0);return m?g.reduce((a,x)=>a+x.s,0)/m*10:null}
function discAvg(d){const a=[1,2,3].map(u=>unitAvg(d,u)).filter(x=>x!==null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function overall(){const a=S.discs.map(d=>discAvg(d.id)).filter(x=>x!==null);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null}
function need(d){const u=[1,2,3].map(i=>unitAvg(d,i)),got=u.filter(x=>x!==null),left=3-got.length,sum=got.reduce((a,b)=>a+b,0);
    if(!got.length)return 'Sem notas ainda';const req=S.target*3-sum;if(!left)return req<=0?'Média atingida ✓':'Faltaram '+f(req/3)+' pts na média';
    return req<=0?'Média já garantida ✓':'Precisa de '+f(req/left)+' em cada unidade restante'}
const col=v=>v===null?'':v>=S.target?'ok':'warn';
// views
const go=v=>{view=v;sheet=null;render()};
function avatar(){return `<div class="av">${S.user.photo?`<img src="${S.user.photo}" alt="">`:esc(S.user.name[0]||'?').toUpperCase()}</div>`}
function ob(){app.innerHTML=`<main><div class="ob"><div class="logo">${LG()}NotaUp</div><h1 style="margin-top:18px">Suas Notas, Sua Evolução</h1><p class="sub">Crie seu perfil para começar.</p>
<label>Seu nome</label><input class="ac" autocapitalize="sentences" id="n" placeholder="Ex.: Lizandro">
<label>Defina o apelido do app</label><input class="ac" autocapitalize="sentences" id="k" placeholder="Ex.: Jarvis"><p class="sub" style="margin-top:6px">É assim que você chama o assistente por voz: “Oi, Jarvis, adiciona a nota…”</p>
<label>Foto (opcional)</label><input id="p" type="file" accept="image/*">
<button class="btn" style="margin-top:18px" onclick="reg()">Começar</button></div></main>`}
function reg(){const name=cap($('#n').value.trim()),nick=cap($('#k').value.trim());if(!name||!nick)return toast('Preencha seu nome e o apelido do app.');
    const fin=photo=>{S.user={name,nick,photo};log('Perfil criado: '+name+' (apelido do app: '+nick+')');save();render();notifPrompt()};
    const fl=$('#p').files[0];if(!fl)return fin('');const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),s=Math.min(im.width,im.height);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,160,160);fin(c.toDataURL('image/jpeg',.8))};im.src=r.result};r.readAsDataURL(fl)}
function home(){const o=overall(),due=S.tasks.filter(t=>!t.graded&&daysTo(t.date)<=3);
    return `<div class="row sp"><div class="logo">${LG()}NotaUp</div><button class="avb" onclick="sheetPhoto()" aria-label="Ajustar foto">${avatar()}</button></div>
 <h1 style="margin-top:18px">Olá, ${esc(S.user.name)}! 👋</h1><p class="sub" style="margin-top:4px">Meu apelido: <b>${esc(S.user.nick)}</b></p><p class="sub">Acompanhe sua evolução acadêmica.</p>
 <div class="g g2" style="margin-top:16px"><div class="card"><div class="sub">Média Geral</div><div class="big">${o===null?'–':f(o)}</div><div class="sub ${col(o)}">${o===null?'Sem notas':o>=S.target?'↑ Bom desempenho':'Atenção à média'}</div></div>
 <div class="card"><div class="sub">Disciplinas</div><div class="big">${String(S.discs.length).padStart(2,'0')}</div><div class="sub">Em acompanhamento</div></div></div>
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
 <div class="card" style="margin-top:12px"><label style="margin:0">Média para aprovação</label><input type="number" step="0.5" value="${S.target}" onchange="S.target=+this.value||7;log('Média de aprovação alterada para '+S.target);save();render()">
 <label>Apelido do app</label><input class="ac" autocapitalize="sentences" value="${esc(S.user.nick)}" onchange="S.user.nick=cap(this.value.trim())||S.user.nick;log('Apelido alterado para '+S.user.nick);save();render()">
 <div class="row sp" style="margin-top:16px"><span style="font-weight:600">Tema</span><div class="seg"><button class="${S.theme!='dark'?'on':''}" onclick="setTheme('light')">Claro</button><button class="${S.theme=='dark'?'on':''}" onclick="setTheme('dark')">Escuro</button></div></div><div class="row sp" style="margin-top:16px"><span style="font-weight:600">Notificações</span><button class="sw ${S.notif?'on':''}" role="switch" aria-checked="${!!S.notif}" aria-label="Notificações" onclick="setNotif(!S.notif)"></button></div></div>
 <div class="card" style="margin-top:12px"><div class="row sp"><h2>Auditoria</h2><button class="lnk" onclick="ask('Apagar todos os seus dados?',()=>{localStorage.removeItem('notaup');location.reload()},'Apagar')">Apagar meus dados</button></div><p class="sub">Tudo o que foi feito no app.</p>${S.log.map(l=>`<div class="it"><div style="font-size:14px">${esc(l.m)}</div><div class="sub">${new Date(l.t).toLocaleString('pt-BR')}</div></div>`).join('')||'<p class="sub">Sem registros.</p>'}</div>`}
// sheets
const dopts=sel=>S.discs.map(d=>`<option value="${d.id}" ${d.id==sel?'selected':''}>${esc(d.name)}</option>`).join('');
const closeSheet=()=>{sheet=null;render()};
function open(h){sheet=`<div class="sheet" onclick="if(event.target==this)closeSheet()"><div>${h}</div></div>`;render()}
function sheetDisc(){open(`<h2>Nova disciplina</h2><label>Nome</label><input class="ac" autocapitalize="sentences" id="dn" placeholder="Ex.: Matemática"><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addDisc($('#dn').value)">Salvar</button></div>`)}
function openDisc(id){const d=S.discs.find(x=>x.id==id);
    open(`<div class="row sp"><h2>${esc(d.name)}</h2><button class="btn sm alt" onclick="ask('Excluir esta disciplina e todas as notas?',()=>delDisc('${id}'),'Excluir')">Excluir</button></div><div class="tab">${[1,2,3].map(u=>`<button class="${tab==u?'on':''}" onclick="tab=${u};openDisc('${id}')">${u}ª unidade</button>`).join('')}</div>
 <div class="card"><div class="sub">Média da unidade</div><div class="big ${col(unitAvg(id,tab))}">${unitAvg(id,tab)===null?'–':f(unitAvg(id,tab))}</div></div>
 <div class="card" style="margin-top:12px"><div class="sub">Média final</div><b style="font-size:22px">${discAvg(id)===null?'–':f(discAvg(id))}</b><div class="sub">${need(id)}</div></div>
 ${S.grades.filter(g=>g.d==id&&g.u==tab).map(g=>`<div class="it row sp"><div><b>${esc(g.name)}</b><div class="sub">${g.type} · ${dfmt(g.date)}</div></div><div class="row"><span class="pill">${f(g.s)}/${f(g.max)}</span><button class="btn sm alt" onclick="delGrade('${g.id}','${id}')">✕</button></div></div>`).join('')}
 <div class="row" style="margin-top:14px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="sheetGrade('${id}')">+ Adicionar Nota</button></div>`)}
// ações
function addDisc(n){n=cap((n||'').trim());if(!n)return toast('Informe o nome.');const ex=S.discs.find(d=>norm(d.name)==norm(n));if(ex)return ex;const d={id:uid(),name:n};S.discs.push(d);log('Disciplina criada: '+n);save();closeSheet();return d}
function delDisc(id){const n=dn(id);S.discs=S.discs.filter(d=>d.id!=id);S.grades=S.grades.filter(g=>g.d!=id);S.tasks=S.tasks.filter(t=>t.d!=id);log('Disciplina excluída: '+n);save();closeSheet()}
function delGrade(id,d){const g=S.grades.find(x=>x.id==id);S.grades=S.grades.filter(x=>x.id!=id);log('Nota removida: '+g.name);save();openDisc(d)}
function num(s){const m=s.match(/\d+(?:[.,]\d+)?/g);return m?m.map(x=>parseFloat(x.replace(',','.'))):[]}
// ---------- novas funções ----------
const TYPES=['Atividade','Projeto','Prova','Teste','Trabalho'],cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function render(){applyTheme();
    if(!S.user){return ob()}
    const v={home,hist,cal,cfg}[view]();
    app.innerHTML=`<main>${v}</main>${vp?vpBox():`<button class="fab" onclick="mic()" aria-label="Falar com ${esc(S.user.nick)}">${IC.mic}</button>`}<nav>${[['home','Início'],['hist','Histórico'],['cal','Calendário'],['cfg','Configurações']].map(([k,l])=>`<button class="${view==k?'on':''}" onclick="go('${k}')">${IC[k]}${l}</button>`).join('')}</nav>${sheet||''}`;
}
function ask(msg,fn,label){cb=fn;open(`<h2>${esc(msg)}</h2><div class="row" style="margin-top:18px"><button class="btn alt" onclick="closeSheet()">Cancelar</button><button class="btn" onclick="const g=cb;closeSheet();g&&g()">${label||'Confirmar'}</button></div>`)}
// calendário / tarefas
function cal(){const late=S.tasks.filter(t=>!t.graded&&daysTo(t.date)<0),up=S.tasks.filter(t=>daysTo(t.date)>=0&&!(t.graded&&0)).sort((a,b)=>a.date<b.date?-1:1),past=S.tasks.filter(t=>t.graded&&daysTo(t.date)<0).sort((a,b)=>a.date<b.date?1:-1);
    const row=t=>{const n=daysTo(t.date),lt=!t.graded&&n<0;return `<div class="it row sp ${lt?'late':''}"><div><b>${esc(t.type)}: ${esc(t.title)}</b><div class="sub">${dfmt(t.date)} · ${esc(dn(t.d))} · ${f(t.pts)} pts${t.graded?' · nota lançada':lt?' · lance a nota':''}</div></div><div class="row">${!t.graded&&n<=0?`<button class="btn sm" onclick="sheetGrade('${t.d}','${t.id}')">Lançar nota</button>`:''}<button class="btn sm alt" aria-label="Excluir" onclick="ask('Excluir esta tarefa?',()=>delTask('${t.id}'),'Excluir')">✕</button></div></div>`};
    return `<div class="row sp"><h1>Calendário</h1><button class="btn sm" onclick="sheetTask()">+ Tarefa</button></div><p class="sub">Trabalhos, provas e atividades.</p>
 ${late.length?`<div class="card" style="margin-top:14px"><h2>Aguardando nota</h2>${late.map(row).join('')}</div>`:''}
 <div class="card" style="margin-top:12px"><h2>Próximos</h2>${up.map(row).join('')||'<p class="sub">Nada agendado.</p>'}</div><div class="card" style="margin-top:12px"><h2>Anteriores</h2>${past.map(row).join('')||'<p class="sub">Vazio.</p>'}</div>`}
function sheetTask(){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    const n=new Date();cp={y:n.getFullYear(),m:n.getMonth(),sel:''};
    open(`<h2>Nova tarefa</h2><label>Data de entrega: <b id="dl">selecione no calendário</b></label><div id="cpw"></div><label>Tipo</label><select id="tp" onchange="tpChg()">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select><label>Descrição</label><input class="ac" autocapitalize="sentences" id="tt" placeholder="Digite aqui a descrição"><label>Matéria</label><select id="td">${dopts()}</select><label>Pontuação (quantos pontos vale)</label><input id="tpt" type="number" step="0.5" inputmode="decimal" placeholder="Ex.: 5"><p class="sub" style="margin-top:8px">Você recebe um aviso 3 dias antes e outro às 18h do dia, para lançar a nota.</p><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addTask({d:$('#td').value,type:$('#tp').value,title:$('#tt').value.trim(),date:cp.sel,pts:parseFloat($('#tpt').value)})">Salvar</button></div>`);drawCal()}
function drawCal(){const el=$('#cpw');if(!el)return;const y=cp.y,m=cp.m,first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),mn=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    let c='';for(let i=0;i<first;i++)c+='<i></i>';for(let d=1;d<=n;d++){const iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');c+=`<button class="${iso==cp.sel?'sel':''} ${iso==today()?'td':''}" onclick="pick('${iso}')">${d}</button>`}
    el.innerHTML=`<div class="row sp"><button class="btn sm alt" onclick="cm(-1)" aria-label="Mês anterior">‹</button><b style="text-transform:capitalize">${mn}</b><button class="btn sm alt" onclick="cm(1)" aria-label="Próximo mês">›</button></div><div class="cg">${'DSTQQSS'.split('').map(x=>`<span>${x}</span>`).join('')}${c}</div>`}
function pick(i){cp.sel=i;drawCal();$('#dl').textContent=dfmt(i)}
function cm(k){const d=new Date(cp.y,cp.m+k,1);cp.y=d.getFullYear();cp.m=d.getMonth();drawCal()}
function addTask(o){if(!o.date)return toast('Selecione a data de entrega.');if(!o.title)return toast('Digite a descrição.');if(isNaN(o.pts))return toast('Informe quantos pontos vale.');
    S.tasks.push({id:uid(),d:o.d,type:o.type,title:cap(o.title),date:o.date,pts:o.pts,graded:false});log(`Tarefa criada: ${o.type} – ${o.title} (${dn(o.d)}, ${f(o.pts)} pts) para ${dfmt(o.date)}`);save();closeSheet();toast('Tarefa salva!');remind()}
function delTask(id){const t=S.tasks.find(x=>x.id==id);S.tasks=S.tasks.filter(x=>x.id!=id);log('Tarefa excluída: '+t.title);save();render()}
// notas
function sheetGrade(d,tid){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    const k=S.tasks.find(x=>x.id==tid)||{};
    open(`<h2>Adicionar nota</h2><label>Disciplina</label><select id="gd">${dopts(d)}</select><label>Unidade</label><select id="gu"><option>1</option><option>2</option><option>3</option></select><label>Tipo</label><select id="gt">${TYPES.map(x=>`<option ${x==k.type?'selected':''}>${x}</option>`).join('')}</select><label>Descrição</label><input class="ac" autocapitalize="sentences" id="gn" value="${esc(k.title||'')}" placeholder="Ex.: Prova 1"><div class="row"><div><label>Valia</label><input id="gm" type="number" step="0.1" inputmode="decimal" value="${k.pts||10}"></div><div><label>Tirei</label><input id="gs" type="number" step="0.1" inputmode="decimal"></div></div><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addGrade($('#gd').value,+$('#gu').value,$('#gt').value,$('#gn').value,+$('#gm').value,parseFloat($('#gs').value),'${tid||''}')">Salvar nota</button></div>`)}
function addGrade(d,u,type,name,max,s,tid){if(!d||isNaN(s)||!max)return toast('Informe a nota e o valor.');if(s>max)return toast('A nota não pode passar do valor.');
    S.grades.push({id:uid(),d,u,type,name:name?cap(name):type+' de '+dn(d),max,s,date:today()});const t=S.tasks.find(x=>x.id==tid);if(t)t.graded=true;
    log(`Nota lançada: ${type} ${name||''} de ${dn(d)} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();closeSheet();toast('Nota salva!')}
// notificações
function ping(m){toast('⏰ '+m);try{if(S.notif&&Notification.permission=='granted')new Notification('NotaUp',{body:m})}catch(e){}}
function remind(){if(!S.user)return;const h=new Date().getHours();S.tasks.forEach(t=>{if(t.graded)return;const n=daysTo(t.date),a=t.id+'a',b=t.id+'b';
    if(n>=0&&n<=3&&!S.notified[a]){S.notified[a]=1;ping(`${n==0?'Hoje':'Dia '+dfmt(t.date)}: ${t.type.toLowerCase()} de ${dn(t.d)}, vale ${f(t.pts)} pontos.`)}
    if((n<0||(n==0&&h>=18))&&!S.notified[b]){S.notified[b]=1;ping(`Quanto você tirou em “${t.title}” (${dn(t.d)}, vale ${f(t.pts)})? Lance sua nota.`)}});save()}
function notifPrompt(){open(`<h2>NotaUp deseja enviar notificações</h2><p class="sub" style="margin-top:8px">Avisos de provas, trabalhos e lembretes para lançar suas notas.</p><div class="row" style="margin-top:18px"><button class="btn alt" onclick="S.asked=1;save();closeSheet()">Cancelar</button><button class="btn" onclick="setNotif(true)">Permitir</button></div>`)}
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
    open(`<h2>Seu perfil</h2><div class="pv"><canvas id="pc"></canvas></div><p class="sub" style="text-align:center">Arraste para mover e use dois dedos para dar zoom.</p><div style="text-align:center;margin-top:10px"><button class="btn sm alt" onclick="$('#pf').click()">Editar foto</button></div><input id="pf" type="file" accept="image/*" style="display:none" onchange="phLoad(this)"><div class="row" style="margin-top:16px"><button class="btn sm alt" style="flex:1" onclick="phRemove()">Remover</button><button class="btn sm alt" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn sm" style="flex:1" onclick="phSave()">Salvar</button></div>`);
    phBind();if(S.user.photo)phImg(S.user.photo);else phDraw($('#pc'),240)}
function phImg(src){const im=new Image();im.onload=()=>{ph.img=im;ph.z=1;ph.ox=0;ph.oy=0;phDraw($('#pc'),240)};im.src=src}
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
const vpBox=()=>`<div class="vp"><div id="vpm">${vpInner()}</div><div class="row" style="margin-top:8px"><input id="vt" placeholder="…ou digite o comando" onkeydown="if(event.key=='Enter')vtype()"><button class="btn sm" onclick="stopVoice()">Cancelar</button></div></div>`;
function vpaint(){const e=$('#vpm');if(e&&vp)e.innerHTML=vpInner()}
function vtype(){const i=$('#vt'),v=i.value.trim();i.value='';if(v)handle(v,1)}
function handle(tx,typed){log((typed?'Comando digitado: “':'Comando de voz: “')+tx+'”');say('u',tx);say('j',voice(tx))}
function say(r,t){if(!vp)return;if(r=='u'){vp.msgs.push({r,t});return vpaint()}const m={r,t:''};vp.msgs.push(m);let i=0;const iv=setInterval(()=>{i+=3;m.t=t.slice(0,i);vpaint();if(i>=t.length)clearInterval(iv)},10)}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;vp={msgs:[{r:'j',t:P(`${cap(hr())}, ${fn1()}! Sou o ${S.user.nick}. O que temos para hoje?`,`${cap(hr())}, ${fn1()}. Sou ${S.user.nick}. Em que posso ajudá-lo?`)}],st:SR?'Iniciando microfone…':'Voz indisponível aqui. Digite o comando.',live:''};keep=!!SR;render();if(SR)listen(SR)}
function listen(SR){if(!keep)return;let r;try{r=new SR()}catch(e){return}rec=r;r.lang='pt-BR';r.interimResults=true;r.maxAlternatives=1;
    r.onstart=()=>{if(vp){vp.st='Ouvindo…';vpaint()}};
    r.onresult=e=>{let tx='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){tx+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}if(!vp)return;if(fin){vp.live='';handle(tx.trim())}else{vp.live=tx;vpaint()}};
    r.onerror=e=>{if(!vp)return;const E=e.error;if(E=='not-allowed'||E=='service-not-allowed'){keep=false;vp.st='Microfone bloqueado. Libere nas configurações do navegador ou digite o comando.'}else if(E=='network'){keep=false;vp.st='Sem internet para reconhecer a voz. Digite o comando.'}else if(E=='audio-capture')vp.st='Não achei o microfone.';else if(E=='no-speech')vp.st='Não ouvi nada. Pode falar.';vpaint()};
    r.onend=()=>{if(keep)setTimeout(()=>listen(SR),40)};try{r.start()}catch(e){}}
function stopVoice(){keep=false;try{rec&&rec.abort()}catch(e){}vp=null;render()}
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
const vpInner=()=>{const h=vp.msgs.slice(-3).map(m=>`<div class="b ${m.r} ${m.seen?'':'in'}">${esc(m.t)}</div>`).join('')+(vp.live?`<div class="b u live">${esc(vp.live)}</div>`:'')+(vp.msgs.length<2&&!vp.live?`<div class="chips">${CH.map(c=>`<button onclick="handle('${c}',1)">${c}</button>`).join('')}</div>`:'')+`<div class="st"><span class="wave"><i></i><i></i><i></i><i></i></span>${esc(vp.st)}</div>`;vp.msgs.forEach(m=>m.seen=1);return h};
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
    let nv=t.match(/(abr|va |vai |ir |mostr|ve )\w*.*?(calendario|historico|configuracoes|inicio|auditoria)/);if(nv){const k={calendario:['cal','o calendário'],historico:['hist','o histórico'],configuracoes:['cfg','as configurações'],auditoria:['cfg','a auditoria'],inicio:['home','o início']}[nv[2]];go(k[0]);return P(`Pronto, abri ${k[1]}.`,`Abrindo ${k[1]}.`)}
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
document.addEventListener('visibilitychange',()=>{if(!document.hidden)remind()});
render();remind();setInterval(remind,60000);