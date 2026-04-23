/**
 * Módulo CRM de Leads - Kanban com drag and drop
 */
const LeadsModule = {
  etapas: ['Novo Lead','Contato Feito','Interessado','Negociação','Matriculado'],
  etapaCores: { 'Novo Lead':'#64748b','Contato Feito':'#3b82f6','Interessado':'#f59e0b','Negociação':'#f97316','Matriculado':'#10b981' },
  currentView: 'kanban',
  searchTerm: '',

  schema: [
    { name:'nome', label:'Nome', type:'text', required:true },
    { name:'whatsapp', label:'WhatsApp', type:'text', placeholder:'(11) 99999-9999' },
    { name:'email', label:'Email', type:'email' },
    { name:'instagram', label:'@Instagram', type:'text' },
    { name:'canal_origem', label:'Canal de Origem', type:'text', options:['Instagram','Indicação','WhatsApp','Site','Anúncio Meta','Google','Outro'], required:true },
    { name:'etapa_funil', label:'Etapa do Funil', type:'text', options:['Novo Lead','Contato Feito','Interessado','Negociação','Matriculado'], required:true },
    { name:'temperatura', label:'Temperatura', type:'text', options:['🔥 Quente','🌤️ Morno','❄️ Frio'] },
    { name:'objetivo', label:'Objetivo com o inglês', type:'text' },
    { name:'nivel_atual', label:'Nível Atual', type:'text', options:['Iniciante','Básico','Intermediário','Avançado','Não sabe'] },
    { name:'turno_preferido', label:'Turno Preferido', type:'text', options:['Manhã','Tarde','Noite','Madrugada','Flexível'] },
    { name:'proximo_followup', label:'Próximo Follow-up', type:'datetime' },
    { name:'indicado_por', label:'Indicado por', type:'text' },
    { name:'valor_proposta', label:'Valor Proposta (R$)', type:'number' },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const leads = await Cache.get('leads');

    container.innerHTML = `
      ${Components.pageHeader(
        '🧲 CRM de Leads',
        `${leads.length} leads • ${leads.filter(l=>l.etapa_funil!=='Matriculado').length} ativos • Kanban drag & drop`,
        `<div class="flex gap-2 flex-wrap">
          <div class="inline-flex bg-slate-100 rounded-lg p-1">
            <button class="btn btn-sm ${this.currentView==='kanban'?'bg-white shadow':'text-slate-600'}" onclick="LeadsModule.switchView('kanban')"><i class="fa-solid fa-columns"></i>Kanban</button>
            <button class="btn btn-sm ${this.currentView==='list'?'bg-white shadow':'text-slate-600'}" onclick="LeadsModule.switchView('list')"><i class="fa-solid fa-list"></i>Lista</button>
          </div>
          ${Components.searchInput('Buscar lead...', v => LeadsModule.onSearch(v))}
          <button class="btn btn-primary" onclick="LeadsModule.openForm()"><i class="fa-solid fa-plus"></i>Novo Lead</button>
        </div>`
      )}
      <div id="leads-content"></div>
    `;

    this.renderContent(leads);
  },

  onSearch(v) {
    this.searchTerm = v.toLowerCase();
    Cache.get('leads').then(leads => this.renderContent(leads));
  },

  switchView(v) {
    this.currentView = v;
    App.navigate('leads');
  },

  renderContent(leads) {
    const filtered = this.searchTerm
      ? leads.filter(l => [l.nome,l.whatsapp,l.email,l.instagram,l.objetivo].some(f => (f||'').toLowerCase().includes(this.searchTerm)))
      : leads;

    const content = document.getElementById('leads-content');
    if (this.currentView === 'kanban') this.renderKanban(content, filtered);
    else this.renderList(content, filtered);
  },

  renderKanban(container, leads) {
    container.innerHTML = `
      <div class="kanban-board">
        ${this.etapas.map(etapa => {
          const items = leads.filter(l => l.etapa_funil === etapa);
          return `
            <div class="kanban-column" style="border-top:3px solid ${this.etapaCores[etapa]}">
              <div class="kanban-column-header">
                <span>${etapa}</span>
                <span class="count">${items.length}</span>
              </div>
              <div class="kanban-list" data-etapa="${etapa}" id="kanban-${etapa.replace(/\s/g,'-')}">
                ${items.map(l => this.cardHtml(l)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.etapas.forEach(etapa => {
      const el = document.getElementById(`kanban-${etapa.replace(/\s/g,'-')}`);
      if (el) new Sortable(el, {
        group: 'leads',
        animation: 180,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: async (evt) => {
          const id = evt.item.dataset.id;
          const newEtapa = evt.to.dataset.etapa;
          const oldEtapa = evt.from.dataset.etapa;
          if (newEtapa !== oldEtapa) {
            try {
              await API.update('leads', id, { etapa_funil: newEtapa });
              Cache.invalidate('leads');
              Toast.success(`Lead movido para "${newEtapa}"`);
              App.updateBadges();
            } catch (e) {
              Toast.error('Erro ao mover lead');
              App.navigate('leads');
            }
          }
        }
      });
    });
  },

  cardHtml(lead) {
    const temp = lead.temperatura || '';
    const tempShort = temp.includes('Quente') ? '🔥' : temp.includes('Morno') ? '🌤️' : temp.includes('Frio') ? '❄️' : '';
    const isLateFU = lead.proximo_followup && new Date(lead.proximo_followup) < new Date();
    return `
      <div class="kanban-card" data-id="${lead.id}" onclick="LeadsModule.openDetail('${lead.id}')">
        <div class="flex items-start gap-2 mb-1">
          ${Components.avatar(lead.nome, 32)}
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-slate-800 truncate">${Utils.escape(lead.nome)}</p>
            <p class="text-xs text-slate-500 truncate">${Utils.escape(lead.canal_origem||'')}</p>
          </div>
          <span class="text-base">${tempShort}</span>
        </div>
        ${lead.objetivo ? `<p class="text-xs text-slate-600 mt-1 line-clamp-2">${Utils.escape(lead.objetivo.slice(0,60))}</p>`:''}
        <div class="flex items-center justify-between mt-2 text-xs">
          ${lead.proximo_followup ? `<span class="${isLateFU?'text-red-600 font-semibold':'text-slate-500'}">📞 ${Utils.date(lead.proximo_followup)}</span>` : '<span></span>'}
          ${lead.valor_proposta ? `<span class="font-semibold text-emerald-600">${Utils.money(lead.valor_proposta)}</span>` : ''}
        </div>
      </div>
    `;
  },

  renderList(container, leads) {
    if (!leads.length) { container.innerHTML = Components.emptyState('🧲','Nenhum lead encontrado'); return; }
    container.innerHTML = `
      <div class="card overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nome</th><th>Canal</th><th>Etapa</th><th>Temperatura</th>
              <th class="hide-mobile">Próximo FU</th><th class="hide-mobile">Valor</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td><div class="flex items-center gap-2">${Components.avatar(l.nome,30)}<div><p class="font-semibold text-slate-800">${Utils.escape(l.nome)}</p><p class="text-xs text-slate-500">${Utils.escape(l.whatsapp||'')}</p></div></div></td>
                <td>${Utils.escape(l.canal_origem||'-')}</td>
                <td>${Components.pill(l.etapa_funil)}</td>
                <td>${Components.pill(l.temperatura)}</td>
                <td class="hide-mobile">${Utils.date(l.proximo_followup)}</td>
                <td class="hide-mobile">${l.valor_proposta?Utils.money(l.valor_proposta):'-'}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-sm" onclick="LeadsModule.openDetail('${l.id}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="Utils.openWhatsApp('${l.whatsapp||''}')"><i class="fa-brands fa-whatsapp text-green-600"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async openDetail(id) {
    const lead = await API.get('leads', id);
    const fuLate = lead.proximo_followup && new Date(lead.proximo_followup) < new Date();
    Modal.open(`Lead: ${Utils.escape(lead.nome)}`, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div><p class="text-xs text-slate-500">WhatsApp</p><p class="font-semibold">${Utils.escape(lead.whatsapp||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Email</p><p class="font-semibold truncate">${Utils.escape(lead.email||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Instagram</p><p class="font-semibold">${Utils.escape(lead.instagram||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Canal</p><p>${Components.pill(lead.canal_origem)}</p></div>
          <div><p class="text-xs text-slate-500">Etapa</p><p>${Components.pill(lead.etapa_funil)}</p></div>
          <div><p class="text-xs text-slate-500">Temperatura</p><p>${Components.pill(lead.temperatura)}</p></div>
          <div><p class="text-xs text-slate-500">Nível atual</p><p class="font-semibold">${Utils.escape(lead.nivel_atual||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Turno preferido</p><p class="font-semibold">${Utils.escape(lead.turno_preferido||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Valor proposta</p><p class="font-semibold text-emerald-600">${lead.valor_proposta?Utils.money(lead.valor_proposta):'-'}</p></div>
          <div><p class="text-xs text-slate-500">Próximo follow-up</p><p class="font-semibold ${fuLate?'text-red-600':''}">${Utils.dateTime(lead.proximo_followup)}</p></div>
        </div>
        ${lead.objetivo ? `<div class="bg-slate-50 p-3 rounded-lg"><p class="text-xs text-slate-500 mb-1">Objetivo</p><p class="text-sm">${Utils.escape(lead.objetivo)}</p></div>` : ''}
        ${lead.observacoes ? `<div class="bg-amber-50 p-3 rounded-lg"><p class="text-xs text-amber-700 mb-1">Observações</p><p class="text-sm">${Utils.escape(lead.observacoes)}</p></div>` : ''}
        ${lead.indicado_por ? `<p class="text-sm text-slate-600">👥 Indicado por: <b>${Utils.escape(lead.indicado_por)}</b></p>` : ''}
      </div>
    `, `
      <button class="btn btn-danger" onclick="LeadsModule.remove('${lead.id}')"><i class="fa-solid fa-trash"></i>Excluir</button>
      <button class="btn btn-secondary" onclick="Utils.openWhatsApp('${lead.whatsapp||''}')"><i class="fa-brands fa-whatsapp"></i>WhatsApp</button>
      <button class="btn btn-secondary" onclick="LeadsModule.convertToAluno('${lead.id}')"><i class="fa-solid fa-user-plus"></i>Matricular</button>
      <button class="btn btn-primary" onclick="LeadsModule.openForm('${lead.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async openForm(id=null) {
    let lead = {};
    if (id) lead = await API.get('leads', id);
    Modal.open(id ? 'Editar Lead' : '+ Novo Lead', `
      <form id="lead-form" class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.schema.map(f => Components.formField(f, lead[f.name])).join('')}
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="LeadsModule.save('${id||''}')"><i class="fa-solid fa-check"></i>Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('lead-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    try {
      if (id) await API.update('leads', id, data);
      else await API.create('leads', data);
      Cache.invalidate('leads');
      Modal.close();
      Toast.success(id ? 'Lead atualizado!' : 'Lead criado!');
      App.navigate('leads');
      App.updateBadges();
    } catch (e) { Toast.error('Erro ao salvar'); }
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir lead', 'Tem certeza que deseja excluir este lead?', async () => {
      await API.remove('leads', id);
      Cache.invalidate('leads');
      Toast.success('Lead removido');
      App.navigate('leads');
      App.updateBadges();
    });
  },

  async convertToAluno(id) {
    const lead = await API.get('leads', id);
    Modal.close();
    // Pré-preenche formulário de aluno
    const prefill = {
      nome: lead.nome,
      whatsapp: lead.whatsapp,
      email: lead.email,
      nivel: lead.nivel_atual || 'Iniciante',
      turno: lead.turno_preferido,
      status: 'Ativo',
      canal_origem: lead.canal_origem,
      data_matricula: new Date().toISOString(),
      data_inicio_metodo: new Date().toISOString(),
      fase_metodo: 'Fase 1 - Fundação',
      progresso_percent: 0,
      frequencia_percent: 100,
      aulas_faltadas_seguidas: 0
    };
    AlunosModule.openForm(null, prefill, async () => {
      // Depois de criar aluno, marca lead como matriculado
      await API.update('leads', id, { etapa_funil: 'Matriculado' });
      Cache.invalidate('leads');
      App.updateBadges();
    });
  }
};

ModuleRegistry['leads'] = LeadsModule;
