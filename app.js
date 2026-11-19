const $=s=>document.querySelector(s),app=$('#app');
const IC={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10H3z"/></svg>',hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'};
let S={user:null,discs:[],grades:[],tasks:[],log:[],target:7,notified:{},notif:false,asked:0,theme:'light'},view='home',tab=1,sheet=null,vp=null,rec=null,keep=false,cb=null,cp={y:0,m:0,sel:''},ph={};
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
<label>Seu nome</label><input id="n" placeholder="Ex.: Lizandro">
<label>Defina o apelido do app</label><input id="k" placeholder="Ex.: Jarvis"><p class="sub" style="margin-top:6px">É assim que você chama o assistente por voz: “Oi, Jarvis, adiciona a nota…”</p>
<label>Foto (opcional)</label><input id="p" type="file" accept="image/*">
<button class="btn" style="margin-top:18px" onclick="reg()">Começar</button></div></main>`}
function reg(){const name=$('#n').value.trim(),nick=$('#k').value.trim();if(!name||!nick)return toast('Preencha seu nome e o apelido do app.');
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
 <label>Apelido do app</label><input value="${esc(S.user.nick)}" onchange="S.user.nick=this.value.trim()||S.user.nick;log('Apelido alterado para '+S.user.nick);save();render()">
 <div class="row sp" style="margin-top:16px"><span style="font-weight:600">Tema</span><div class="seg"><button class="${S.theme!='dark'?'on':''}" onclick="setTheme('light')">Claro</button><button class="${S.theme=='dark'?'on':''}" onclick="setTheme('dark')">Escuro</button></div></div><div class="row sp" style="margin-top:16px"><span style="font-weight:600">Notificações</span><button class="sw ${S.notif?'on':''}" role="switch" aria-checked="${!!S.notif}" aria-label="Notificações" onclick="setNotif(!S.notif)"></button></div></div>
 <div class="card" style="margin-top:12px"><div class="row sp"><h2>Auditoria</h2><button class="lnk" onclick="ask('Apagar todos os seus dados?',()=>{localStorage.removeItem('notaup');location.reload()},'Apagar')">Apagar meus dados</button></div><p class="sub">Tudo o que foi feito no app.</p>${S.log.map(l=>`<div class="it"><div style="font-size:14px">${esc(l.m)}</div><div class="sub">${new Date(l.t).toLocaleString('pt-BR')}</div></div>`).join('')||'<p class="sub">Sem registros.</p>'}</div>`}
// sheets
const dopts=sel=>S.discs.map(d=>`<option value="${d.id}" ${d.id==sel?'selected':''}>${esc(d.name)}</option>`).join('');
const closeSheet=()=>{sheet=null;render()};
function open(h){sheet=`<div class="sheet" onclick="if(event.target==this)closeSheet()"><div>${h}</div></div>`;render()}
function sheetDisc(){open(`<h2>Nova disciplina</h2><label>Nome</label><input id="dn" placeholder="Ex.: Matemática"><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addDisc($('#dn').value)">Salvar</button></div>`)}
function openDisc(id){const d=S.discs.find(x=>x.id==id);
    open(`<div class="row sp"><h2>${esc(d.name)}</h2><button class="btn sm alt" onclick="ask('Excluir esta disciplina e todas as notas?',()=>delDisc('${id}'),'Excluir')">Excluir</button></div><div class="tab">${[1,2,3].map(u=>`<button class="${tab==u?'on':''}" onclick="tab=${u};openDisc('${id}')">${u}ª unidade</button>`).join('')}</div>
 <div class="card"><div class="sub">Média da unidade</div><div class="big ${col(unitAvg(id,tab))}">${unitAvg(id,tab)===null?'–':f(unitAvg(id,tab))}</div></div>
 <div class="card" style="margin-top:12px"><div class="sub">Média final</div><b style="font-size:22px">${discAvg(id)===null?'–':f(discAvg(id))}</b><div class="sub">${need(id)}</div></div>
 ${S.grades.filter(g=>g.d==id&&g.u==tab).map(g=>`<div class="it row sp"><div><b>${esc(g.name)}</b><div class="sub">${g.type} · ${dfmt(g.date)}</div></div><div class="row"><span class="pill">${f(g.s)}/${f(g.max)}</span><button class="btn sm alt" onclick="delGrade('${g.id}','${id}')">✕</button></div></div>`).join('')}
 <div class="row" style="margin-top:14px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="sheetGrade('${id}')">+ Adicionar Nota</button></div>`)}
