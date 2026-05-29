
// ── ESTADO ──
let db = {
  adubos: JSON.parse(localStorage.getItem('ag_adubos')||'[]'),
  movs:   JSON.parse(localStorage.getItem('ag_movs')||'[]'),
};
let editId = null;
let movTipo = 'entrada';

function save(){
  localStorage.setItem('ag_adubos', JSON.stringify(db.adubos));
  localStorage.setItem('ag_movs',   JSON.stringify(db.movs));
}

// ── NAVEGAÇÃO ──
function go(pg){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+pg).classList.add('active');
  const idx = {dash:0,adubos:1,estoque:2,alertas:3,historico:4};
  document.querySelectorAll('.nav-item')[idx[pg]].classList.add('active');
  render(pg);
}

// ── RENDER ──
function render(pg){
  if(pg==='dash')      renderDash();
  if(pg==='adubos')    renderAdubos();
  if(pg==='estoque')   renderEstoque();
  if(pg==='alertas')   renderAlertas();
  if(pg==='historico') renderHistorico();
}

function statusAdubo(a){
  if(a.qtd<=0) return {cls:'badge-out',txt:'⛔ Sem estoque'};
  if(a.qtd<=a.min) return {cls:'badge-low',txt:'⚠️ Estoque baixo'};
  return {cls:'badge-ok',txt:'✅ OK'};
}

// ── DASHBOARD ──
function renderDash(){
  const total = db.adubos.length;
  const baixo = db.adubos.filter(a=>a.qtd>0&&a.qtd<=a.min).length;
  const sem   = db.adubos.filter(a=>a.qtd<=0).length;
  const movs  = db.movs.length;
  document.getElementById('dash-stats').innerHTML=`
    <div class="stat"><div class="stat-ico g">🧪</div><div class="stat-info"><p>Total de Adubos</p><strong>${total}</strong></div></div>
    <div class="stat"><div class="stat-ico y">⚠️</div><div class="stat-info"><p>Estoque Baixo</p><strong>${baixo}</strong></div></div>
    <div class="stat"><div class="stat-ico r">⛔</div><div class="stat-info"><p>Sem Estoque</p><strong>${sem}</strong></div></div>
    <div class="stat"><div class="stat-ico b">🔄</div><div class="stat-info"><p>Movimentações</p><strong>${movs}</strong></div></div>
  `;
  // alertas
  const alerts = db.adubos.filter(a=>a.qtd<=a.min);
  const da = document.getElementById('dash-alertas');
  if(!alerts.length){ da.innerHTML='<div class="empty-state"><div class="empty-ico">✅</div><p>Nenhum alerta no momento</p></div>'; }
  else {
    da.innerHTML='<div class="alert-list">'+alerts.slice(0,4).map(a=>{
      const cls = a.qtd<=0?'out':'low';
      return `<div class="alert-item ${cls}"><span class="alert-ico">${a.qtd<=0?'⛔':'⚠️'}</span><div class="alert-info"><p>${a.nome}</p><span>Estoque: ${a.qtd} ${a.un} | Mín: ${a.min} ${a.un}</span></div></div>`;
    }).join('')+'</div>';
  }
  // hist
  const dh = document.getElementById('dash-hist');
  const ultimas = [...db.movs].reverse().slice(0,5);
  if(!ultimas.length){ dh.innerHTML='<div class="empty-state"><div class="empty-ico">📋</div><p>Nenhuma movimentação ainda</p></div>'; }
  else {
    dh.innerHTML = ultimas.map(m=>`
      <div class="hist-item">
        <div class="hist-dot ${m.tipo==='entrada'?'e':'s'}">${m.tipo==='entrada'?'📥':'📤'}</div>
        <div class="hist-info"><p>${m.aduboNome}</p><span>${m.data} ${m.motivo?'· '+m.motivo:''}</span></div>
        <div class="hist-qty ${m.tipo==='entrada'?'e':'s'}">${m.tipo==='entrada'?'+':'-'}${m.qtd} ${m.un}</div>
      </div>`).join('');
  }
}

