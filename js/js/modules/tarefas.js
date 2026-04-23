/**
 * Módulo Tarefas - Kanban por prioridade/status
 */
const TarefasModule = {
  statuses: ['A Fazer','Em Andamento','Em Revisão','Concluída'],
  statusCores: {'A Fazer':'#64748b','Em Andamento':'#3b82f6','Em Revisão':'#f59e0b','Concluída':'#10b981'},

  schema: [
    { name:'titulo', label:'Título', type:'text', required:true },
    { name:'categoria', label:'Categoria', type:'text', options:['Lead','Aluno','Turma','Financeiro','Marketing','Pessoal','Operação'], required:true },
    { name:'prioridade', label:'Prioridade', type:'text', options:['🔴 Alta','🟡 Média','🟢 Baixa'], required:true },
    { name:'status', label:'Status', type:'text', options:['A Fazer','Em Andamento','Em Revisão','Concluída'], required:true },
    { name:'responsavel', label:'Responsável', type:'text' },
    { name:'data_limite', label:'Prazo', type:'datetime' },
    { name:'relacionado_a', label:'Relacionado a', type:'text' },
    { name:'descricao', label:'Descrição', type:'textarea' }
  ],

  async render(container) {
    const tarefas = await Cache.get('tarefas');
    const pendentes = tarefas.filter(t => t.status !== 'Concluída');
    const altas = tarefas.filter(t => t.prioridade?.includes('Alta') && t.status !== 'Concluída').length;

    container.innerHTML = `
      ${Components.pageHeader('✅ Tarefas & Pendências', `${pendentes.length} pendentes • ${altas} urgentes`,
        `<button class="btn btn-primary" onclick="TarefasModule.openForm()"><i class="fa-solid fa-plus"></i>Nova Tarefa</button>`
      )}
      <div class="kanban-board" id="tarefas-kanban">
        ${this.statuses.map(s => {
          const items = tarefas.filter(t => t.status === s).sort((a,b) => {
            const order = { '🔴 Alta':1, '🟡 Média':2, '🟢 Baixa':3 };
            return (order[a.prioridade]||99) - (order[b.prioridade]||99);
          });
          return `
            <div class="kanban-column" style="border-top:3px solid ${this.statusCores[s]}">
              <div class="kanban-column-header"><span>${s}</span><span class="count">${items.length}</span></div>
              <div class="kanban-list" data-status="${s}" id="tskb-${s.replace(/\s/g,'-')}">
                ${items.map(t => this.cardHtml(t)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.statuses.forEach(s => {
      const el = document.getElementById(`tskb-${s.replace(/\s/g,'-')}`);
      if (el) new Sortable(el, {
        group:'tarefas', animation:180, ghostClass:'sortable-ghost',
        onEnd: async evt => {
          const id = evt.item.dataset.id;
          const newStatus = evt.to.dataset.status;
          if (newStatus !== evt.from.dataset.status) {
            await API.update('tarefas', id, { status: newStatus });
            Cache.invalidate('tarefas');
            Toast.success(`Movida para ${newStatus}`);
            App.updateBadges();
          }
        }
      });
    });
  },

  cardHtml(t) {
    const late = t.data_limite && new Date(t.data_limite) < new Date() && t.status !== 'Concluída';
    const prColor = t.prioridade?.includes('Alta') ? '#ef4444' : t.prioridade?.includes('Média') ? '#f59e0b' : '#10b981';
    return `
      <div class="kanban-card" data-id="${t.id}" onclick="TarefasModule.openDetail('${t.id}')" style="border-left-color:${prColor}">
        <div class="flex items-start justify-between gap-2">
          <p class="font-semibold text-sm flex-1">${Utils.escape(t.titulo)}</p>
          <span class="text-xs">${(t.prioridade||'').split(' ')[0]}</span>
        </div>
        <p class="text-xs text-slate-500 mt-1">${Utils.escape(t.categoria||'')}${t.relacionado_a?` • ${Utils.escape(t.relacionado_a)}`:''}</p>
        ${t.data_limite?`<p class="text-xs mt-1 ${late?'text-red-600 font-semibold':'text-slate-500'}">📅 ${Utils.dateTime(t.data_limite)}${late?' ⚠️':''}</p>`:''}
        ${t.responsavel?`<p class="text-xs text-slate-500 mt-1">👤 ${Utils.escape(t.responsavel)}</p>`:''}
      </div>
    `;
  },

  async openDetail(id) {
    const t = await API.get('tarefas', id);
    Modal.open(Utils.escape(t.titulo), `
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">${Components.pill(t.status)}${Components.pill(t.prioridade)}${Components.pill(t.categoria)}</div>
        ${t.descricao?`<div class="bg-slate-50 p-3 rounded-lg text-sm">${Utils.escape(t.descricao)}</div>`:''}
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-xs text-slate-500">Responsável</p><p class="font-semibold">${Utils.escape(t.responsavel||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Prazo</p><p class="font-semibold">${Utils.dateTime(t.data_limite)}</p></div>
          ${t.relacionado_a?`<div class="col-span-2"><p class="text-xs text-slate-500">Relacionado a</p><p class="font-semibold">${Utils.escape(t.relacionado_a)}</p></div>`:''}
        </div>
      </div>
    `, `
      <button class="btn btn-danger" onclick="TarefasModule.remove('${t.id}')"><i class="fa-solid fa-trash"></i></button>
      ${t.status!=='Concluída'?`<button class="btn btn-secondary" onclick="TarefasModule.markDone('${t.id}')"><i class="fa-solid fa-check"></i>Concluir</button>`:''}
      <button class="btn btn-primary" onclick="TarefasModule.openForm('${t.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async markDone(id) {
    await API.update('tarefas', id, { status: 'Concluída' });
    Cache.invalidate('tarefas');
    Modal.close();
    Toast.success('Tarefa concluída! 🎉');
    App.navigate('tarefas');
    App.updateBadges();
  },

  async openForm(id=null) {
    let t = { status: 'A Fazer', prioridade: '🟡 Média' };
    if (id) t = await API.get('tarefas', id);
    Modal.open(id?'Editar Tarefa':'+ Nova Tarefa', `
      <form id="tarefa-form" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.schema.map(f => Components.formField(f, t[f.name])).join('')}
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="TarefasModule.save('${id||''}')">Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('tarefa-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    if (id) await API.update('tarefas', id, data);
    else await API.create('tarefas', data);
    Cache.invalidate('tarefas');
    Modal.close();
    Toast.success('Tarefa salva!');
    App.navigate('tarefas');
    App.updateBadges();
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir tarefa?', 'Ação irreversível.', async () => {
      await API.remove('tarefas', id);
      Cache.invalidate('tarefas');
      Toast.success('Removida');
      App.navigate('tarefas');
      App.updateBadges();
    });
  }
};

ModuleRegistry['tarefas'] = TarefasModule;
