/**
 * Módulo Financeiro - MRR, inadimplência, Kanban
 */
const FinanceiroModule = {
  statuses: ['Pendente','Pago','Atrasado','Cancelado','Estornado'],
  statusCores: {'Pendente':'#f59e0b','Pago':'#10b981','Atrasado':'#ef4444','Cancelado':'#64748b','Estornado':'#6b7280'},
  currentView: 'kanban',
  filterMonth: Utils.currentMonth(),

  schema: [
    { name:'aluno_id', label:'ID do Aluno', type:'text' },
    { name:'aluno_nome', label:'Nome do Aluno', type:'text', required:true },
    { name:'tipo', label:'Tipo', type:'text', options:['Mensalidade','Pacote de Aulas','Matrícula','Material','Mentoria','Outro'], required:true },
    { name:'descricao', label:'Descrição', type:'text' },
    { name:'valor', label:'Valor (R$)', type:'number', required:true },
    { name:'data_vencimento', label:'Data Vencimento', type:'date', required:true },
    { name:'data_pagamento', label:'Data Pagamento', type:'date' },
    { name:'mes_referencia', label:'Mês de Referência', type:'text', placeholder:'2026-04' },
    { name:'status', label:'Status', type:'text', options:['Pendente','Pago','Atrasado','Cancelado','Estornado'], required:true },
    { name:'forma_pagamento', label:'Forma de Pagamento', type:'text', options:['PIX','Boleto','Cartão Crédito','Cartão Débito','Dinheiro','Transferência'] },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const financeiro = await Cache.get('financeiro');
    const filtered = financeiro.filter(f => !this.filterMonth || f.mes_referencia === this.filterMonth);

    const totalMes = filtered.reduce((s,f) => s + (Number(f.valor)||0), 0);
    const recebido = filtered.filter(f=>f.status==='Pago').reduce((s,f)=>s+(Number(f.valor)||0),0);
    const pendente = filtered.filter(f=>f.status==='Pendente').reduce((s,f)=>s+(Number(f.valor)||0),0);
    const atrasado = filtered.filter(f=>f.status==='Atrasado').reduce((s,f)=>s+(Number(f.valor)||0),0);

    // Meses disponíveis
    const meses = [...new Set(financeiro.map(f => f.mes_referencia).filter(Boolean))].sort().reverse();

    container.innerHTML = `
      ${Components.pageHeader('💰 Financeiro', `MRR do mês • ${filtered.length} cobranças`,
        `<div class="flex gap-2 flex-wrap">
          <select class="form-select" style="max-width:160px" onchange="FinanceiroModule.setMonth(this.value)">
            <option value="">Todos os meses</option>
            ${meses.map(m => `<option value="${m}" ${m===this.filterMonth?'selected':''}>${m}</option>`).join('')}
          </select>
          <div class="inline-flex bg-slate-100 rounded-lg p-1">
            <button class="btn btn-sm ${this.currentView==='kanban'?'bg-white shadow':''}" onclick="FinanceiroModule.switchView('kanban')"><i class="fa-solid fa-columns"></i>Kanban</button>
            <button class="btn btn-sm ${this.currentView==='list'?'bg-white shadow':''}" onclick="FinanceiroModule.switchView('list')"><i class="fa-solid fa-list"></i>Lista</button>
          </div>
          <button class="btn btn-primary" onclick="FinanceiroModule.openForm()"><i class="fa-solid fa-plus"></i>Nova Cobrança</button>
        </div>`
      )}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        ${Components.kpiCard({label:'Total do Mês', value:Utils.money(totalMes), icon:'💵', color:'#6d28d9'})}
        ${Components.kpiCard({label:'Recebido', value:Utils.money(recebido), icon:'✅', color:'#10b981', trend: totalMes?`${((recebido/totalMes)*100).toFixed(0)}% do total`:''})}
        ${Components.kpiCard({label:'A Receber', value:Utils.money(pendente), icon:'⏳', color:'#f59e0b'})}
        ${Components.kpiCard({label:'Em Atraso', value:Utils.money(atrasado), icon:'⚠️', color:'#ef4444', trend: totalMes?`${((atrasado/totalMes)*100).toFixed(1)}% inadimpl.`:'', trendType:'down'})}
      </div>

      <div id="fin-content"></div>
    `;

    if (this.currentView === 'kanban') this.renderKanban(filtered);
    else this.renderList(filtered);
  },

  setMonth(m) { this.filterMonth = m; App.navigate('financeiro'); },
  switchView(v) { this.currentView = v; App.navigate('financeiro'); },

  renderKanban(financeiro) {
    const c = document.getElementById('fin-content');
    c.innerHTML = `
      <div class="kanban-board">
        ${this.statuses.map(s => {
          const items = financeiro.filter(f => f.status === s);
          const total = items.reduce((acc,f)=>acc+(Number(f.valor)||0),0);
          return `
            <div class="kanban-column" style="border-top:3px solid ${this.statusCores[s]}">
              <div class="kanban-column-header"><span>${s}<br><span class="text-xs font-normal text-slate-500">${Utils.money(total)}</span></span><span class="count">${items.length}</span></div>
              <div class="kanban-list" data-status="${s}" id="fkb-${s}">
                ${items.map(f => this.cardHtml(f)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.statuses.forEach(s => {
      const el = document.getElementById(`fkb-${s}`);
      if (el) new Sortable(el, {
        group:'fin', animation:180, ghostClass:'sortable-ghost',
        onEnd: async evt => {
          const id = evt.item.dataset.id;
          const newStatus = evt.to.dataset.status;
          if (newStatus !== evt.from.dataset.status) {
            const update = { status: newStatus };
            if (newStatus === 'Pago' && !evt.item.dataset.paid) update.data_pagamento = new Date().toISOString();
            await API.update('financeiro', id, update);
            Cache.invalidate('financeiro');
            Toast.success(`Status → ${newStatus}`);
            App.updateBadges();
          }
        }
      });
    });
  },

  cardHtml(f) {
    const late = f.status !== 'Pago' && f.data_vencimento && new Date(f.data_vencimento) < new Date();
    return `
      <div class="kanban-card" data-id="${f.id}" onclick="FinanceiroModule.openDetail('${f.id}')">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">${Utils.escape(f.aluno_nome||'-')}</p>
            <p class="text-xs text-slate-500">${Utils.escape(f.tipo||'')} • ${Utils.escape(f.mes_referencia||'')}</p>
          </div>
          <p class="font-bold text-emerald-700">${Utils.money(f.valor)}</p>
        </div>
        <p class="text-xs mt-1 ${late?'text-red-600 font-semibold':'text-slate-500'}">Vence: ${Utils.date(f.data_vencimento)}${late?' ⚠️':''}</p>
      </div>
    `;
  },

  renderList(financeiro) {
    const c = document.getElementById('fin-content');
    c.innerHTML = `
      <div class="card overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Aluno</th><th>Tipo</th><th class="hide-mobile">Mês</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${financeiro.map(f => `
              <tr>
                <td class="font-semibold">${Utils.escape(f.aluno_nome||'-')}</td>
                <td>${Utils.escape(f.tipo||'-')}</td>
                <td class="hide-mobile">${Utils.escape(f.mes_referencia||'-')}</td>
                <td class="font-bold text-emerald-700">${Utils.money(f.valor)}</td>
                <td>${Utils.date(f.data_vencimento)}</td>
                <td>${Components.pill(f.status)}</td>
                <td>
                  <div class="flex gap-1">
                    ${f.status!=='Pago'?`<button class="btn btn-ghost btn-sm" title="Marcar como pago" onclick="FinanceiroModule.markPaid('${f.id}')"><i class="fa-solid fa-check text-green-600"></i></button>`:''}
                    <button class="btn btn-ghost btn-sm" onclick="FinanceiroModule.openDetail('${f.id}')"><i class="fa-solid fa-eye"></i></button>
                  </div>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="7" class="text-center py-6 text-slate-500">Sem cobranças</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  },

  async markPaid(id) {
    await API.update('financeiro', id, { status: 'Pago', data_pagamento: new Date().toISOString() });
    Cache.invalidate('financeiro');
    Toast.success('Pagamento confirmado!');
    App.navigate('financeiro');
    App.updateBadges();
  },

  async openDetail(id) {
    const f = await API.get('financeiro', id);
    Modal.open(`${Utils.escape(f.aluno_nome)} — ${Utils.escape(f.tipo)}`, `
      <div class="space-y-3">
        <div class="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl text-center">
          <p class="text-xs text-emerald-700">VALOR</p>
          <p class="text-3xl font-bold text-emerald-700">${Utils.money(f.valor)}</p>
          <p class="mt-2">${Components.pill(f.status)}</p>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-xs text-slate-500">Mês ref.</p><p class="font-semibold">${Utils.escape(f.mes_referencia||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Forma pagamento</p><p class="font-semibold">${Utils.escape(f.forma_pagamento||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Vencimento</p><p class="font-semibold">${Utils.date(f.data_vencimento)}</p></div>
          <div><p class="text-xs text-slate-500">Pagamento</p><p class="font-semibold">${Utils.date(f.data_pagamento)}</p></div>
        </div>
        ${f.descricao?`<p class="text-sm"><strong>Descrição:</strong> ${Utils.escape(f.descricao)}</p>`:''}
        ${f.observacoes?`<div class="bg-amber-50 p-3 rounded-lg text-sm">${Utils.escape(f.observacoes)}</div>`:''}
      </div>
    `, `
      <button class="btn btn-danger" onclick="FinanceiroModule.remove('${f.id}')"><i class="fa-solid fa-trash"></i></button>
      ${f.status!=='Pago'?`<button class="btn btn-secondary" onclick="FinanceiroModule.markPaid('${f.id}');Modal.close()"><i class="fa-solid fa-check text-green-600"></i>Marcar Pago</button>`:''}
      <button class="btn btn-primary" onclick="FinanceiroModule.openForm('${f.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async openForm(id=null) {
    let f = { mes_referencia: Utils.currentMonth(), status: 'Pendente', forma_pagamento: 'PIX', tipo: 'Mensalidade' };
    if (id) f = await API.get('financeiro', id);
    Modal.open(id?'Editar Cobrança':'+ Nova Cobrança', `
      <form id="fin-form" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.schema.map(fd => Components.formField(fd, f[fd.name])).join('')}
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="FinanceiroModule.save('${id||''}')">Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('fin-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    if (id) await API.update('financeiro', id, data);
    else await API.create('financeiro', data);
    Cache.invalidate('financeiro');
    Modal.close();
    Toast.success('Cobrança salva!');
    App.navigate('financeiro');
    App.updateBadges();
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir cobrança?', 'Ação irreversível.', async () => {
      await API.remove('financeiro', id);
      Cache.invalidate('financeiro');
      Toast.success('Removida');
      App.navigate('financeiro');
      App.updateBadges();
    });
  }
};

ModuleRegistry['financeiro'] = FinanceiroModule;
