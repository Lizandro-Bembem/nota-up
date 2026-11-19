const $=s=>document.querySelector(s),app=$('#app');
const CAP='<svg viewBox="0 0 48 40" fill="currentColor"><path d="M24 2 1 13l23 11 17-8v14h4V16l2-1v-2z"/><path d="M11 24v8c0 4 6 7 13 7s13-3 13-7v-8l-13 6z"/></svg>';
const IC={home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11 12 3l9 8v10H3z"/></svg>',hist:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>'};
let S={user:null,discs:[],grades:[],tasks:[],log:[],target:7,notified:{}},view='home',tab=1,sheet=null,listening=false,rec=null;
try{S=Object.assign(S,JSON.parse(localStorage.getItem('notaup')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('notaup',JSON.stringify(S))}catch(e){}};
const uid=()=>Math.random().toString(36).slice(2,9),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f=n=>(Math.round(n*10)/10).toFixed(1).replace('.',','),today=()=>new Date().toISOString().slice(0,10);
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
function render(){
    if(!S.user){return ob()}
    const v={home,hist,cal,cfg}[view]();
    app.innerHTML=`<main>${v}</main><button class="fab ${listening?'on':''}" onclick="mic()" aria-label="Falar com ${esc(S.user.nick)}">${IC.mic}</button><nav>${[['home','Início'],['hist','Histórico'],['cal','Calendário'],['cfg','Configurações']].map(([k,l])=>`<button class="${view==k?'on':''}" onclick="go('${k}')">${IC[k]}${l}</button>`).join('')}</nav>${sheet||''}`;
}
const go=v=>{view=v;sheet=null;render()};
function avatar(){return `<div class="av">${S.user.photo?`<img src="${S.user.photo}" alt="">`:esc(S.user.name[0]||'?').toUpperCase()}</div>`}
function ob(){app.innerHTML=`<main><div class="ob"><div class="logo">${CAP}NotaUp</div><h1 style="margin-top:18px">Suas Notas, Sua Evolução</h1><p class="sub">Crie seu perfil para começar.</p>
<label>Seu nome</label><input id="n" placeholder="Ex.: Lizandro">
<label>Defina o apelido do app</label><input id="k" placeholder="Ex.: Jarvis"><p class="sub" style="margin-top:6px">É assim que você chama o assistente por voz: “Oi, Jarvis, adiciona a nota…”</p>
<label>Foto (opcional)</label><input id="p" type="file" accept="image/*">
<button class="btn" style="margin-top:18px" onclick="reg()">Começar</button></div></main>`}
function reg(){const name=$('#n').value.trim(),nick=$('#k').value.trim();if(!name||!nick)return toast('Preencha seu nome e o apelido do app.');
    const fin=photo=>{S.user={name,nick,photo};log('Perfil criado: '+name+' (apelido do app: '+nick+')');save();render()};
    const fl=$('#p').files[0];if(!fl)return fin('');const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),s=Math.min(im.width,im.height);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,160,160);fin(c.toDataURL('image/jpeg',.8))};im.src=r.result};r.readAsDataURL(fl)}
function home(){const o=overall(),due=S.tasks.filter(t=>!t.done&&daysTo(t.date)>=0&&daysTo(t.date)<=3);
    return `<div class="row sp"><div class="logo">${CAP}NotaUp</div>${avatar()}</div>
 <h1 style="margin-top:18px">Olá, ${esc(S.user.name)}! 👋</h1><p class="sub" style="margin-top:4px">Meu apelido: <b>${esc(S.user.nick)}</b></p><p class="sub">Acompanhe sua evolução acadêmica.</p>
 <div class="g g2" style="margin-top:16px"><div class="card"><div class="sub">Média Geral</div><div class="big">${o===null?'–':f(o)}</div><div class="sub ${col(o)}">${o===null?'Sem notas':o>=S.target?'↑ Bom desempenho':'Atenção à média'}</div></div>
 <div class="card"><div class="sub">Disciplinas</div><div class="big">${String(S.discs.length).padStart(2,'0')}</div><div class="sub">Em acompanhamento</div></div></div>
 ${due.length?`<div class="card" style="margin-top:12px"><h2>Lembretes</h2>${due.map(t=>`<div class="it"><b>${esc(t.title)}</b><div class="sub">${daysTo(t.date)==0?'Entrega hoje':'Entrega em '+daysTo(t.date)+' dia(s)'} · ${esc(dn(t.d))}</div></div>`).join('')}</div>`:''}
 <div class="card" style="margin-top:12px"><div class="row sp"><h2>Minhas Disciplinas</h2><button class="btn sm alt" onclick="sheetDisc()">+ Nova</button></div>
 ${S.discs.length?S.discs.map(d=>{const a=discAvg(d.id);return `<div class="it" onclick="openDisc('${d.id}')" style="cursor:pointer"><div class="row sp"><b>${esc(d.name)}</b><span class="pill ${col(a)}">${a===null?'–':f(a)}</span></div><div class="bar"><i style="width:${a===null?0:a*10}%"></i></div><div class="sub" style="margin-top:4px">${need(d.id)}</div></div>`}).join(''):'<p class="sub" style="margin-top:10px">Nenhuma disciplina ainda. Toque em “+ Nova” ou diga “'+esc(S.user.nick)+', cria a matéria Matemática”.</p>'}</div>
 <button class="btn" style="margin-top:14px" onclick="sheetGrade()">+ Adicionar Nota</button>`}
