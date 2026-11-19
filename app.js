const $=s=>document.querySelector(s),app=$('#app');
const IC={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10H3z"/></svg>',hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',ativ:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 8h6M8 12h6"/></svg>',stop:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'};
let S={user:null,discs:[],grades:[],tasks:[],log:[],target:7,notified:{},notif:false,asked:0,theme:'light',tone:'amigo',sec:null,ai:{prov:'claude',key:'',model:''},chat:[]},view='home',tab=1,sheet=null,vp=null,rec=null,keep=false,cb=null,cp={y:0,m:0,sel:''},ph={};
try{S=Object.assign(S,JSON.parse(localStorage.getItem('notaup')||'{}'))}catch(e){}
let locked=!!S.sec,AI={busy:false,img:null,picking:false};
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
    const fin=photo=>{S.user={name,nick,photo};log('Perfil criado: '+name+' (apelido do app: '+nick+')');save();render()};
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
 <div class="row sp" style="margin-top:16px"><span style="font-weight:600">Tema</span><div class="seg" data-pos="${S.theme=='dark'?1:0}"><i class="th"></i><button class="${S.theme!='dark'?'on':''}" onclick="setTheme('light')">Claro</button><button class="${S.theme=='dark'?'on':''}" onclick="setTheme('dark')">Escuro</button></div></div><div class="row sp" style="margin-top:16px"><span style="font-weight:600">Notificações</span><button class="sw ${S.notif?'on':''}" role="switch" aria-checked="${!!S.notif}" aria-label="Notificações" onclick="setNotif(!S.notif)"></button></div></div>
 ${aiCard()}${secCard()}<div class="card" style="margin-top:12px"><div class="row sp"><h2>Auditoria</h2><button class="lnk" onclick="ask('Apagar todos os seus dados?',()=>{localStorage.removeItem('notaup');location.reload()},'Apagar')">Apagar meus dados</button></div><p class="sub">Tudo o que foi feito no app.</p>${S.log.map(l=>`<div class="it"><div style="font-size:14px">${esc(l.m)}</div><div class="sub">${new Date(l.t).toLocaleString('pt-BR')}</div></div>`).join('')||'<p class="sub">Sem registros.</p>'}</div>`}
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
    if(S.sec&&locked)return lockScr();if(!S.sec)return setupLock();
    const v={home,hist,ativ,cal,cfg}[view]();
    app.innerHTML=`<main>${v}</main>${vp?vpBox():view=='ativ'?'':`<button class="fab" onclick="mic()" aria-label="Falar com ${esc(S.user.nick)}">${IC.mic}</button>`}<nav>${[['home','Início'],['hist','Histórico'],['ativ','Atividades'],['cal','Calendário'],['cfg','Configurações']].map(([k,l])=>`<button class="${view==k?'on':''}" onclick="go('${k}')">${IC[k]}${l}</button>`).join('')}</nav>${sheet||''}`;if(view=='ativ')aiPaint(true);
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
    open(`<h2>Adicionar nota</h2><label>Disciplina</label><select id="gd">${dopts(d)}<option value="all" ${d=='all'?'selected':''}>Todas as matérias (projeto)</option></select><label>Unidade</label><select id="gu"><option>1</option><option>2</option><option>3</option></select><label>Tipo</label><select id="gt">${TYPES.map(x=>`<option ${x==k.type?'selected':''}>${x}</option>`).join('')}</select><label>Descrição</label><input class="ac" autocapitalize="sentences" id="gn" value="${esc(k.title||'')}" placeholder="Ex.: Prova 1"><div class="row"><div><label>Valia</label><input id="gm" type="number" step="0.1" inputmode="decimal" value="${k.pts||10}"></div><div><label>Tirei</label><input id="gs" type="number" step="0.1" inputmode="decimal"></div></div><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addGrade($('#gd').value,+$('#gu').value,$('#gt').value,$('#gn').value,+$('#gm').value,parseFloat($('#gs').value),'${tid||''}')">Salvar nota</button></div>`)}
