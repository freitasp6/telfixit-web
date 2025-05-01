// public/app.js

// Faz fetch com token de autenticação
async function authFetch(url, opts = {}) {
  opts.headers = {
    ...(opts.headers || {}),
    'Authorization': `Bearer ${localStorage.token}`
  };
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return res;
}

// Mostra alertas no canto superior direito
function alerta(msg, type = 'success') {
  const container = document.getElementById('alertContainer');
  const a = document.createElement('div');
  a.className = `alert alert-${type} alert-dismissible fade show`;
  a.innerHTML = `
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.appendChild(a);
  setTimeout(() => a.remove(), 4000);
}

// Mostrar/ocultar painéis
function showPanel(id) {
  [
    'panelNovaWO',
    'panelCriarEquipa',
    'panelConsultarEquipas',
    'panelEstatisticas',
    'painel',
    'searchPanel'
  ].forEach(pid => {
    const el = document.getElementById(pid);
    if (el) el.classList.add('d-none');
  });
  if (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('d-none');
  }
}

// Variáveis globais
let wos = [];
let equipas = [];
let modo = 'pendentes';  // ou 'fechadas'

// Carrega WOs do servidor
async function carregarWOs() {
  try {
    const res = await authFetch('/wos');
    wos = await res.json();
    renderWOs();
  } catch (err) {
    alerta(`Erro a carregar WOs: ${err.message}`, 'danger');
  }
}

// Carrega equipas do servidor
async function carregarEquipas() {
  try {
    const res = await authFetch('/equipas');
    equipas = await res.json();
    renderEquipas();
  } catch (err) {
    alerta(`Erro a carregar equipas: ${err.message}`, 'danger');
  }
}

// Gera classe de SLA com base na data limite
function slaClass(wo) {
  if (!wo.data) return '';
  const diff = (new Date(wo.data) - new Date()) / 36e5;
  if (diff < 0) return 'sla-red';
  if (diff < 24) return 'sla-ora';
  return 'sla-grn';
}

// Renderiza a lista de equipas na tabela
function renderEquipas() {
  const tb = document.getElementById('tblEquipas');
  if (!tb) return;
  tb.innerHTML = '';
  equipas.forEach(eq => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${eq.tecnico}</td>
      <td>${eq.empresa}</td>
      <td>${eq.zona}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger btn-del-equipa">
          Apagar
        </button>
      </td>
    `;
    tb.appendChild(tr);
    tr.querySelector('.btn-del-equipa').onclick = async () => {
      if (!confirm('Eliminar equipa?')) return;
      try {
        await authFetch(`/equipas/${encodeURIComponent(eq.tecnico)}`, { method: 'DELETE' });
        alerta('Equipa removida');
        carregarEquipas();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };
  });
}

