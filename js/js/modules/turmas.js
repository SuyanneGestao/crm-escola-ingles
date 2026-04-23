/**
 * Módulo Turmas - Kanban + detalhes
 */
const TurmasModule = {
  statuses: ['Em formação','Ativa','Lotada','Pausada','Encerrada'],
  statusCores: {'Em formação':'#3b82f6','Ativa':'#10b981','Lotada':'#f59e0b','Pausada':'#64748b','Encerrada':'#6b7280'},
  currentView: 'kanban',

  schema: [
    { name:'nome', label:'Nome da Turma', type:'text', required:true },
    { name:'professor_id', label:'ID do Professor', type:'text' },
    { name:'professor_nome', label:'Nome do Professor', type:'text' },
    { name:'nivel', label:'Nível', type:'text', options:['Iniciante','Básico','Intermediário','Avançado','Conversação'] },
    { name:'dias_semana', label:'Dias da semana', type:'array', placeholder:'Segunda, Quarta, Sexta' },
    { name:'horario', label:'Horário', type:'text', placeholder:'19:00-20:30' },
    { name:'turno', label:'Turno', type:'text', options:['Manhã','Tarde','Noite','Madrugada'] },
    { name:'link_aula', label:'Link da aula', type:'text' },
    { name:'capacidade_max', label:'Capacidade máxima', type:'number' },
    { name:'num_alunos', label:'Nº alunos atual', type:'number' },
    { name:'status', label:'Status', type:'text', options:['Em formação','Ativa','Lotada','Pausada','Encerrada'], required:true },
    { name:'data_inicio', label:'Data início', type:'date' },
    { name:'data_fim_prevista', label:'Data fim prevista', type:'date' },
    { name:'valor_mensalidade', label:'Valor mensalidade (R$)', type:'number' },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const [turmas, profs, alunos] = await Promise.all([Cache.get('turmas'), Cache.get('professores'), Cache.get('alunos')]);
    this.profs = profs; this.alunos = alunos;

    container.innerHTML = `
      ${Components.pageHeader('📚 Turmas', `${turmas.length} turmas • ${turmas.filter(t=>t.status==='Ativa'||t.status==='Lotada').length} ativas`,
        `<div class="flex gap-2 flex-wrap">
          <div class="inline-flex bg-slate-100 rounded-lg p-1">
            <button class="btn btn-sm ${this.currentView==='kanban'?'bg-white shadow':'text-slate-600'}" onclick="TurmasModule.switchView('kanban')"><i class="fa-solid fa-columns"></i>Kanban</button>
            <button class="btn btn-sm ${this.currentView==='list'?'bg-white shadow':'text-slate-600'}" onclick="TurmasModule.switchView('list')"><i class="fa-solid fa-list"></i>Lista</button>
          </div>
          <button class="btn btn-primary" onclick="TurmasModule.openForm()"><i class="fa-solid fa-plus"></i>Nova Turma</button>
        </div>`
      )}
      <div id="turmas-content"></div>
    `;
    if (this.currentView === 'kanban') this.renderKanban(turmas);
    else this.renderList(turmas);
  },

  switchView(v) { this.currentView = v; App.navigate('turmas'); },

  renderKanban(turmas) {
    const c = document.getElementById('turmas-content');
    c.innerHTML = `
      <div class="kanban-board">
        ${this.statuses.map(s => {
          const items = turmas.filter(t => t.status === s);
          return `
            <div class="kanban-column" style="border-top:3px solid ${this.statusCores[s]}">
              <div class="kanban-column-header"><span>${s}</span><span class="count">${items.length}</span></div>
              <div class="kanban-list" data-status="${s}" id="tkb-${s.replace(/\s/g,'-')}">
                ${items.map(t => this.cardHtml(t)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.statuses.forEach(s => {
      const el = document.getElementById(`tkb-${s.replace(/\s/g,'-')}`);
      if (el) new Sortable(el, {
        group:'turmas', animation:180, ghostClass:'sortable-ghost',
        onEnd: async evt => {
          const id = evt.item.dataset.id;
          const newStatus = evt.to.dataset.status;
          if (newStatus !== evt.from.dataset.status) {
            await API.update('turmas', id, { status: newStatus });
            Cache.invalidate('turmas');
            Toast.success(`Status → ${newStatus}`);
          }
        }
      });
    });
  },

  cardHtml(t) {
    const ocup = t.capacidade_max ? Math.round((t.num_alunos||0)/t.capacidade_max*100) : 0;
    return `
      <div class="kanban-card" data-id="${t.id}" onclick="TurmasModule.openDetail('${t.id}')">
        <p class="font-semibold text-sm text-slate-800">${Utils.escape(t.nome)}</p>
        <p class="text-xs text-slate-500 mt-1">${Utils.escape(t.professor_nome||'-')} • ${Utils.escape(t.nivel||'')}</p>
        <p class="text-xs text-slate-600 mt-1">🕐 ${Utils.escape(t.horario||'-')} • ${(t.dias_semana||[]).join(', ')}</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs font-semibold">${t.num_alunos||0}/${t.capacidade_max||0} alunos</span>
          <span class="text-xs font-bold text-emerald-600">${t.valor_mensalidade?Utils.money(t.valor_mensalidade):''}</span>
        </div>
        <div class="progress-bar mt-1"><div class="progress-fill" style="width:${ocup}%"></div></div>
      </div>
    `;
  },

  renderList(turmas) {
    const c = document.getElementById('turmas-content');
    c.innerHTML = `
      <div class="card overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Turma</th><th>Professor</th><th>Nível</th><th class="hide-mobile">Horário</th><th>Alunos</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${turmas.map(t => `
              <tr>
                <td><p class="font-semibold">${Utils.escape(t.nome)}</p><p class="text-xs text-slate-500">${(t.dias_semana||[]).join(', ')}</p></td>
                <td>${Utils.escape(t.professor_nome||'-')}</td>
                <td>${Utils.escape(t.nivel||'-')}</td>
                <td class="hide-mobile">${Utils.escape(t.horario||'-')}</td>
                <td>${t.num_alunos||0}/${t.capacidade_max||0}</td>
                <td>${Components.pill(t.status)}</td>
                <td><button class="btn btn-ghost btn-sm" onclick="TurmasModule.openDetail('${t.id}')"><i class="fa-solid fa-eye"></i></button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async openDetail(id) {
    const turma = await API.get('turmas', id);
    const alunosTurma = this.alunos.filter(a => a.turma_id === id);
    Modal.open(`📚 ${Utils.escape(turma.nome)}`, `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-xs text-slate-500">Professor</p><p class="font-semibold">${Utils.escape(turma.professor_nome||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Nível</p><p class="font-semibold">${Utils.escape(turma.nivel||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Dias</p><p class="font-semibold">${(turma.dias_semana||[]).join(', ')||'-'}</p></div>
          <div><p class="text-xs text-slate-500">Horário</p><p class="font-semibold">${Utils.escape(turma.horario||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Turno</p><p class="font-semibold">${Utils.escape(turma.turno||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Status</p>${Components.pill(turma.status)}</div>
          <div><p class="text-xs text-slate-500">Ocupação</p><p class="font-semibold">${turma.num_alunos||0}/${turma.capacidade_max||0}</p></div>
          <div><p class="text-xs text-slate-500">Mensalidade</p><p class="font-semibold text-emerald-600">${turma.valor_mensalidade?Utils.money(turma.valor_mensalidade):'-'}</p></div>
        </div>
        ${turma.link_aula ? `<a href="${Utils.escape(turma.link_aula)}" target="_blank" class="btn btn-secondary w-full"><i class="fa-solid fa-video"></i>Entrar na aula</a>`:''}

        <div>
          <p class="text-xs text-slate-500 font-semibold mb-2">ALUNOS (${alunosTurma.length})</p>
          <div class="space-y-1">
            ${alunosTurma.length ? alunosTurma.map(a => `
              <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                ${Components.avatar(a.nome, 30)}
                <div class="flex-1">
                  <p class="text-sm font-semibold">${Utils.escape(a.nome)}</p>
                  <p class="text-xs text-slate-500">${Utils.escape(a.fase_metodo||'')} • ${a.progresso_percent||0}%</p>
                </div>
                ${Components.pill(a.status)}
              </div>
            `).join('') : '<p class="text-sm text-slate-400 text-center py-3">Sem alunos ainda</p>'}
          </div>
        </div>
      </div>
    `, `
      <button class="btn btn-danger" onclick="TurmasModule.remove('${turma.id}')"><i class="fa-solid fa-trash"></i></button>
      <button class="btn btn-primary" onclick="TurmasModule.openForm('${turma.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async openForm(id=null) {
    let t = {};
    if (id) t = await API.get('turmas', id);
    Modal.open(id?'Editar Turma':'+ Nova Turma', `
      <form id="turma-form" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.schema.map(f => Components.formField(f, t[f.name])).join('')}
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="TurmasModule.save('${id||''}')"><i class="fa-solid fa-check"></i>Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('turma-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    try {
      if (id) await API.update('turmas', id, data);
      else await API.create('turmas', data);
      Cache.invalidate('turmas');
      Modal.close();
      Toast.success('Turma salva!');
      App.navigate('turmas');
    } catch { Toast.error('Erro ao salvar'); }
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir turma?', 'Ação irreversível.', async () => {
      await API.remove('turmas', id);
      Cache.invalidate('turmas');
      Toast.success('Turma removida');
      App.navigate('turmas');
    });
  }
};

ModuleRegistry['turmas'] = TurmasModule;