// ações
function addDisc(n){n=(n||'').trim();if(!n)return toast('Informe o nome.');const ex=S.discs.find(d=>norm(d.name)==norm(n));if(ex)return ex;const d={id:uid(),name:n};S.discs.push(d);log('Disciplina criada: '+n);save();closeSheet();return d}
function delDisc(id){const n=dn(id);S.discs=S.discs.filter(d=>d.id!=id);S.grades=S.grades.filter(g=>g.d!=id);S.tasks=S.tasks.filter(t=>t.d!=id);log('Disciplina excluída: '+n);save();closeSheet()}
function delGrade(id,d){const g=S.grades.find(x=>x.id==id);S.grades=S.grades.filter(x=>x.id!=id);log('Nota removida: '+g.name);save();openDisc(d)}
function num(s){const m=s.match(/\d+(?:[.,]\d+)?/g);return m?m.map(x=>parseFloat(x.replace(',','.'))):[]}
function findDisc(t){return [...S.discs].sort((a,b)=>b.name.length-a.name.length).find(d=>t.includes(norm(d.name)))}
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
    open(`<h2>Nova tarefa</h2><label>Data de entrega: <b id="dl">selecione no calendário</b></label><div id="cpw"></div><label>Tipo</label><select id="tp" onchange="tpChg()">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select><label>Descrição</label><input id="tt" placeholder="Digite aqui a descrição"><label>Matéria</label><select id="td">${dopts()}</select><label>Pontuação (quantos pontos vale)</label><input id="tpt" type="number" step="0.5" inputmode="decimal" placeholder="Ex.: 5"><p class="sub" style="margin-top:8px">Você recebe um aviso 3 dias antes e outro às 18h do dia, para lançar a nota.</p><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addTask({d:$('#td').value,type:$('#tp').value,title:$('#tt').value.trim(),date:cp.sel,pts:parseFloat($('#tpt').value)})">Salvar</button></div>`);drawCal()}