// ── ADUBOS ──
function renderAdubos(){
  const tbody = document.getElementById('tbl-adubos');
  if(!db.adubos.length){
    tbody.innerHTML=`<tr><td colspan="7"><div class="empty-state"><div class="empty-ico">🧪</div><p>Nenhum adubo cadastrado ainda.<br>Clique em "Novo Adubo" para começar.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = db.adubos.map(a=>{
    const s = statusAdubo(a);
    return `<tr>
      <td><strong>${a.nome}</strong>${a.fab?`<br><span style="font-size:11px;color:var(--cinza)">${a.fab}</span>`:''}}</td>
      <td><span class="badge badge-type">${a.tipo}</span></td>
      <td>${a.npk||'—'}</td>
      <td><strong>${a.qtd}</strong> ${a.un}</td>
      <td>${a.min} ${a.un}</td>
      <td><span class="badge ${s.cls}">${s.txt}</span></td>
      <td style="display:flex;gap:6px;">
        <button class="btn btn-warn btn-sm" onclick="editarAdubo(${a.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="excluirAdubo(${a.id})">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ── ESTOQUE ──
function renderEstoque(){
  // popular select
  const sel = document.getElementById('mov-adubo');
  sel.innerHTML='<option value="">Selecione o adubo...</option>'+
    db.adubos.map(a=>`<option value="${a.id}">${a.nome} (${a.qtd} ${a.un})</option>`).join('');
  // tabela
  const tbody = document.getElementById('tbl-estoque');
  if(!db.adubos.length){
    tbody.innerHTML=`<tr><td colspan="5"><div class="empty-state"><div class="empty-ico">📦</div><p>Nenhum adubo cadastrado</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = db.adubos.map(a=>{
    const s=statusAdubo(a);
    return `<tr>
      <td><strong>${a.nome}</strong></td>
      <td><span class="badge badge-type">${a.tipo}</span></td>
      <td><strong>${a.qtd}</strong> ${a.un}</td>
      <td>${a.min} ${a.un}</td>
      <td><span class="badge ${s.cls}">${s.txt}</span></td>
    </tr>`;
  }).join('');
}

// ── ALERTAS ──
function renderAlertas(){
  const body = document.getElementById('alertas-body');
  const items = db.adubos.filter(a=>a.qtd<=a.min);
  if(!items.length){
    body.innerHTML='<div class="empty-state"><div class="empty-ico">✅</div><p>Tudo certo! Nenhum alerta no momento.</p></div>';
    return;
  }
  body.innerHTML='<div class="alert-list">'+items.map(a=>{
    const sem = a.qtd<=0;
    return `<div class="alert-item ${sem?'out':'low'}">
      <span class="alert-ico">${sem?'⛔':'⚠️'}</span>
      <div class="alert-info" style="flex:1">
        <p>${a.nome} <span class="badge badge-type" style="margin-left:6px">${a.tipo}</span></p>
        <span>Estoque atual: <strong>${a.qtd} ${a.un}</strong> | Mínimo: ${a.min} ${a.un}</span>
      </div>
      <button class="btn btn-pri btn-sm" onclick="go('estoque')">📥 Repor</button>
    </div>`;
  }).join('')+'</div>';
}

// ── HISTÓRICO ──
function renderHistorico(){
  const tbody = document.getElementById('tbl-hist');
  const lista = [...db.movs].reverse();
  if(!lista.length){
    tbody.innerHTML=`<tr><td colspan="6"><div class="empty-state"><div class="empty-ico">📋</div><p>Nenhuma movimentação registrada</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(m=>`<tr>
    <td>${m.data}</td>
    <td>${m.aduboNome}</td>
    <td><span class="badge ${m.tipo==='entrada'?'badge-ok':'badge-out'}">${m.tipo==='entrada'?'📥 Entrada':'📤 Saída'}</span></td>
    <td><strong>${m.qtd}</strong> ${m.un}</td>
    <td>${m.motivo||'—'}</td>
    <td>${m.resp||'—'}</td>
  </tr>`).join('');
}

// ── MODAL ADUBO ──
function abrirModalAdubo(id=null){
  editId=id;
  document.getElementById('modal-titulo').textContent = id?'Editar Adubo':'Novo Adubo';
  limparModalAdubo();
  if(id){
    const a=db.adubos.find(x=>x.id===id);
    if(a){
      document.getElementById('a-nome').value=a.nome;
      document.getElementById('a-tipo').value=a.tipo;
      document.getElementById('a-npk').value=a.npk||'';
      document.getElementById('a-fab').value=a.fab||'';
      document.getElementById('a-qtd').value=a.qtd;
      document.getElementById('a-un').value=a.un;
      document.getElementById('a-min').value=a.min||0;
      document.getElementById('a-obs').value=a.obs||'';
    }
  }
  document.getElementById('modal-adubo-overlay').classList.add('open');
}
function fecharModal(){
  document.getElementById('modal-adubo-overlay').classList.remove('open');
  editId=null;
}
function limparModalAdubo(){
  ['a-nome','a-tipo','a-npk','a-fab','a-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('a-qtd').value='';
  document.getElementById('a-min').value='';
  document.getElementById('a-un').value='kg';
  document.querySelectorAll('.err-msg').forEach(e=>e.style.display='none');
  document.querySelectorAll('.modal input,.modal select').forEach(e=>e.classList.remove('err'));
}

function salvarAdubo(){
  const nome=document.getElementById('a-nome').value.trim();
  const tipo=document.getElementById('a-tipo').value;
  const qtd=parseFloat(document.getElementById('a-qtd').value)||0;
  let ok=true;
  if(!nome){document.getElementById('a-nome').classList.add('err');document.getElementById('err-a-nome').style.display='block';ok=false;}
  else{document.getElementById('a-nome').classList.remove('err');document.getElementById('err-a-nome').style.display='none';}
  if(!tipo){document.getElementById('a-tipo').classList.add('err');document.getElementById('err-a-tipo').style.display='block';ok=false;}
  else{document.getElementById('a-tipo').classList.remove('err');document.getElementById('err-a-tipo').style.display='none';}
  if(qtd<0||document.getElementById('a-qtd').value===''){document.getElementById('a-qtd').classList.add('err');document.getElementById('err-a-qtd').style.display='block';ok=false;}
  else{document.getElementById('a-qtd').classList.remove('err');document.getElementById('err-a-qtd').style.display='none';}
  if(!ok) return;

  const obj={
    id: editId||Date.now(),
    nome, tipo,
    npk: document.getElementById('a-npk').value.trim(),
    fab: document.getElementById('a-fab').value.trim(),
    qtd,
    un:  document.getElementById('a-un').value,
    min: parseFloat(document.getElementById('a-min').value)||0,
    obs: document.getElementById('a-obs').value.trim(),
  };

  if(editId){
    const i=db.adubos.findIndex(x=>x.id===editId);
    db.adubos[i]=obj;
    toast('Adubo atualizado!','s');
  } else {
    db.adubos.push(obj);
    toast('Adubo cadastrado!','s');
  }
  save(); fecharModal(); renderAdubos();
}

function editarAdubo(id){ abrirModalAdubo(id); }

function excluirAdubo(id){
  if(!confirm('Excluir este adubo?')) return;
  db.adubos=db.adubos.filter(a=>a.id!==id);
  save(); renderAdubos(); toast('Adubo removido','e');
}

// ── MOVIMENTAÇÃO ──
function selTipo(t){
  movTipo=t;
  document.getElementById('btn-entrada').classList.toggle('sel',t==='entrada');
  document.getElementById('btn-saida').classList.toggle('sel',t==='saida');
}

function salvarMov(){
  const aid=document.getElementById('mov-adubo').value;
  const qtd=parseFloat(document.getElementById('mov-qtd').value);
  let ok=true;
  if(!aid){document.getElementById('mov-adubo').classList.add('err');document.getElementById('err-mov-adubo').style.display='block';ok=false;}
  else{document.getElementById('mov-adubo').classList.remove('err');document.getElementById('err-mov-adubo').style.display='none';}
  if(!qtd||qtd<=0){document.getElementById('mov-qtd').classList.add('err');document.getElementById('err-mov-qtd').style.display='block';ok=false;}
  else{document.getElementById('mov-qtd').classList.remove('err');document.getElementById('err-mov-qtd').style.display='none';}
  if(!ok) return;

  const a=db.adubos.find(x=>x.id==aid);
  if(movTipo==='saida'&&qtd>a.qtd){ toast('Quantidade maior que o estoque disponível!','e'); return; }

  if(movTipo==='entrada') a.qtd+=qtd;
  else a.qtd-=qtd;
  a.qtd=Math.round(a.qtd*100)/100;

  const now=new Date();
  db.movs.push({
    id:Date.now(), tipo:movTipo,
    aduboId:a.id, aduboNome:a.nome,
    qtd, un:document.getElementById('mov-un').value,
    motivo:document.getElementById('mov-motivo').value.trim(),
    resp:document.getElementById('mov-resp').value.trim(),
    data:now.toLocaleDateString('pt-BR')+' '+now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
  });

  save();
  document.getElementById('mov-qtd').value='';
  document.getElementById('mov-motivo').value='';
  document.getElementById('mov-resp').value='';
  document.getElementById('mov-adubo').value='';
  renderEstoque();
  toast(`${movTipo==='entrada'?'Entrada':'Saída'} registrada!`, movTipo==='entrada'?'s':'w');
}

function limparHistorico(){
  if(!confirm('Limpar todo o histórico de movimentações?')) return;
  db.movs=[];
  save(); renderHistorico(); toast('Histórico limpo','e');
}

// ── TOAST ──
function toast(msg,tipo='s'){
  const t=document.getElementById('toast');
  t.textContent = tipo==='s'?'✅ '+msg : tipo==='e'?'❌ '+msg : '⚠️ '+msg;
  t.className='toast '+tipo+' show';
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ── DADOS DEMO se vazio ──
if(!db.adubos.length){
  db.adubos=[
    {id:1,nome:'Ureia 45%',tipo:'Nitrogenado',npk:'45-00-00',fab:'Yara Brasil',qtd:1200,un:'kg',min:500,obs:''},
    {id:2,nome:'MAP Fosfato',tipo:'Fosfatado',npk:'11-52-00',fab:'Mosaic',qtd:350,un:'kg',min:300,obs:''},
    {id:3,nome:'NPK 10-10-10',tipo:'NPK Composto',npk:'10-10-10',fab:'Nutrien',qtd:80,un:'sc',min:50,obs:''},
    {id:4,nome:'Calcário Dolomítico',tipo:'Calcário',npk:'',fab:'AgroShop',qtd:8,un:'ton',min:10,obs:'Atenção: abaixo do mínimo'},
    {id:5,nome:'Composto Orgânico',tipo:'Orgânico',npk:'',fab:'AgroShop',qtd:0,un:'kg',min:200,obs:''},
  ];
  db.movs=[
    {id:1,tipo:'entrada',aduboId:1,aduboNome:'Ureia 45%',qtd:500,un:'kg',motivo:'Compra inicial',resp:'João Silva',data:'20/04/2026 08:30'},
    {id:2,tipo:'saida',aduboId:1,aduboNome:'Ureia 45%',qtd:100,un:'kg',motivo:'Aplicação talhão A',resp:'João Silva',data:'21/04/2026 14:00'},
    {id:3,tipo:'entrada',aduboId:3,aduboNome:'NPK 10-10-10',qtd:30,un:'sc',motivo:'Reposição',resp:'Maria Costa',data:'22/04/2026 09:15'},
  ];
  save();
}

// init
renderDash();

// ── SUPABASE CONFIG ──
const SUPABASE_URL = "https://bovhzscieveyaicgvrzo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvdmh6c2NpZXZleWFpY2d2cnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTY0MDEsImV4cCI6MjA5NTU3MjQwMX0.CKi7MMklh4r78_KJZa_d--6cvgtw9wMaP8jqf1hggPY"
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// ── LOGIN ──
async function fazerLogin() {
  const usuario = document.getElementById('login-user').value.trim()
  const senha   = document.getElementById('login-senha').value.trim()
  const err     = document.getElementById('login-err')
  err.style.display = 'none'

  if (!usuario || !senha) {
    err.style.display = 'block'
    err.textContent = '⚠️ Preencha usuário e senha'
    return
  }

  const { data, error } = await sb
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .single()

  if (data) {
    document.getElementById('tela-login').style.display = 'none'
    document.getElementById('app').style.display = 'flex'
    document.getElementById('nome-logado').textContent = data.nome
    toast('Bem-vindo, ' + data.nome + '!', 's')
  } else {
    err.style.display = 'block'
    err.textContent = '⚠️ Usuário ou senha incorretos'
  }
}

// ── CADASTRO ──
async function cadastrarUsuario() {
  const nome    = document.getElementById('cad-nome').value.trim()
  const usuario = document.getElementById('cad-user').value.trim()
  const senha   = document.getElementById('cad-senha').value.trim()
  const conf    = document.getElementById('cad-conf').value.trim()
  const err     = document.getElementById('cad-err')
  err.style.display = 'none'

  if (!nome || !usuario || !senha || !conf) {
    err.style.display = 'block'
    err.textContent = '⚠️ Preencha todos os campos'
    return
  }
  if (senha.length < 4) {
    err.style.display = 'block'
    err.textContent = '⚠️ Senha deve ter mínimo 4 caracteres'
    return
  }
  if (senha !== conf) {
    err.style.display = 'block'
    err.textContent = '⚠️ As senhas não coincidem'
    return
  }
  if (usuario.includes(' ')) {
    err.style.display = 'block'
    err.textContent = '⚠️ Usuário não pode ter espaços'
    return
  }

  const { error } = await sb
    .from('usuarios')
    .insert({ nome, usuario, senha })

  if (error) {
    err.style.display = 'block'
    err.textContent = error.code === '23505'
      ? '⚠️ Esse usuário já existe'
      : '⚠️ Erro ao cadastrar: ' + error.message
  } else {
    toast('Conta criada! Faça login.', 's')
    mostrarLogin()
    document.getElementById('login-user').value = usuario
  }
}

// ── ALTERNAR PAINÉIS ──
function mostrarCadastro() {
  document.getElementById('painel-login').style.display = 'none'
  document.getElementById('painel-cadastro').style.display = 'block'
}
function mostrarLogin() {
  document.getElementById('painel-cadastro').style.display = 'none'
  document.getElementById('painel-login').style.display = 'block'
}
function sair() {
  document.getElementById('app').style.display = 'none'
  document.getElementById('tela-login').style.display = 'flex'
  document.getElementById('login-user').value = ''
  document.getElementById('login-senha').value = ''
  document.getElementById('login-err').style.display = 'none'
  mostrarLogin()
}
