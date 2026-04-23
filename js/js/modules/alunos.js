/**
 * Módulo Alunos - cadastro, jornada no método, frequência
 */
const AlunosModule = {
  currentView: 'kanban',
  searchTerm: '',
  statuses: ['Ativo','Pausado','Trancado','Concluído','Cancelado'],
  statusCores: {'Ativo':'#10b981','Pausado':'#f59e0b','Trancado':'#64748b','Concluído':'#6d28d9','Cancelado':'#ef4444'},

  schema: [
    { name:'nome', label:'Nome completo', type:'text', required:true },
    { name:'whatsapp', label:'WhatsApp', type:'text' },
    { name:'email', label:'Email', type:'email' },
    { name:'cpf', label:'CPF', type:'text' },
    { name:'data_nascimento', label:'Data de nascimento', type:'date' },
    { name:'status', label:'Status', type:'text', options:['Ativo','Pausado','Trancado','Concluído','Cancelado'], required:true },
    { name:'nivel', label:'Nível', type:'text', options:['Iniciante','Básico','Intermediário','Avançado','Fluente'] },
    { name:'turno', label:'Turno', type:'text', options:['Manhã','Tarde','Noite','Madrugada'] },
    { name:'turma_id', label:'ID da Turma', type:'text' },
    { name:'data_matricula', label:'Data matrícula', type:'date' },
    { name:'data_inicio_metodo', label:'Início no método', type:'date' },
    { name:'fase_metodo', label:'Fase do método', type:'text', options:['Fase 1 - Fundação','Fase 2 - Estrutura','Fase 3 - Fluência','Fase 4 - Domínio','Fase 5 - Maestria','Concluído'] },
    { name:'progresso_percent', label:'Progresso (%)', type:'number' },
    { name:'frequencia_percent', label:'Frequência (%)', type:'number' },
    { name:'aulas_faltadas_seguidas', label:'Faltas seguidas', type:'number' },
    { name:'nps', label:'NPS (0-10)', type:'number' },
    { name:'indicou_quantos', label:'Quantos indicou', type:'number' },
    { name:'canal_origem', label:'Canal de origem', type:'text' },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const [alunos, turmas] = await Promise.all([Cache.get('alunos'), Cache.get('turmas')]);
    this.turmasMap = Object.fromEntries(turmas.map(t=>[t.id,t]));

    container.innerHTML = `
      ${Components.pageHeader(
        '👩‍🎓 Alunos',
        `${alunos.length} cadastrados • ${alunos.filter(a=>a.status==='Ativo').length} ativos`,
        `<div class="flex gap-2 flex-wrap">
          <div class="inline-flex bg-slate-100 rounded-lg p-1">
            <button class="btn btn-sm ${this.currentView==='kanban'?'bg-white shadow':'text-slate-600'}" onclick="AlunosModule.switchView('kanban')"><i class="fa-solid fa-columns"></i>Kanban</button>
            <button class="btn btn-sm ${this.currentView==='list'?'bg-white shadow':'text-slate-600'}" onclick="AlunosModule.switchView('list')"><i class="fa-solid fa-list"></i>Lista</button>
            <button class="btn btn-sm ${this.currentView==='metodo'?'bg-white shadow':'text-slate-600'}" onclick="AlunosModule.switchView('metodo')"><i class="fa-solid fa-graduation-cap"></i>Método</button>
          </div>
          ${Components.searchInput('Buscar aluno...', v => AlunosModule.onSearch(v))}
          <button class="btn btn-primary" onclick="AlunosModule.openForm()"><i class="fa-solid fa-plus"></i>Novo Aluno</button>
        </div>`
      )}
      <div id="alunos-content"></div>
    `;
    this.renderContent(alunos);
  },

  onSearch(v) { this.searchTerm = v.toLowerCase(); Cache.get('alunos').then(a=>this.renderContent(a)); },
  switchView(v) { this.currentView = v; App.navigate('alunos'); },

  renderContent(alunos) {
    const filtered = this.searchTerm
      ? alunos.filter(a => [a.nome,a.whatsapp,a.email].some(f => (f||'').toLowerCase().includes(this.searchTerm)))
      : alunos;
    const content = document.getElementById('alunos-content');
    if (this.currentView === 'kanban') this.renderKanban(content, filtered);
    else if (this.currentView === 'list') this.renderList(content, filtered);
    else this.renderMetodo(content, filtered);
  },

  renderKanban(container, alunos) {
    container.innerHTML = `
      <div class="kanban-board">
        ${this.statuses.map(s => {
          const items = alunos.filter(a => a.status === s);
          return `
            <div class="kanban-column" style="border-top:3px solid ${this.statusCores[s]}">
              <div class="kanban-column-header"><span>${s}</span><span class="count">${items.length}</span></div>
              <div class="kanban-list" data-status="${s}" id="akb-${s}">
                ${items.map(a => this.cardHtml(a)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    this.statuses.forEach(s => {
      const el = document.getElementById(`akb-${s}`);
      if (el) new Sortable(el, {
        group:'alunos', animation:180, ghostClass:'sortable-ghost',
        onEnd: async evt => {
          const id = evt.item.dataset.id;
          const newStatus = evt.to.dataset.status;
          if (newStatus !== evt.from.dataset.status) {
            await API.update('alunos', id, { status: newStatus });
            Cache.invalidate('alunos');
            Toast.success(`Status → ${newStatus}`);
          }
        }
      });
    });
  },

  cardHtml(a) {
    const risco = (a.aulas_faltadas_seguidas||0) >= 2;
    const prog = a.progresso_percent || 0;
    return `
      <div class="kanban-card" data-id="${a.id}" onclick="AlunosModule.openDetail('${a.id}')" style="border-left-color:${risco?'#ef4444':'#6d28d9'}">
        <div class="flex items-start gap-2 mb-1">
          ${Components.avatar(a.nome, 32)}
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">${Utils.escape(a.nome)}</p>
            <p class="text-xs text-slate-500 truncate">${Utils.escape(a.nivel||'')} • ${Utils.escape(a.turno||'')}</p>
          </div>
          ${risco?'<span title="Em risco">🚨</span>':''}
        </div>
        <p class="text-xs text-slate-600 mb-1">${Utils.escape(a.fase_metodo||'-')}</p>
        <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
        <div class="flex items-center justify-between mt-1 text-xs text-slate-500">
          <span>${prog}%</span>
          <span>Freq: ${a.frequencia_percent||0}%</span>
        </div>
      </div>
    `;
  },

  renderList(container, alunos) {
    if (!alunos.length) { container.innerHTML = Components.emptyState('👩‍🎓','Nenhum aluno'); return; }
    container.innerHTML = `
      <div class="card overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Aluno</th><th>Status</th><th>Nível</th><th class="hide-mobile">Turma</th><th class="hide-mobile">Fase</th><th>Prog</th><th>Freq</th><th>Ações</th></tr></thead>
          <tbody>
            ${alunos.map(a => `
              <tr>
                <td><div class="flex items-center gap-2">${Components.avatar(a.nome,30)}<div><p class="font-semibold">${Utils.escape(a.nome)}</p><p class="text-xs text-slate-500">${Utils.escape(a.whatsapp||'')}</p></div></div></td>
                <td>${Components.pill(a.status)}</td>
                <td>${Utils.escape(a.nivel||'-')}</td>
                <td class="hide-mobile">${Utils.escape(this.turmasMap?.[a.turma_id]?.nome||'-')}</td>
                <td class="hide-mobile">${Utils.escape(a.fase_metodo||'-')}</td>
                <td>${a.progresso_percent||0}%</td>
                <td>${a.frequencia_percent||0}%</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-sm" onclick="AlunosModule.openDetail('${a.id}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn btn-ghost btn-sm" onclick="Utils.openWhatsApp('${a.whatsapp||''}')"><i class="fa-brands fa-whatsapp text-green-600"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderMetodo(container, alunos) {
    // Visão por fase do método
    const fases = ['Fase 1 - Fundação','Fase 2 - Estrutura','Fase 3 - Fluência','Fase 4 - Domínio','Fase 5 - Maestria','Concluído'];
    const emFase = fase => alunos.filter(a => a.fase_metodo === fase);
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${fases.map((fase, idx) => {
          const items = emFase(fase);
          const color = ['#3b82f6','#8b5cf6','#f59e0b','#f97316','#10b981','#6d28d9'][idx];
          return `
            <div class="card p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-slate-800">${fase}</h3>
                <span class="pill" style="background:${color}20;color:${color}">${items.length}</span>
              </div>
              <div class="space-y-2 max-h-72 overflow-y-auto">
                ${items.length ? items.map(a => `
                  <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer" onclick="AlunosModule.openDetail('${a.id}')">
                    ${Components.avatar(a.nome,30)}
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-sm truncate">${Utils.escape(a.nome)}</p>
                      <div class="progress-bar mt-1"><div class="progress-fill" style="width:${a.progresso_percent||0}%;background:${color}"></div></div>
                    </div>
                    <span class="text-xs font-semibold" style="color:${color}">${a.progresso_percent||0}%</span>
                  </div>
                `).join('') : '<p class="text-sm text-slate-400 py-4 text-center">Nenhum aluno nesta fase</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  async openDetail(id) {
    const [aluno, turmas, financeiro, interacoes] = await Promise.all([
      API.get('alunos', id),
      Cache.get('turmas'),
      Cache.get('financeiro'),
      Cache.get('interacoes')
    ]);
    const turma = turmas.find(t => t.id === aluno.turma_id);
    const finAluno = financeiro.filter(f => f.aluno_id === aluno.id);
    const atrasos = finAluno.filter(f => f.status === 'Atrasado').length;
    const interAluno = interacoes.filter(i => i.entidade_id === aluno.id).slice(0,5);

    Modal.open(`${Utils.escape(aluno.nome)}`, `
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          ${Components.avatar(aluno.nome, 56)}
          <div class="flex-1">
            <h3 class="font-bold text-lg">${Utils.escape(aluno.nome)}</h3>
            <p class="text-sm text-slate-500">${Utils.escape(aluno.email||'')} • ${Utils.escape(aluno.whatsapp||'')}</p>
            <div class="flex gap-2 mt-1">${Components.pill(aluno.status)}${Components.pill(aluno.nivel)}</div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-brand-50 to-purple-50 p-4 rounded-xl">
          <p class="text-xs text-brand-700 font-semibold mb-1">JORNADA NO MÉTODO</p>
          <p class="font-bold text-slate-800">${Utils.escape(aluno.fase_metodo||'-')}</p>
          <div class="progress-bar mt-2"><div class="progress-fill" style="width:${aluno.progresso_percent||0}%"></div></div>
          <p class="text-xs text-slate-600 mt-1">${aluno.progresso_percent||0}% concluído • Início: ${Utils.date(aluno.data_inicio_metodo)}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div class="bg-slate-50 p-2 rounded-lg"><p class="text-xs text-slate-500">Frequência</p><p class="font-bold text-lg ${aluno.frequencia_percent<75?'text-red-600':'text-green-600'}">${aluno.frequencia_percent||0}%</p></div>
          <div class="bg-slate-50 p-2 rounded-lg"><p class="text-xs text-slate-500">NPS</p><p class="font-bold text-lg text-brand-700">${aluno.nps??'-'}</p></div>
          <div class="bg-slate-50 p-2 rounded-lg"><p class="text-xs text-slate-500">Faltas seq.</p><p class="font-bold text-lg ${(aluno.aulas_faltadas_seguidas||0)>=2?'text-red-600':'text-slate-700'}">${aluno.aulas_faltadas_seguidas||0}</p></div>
          <div class="bg-slate-50 p-2 rounded-lg"><p class="text-xs text-slate-500">Indicou</p><p class="font-bold text-lg text-emerald-600">${aluno.indicou_quantos||0}</p></div>
        </div>

        ${turma ? `<div class="bg-slate-50 p-3 rounded-lg"><p class="text-xs text-slate-500">Turma</p><p class="font-semibold">${Utils.escape(turma.nome)}</p><p class="text-xs text-slate-600">${Utils.escape(turma.horario||'')} • ${(turma.dias_semana||[]).join(', ')} • ${Utils.escape(turma.professor_nome||'')}</p></div>`:''}

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div><p class="text-xs text-slate-500">Matrícula</p><p>${Utils.date(aluno.data_matricula)}</p></div>
          <div><p class="text-xs text-slate-500">Canal origem</p><p>${Utils.escape(aluno.canal_origem||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Última aula</p><p>${Utils.date(aluno.ultima_aula)}</p></div>
          <div><p class="text-xs text-slate-500">Pagamentos</p><p>${finAluno.length} total ${atrasos?`<span class="text-red-600">• ${atrasos} atrasado(s)</span>`:''}</p></div>
        </div>

        ${aluno.observacoes ? `<div class="bg-amber-50 p-3 rounded-lg"><p class="text-xs text-amber-700 mb-1">Observações</p><p class="text-sm">${Utils.escape(aluno.observacoes)}</p></div>`:''}

        ${interAluno.length ? `<div><p class="text-xs text-slate-500 font-semibold mb-2">📝 ÚLTIMAS INTERAÇÕES</p>
          ${interAluno.map(i => `<div class="text-sm border-l-2 border-brand-300 pl-3 mb-2"><p class="font-semibold">${Utils.escape(i.assunto||i.tipo_interacao)}</p><p class="text-xs text-slate-500">${Utils.dateTime(i.data_interacao)}</p></div>`).join('')}
        </div>`:''}
      </div>
    `, `
      <button class="btn btn-danger" onclick="AlunosModule.remove('${aluno.id}')"><i class="fa-solid fa-trash"></i></button>
      <button class="btn btn-secondary" onclick="Utils.openWhatsApp('${aluno.whatsapp||''}')"><i class="fa-brands fa-whatsapp"></i>WhatsApp</button>
      <button class="btn btn-primary" onclick="AlunosModule.openForm('${aluno.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async openForm(id=null, prefill={}, onSuccess=null) {
    let aluno = prefill;
    if (id) aluno = await API.get('alunos', id);
    this._onSuccess = onSuccess;
    Modal.open(id ? 'Editar Aluno' : '+ Novo Aluno', `
      <form id="aluno-form" class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.schema.map(f => Components.formField(f, aluno[f.name])).join('')}
        </div>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="AlunosModule.save('${id||''}')"><i class="fa-solid fa-check"></i>Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('aluno-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    try {
      if (id) await API.update('alunos', id, data);
      else await API.create('alunos', data);
      Cache.invalidate('alunos');
      Modal.close();
      Toast.success(id ? 'Aluno atualizado!' : 'Aluno cadastrado!');
      if (this._onSuccess) { this._onSuccess(); this._onSuccess = null; }
      App.navigate('alunos');
      App.updateBadges();
    } catch (e) { Toast.error('Erro ao salvar'); }
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir aluno', 'Tem certeza? Essa ação não pode ser desfeita.', async () => {
      await API.remove('alunos', id);
      Cache.invalidate('alunos');
      Toast.success('Aluno removido');
      App.navigate('alunos');
    });
  }
};

ModuleRegistry['alunos'] = AlunosModule;