function addGrade(d,u,type,name,max,s,tid){if(!d||isNaN(s)||!max)return toast('Informe a nota e o valor.');if(s>max)return toast('A nota não pode passar do valor.');
    (d=='all'?S.discs.map(x=>x.id):[d]).forEach(id=>S.grades.push({id:uid(),d:id,u,type,name:name?cap(name):d=='all'?type+' da unidade':type+' de '+dn(d),max,s,date:today()}));const t=S.tasks.find(x=>x.id==tid);if(t)t.graded=true;
    log(`Nota lançada: ${type} ${name||''} de ${dn(d)} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();closeSheet();toast('Nota salva!')}
// notificações
function ping(m){toast('⏰ '+m);try{if(S.notif&&Notification.permission=='granted')new Notification('NotaUp',{body:m})}catch(e){}}
function remind(){if(!S.user||(S.sec&&locked))return;const h=new Date().getHours();S.tasks.forEach(t=>{if(t.graded)return;const n=daysTo(t.date),a=t.id+'a',b=t.id+'b';
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
function setTheme(t){const was=S.theme;S.theme=t;log('Tema alterado para '+(t=='dark'?'escuro':'claro'));save();applyTheme();const sg=document.querySelector('.seg'),p=t=='dark'?1:0;
    if(sg&&!sheet&&was!=t){sg.dataset.pos=p;sg.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('on',i==p));setTimeout(()=>{if(S.theme==t)render()},380)}else render()}
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
const vpBox=()=>`<div class="vp"><button class="vx" onclick="stopVoice()" aria-label="Fechar">✕</button><div id="vpm">${vpInner()}</div><div class="row" style="margin-top:8px"><input id="vt" placeholder="…ou digite o comando" onkeydown="if(event.key=='Enter')vtype()"><span id="vbtn">${vbtn()}</span></div></div>`;
const vbtn=()=>`<button class="vb ${keep?'on':''}" onclick="toggleMic()" aria-label="${keep?'Parar de ouvir':'Falar'}">${keep?IC.stop:IC.mic}</button>`;
function toggleMic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!vp)return;
    if(keep){keep=false;clearTimeout(rstTimer);clearTimeout(guardT);guardT=null;try{rec&&rec.abort()}catch(e){}vp.live='';vp.st='Parei de ouvir. Toque no microfone para falar.';return vpaint()}
    if(!SR){vp.st='Voz indisponível aqui. Digite o comando.';return vpaint()}
    keep=true;vp.st='Iniciando microfone…';vpaint();listen(SR)}
function vpaint(){const e=$('#vpm');if(e&&vp)e.innerHTML=vpInner();const b=$('#vbtn');if(b&&vp)b.innerHTML=vbtn()}
function vtype(){const i=$('#vt'),v=i.value.trim();i.value='';if(v)handle(v,1)}
function handle(tx,typed){log((typed?'Comando digitado: “':'Comando de voz: “')+tx+'”');say('u',tx);let a;try{a=voice(tx)}catch(e){console.error(e);a=P('Opa, deu um tropeço aqui. Pode repetir?','Ocorreu um erro. Poderia repetir?')}say('j',a)}
function say(r,t){if(!vp)return;if(r=='u'){vp.msgs.push({r,t});return vpaint()}const m={r,t:''};vp.msgs.push(m);let i=0;const iv=setInterval(()=>{i+=3;m.t=t.slice(0,i);vpaint();if(i>=t.length)clearInterval(iv)},10)}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;vp={msgs:[{r:'j',t:P(`${cap(hr())}, ${fn1()}! Sou o ${S.user.nick}. O que temos para hoje?`,`${cap(hr())}, ${fn1()}. Sou ${S.user.nick}. Em que posso ajudá-lo?`)}],st:SR?'Iniciando microfone…':'Voz indisponível aqui. Digite o comando.',live:''};keep=!!SR;render();if(SR)listen(SR)}
// reconhecimento de voz: UMA instância reaproveitada (recriar a cada frase travava o microfone)
let running=false,lastEv=0,lastFin={t:'',at:0},rstTimer=null;
let guardT=null;
function recStart(){if(!keep||!rec||running)return;try{rec.start()}catch(e){}if(!guardT)guardT=setTimeout(()=>{guardT=null;if(keep&&!running){keep=false;try{rec.abort()}catch(e){}if(vp){vp.st='Toque no microfone para falar.';vpaint()}}},2500)}
function recLater(ms){clearTimeout(rstTimer);rstTimer=setTimeout(recStart,ms)}
function finalText(tx){tx=(tx||'').trim();if(!tx)return;const n=Date.now();if(tx===lastFin.t&&n-lastFin.at<2000)return;lastFin={t:tx,at:n};handle(tx)}
function listen(SR){if(!keep)return;
    if(!rec){let r;try{r=new SR()}catch(e){if(vp){vp.st='Não consegui iniciar o microfone. Digite o comando.';vpaint()}return}rec=r;r.lang='pt-BR';r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
        r.onstart=()=>{clearTimeout(guardT);guardT=null;running=true;lastEv=Date.now();if(vp){vp.st='Ouvindo…';vpaint()}};
        r.onresult=e=>{lastEv=Date.now();let tx='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){tx+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}if(!vp)return;if(fin){vp.live='';finalText(tx)}else{vp.live=tx;vpaint()}};
        r.onerror=e=>{if(!vp)return;const E=e.error;if(E=='not-allowed'||E=='service-not-allowed'){keep=false;vp.st='Microfone bloqueado. Libere nas configurações do navegador ou digite o comando.'}else if(E=='network'){keep=false;vp.st='Sem internet para reconhecer a voz. Digite o comando.'}else if(E=='audio-capture')vp.st='Não achei o microfone.';else if(E=='no-speech')vp.st='Não ouvi nada. Pode falar.';else return;vpaint()};
        r.onend=()=>{running=false;if(vp&&vp.live){const tx=vp.live;vp.live='';finalText(tx)}if(keep)recLater(350)}}
    recStart()}
function stopVoice(){keep=false;clearTimeout(rstTimer);clearTimeout(guardT);guardT=null;try{rec&&rec.abort()}catch(e){}vp=null;render()}
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
function mkTask(did,T,iso,pts){const all=did=='all',d=all?{name:'todas as matérias'}:S.discs.find(x=>x.id==did),to=all?' para todas as matérias':' de '+d.name;
    S.tasks.push({id:uid(),d:did,type:T,title:all?'Todas as matérias':T+' de '+d.name,date:iso,pts,graded:false});log(`Tarefa criada por voz: ${T}${all?' (todas as matérias)':' de '+d.name} para ${dfmt(iso)} (${f(pts)} pts)`);save();render();remind();
    return P(`Combinado! Agendei ${T.toLowerCase()}${to} pro dia ${dfmt(iso)}, valendo ${f(pts)}.`,`Agendei ${T.toLowerCase()}${to} para o dia ${dfmt(iso)}, valendo ${f(pts)} pontos.`)}
function finishGrade(d,T,max,s,u){const all=d.id=='all',tk=S.tasks.find(x=>x.d==d.id&&!x.graded&&norm(x.type)==norm(T));max=max||(tk?tk.pts:10);if(s>max)return P(`Ops, ${f(s)} passa do valor ${f(max)}. Quanto foi mesmo?`,`A nota ${f(s)} excede o valor ${f(max)}. Poderia confirmar?`);
    if(all){if(!S.discs.length)return P('Você ainda não tem matérias cadastradas.','Não há disciplinas cadastradas.');if(tk)tk.graded=true;const nm=tk&&tk.title!='Todas as matérias'?tk.title:T+' da unidade';S.discs.forEach(x=>S.grades.push({id:uid(),d:x.id,u,type:T,name:nm,max,s,date:today()}));log(`Nota lançada por voz: ${T} (todas as matérias, ${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();
        return P(`Feito! ${T} da ${u}ª unidade: ${f(s)}/${f(max)} em todas as matérias.`,`Registrado: ${T.toLowerCase()} da ${u}ª unidade, ${f(s)} de ${f(max)}, em todas as matérias.`)}
    if(tk)tk.graded=true;S.grades.push({id:uid(),d:d.id,u,type:T,name:tk?tk.title:T+' de '+d.name,max,s,date:today()});log(`Nota lançada por voz: ${T} de ${d.name} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();const a=discAvg(d.id);
    return P(`Feito! ${T} de ${d.name}: ${f(s)}/${f(max)} na ${u}ª unidade. Sua média em ${d.name} tá ${f(a)}.`,`Registrado: ${T.toLowerCase()} de ${d.name}, ${f(s)} de ${f(max)} (${u}ª unidade). Média atual: ${f(a)}.`)}
const CH=['O que temos para hoje?','Minha média geral','Quanto falta para passar?','Minhas matérias'];
const vpInner=()=>{const h=vp.msgs.slice(-3).map(m=>`<div class="b ${m.r} ${m.seen?'':'in'}">${esc(m.t)}</div>`).join('')+(vp.live?`<div class="b u live">${esc(vp.live)}</div>`:'')+(vp.msgs.length<2&&!vp.live?`<div class="chips">${CH.map(c=>`<button onclick="handle('${c}',1)">${c}</button>`).join('')}</div>`:'')+`<div class="st"><span class="wave"><i></i><i></i><i></i><i></i></span>${esc(vp.st)}</div>`;vp.msgs.forEach(m=>m.seen=1);return h};
function voice(raw){const n0=norm(raw);let t=words2num(n0).replace(/(\d)\s*(virgula|ponto)\s*(\d)/g,'$1.$3').replace(/(\d),(\d)/g,'$1.$2').replace(new RegExp('\\b'+rx(norm(S.user.nick))+'\\b','g'),' ').replace(/\s+/g,' ').trim();const nm=fn1();
    const A=vp&&vp.ask;if(A){vp.ask=null;const x=num(t);
        if(/^(nao|deixa|cancela|esquece|para)\b/.test(t))return P('Beleza, deixei pra lá.','Certo, cancelado.');
        if(A.kind=='yes'&&/^(sim|pode|claro|confirm\w*|isso|ok|quero|exato)\b/.test(t))return A.fn();
        if(A.kind=='score'&&x.length&&t.split(' ').length<=5&&!/materia|disciplina|prova|trabalho|atividade|projeto|teste/.test(t))return finishGrade(A.d=='all'?{id:'all',name:'todas as matérias'}:S.discs.find(d=>d.id==A.d),A.T,A.max,x[0],A.u);
        if(A.kind=='date'){const iso=parseDate(t);if(iso)return mkTask(A.d,A.T,iso,A.pts)}}
    const act=/adicion|lanc|registr|tirei|tirou|cri[ae]|cadastr|agend|anot|apag|remov|exclu|delet/.test(t),cmd=/adicion|cri[ae]|cadastr|lanc|registr|agend|apag|remov|exclu|tirei|tirou|nota|materia|disciplina|prova|trabalho|atividade|projeto|teste|dia \d/.test(t),d=findDisc(t);
    if(/(seja|quero|fale|fala|responda|modo|mude|muda|fique).*(formal|corporativ|empresarial|profissional)/.test(t)){S.tone='formal';save();log('Jarvis: tom formal');return 'Entendido. Passarei a me comunicar de forma formal e objetiva.'}
    if(/(seja|quero|fale|fala|responda|modo|mude|muda|fique).*(amig|descontra|informal|casual)/.test(t)){S.tone='amigo';save();log('Jarvis: tom de amigo');return `Fechou, ${nm}! Agora a gente conversa como amigos.`}
    if(/(mud|alter|troc|defin)\w*.*media.*?\d/.test(t)&&!/tirei|tirou/.test(t)){const v=+t.match(/media.*?(\d+(?:\.\d+)?)/)[1];if(v>0&&v<=10){S.target=v;log('Média de aprovação alterada para '+v+' (voz)');save();render();return P(`Fechado! Agora a média pra passar é ${f(v)}.`,`Média de aprovação alterada para ${f(v)}.`)}}
    if(/(modo|tema)\s*(escuro|noturno)/.test(t)){setTheme('dark');return P('Pronto, modo escuro ligado.','Modo escuro ativado.')}
    if(/(modo|tema)\s*claro/.test(t)){setTheme('light');return P('Pronto, modo claro ligado.','Modo claro ativado.')}
    let nv=t.match(/\b(abr|va|vai|ir|mostr|ve)\w*\b.*?(calendario|historico|configuracoes|inicio|auditoria|atividades)/);if(nv){const k={calendario:['cal','o calendário'],historico:['hist','o histórico'],configuracoes:['cfg','as configurações'],auditoria:['cfg','a auditoria'],atividades:['ativ','as atividades'],inicio:['home','o início']}[nv[2]];go(k[0]);return P(`Pronto, abri ${k[1]}.`,`Abrindo ${k[1]}.`)}
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
    const D=ty=='projeto'?{id:'all',name:'todas as matérias'}:d;
    if(ty&&date&&!sm){if(!D)return noDisc;return mkTask(D.id,cap(ty),date,vm?+vm[1]:10)}
    if(ty&&!sm&&!vm&&/agend|marc|lembr|cri[ae]|tenho|\btem\b/.test(t)){if(!D)return noDisc;const T=cap(ty),of=D.id=='all'?' para todas as matérias':' de '+D.name;if(vp)vp.ask={kind:'date',d:D.id,T,pts:10};return P(`Beleza! Pra quando é ${T.toLowerCase()}${of}?`,`Para qual data está marcada ${T.toLowerCase()}${of}?`)}
    if((ty||/nota/.test(t))&&/adicion|lanc|registr|coloc|anot|tirei|tirou|fiz|consegui|peguei/.test(t)){if(!D)return noDisc;const T=cap(ty||'atividade'),
        um=t.match(/(\d)\s*[aºªo]?\s*unidade/)||t.match(/unidade\s*(\d)/),w=t.match(/(primeira|segunda|terceira)\s*unidade/),u=um?+um[1]:w?{primeira:1,segunda:2,terceira:3}[w[1]]:1,max=vm?+vm[1]:null;
        if(!sm){if(vp)vp.ask={kind:'score',d:D.id,T,max,u};const of=D.id=='all'?' (todas as matérias)':' de '+D.name;return P(`Beleza, ${T.toLowerCase()}${of}. Quanto você tirou?`,`${T}${of}. Qual foi a nota obtida?`)}return finishGrade(D,T,max,+sm[1],u)}
    return P(`Não entendi bem, ${nm}. Pode repetir? Ex.: “tirei 8 na prova de Português”, “quanto falta pra passar em Inglês” ou “o que temos para hoje”.`,'Não compreendi a solicitação. Poderia reformular? Exemplo: “quanto falta para passar em Inglês”.')}
document.addEventListener('input',e=>{const t=e.target;if(!t.classList||!t.classList.contains('ac'))return;const v=t.value;if(v&&v[0]!==v[0].toUpperCase()){const s=t.selectionStart;t.value=v[0].toUpperCase()+v.slice(1);try{t.setSelectionRange(s,s)}catch(_){}}});
['gesturestart','gesturechange','gestureend'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault()));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)remind()});
// ---------- v6: segurança, conta de IA e atividades ----------
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),unb=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),rnd=n=>crypto.getRandomValues(new Uint8Array(n));
async function hashPw(p,salt){try{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(p),'PBKDF2',false,['deriveBits']);return b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:unb(salt),iterations:150000,hash:'SHA-256'},k,256))}catch(e){let h=5381;const s=salt+p;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return 'w'+h}}
// -- tela de criar senha
function setupLock(){app.innerHTML=`<main><div class="ob"><div class="logo">${LG()}NotaUp</div><h1 style="margin-top:18px">Proteja seu app</h1><p class="sub">Crie uma senha para entrar. Depois você pode ativar o Face ID.</p>
<label>Senha (mínimo 4 caracteres)</label><input id="s1" type="password" autocomplete="new-password"><label>Repita a senha</label><input id="s2" type="password" autocomplete="new-password" onkeydown="if(event.key=='Enter')saveLock()">
<button class="btn" style="margin-top:18px" onclick="saveLock()">Salvar senha</button></div></main>`}
async function saveLock(){const a=$('#s1').value,b=$('#s2').value;if(a.length<4)return toast('A senha precisa ter pelo menos 4 caracteres.');if(a!==b)return toast('As senhas não são iguais.');
    const salt=b64(rnd(16));S.sec={salt,hash:await hashPw(a,salt),cred:''};log('Senha de acesso criada');save();locked=false;render();bioOffer()}
const afterLock=()=>{if(!S.asked)notifPrompt()};
async function bioOffer(){let ok=false;try{ok=!!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){}
    if(!ok)return afterLock();
    open(`<h2>Ativar Face ID / biometria?</h2><p class="sub" style="margin-top:8px">Entre no app só com o rosto ou a digital. A senha continua valendo como reserva.</p><div class="row" style="margin-top:18px"><button class="btn alt" onclick="closeSheet();afterLock()">Agora não</button><button class="btn" onclick="bioEnable(true)">Ativar</button></div>`)}
async function bioEnable(first){let ok=false;
    try{const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'NotaUp'},user:{id:rnd(16),name:S.user.name,displayName:S.user.name},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
        S.sec.cred=b64(c.rawId);log('Face ID/biometria cadastrado');save();ok=true}catch(e){}
    closeSheet();if(first)afterLock();toast(ok?'Face ID ativado!':'Não consegui ativar o Face ID. Ele precisa de https e de biometria configurada no aparelho.')}
function bioToggle(){if(S.sec.cred){S.sec.cred='';log('Face ID/biometria desativado');save();render()}else bioEnable(false)}
// -- tela de entrada
function lockScr(){app.innerHTML=`<main><div class="ob"><div class="logo">${LG()}NotaUp</div><h1 style="margin-top:18px">Olá, ${esc(fn1())}!</h1><p class="sub">Digite sua senha para entrar.</p>
<label>Senha</label><input id="lp" type="password" autocomplete="current-password" onkeydown="if(event.key=='Enter')unlock()"><button class="btn" style="margin-top:14px" onclick="unlock()">Entrar</button>
${S.sec.cred?`<button class="btn alt" style="margin-top:8px" onclick="bioUnlock()">Entrar com Face ID</button>`:''}<button class="lnk" style="margin-top:10px" onclick="forgot()">Esqueci minha senha</button></div></main>${sheet||''}`}
async function unlock(){const e=$('#lp'),v=e?e.value:'';if(!v)return;if(await hashPw(v,S.sec.salt)===S.sec.hash){locked=false;render();remind()}else{toast('Senha incorreta.');e.value=''}}
async function bioUnlock(){try{await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:unb(S.sec.cred),transports:['internal']}],userVerification:'required',timeout:60000}});locked=false;render();remind()}catch(e){toast('O Face ID não funcionou. Use a senha.')}}
function forgot(){ask('Esqueci a senha: isso apaga TODOS os dados do app neste aparelho. Continuar?',()=>{try{localStorage.removeItem('notaup')}catch(e){}location.reload()},'Apagar tudo')}
let hiddenAt=0;document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();return}
    if(AI.picking){AI.picking=false;hiddenAt=0;return}
    if(S.sec&&!locked&&hiddenAt&&Date.now()-hiddenAt>60000){locked=true;keep=false;clearTimeout(rstTimer);try{rec&&rec.abort()}catch(e){}vp=null;sheet=null;render()}hiddenAt=0});
// -- cartões em Configurações
const secCard=()=>{const on=!!(S.sec&&S.sec.cred);return `<div class="card" style="margin-top:12px"><h2>Segurança</h2><p class="sub">O app pede senha ao entrar e quando você volta depois de mais de 1 minuto fora.</p><div class="row sp" style="margin-top:12px"><span style="font-weight:600">Face ID / biometria</span><button class="sw ${on?'on':''}" role="switch" aria-checked="${on}" aria-label="Face ID" onclick="bioToggle()"></button></div><button class="btn sm alt" style="margin-top:12px" onclick="sheetPw()">Alterar senha</button></div>`};
function sheetPw(){open(`<h2>Alterar senha</h2><label>Senha atual</label><input id="p0" type="password"><label>Nova senha</label><input id="p1" type="password"><label>Repita a nova senha</label><input id="p2" type="password"><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn" style="flex:1" onclick="changePw()">Salvar</button></div>`)}
async function changePw(){const a=$('#p0').value,n=$('#p1').value,r=$('#p2').value;if(await hashPw(a,S.sec.salt)!==S.sec.hash)return toast('Senha atual incorreta.');if(n.length<4)return toast('A nova senha precisa ter pelo menos 4 caracteres.');if(n!==r)return toast('As senhas não são iguais.');
    const salt=b64(rnd(16));S.sec.salt=salt;S.sec.hash=await hashPw(n,salt);log('Senha alterada');save();closeSheet();toast('Senha alterada!')}
const defModel=p=>p=='openai'?'gpt-4o':'claude-sonnet-5-5';
const aiCard=()=>{const a=S.ai;return `<div class="card" style="margin-top:12px"><h2>Conta de IA</h2>${a.key?`<p class="sub">Vinculado a <b>${a.prov=='openai'?'ChatGPT (OpenAI)':'Claude (Anthropic)'}</b> · modelo ${esc(a.model||defModel(a.prov))}</p><div class="row" style="margin-top:12px"><button class="btn sm alt" onclick="sheetLink()">Trocar</button><button class="btn sm alt" onclick="ask('Desvincular a conta de IA?',unlink,'Desvincular')">Desvincular</button></div>`:`<p class="sub">Vincule o Claude ou o ChatGPT para resolver atividades por foto ou texto.</p><button class="btn" style="margin-top:12px" onclick="sheetLink()">Vincular conta</button>`}</div>`};
function sheetLink(){const a=S.ai;open(`<h2>Vincular conta</h2><p class="sub" style="margin-top:6px">O vínculo é feito com a chave de API da sua conta. Ela fica guardada só neste aparelho.</p>
<label>Serviço</label><select id="lpv" onchange="$('#lmd').placeholder=defModel(this.value)"><option value="claude" ${a.prov!='openai'?'selected':''}>Claude (Anthropic)</option><option value="openai" ${a.prov=='openai'?'selected':''}>ChatGPT (OpenAI)</option></select>
<label>Chave de API</label><input id="lky" type="password" autocomplete="off" placeholder="Cole a chave aqui"><label>Modelo (opcional)</label><input id="lmd" placeholder="${defModel(a.prov)}" value="${esc(a.model||'')}">
<p class="sub" style="margin-top:8px">Onde criar: console.anthropic.com (Claude) ou platform.openai.com (ChatGPT). O uso é cobrado à parte da assinatura do chat.</p>
<div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Cancelar</button><button class="btn" style="flex:1" onclick="saveLink()">Vincular</button></div>`)}
function saveLink(){const k=$('#lky').value.trim();if(k.length<20)return toast('Cole a chave de API completa.');S.ai={prov:$('#lpv').value,key:k,model:$('#lmd').value.trim()};S.chat=[];log('Conta de IA vinculada: '+(S.ai.prov=='openai'?'ChatGPT':'Claude'));save();closeSheet();toast('Conta vinculada!')}
function unlink(){S.ai.key='';log('Conta de IA desvinculada');save();render()}
// -- aba Atividades
const SYS='Você é o assistente de estudos do app NotaUp. Responda sempre em português do Brasil. Resolva a atividade que o aluno enviar (texto ou foto) explicando o passo a passo de forma clara e curta, e destaque a resposta final. Se a foto estiver ilegível ou faltar informação, diga o que falta.';
const fmt=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
function ativ(){return `<div class="row sp"><h1>Atividades</h1>${S.chat.length?`<button class="lnk" onclick="aiClear()">Nova conversa</button>`:''}</div><p class="sub">Mande uma foto ou escreva a atividade e receba a resolução.</p>
${S.ai.key?`<div id="aim" style="margin-top:14px"></div><div class="cmp"><div id="aip"></div><div class="row" style="align-items:flex-end"><button class="btn sm alt" onclick="AI.picking=true;$('#aif').click()" aria-label="Enviar foto" style="padding:12px">📷</button><textarea id="ait" rows="1" placeholder="Escreva a atividade…" oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea><button class="btn sm" id="ais" onclick="aiSend()" style="padding:12px 14px">Enviar</button></div><input id="aif" type="file" accept="image/*" style="display:none" onchange="aiPick(this)"></div>`
    :`<div class="card" style="margin-top:14px"><h2>Vincule sua conta</h2><p class="sub" style="margin-top:6px">Conecte o Claude ou o ChatGPT para tirar foto de uma atividade, ou escrevê-la, e receber a resposta aqui, como no chat.</p><button class="btn" style="margin-top:12px" onclick="sheetLink()">Vincular conta</button></div>`}`}
function aiPaint(sc){const m=$('#aim');if(!m)return;
    m.innerHTML=S.chat.map(x=>`<div class="b ${x.r=='u'?'u':'j'} ai">${x.img?'<div class="sub">📷 foto enviada</div>':''}${fmt(x.t)}</div>`).join('')+(AI.busy?`<div class="st"><span class="wave"><i></i><i></i><i></i><i></i></span>Pensando…</div>`:'');
    const p=$('#aip');if(p)p.innerHTML=AI.img?`<div class="row sp card" style="padding:8px;margin-bottom:8px"><img src="${AI.img}" style="height:56px;border-radius:10px" alt="Foto"><button class="btn sm alt" onclick="AI.img=null;aiPaint()">Remover foto</button></div>`:'';
    const s=$('#ais');if(s)s.disabled=AI.busy;if(sc){const mn=document.querySelector('main');if(mn)mn.scrollTop=mn.scrollHeight}}
function aiPick(i){AI.picking=false;const fl=i.files[0];i.value='';if(!fl)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);AI.img=c.toDataURL('image/jpeg',.82);aiPaint(true)};im.onerror=()=>toast('Não consegui abrir essa imagem.');im.src=r.result};r.readAsDataURL(fl)}
function aiClear(){S.chat=[];AI.img=null;save();render()}
async function aiSend(){if(AI.busy)return;const ta=$('#ait'),t=ta.value.trim(),img=AI.img;if(!t&&!img)return toast('Escreva a atividade ou envie uma foto.');
    const hist=S.chat.filter(x=>!x.err).slice(-10).map(x=>({r:x.r,t:x.img?'[foto enviada] '+x.t:x.t}));
    S.chat.push({r:'u',t:t||'(resolva a atividade da foto)',img:!!img});ta.value='';ta.style.height='auto';AI.img=null;AI.busy=true;log('Atividade enviada ao assistente de IA'+(img?' (com foto)':''));save();aiPaint(true);
    try{S.chat.push({r:'j',t:await aiCall(hist,t||'Resolva a atividade da foto.',img)})}catch(e){S.chat.push({r:'j',t:'⚠️ '+e.message,err:true})}
    AI.busy=false;S.chat=S.chat.slice(-40);save();if(view=='ativ')aiPaint(true)}
async function aiCall(hist,text,img){const a=S.ai,md=a.model||defModel(a.prov);let r;
    const H=hist.map(x=>({role:x.r=='u'?'user':'assistant',content:x.t}));while(H.length&&H[0].role!='user')H.shift();
    try{if(a.prov=='openai'){const cur=img?[{type:'text',text},{type:'image_url',image_url:{url:img}}]:text;
        r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+a.key},body:JSON.stringify({model:md,messages:[{role:'system',content:SYS},...H,{role:'user',content:cur}]})})}
    else{const cur=img?[{type:'image',source:{type:'base64',media_type:'image/jpeg',data:img.split(',')[1]}},{type:'text',text}]:text;
        r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':a.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:md,max_tokens:2048,system:SYS,messages:[...H,{role:'user',content:cur}]})})}
    }catch(e){throw new Error('Sem conexão com a internet. Tente de novo.')}
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const m=j.error&&(j.error.message||'');if(r.status==401)throw new Error('Chave de API inválida. Vincule a conta de novo em Configurações.');if(r.status==429)throw new Error('Limite de uso ou saldo da conta esgotado.');throw new Error('Erro '+r.status+(typeof m=='string'&&m?': '+m:''))}
    return a.prov=='openai'?j.choices[0].message.content:j.content.filter(c=>c.type=='text').map(c=>c.text).join('\n')}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
render();remind();setInterval(remind,60000);