function drawCal(){const el=$('#cpw');if(!el)return;const y=cp.y,m=cp.m,first=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),mn=new Date(y,m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    let c='';for(let i=0;i<first;i++)c+='<i></i>';for(let d=1;d<=n;d++){const iso=y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');c+=`<button class="${iso==cp.sel?'sel':''} ${iso==today()?'td':''}" onclick="pick('${iso}')">${d}</button>`}
    el.innerHTML=`<div class="row sp"><button class="btn sm alt" onclick="cm(-1)" aria-label="Mês anterior">‹</button><b style="text-transform:capitalize">${mn}</b><button class="btn sm alt" onclick="cm(1)" aria-label="Próximo mês">›</button></div><div class="cg">${'DSTQQSS'.split('').map(x=>`<span>${x}</span>`).join('')}${c}</div>`}
function pick(i){cp.sel=i;drawCal();$('#dl').textContent=dfmt(i)}
function cm(k){const d=new Date(cp.y,cp.m+k,1);cp.y=d.getFullYear();cp.m=d.getMonth();drawCal()}
function addTask(o){if(!o.date)return toast('Selecione a data de entrega.');if(!o.title)return toast('Digite a descrição.');if(isNaN(o.pts))return toast('Informe quantos pontos vale.');
    S.tasks.push({id:uid(),d:o.d,type:o.type,title:o.title,date:o.date,pts:o.pts,graded:false});log(`Tarefa criada: ${o.type} – ${o.title} (${dn(o.d)}, ${f(o.pts)} pts) para ${dfmt(o.date)}`);save();closeSheet();toast('Tarefa salva!');remind()}
function delTask(id){const t=S.tasks.find(x=>x.id==id);S.tasks=S.tasks.filter(x=>x.id!=id);log('Tarefa excluída: '+t.title);save();render()}
// notas
function sheetGrade(d,tid){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    const k=S.tasks.find(x=>x.id==tid)||{};
    open(`<h2>Adicionar nota</h2><label>Disciplina</label><select id="gd">${dopts(d)}</select><label>Unidade</label><select id="gu"><option>1</option><option>2</option><option>3</option></select><label>Tipo</label><select id="gt">${TYPES.map(x=>`<option ${x==k.type?'selected':''}>${x}</option>`).join('')}</select><label>Descrição</label><input id="gn" value="${esc(k.title||'')}" placeholder="Ex.: Prova 1"><div class="row"><div><label>Valia</label><input id="gm" type="number" step="0.1" inputmode="decimal" value="${k.pts||10}"></div><div><label>Tirei</label><input id="gs" type="number" step="0.1" inputmode="decimal"></div></div><div class="row" style="margin-top:16px"><button class="btn alt" style="flex:1" onclick="closeSheet()">Sair</button><button class="btn" style="flex:1" onclick="addGrade($('#gd').value,+$('#gu').value,$('#gt').value,$('#gn').value,+$('#gm').value,parseFloat($('#gs').value),'${tid||''}')">Salvar nota</button></div>`)}
function addGrade(d,u,type,name,max,s,tid){if(!d||isNaN(s)||!max)return toast('Informe a nota e o valor.');if(s>max)return toast('A nota não pode passar do valor.');
    S.grades.push({id:uid(),d,u,type,name:name||type+' de '+dn(d),max,s,date:today()});const t=S.tasks.find(x=>x.id==tid);if(t)t.graded=true;
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
function voice(raw){const n0=norm(raw);let t=n0.replace(/(\d)\s*(virgula|ponto)\s*(\d)/g,'$1.$3').replace(/(\d),(\d)/g,'$1.$2').replace(norm(S.user.nick),' ');
    if(t.replace(/\b(oi|ola|alo|e ai|ei|opa|bom dia|boa tarde|boa noite)\b|[^a-z]/g,'')==='')return 'Oi! Em que posso ajudar? Diga, por exemplo, “adicionar matéria de Português”.';
    let m=n0.match(/(?:cri\w*|cadastr\w*|adicion\w*|acrescent\w*|nov[ao])\s+(?:a\s+|uma\s+)?(?:nova\s+)?(?:materia|disciplina)\s+(?:de\s+|da\s+|do\s+)?(.+)$/);
    if(m){const nick=S.user.nick.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),nm=cap(raw.slice(raw.length-m[1].length).replace(new RegExp('[\\s,]*'+nick+'[\\s.!?]*$','i'),'').replace(/[\s,]*por favor[\s.!?]*$/i,'').replace(/[.!?]+$/,'').trim());if(!nm)return 'Qual é o nome da matéria?';if(S.discs.some(d=>norm(d.name)==norm(nm)))return `A matéria ${nm} já existe.`;addDisc(nm);return `Ok, matéria ${nm} adicionada.`}
    if(/(apag|remov|exclu|desfa)\w*.*(ultima|nota)/.test(t)){const g=S.grades.pop();if(!g)return 'Não há notas para remover.';log('Nota removida por voz: '+g.name);save();render();return 'Ok, última nota removida.'}
    const d=findDisc(t),ty=(t.match(/prova|teste|atividade|projeto|trabalho/)||[''])[0],vm=t.match(/val\w*\s*(\d+(?:\.\d+)?)/),sm=t.match(/(?:tirei|tirou|fiz|consegui|nota)\s*(?:de\s*)?(\d+(?:\.\d+)?)/),dm=t.match(/dia\s*(\d{1,2})/);
    if(ty&&dm&&!sm){if(!d)return 'Não achei essa matéria. Diga o nome como está no app.';const day=+dm[1],dt=new Date();if(day<dt.getDate())dt.setMonth(dt.getMonth()+1);dt.setDate(day);const iso=ymd(dt),T=cap(ty);
        S.tasks.push({id:uid(),d:d.id,type:T,title:T+' de '+d.name,date:iso,pts:vm?+vm[1]:10,graded:false});log(`Tarefa criada por voz: ${T} de ${d.name} para ${dfmt(iso)}`);save();render();remind();return `Ok, ${T.toLowerCase()} de ${d.name} agendado para ${dfmt(iso)}.`}
    if((ty||/nota/.test(t))&&/adicion|lanc|registr|coloc|anot|tirei|tirou|fiz/.test(t)){if(!d)return 'Não achei essa matéria. Crie antes: “adicionar matéria de …”.';if(!sm)return 'Não entendi a nota. Diga, por exemplo, “tirei 3,5”.';
        const T=cap(ty||'atividade'),tk=S.tasks.find(x=>x.d==d.id&&!x.graded&&norm(x.type)==norm(T)),max=vm?+vm[1]:(tk?tk.pts:10),s=+sm[1];if(s>max)return `A nota ${f(s)} passa do valor ${f(max)}. Tente de novo.`;
        const um=t.match(/(\d)\s*(?:a|º|o)?\s*unidade/)||t.match(/unidade\s*(\d)/),w=t.match(/(primeira|segunda|terceira)\s*unidade/),u=um?+um[1]:w?{primeira:1,segunda:2,terceira:3}[w[1]]:1;
        if(tk)tk.graded=true;S.grades.push({id:uid(),d:d.id,u,type:T,name:tk?tk.title:T+' de '+d.name,max,s,date:today()});log(`Nota lançada por voz: ${T} de ${d.name} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();return `Ok, ${T.toLowerCase()} de ${d.name}: ${f(s)}/${f(max)} salvo na ${u}ª unidade.`}
    return 'Não entendi. Tente: “adicionar matéria de Inglês” ou “adiciona a nota do trabalho de Biologia, valia 5, tirei 3,5”.'}
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
const vpInner=()=>{const h=vp.msgs.slice(-3).map(m=>`<div class="b ${m.r} ${m.seen?'':'in'}">${esc(m.t)}</div>`).join('')+(vp.live?`<div class="b u live">${esc(vp.live)}</div>`:'')+`<div class="st"><span class="wave"><i></i><i></i><i></i><i></i></span>${esc(vp.st)}</div>`;vp.msgs.forEach(m=>m.seen=1);return h};
const vpBox=()=>`<div class="vp"><div id="vpm">${vpInner()}</div><div class="row" style="margin-top:8px"><input id="vt" placeholder="…ou digite o comando" onkeydown="if(event.key=='Enter')vtype()"><button class="btn sm" onclick="stopVoice()">Cancelar</button></div></div>`;
function vpaint(){const e=$('#vpm');if(e&&vp)e.innerHTML=vpInner()}
function vtype(){const i=$('#vt'),v=i.value.trim();i.value='';if(v)handle(v,1)}
function handle(tx,typed){log((typed?'Comando digitado: “':'Comando de voz: “')+tx+'”');say('u',tx);say('j',voice(tx))}
function say(r,t){if(!vp)return;if(r=='u'){vp.msgs.push({r,t});return vpaint()}const m={r,t:''};vp.msgs.push(m);let i=0;const iv=setInterval(()=>{i+=2;m.t=t.slice(0,i);vpaint();if(i>=t.length)clearInterval(iv)},14)}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;vp={msgs:[{r:'j',t:`Oi! Sou o ${S.user.nick}. Pode falar.`}],st:SR?'Iniciando microfone…':'Voz indisponível aqui. Digite o comando.',live:''};keep=!!SR;render();if(SR)listen(SR)}
function listen(SR){if(!keep)return;let r;try{r=new SR()}catch(e){return}rec=r;r.lang='pt-BR';r.interimResults=true;r.maxAlternatives=1;
    r.onstart=()=>{if(vp){vp.st='Ouvindo…';vpaint()}};
    r.onresult=e=>{let tx='',fin=false;for(let i=e.resultIndex;i<e.results.length;i++){tx+=e.results[i][0].transcript;if(e.results[i].isFinal)fin=true}if(!vp)return;if(fin){vp.live='';handle(tx.trim())}else{vp.live=tx;vpaint()}};
    r.onerror=e=>{if(!vp)return;const E=e.error;if(E=='not-allowed'||E=='service-not-allowed'){keep=false;vp.st='Microfone bloqueado. Libere nas configurações do navegador ou digite o comando.'}else if(E=='network'){keep=false;vp.st='Sem internet para reconhecer a voz. Digite o comando.'}else if(E=='audio-capture')vp.st='Não achei o microfone.';else if(E=='no-speech')vp.st='Não ouvi nada. Pode falar.';vpaint()};
    r.onend=()=>{if(keep)setTimeout(()=>listen(SR),120)};try{r.start()}catch(e){}}
function stopVoice(){keep=false;try{rec&&rec.abort()}catch(e){}vp=null;render()}
['gesturestart','gesturechange','gestureend'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault()));
render();remind();setInterval(remind,60000);