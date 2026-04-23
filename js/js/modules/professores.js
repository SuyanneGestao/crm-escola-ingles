/**
 * Módulo Professores
 */
const ProfessoresModule = {
  schema: [
    { name:'nome', label:'Nome', type:'text', required:true },
    { name:'whatsapp', label:'WhatsApp', type:'text' },
    { name:'email', label:'Email', type:'email' },
    { name:'niveis_ensina', label:'Níveis que ensina', type:'array', placeholder:'Iniciante, Básico, Intermediário' },
    { name:'turnos_disponiveis', label:'Turnos disponíveis', type:'array', placeholder:'Manhã, Noite' },
    { name:'dias_disponiveis', label:'Dias disponíveis', type:'array', placeholder:'Segunda, Quarta, Sexta' },
    { name:'valor_hora', label:'Valor/hora (R$)', type:'number' },
    { name:'num_turmas', label:'Nº turmas ativas', type:'number' },
    { name:'status', label:'Status', type:'text', options:['Ativo','Inativo','Afastado'], required:true },
    { name:'formacao', label:'Formação', type:'text' },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const [profs, turmas] = await Promise.all([Cache.get('professores'), Cache.get('turmas')]);
    this.turmas = turmas;

    container.innerHTML = `
      ${Components.pageHeader('👨‍🏫 Professores', `${profs.length} cadastrados • ${profs.filter(p=>p.status==='Ativo').length} ativos`,
        `<button class="btn btn-primary" onclick="ProfessoresModule.openForm()"><i class="fa-solid fa-plus"></i>Novo Professor</button>`
      )}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${profs.map(p => {
          const turmasProf = turmas.filter(t => t.professor_id === p.id);
          return `
            <div class="card p-5 cursor-pointer hover:shadow-lg transition" onclick="ProfessoresModule.openDetail('${p.id}')">
              <div class="flex items-start gap-3">
                ${Components.avatar(p.nome, 50)}
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-slate-800 truncate">${Utils.escape(p.nome)}</h3>
                  <p class="text-xs text-slate-500 truncate">${Utils.escape(p.email||'')}</p>
                  <div class="mt-1">${Components.pill(p.status)}</div>
                </div>
              </div>
              <div class="mt-3 space-y-1 text-xs text-slate-600">
                <p><i class="fa-solid fa-layer-group w-4 text-slate-400"></i> ${(p.niveis_ensina||[]).join(', ')||'-'}</p>
                <p><i class="fa-solid fa-clock w-4 text-slate-400"></i> ${(p.turnos_disponiveis||[]).join(', ')||'-'}</p>
                <p><i class="fa-solid fa-calendar-days w-4 text-slate-400"></i> ${(p.dias_disponiveis||[]).join(', ')||'-'}</p>
              </div>
              <div class="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                <span class="text-xs text-slate-500">${turmasProf.length} turma(s)</span>
                <span class="font-bold text-emerald-600">${p.valor_hora?Utils.money(p.valor_hora)+'/h':''}</span>
              </div>
            </div>
          `;
        }).join('') || Components.emptyState('👨‍🏫','Nenhum professor cadastrado')}
      </div>
    `;
  },

  async openDetail(id) {
    const p = await API.get('professores', id);
    const turmasProf = this.turmas.filter(t => t.professor_id === id);
    Modal.open(Utils.escape(p.nome), `
      <div class="space-y-3">
        <div class="flex items-center gap-3">${Components.avatar(p.nome, 56)}<div><p class="font-bold">${Utils.escape(p.nome)}</p><p class="text-sm text-slate-500">${Utils.escape(p.email||'')}</p>${Components.pill(p.status)}</div></div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div><p class="text-xs text-slate-500">WhatsApp</p><p class="font-semibold">${Utils.escape(p.whatsapp||'-')}</p></div>
          <div><p class="text-xs text-slate-500">Valor/hora</p><p class="font-semibold text-emerald-600">${p.valor_hora?Utils.money(p.valor_hora):'-'}</p></div>
        </div>
        <div class="bg-slate-50 p-3 rounded-lg">
          <p class="text-xs text-slate-500">Níveis</p><p class="text-sm">${(p.niveis_ensina||[]).join(' • ')||'-'}</p>
          <p class="text-xs text-slate-500 mt-2">Turnos disponíveis</p><p class="text-sm">${(p.turnos_disponiveis||[]).join(' • ')||'-'}</p>
          <p class="text-xs text-slate-500 mt-2">Dias disponíveis</p><p class="text-sm">${(p.dias_disponiveis||[]).join(' • ')||'-'}</p>
        </div>
        ${p.formacao?`<div><p class="text-xs text-slate-500">Formação</p><p class="text-sm">${Utils.escape(p.formacao)}</p></div>`:''}
        <div><p class="text-xs text-slate-500 font-semibold mb-1">TURMAS (${turmasProf.length})</p>
          ${turmasProf.map(t => `<div class="text-sm p-2 bg-slate-50 rounded mb-1">${Utils.escape(t.nome)} <span class="text-xs text-slate-500">• ${Utils.escape(t.horario||'')}</span></div>`).join('')||'<p class="text-sm text-slate-400">Sem turmas</p>'}
        </div>
      </div>
    `, `
      <button class="btn btn-danger" onclick="ProfessoresModule.remove('${p.id}')"><i class="fa-solid fa-trash"></i></button>
      <button class="btn btn-secondary" onclick="Utils.openWhatsApp('${p.whatsapp||''}')"><i class="fa-brands fa-whatsapp"></i></button>
      <button class="btn btn-primary" onclick="ProfessoresModule.openForm('${p.id}')"><i class="fa-solid fa-pen"></i>Editar</button>
    `);
  },

  async openForm(id=null) {
    let p = {};
    if (id) p = await API.get('professores', id);
    Modal.open(id?'Editar Professor':'+ Novo Professor', `
      <form id="prof-form" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.schema.map(f => Components.formField(f, p[f.name])).join('')}
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="ProfessoresModule.save('${id||''}')">Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('prof-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    if (id) await API.update('professores', id, data);
    else await API.create('professores', data);
    Cache.invalidate('professores');
    Modal.close();
    Toast.success('Professor salvo!');
    App.navigate('professores');
  },

  remove(id) {
    Modal.close();
    Modal.confirm('Excluir professor?', 'Ação irreversível.', async () => {
      await API.remove('professores', id);
      Cache.invalidate('professores');
      Toast.success('Removido');
      App.navigate('professores');
    });
  }
};

ModuleRegistry['professores'] = ProfessoresModule;