const dn=id=>(S.discs.find(d=>d.id==id)||{name:'?'}).name;
const daysTo=d=>Math.round((new Date(d+'T12:00')-new Date(today()+'T12:00'))/864e5);
function hist(){const g=[...S.grades].sort((a,b)=>a.date<b.date?-1:1);
    const bars=S.discs.map(d=>{const a=discAvg(d.id);return a===null?'':`<div class="it"><div class="row sp"><span>${esc(d.name)}</span><b>${f(a)}</b></div><div class="bar"><i style="width:${a*10}%"></i></div></div>`}).join('');
    return `<h1>Histórico</h1><p class="sub">Seu desempenho por disciplina e todas as notas lançadas.</p>
 <div class="card" style="margin-top:14px"><h2>Média por disciplina</h2>${bars||'<p class="sub">Sem dados ainda.</p>'}</div>
 <div class="card" style="margin-top:12px"><h2>Notas lançadas</h2>${[...g].reverse().map(x=>`<div class="it"><div class="row sp"><div><b>${esc(x.name)}</b><div class="sub">${esc(dn(x.d))} · ${x.u}ª unidade · ${x.type} · ${dfmt(x.date)}</div></div><span class="pill">${f(x.s)}/${f(x.max)}</span></div></div>`).join('')||'<p class="sub">Nenhuma nota.</p>'}</div>`}
function cal(){const ev=[...S.tasks.map(t=>({date:t.date,t:'📌 '+t.title,s:dn(t.d)+(t.done?' · concluído':''),id:t.id,task:1})),...S.grades.map(g=>({date:g.date,t:'✅ '+g.name,s:dn(g.d)+' · '+f(g.s)+'/'+f(g.max)}))].sort((a,b)=>a.date<b.date?-1:1);
    const up=ev.filter(e=>e.date>=today()),past=ev.filter(e=>e.date<today()).reverse();
    const L=a=>a.map(e=>`<div class="it row sp"><div><b>${esc(e.t)}</b><div class="sub">${dfmt(e.date)} · ${esc(e.s)}</div></div>${e.task?`<button class="btn sm alt" onclick="doneT('${e.id}')">✓</button>`:''}</div>`).join('');
    return `<div class="row sp"><h1>Calendário</h1><button class="btn sm" onclick="sheetTask()">+ Entrega</button></div><p class="sub">Trabalhos, provas e notas lançadas por data.</p>
 <div class="card" style="margin-top:14px"><h2>Próximos</h2>${L(up)||'<p class="sub">Nada agendado.</p>'}</div><div class="card" style="margin-top:12px"><h2>Anteriores</h2>${L(past)||'<p class="sub">Vazio.</p>'}</div>`}
function cfg(){return `<h1>Configurações</h1>
 <div class="card row" style="margin-top:14px">${avatar()}<div><b>${esc(S.user.name)}</b><div class="sub">Apelido do app: ${esc(S.user.nick)}</div></div></div>
 <div class="card" style="margin-top:12px"><label style="margin:0">Média para aprovação</label><input type="number" step="0.5" value="${S.target}" onchange="S.target=+this.value||7;log('Média de aprovação alterada para '+S.target);save();render()">
 <label>Apelido do app</label><input value="${esc(S.user.nick)}" onchange="S.user.nick=this.value.trim()||S.user.nick;log('Apelido alterado para '+S.user.nick);save();render()">
 <button class="btn alt" style="margin-top:14px" onclick="Notification&&Notification.requestPermission().then(p=>toast(p=='granted'?'Notificações ativadas.':'Notificações bloqueadas.'))">Ativar notificações</button></div>
 <div class="card" style="margin-top:12px"><h2>Auditoria</h2><p class="sub">Tudo o que foi feito no app.</p>${S.log.map(l=>`<div class="it"><div style="font-size:14px">${esc(l.m)}</div><div class="sub">${new Date(l.t).toLocaleString('pt-BR')}</div></div>`).join('')||'<p class="sub">Sem registros.</p>'}</div>
 <button class="btn alt" style="margin-top:12px" onclick="if(confirm('Apagar todos os dados?')){localStorage.removeItem('notaup');location.reload()}">Apagar meus dados</button>`}
