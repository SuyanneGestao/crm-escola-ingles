/**
 * Módulo Método & Progresso - fases do método autoral
 */
const MetodoModule = {
  fases: ['Fase 1 - Fundação','Fase 2 - Estrutura','Fase 3 - Fluência','Fase 4 - Domínio','Fase 5 - Maestria','Concluído'],
  coresFase: ['#3b82f6','#8b5cf6','#f59e0b','#f97316','#10b981','#6d28d9'],

  async render(container) {
    const [alunos, fases] = await Promise.all([Cache.get('alunos'), Cache.get('metodo_fases')]);
    const ativos = alunos.filter(a => a.status === 'Ativo');

    // Métricas gerais
    const progMedio = ativos.length
      ? Math.round(ativos.reduce((s,a)=>s+(a.progresso_percent||0),0)/ativos.length)
      : 0;
    const npsMedio = ativos.filter(a=>a.nps!=null).length
      ? (ativos.reduce((s,a)=>s+(a.nps||0),0)/ativos.filter(a=>a.nps!=null).length).toFixed(1)
      : '-';
    const concluidos = alunos.filter(a => a.fase_metodo === 'Concluído').length;

    container.innerHTML = `
      ${Components.pageHeader('🎓 Método & Progresso', 'Acompanhe a jornada dos alunos no seu método autoral',
        `<button class="btn btn-primary" onclick="MetodoModule.openFaseForm()"><i class="fa-solid fa-plus"></i>Registrar Avaliação</button>`
      )}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        ${Components.kpiCard({label:'Alunos ativos', value:ativos.length, icon:'👩‍🎓', color:'#6d28d9'})}
        ${Components.kpiCard({label:'Progresso médio', value:progMedio+'%', icon:'📈', color:'#10b981'})}
        ${Components.kpiCard({label:'NPS médio', value:npsMedio, icon:'⭐', color:'#f59e0b'})}
        ${Components.kpiCard({label:'Concluíram método', value:concluidos, icon:'🏆', color:'#ec4899'})}
      </div>

      <!-- Pipeline do método -->
      <div class="card p-4 md:p-5 mb-5">
        <h3 class="font-bold mb-4">📊 Alunos por Fase do Método</h3>
        <div style="height:250px"><canvas id="chart-fases"></canvas></div>
      </div>

      <!-- Fases detalhadas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${this.fases.map((fase,idx) => {
          const items = ativos.filter(a => a.fase_metodo === fase);
          const color = this.coresFase[idx];
          const avgProg = items.length ? Math.round(items.reduce((s,a)=>s+(a.progresso_percent||0),0)/items.length) : 0;
          const avgNps = items.filter(a=>a.nps!=null).length
            ? (items.reduce((s,a)=>s+(a.nps||0),0)/items.filter(a=>a.nps!=null).length).toFixed(1) : '-';
          return `
            <div class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold" style="color:${color}">${fase}</h4>
                <span class="pill" style="background:${color}20;color:${color}">${items.length}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><p class="text-slate-500">Progresso médio</p><p class="font-bold">${avgProg}%</p></div>
                <div><p class="text-slate-500">NPS médio</p><p class="font-bold">${avgNps}</p></div>
              </div>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                ${items.map(a => `
                  <div class="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer" onclick="AlunosModule.openDetail('${a.id}')">
                    ${Components.avatar(a.nome, 26)}
                    <span class="text-sm flex-1 truncate">${Utils.escape(a.nome)}</span>
                    <span class="text-xs font-semibold" style="color:${color}">${a.progresso_percent||0}%</span>
                  </div>
                `).join('') || '<p class="text-xs text-slate-400 py-2 text-center">Sem alunos</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Últimas avaliações -->
      <div class="card p-4 md:p-5 mt-5">
        <h3 class="font-bold mb-3">📝 Últimas Avaliações por Fase</h3>
        ${fases.length ? `
          <div class="space-y-2">
            ${fases.slice().sort((a,b)=>new Date(b.data_inicio||0)-new Date(a.data_inicio||0)).slice(0,10).map(f => `
              <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                ${Components.avatar(f.aluno_nome,32)}
                <div class="flex-1">
                  <p class="text-sm font-semibold">${Utils.escape(f.aluno_nome)}</p>
                  <p class="text-xs text-slate-500">${Utils.escape(f.fase)} • ${Utils.escape(f.status)}</p>
                </div>
                <div class="text-right text-xs">
                  ${f.nota_avaliacao!=null?`<p>⭐ ${f.nota_avaliacao}</p>`:''}
                  ${f.nps_fase!=null?`<p>NPS: ${f.nps_fase}</p>`:''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : Components.emptyState('📋','Sem avaliações ainda')}
      </div>
    `;

    // Gráfico fases
    const ctx = document.getElementById('chart-fases');
    if (ctx) new Chart(ctx, {
      type:'bar',
      data: {
        labels: this.fases,
        datasets: [{
          label:'Alunos',
          data: this.fases.map(f => ativos.filter(a => a.fase_metodo === f).length),
          backgroundColor: this.coresFase,
          borderRadius: 6
        }]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
    });
  },

  async openFaseForm() {
    const alunos = await Cache.get('alunos');
    Modal.open('+ Registrar Avaliação de Fase', `
      <form id="fase-form" class="space-y-3">
        <div>
          <label class="form-label">Aluno *</label>
          <select name="aluno_id" class="form-select" required>
            <option value="">— selecione —</option>
            ${alunos.filter(a=>a.status==='Ativo').map(a => `<option value="${a.id}" data-nome="${Utils.escape(a.nome)}">${Utils.escape(a.nome)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Fase *</label>
          <select name="fase" class="form-select" required>
            ${this.fases.map(f => `<option>${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select name="status" class="form-select">
            <option>Em andamento</option><option>Concluída</option><option>Não iniciada</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="form-label">Nota (0-10)</label><input type="number" min="0" max="10" name="nota_avaliacao" class="form-input"></div>
          <div><label class="form-label">NPS da fase</label><input type="number" min="0" max="10" name="nps_fase" class="form-input"></div>
        </div>
        <div><label class="form-label">Feedback</label><textarea name="feedback" class="form-textarea"></textarea></div>
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="MetodoModule.saveFase()">Salvar</button>
    `);
  },

  async saveFase() {
    const form = document.getElementById('fase-form');
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const sel = form.querySelector('select[name=aluno_id]');
    const alunoNome = sel.selectedOptions[0]?.dataset.nome || '';
    const data = {
      aluno_id: fd.get('aluno_id'),
      aluno_nome: alunoNome,
      fase: fd.get('fase'),
      status: fd.get('status'),
      nota_avaliacao: fd.get('nota_avaliacao') ? Number(fd.get('nota_avaliacao')) : null,
      nps_fase: fd.get('nps_fase') ? Number(fd.get('nps_fase')) : null,
      feedback: fd.get('feedback') || null,
      data_inicio: new Date().toISOString()
    };
    await API.create('metodo_fases', data);
    Cache.invalidate('metodo_fases');
    Modal.close();
    Toast.success('Avaliação registrada!');
    App.navigate('metodo');
  }
};

ModuleRegistry['metodo'] = MetodoModule;