// Renderiza os cartões de WO
function renderWOs() {
  const container = document.getElementById('painel');
  const filtro = document.getElementById('searchInput')?.value.toLowerCase() || '';
  container.innerHTML = '';

  const lista = wos
    .filter(w => modo === 'pendentes'
      ? (w.estado === 'Pendente' || w.estado === 'Em Curso')
      : (w.estado === 'Fechada')
    )
    .filter(w => w.assunto.toLowerCase().includes(filtro));

  lista.forEach((wo, i) => {
    const col = document.createElement('div');
    col.className = 'col-12 mb-3';

    col.innerHTML = `
      <div class="card ${slaClass(wo)}">
        <div class="card-header d-flex justify-content-between pointer" 
             data-bs-toggle="collapse" data-bs-target="#det${i}">
          <div><strong>${wo.assunto}</strong> (${wo.estado})</div>
          <button class="btn btn-sm btn-outline-danger btn-del-wo">Apagar</button>
        </div>
        <div id="det${i}" class="collapse">
          <div class="card-body">
            <p><strong>Data Limite:</strong> ${wo.data||''}</p>
            <p><strong>Zona:</strong> ${wo.zona||''}</p>
            <p><strong>Técnico:</strong> ${wo.tecnico||''}</p>
            <p><strong>Empresa:</strong> ${wo.empresa||''}</p>
            <p><strong>Descrição:</strong><br/>${wo.descricao||''}</p>
            <p><strong>Localização:</strong> ${wo.local||''}</p>
            <p><strong>Link Óptico:</strong><br/>${wo.link_optico||''}</p>
            <hr/>

            <h6>Alterar Estado</h6>
            <button class="btn btn-sm btn-outline-success mb-2 btn-curso">Em Curso</button>
            <button class="btn btn-sm btn-outline-primary mb-3 btn-fechada">Fechada</button>
            <hr/>

            <h6>Comentários Técnico</h6>
            <ul>${(wo.comentarios_tecnico||[]).map(c=>`<li>${c}</li>`).join('')||'<li>(sem)</li>'}</ul>
            <h6>Comentários Backoffice</h6>
            <ul>${(wo.comentarios_backoffice||[]).map(c=>`<li>${c}</li>`).join('')||'<li>(sem)</li>'}</ul>

            <div class="input-group mb-3">
              <select class="form-select tipo-comentario" style="max-width:150px">
                <option value="tecnico">Técnico</option>
                <option value="backoffice">Backoffice</option>
              </select>
              <input type="text" class="form-control comentario-input" placeholder="Comentário..."/>
              <button class="btn btn-outline-primary btn-add-comentario">Enviar</button>
            </div>

            <div class="mb-2 fotos-list">
              ${(wo.fotos||[]).map(f=>`
                <a href="${f.path}" target="_blank">
                  <img src="${f.path}" class="foto-thumb rounded"/>
                </a>`).join('')||'(sem)'}
            </div>

            <div class="input-group">
              <input type="file" multiple class="form-control fotos-input"/>
              <button class="btn btn-outline-primary btn-upload-fotos">Upload</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(col);

    // handlers:
    const header = col.querySelector('.btn-del-wo');
    header.onclick = async ev => {
      ev.stopPropagation();
      if (!confirm('Eliminar WO?')) return;
      try {
        await authFetch(`/wos/${encodeURIComponent(wo.assunto)}`, { method: 'DELETE' });
        alerta('WO eliminada');
        carregarWOs();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };

    col.querySelector('.btn-curso').onclick = async () => {
      try {
        await authFetch(`/wos/${encodeURIComponent(wo.assunto)}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ estado: 'Em Curso' })
        });
        alerta('Estado alterado para Em Curso');
        carregarWOs();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };

    col.querySelector('.btn-fechada').onclick = async () => {
      try {
        await authFetch(`/wos/${encodeURIComponent(wo.assunto)}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ estado: 'Fechada' })
        });
        alerta('Estado alterado para Fechada');
        carregarWOs();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };

    col.querySelector('.btn-add-comentario').onclick = async () => {
      const tipo = col.querySelector('.tipo-comentario').value;
      const txt  = col.querySelector('.comentario-input').value.trim();
      if (!txt) return alerta('Comentário vazio','danger');
      try {
        await authFetch(`/comentarios/${encodeURIComponent(wo.assunto)}`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ tipo, comentario: txt })
        });
        alerta('Comentário enviado');
        carregarWOs();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };

    col.querySelector('.btn-upload-fotos').onclick = async () => {
      const files = col.querySelector('.fotos-input').files;
      if (!files.length) return alerta('Selecione pelo menos 1 foto','danger');
      const fd = new FormData();
      [...files].forEach(f => fd.append('fotos', f));
      try {
        await authFetch(`/fotos/${encodeURIComponent(wo.assunto)}`, {
          method: 'POST',
          body: fd
        });
        alerta('Fotos enviadas');
        carregarWOs();
      } catch (err) {
        alerta(`Erro: ${err.message}`, 'danger');
      }
    };
  });

  // atualiza estatísticas
  document.getElementById('statTotal').textContent     = wos.length;
  document.getElementById('statPendentes').textContent = wos.filter(w=>['Pendente','Em Curso'].includes(w.estado)).length;
  document.getElementById('statFechadas').textContent  = wos.filter(w=>w.estado==='Fechada').length;
}

// criar nova WO
document.getElementById('btnNovaWO').onclick = async () => {
  showPanel('panelNovaWO');
  ['inAssunto','inData','inDesc','inLocal','inLink'].forEach(id => {
    document.getElementById(id).value = '';
  });
  await carregarEquipas();
  populateZonas();
};

// pendentes / fechadas / pesquisar
document.getElementById('btnPendentes').onclick   = () => { modo='pendentes'; showPanel('painel'); renderWOs(); };
document.getElementById('btnFechadas').onclick    = () => { modo='fechadas';  showPanel('painel'); renderWOs(); };
document.getElementById('btnPesquisar').onclick   = () => showPanel('searchPanel');

// criar / consultar equipas
document.getElementById('btnCriarEquipa').onclick      = () => showPanel('panelCriarEquipa');
document.getElementById('btnConsultarEquipas').onclick = () => { showPanel('panelConsultarEquipas'); renderEquipas(); };
document.getElementById('btnEstatisticas').onclick     = () => showPanel('panelEstatisticas');

// menu utilizadores e logout
document.getElementById('btnUsers').onclick  = () => window.location = 'users.html';
document.getElementById('btnLogout').onclick = () => {
  localStorage.removeItem('token');
  window.location = 'login.html';
};

// salvar equipa
document.getElementById('saveEquipe').onclick = async () => {
  const te = document.getElementById('inEqTecnico').value.trim();
  const em = document.getElementById('inEqEmpresa').value.trim();
  const zo = document.getElementById('inEqZona').value.trim();
  if (!te||!em||!zo) return alerta('Preencha todos os campos','danger');
  try {
    await authFetch('/equipas', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tecnico:te, empresa:em, zona:zo })
    });
    alerta('Equipa criada');
    carregarEquipas();
  } catch (err) {
    alerta(`Erro: ${err.message}`, 'danger');
  }
};

// dependências de Nova WO
function populateZonas() {
  const sel = document.getElementById('inZona');
  sel.innerHTML = '<option value="">— selecione —</option>';
  [...new Set(equipas.map(e=>e.zona))].forEach(z => {
    sel.innerHTML += `<option>${z}</option>`;
  });
  sel.disabled = false;
  const t = document.getElementById('inTecnico');
  t.innerHTML = '<option value="">— selecione —</option>';
  t.disabled = true;
  const e = document.getElementById('inEmpresa');
  e.innerHTML = '<option value="">— selecione —</option>';
  e.disabled = true;
}
function populateTecnicos(zona) {
  const sel = document.getElementById('inTecnico');
  sel.innerHTML = '<option value="">— selecione —</option>';
  equipas.filter(e=>e.zona===zona).forEach(eq => {
    sel.innerHTML += `<option>${eq.tecnico}</option>`;
  });
  sel.disabled = false;
  const e = document.getElementById('inEmpresa');
  e.innerHTML = '<option value="">— selecione —</option>';
  e.disabled = true;
}
function populateEmpresas(tecnico) {
  const sel = document.getElementById('inEmpresa');
  sel.innerHTML = '<option value="">— selecione —</option>';
  const eq = equipas.find(e=>e.tecnico===tecnico);
  if (eq) sel.innerHTML += `<option>${eq.empresa}</option>`;
  sel.disabled = false;
}
document.getElementById('inZona').addEventListener('change', e=> populateTecnicos(e.target.value));
document.getElementById('inTecnico').addEventListener('change', e=> populateEmpresas(e.target.value));

// salvar WO
document.getElementById('saveWO').onclick = async () => {
  const assunto = document.getElementById('inAssunto').value.trim();
  if (!assunto) return alerta('Assunto obrigatório','danger');
  const body = {
    assunto,
    data: document.getElementById('inData').value,
    descricao: document.getElementById('inDesc').value,
    local: document.getElementById('inLocal').value,
    link_optico: document.getElementById('inLink').value,
    zona: document.getElementById('inZona').value,
    tecnico: document.getElementById('inTecnico').value,
    empresa: document.getElementById('inEmpresa').value,
    estado: 'Pendente'
  };
  try {
    await authFetch('/wos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    alerta('WO criada');
    showPanel('painel');
    carregarWOs();
  } catch (err) {
    alerta(`Erro: ${err.message}`, 'danger');
  }
};

// Inicialização ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  showPanel('painel');
  carregarEquipas();
  carregarWOs();
});