// sheets
const dopts=sel=>S.discs.map(d=>`<option value="${d.id}" ${d.id==sel?'selected':''}>${esc(d.name)}</option>`).join('');
const close=()=>{sheet=null;render()};
function open(h){sheet=`<div class="sheet" onclick="if(event.target==this)close()"><div>${h}</div></div>`;render()}
function sheetDisc(){open(`<h2>Nova disciplina</h2><label>Nome</label><input id="dn" placeholder="Ex.: Matemática"><button class="btn" style="margin-top:16px" onclick="addDisc($('#dn').value)">Salvar</button>`)}
function sheetGrade(d){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    open(`<h2>Adicionar nota</h2><label>Disciplina</label><select id="gd">${dopts(d)}</select><label>Unidade</label><select id="gu"><option>1</option><option>2</option><option>3</option></select><label>Tipo</label><select id="gt"><option>Prova</option><option>Trabalho</option></select><label>Descrição</label><input id="gn" placeholder="Ex.: Prova 1"><div class="row"><div><label>Valia</label><input id="gm" type="number" step="0.1" value="10"></div><div><label>Tirei</label><input id="gs" type="number" step="0.1"></div></div><button class="btn" style="margin-top:16px" onclick="addGrade($('#gd').value,+$('#gu').value,$('#gt').value,$('#gn').value,+$('#gm').value,+$('#gs').value)">Salvar nota</button>`)}
function sheetTask(){if(!S.discs.length){toast('Crie uma disciplina primeiro.');return sheetDisc()}
    open(`<h2>Nova entrega</h2><label>Disciplina</label><select id="td">${dopts()}</select><label>Título</label><input id="tt" placeholder="Ex.: Trabalho de Biologia"><label>Data de entrega</label><input id="tw" type="date"><p class="sub" style="margin-top:8px">Você recebe um lembrete 3 dias antes.</p><button class="btn" style="margin-top:16px" onclick="addTask($('#td').value,$('#tt').value,$('#tw').value)">Salvar</button>`)}
function openDisc(id){const d=S.discs.find(x=>x.id==id);
    open(`<div class="row sp"><h2>${esc(d.name)}</h2><button class="btn sm alt" onclick="if(confirm('Excluir disciplina e notas?')){delDisc('${id}')}">Excluir</button></div><div class="tab">${[1,2,3].map(u=>`<button class="${tab==u?'on':''}" onclick="tab=${u};openDisc('${id}')">${u}ª unidade</button>`).join('')}</div>
 <div class="card"><div class="sub">Média da unidade</div><div class="big ${col(unitAvg(id,tab))}">${unitAvg(id,tab)===null?'–':f(unitAvg(id,tab))}</div></div>
 <div class="card" style="margin-top:12px"><div class="sub">Média final</div><b style="font-size:22px">${discAvg(id)===null?'–':f(discAvg(id))}</b><div class="sub">${need(id)}</div></div>
 ${S.grades.filter(g=>g.d==id&&g.u==tab).map(g=>`<div class="it row sp"><div><b>${esc(g.name)}</b><div class="sub">${g.type} · ${dfmt(g.date)}</div></div><div class="row"><span class="pill">${f(g.s)}/${f(g.max)}</span><button class="btn sm alt" onclick="delGrade('${g.id}','${id}')">✕</button></div></div>`).join('')}
 <button class="btn" style="margin-top:14px" onclick="sheetGrade('${id}')">+ Adicionar Nota</button>`)}
// ações
function addDisc(n){n=(n||'').trim();if(!n)return toast('Informe o nome.');const ex=S.discs.find(d=>norm(d.name)==norm(n));if(ex)return ex;const d={id:uid(),name:n};S.discs.push(d);log('Disciplina criada: '+n);save();close();return d}
function addGrade(d,u,type,name,max,s){if(!d||isNaN(s)||!max)return toast('Informe a nota e o valor.');if(s>max)return toast('A nota não pode passar do valor.');
    S.grades.push({id:uid(),d,u,type,name:name||type+' de '+dn(d),max,s,date:today()});log(`Nota lançada: ${type} ${name||''} de ${dn(d)} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();close();toast('Nota salva!')}
function addTask(d,title,date){if(!title||!date)return toast('Informe título e data.');S.tasks.push({id:uid(),d,title,date,done:false});log(`Entrega agendada: ${title} para ${dfmt(date)}`);save();close();remind()}
function doneT(id){const t=S.tasks.find(x=>x.id==id);t.done=!t.done;log((t.done?'Entrega concluída: ':'Entrega reaberta: ')+t.title);save();render()}
function delDisc(id){const n=dn(id);S.discs=S.discs.filter(d=>d.id!=id);S.grades=S.grades.filter(g=>g.d!=id);S.tasks=S.tasks.filter(t=>t.d!=id);log('Disciplina excluída: '+n);save();close()}
function delGrade(id,d){const g=S.grades.find(x=>x.id==id);S.grades=S.grades.filter(x=>x.id!=id);log('Nota removida: '+g.name);save();openDisc(d)}
function remind(){S.tasks.forEach(t=>{const n=daysTo(t.date);if(!t.done&&n>=0&&n<=3&&!S.notified[t.id]){S.notified[t.id]=1;save();const m=`${t.title} – entrega ${n==0?'hoje':'em '+n+' dia(s)'}`;toast('⏰ '+m);try{if(Notification.permission=='granted')new Notification('NotaUp',{body:m})}catch(e){}}})}
// voz
function num(s){const m=s.match(/\d+(?:[.,]\d+)?/g);return m?m.map(x=>parseFloat(x.replace(',','.'))):[]}
function findDisc(t){return [...S.discs].sort((a,b)=>b.name.length-a.name.length).find(d=>t.includes(norm(d.name)))}
function voice(raw){const t=norm(raw.replace(/(\d)\s*(virgula|ponto)\s*(\d)/g,'$1.$3')),k=norm(S.user.nick);
    if(!t.includes(k)){return toast('Diga “Oi, '+S.user.nick+'” antes do comando.')}
    const c=t.slice(t.indexOf(k)+k.length);
    let m=c.match(/(?:cria|cadastra|adiciona|nova)\s+(?:a\s+)?(?:materia|disciplina)\s+(?:de\s+)?(.+)/);
    if(m){const n=m[1].trim().replace(/^./,x=>x.toUpperCase());addDisc(n);return toast('Disciplina criada: '+n)}
    if(/(apaga|remove|exclui|desfaz).*(ultima|nota)/.test(c)){const g=S.grades.pop();if(!g)return toast('Não há notas.');log('Nota removida por voz: '+g.name);save();render();return toast('Última nota removida.')}
    if(/(lembra|agenda|adiciona).*(entrega|trabalho|prova).*(dia|para)/.test(c)&&/dia\s*\d+/.test(c)&&!/tirei|tirou|nota/.test(c)){const d=findDisc(c);const dd=+c.match(/dia\s*(\d+)/)[1];const dt=new Date();if(dd<dt.getDate())dt.setMonth(dt.getMonth()+1);dt.setDate(dd);if(!d)return toast('Não achei a disciplina.');const iso=dt.toISOString().slice(0,10);addTask(d.id,(/prova/.test(c)?'Prova':'Trabalho')+' de '+d.name,iso);return toast('Entrega agendada para '+dfmt(iso))}
    if(/adiciona|lanca|registra|coloca/.test(c)&&/nota|trabalho|prova/.test(c)){const d=findDisc(c);if(!d)return toast('Não achei essa disciplina. Crie antes: “'+S.user.nick+', cria a matéria …”');
        const type=/prova/.test(c)?'Prova':'Trabalho';const vm=c.match(/val(?:ia|e|endo)\s*(\d+(?:\.\d+)?)/),sm=c.match(/(?:tirei|tirou|fiz|consegui)\s*(\d+(?:\.\d+)?)/),um=c.match(/(\d)\s*(?:a|º|o)?\s*unidade/)||c.match(/unidade\s*(\d)/);
        const nums=num(c);const max=vm?+vm[1]:10,s=sm?+sm[1]:(nums.length?nums[nums.length-1]:NaN);
        if(isNaN(s))return toast('Não entendi a nota. Diga “tirei 3,5”.');if(s>max)return toast('A nota não pode passar do valor.');
        const u=um?+um[1]:1;S.grades.push({id:uid(),d:d.id,u,type,name:type+' de '+d.name,max,s,date:today()});log(`Nota lançada por voz: ${type} de ${d.name} (${u}ª unidade) – ${f(s)}/${f(max)}`);save();render();return toast(`${type} de ${d.name}: ${f(s)}/${f(max)} salvo.`)}
    toast('Não entendi. Exemplo: “Oi '+S.user.nick+', adiciona a nota do trabalho de Biologia, valia 5, tirei 3,5”.')}
function mic(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return toast('Seu navegador não suporta voz. Use o Chrome ou Safari.');
    if(listening){rec&&rec.stop();return}
    rec=new SR();rec.lang='pt-BR';rec.onstart=()=>{listening=true;render();toast('Ouvindo… diga “Oi, '+S.user.nick+'”')};
    rec.onresult=e=>{const tx=e.results[0][0].transcript;log('Comando de voz: “'+tx+'”');voice(tx)};
    rec.onerror=e=>{toast(e.error=='not-allowed'?'Permita o microfone para usar a voz.':'Não consegui ouvir. Tente de novo.')};
    rec.onend=()=>{listening=false;render()};try{rec.start()}catch(e){}}
render();remind();