/**
 * Módulo Dashboard - KPIs e gráficos
 */
const DashboardModule = {
  async render(container) {
    const [leads, alunos, turmas, financeiro, tarefas, marketing] = await Promise.all([
      Cache.get('leads'),
      Cache.get('alunos'),
      Cache.get('turmas'),
      Cache.get('financeiro'),
      Cache.get('tarefas'),
      Cache.get('marketing')
    ]);

    const now = new Date();
    const mesAtual = Utils.currentMonth();

    // KPIs
    const alunosAtivos = alunos.filter(a => a.status === 'Ativo').length;
    const leadsAtivos = leads.filter(l => l.etapa_funil !== 'Matriculado').length;
    const leadsMatriculados = leads.filter(l => l.etapa_funil === 'Matriculado').length;
    const taxaConversao = leads.length ? ((leadsMatriculados / leads.length) * 100).toFixed(1) : 0;

    const mrr = financeiro
      .filter(f => f.tipo === 'Mensalidade' && f.mes_referencia === mesAtual)
      .reduce((s,f) => s + (Number(f.valor)||0), 0);

    const pagoMes = financeiro
      .filter(f => f.mes_referencia === mesAtual && f.status === 'Pago')
      .reduce((s,f) => s + (Number(f.valor)||0), 0);

    const atrasados = financeiro.filter(f => f.status === 'Atrasado');
    const valorAtrasado = atrasados.reduce((s,f) => s + (Number(f.valor)||0), 0);
    const inadimplenciaPct = mrr ? ((valorAtrasado / mrr) * 100).toFixed(1) : 0;

    const turmasAtivas = turmas.filter(t => t.status === 'Ativa' || t.status === 'Lotada').length;
    const tarefasAlta = tarefas.filter(t => t.prioridade?.includes('Alta') && t.status !== 'Concluída').length;
    const alunosEmRisco = alunos.filter(a => (a.aulas_faltadas_seguidas||0) >= 2 && a.status === 'Ativo').length;

    const npsMedio = alunos.filter(a => a.nps != null).length
      ? (alunos.reduce((s,a) => s + (a.nps||0), 0) / alunos.filter(a=>a.nps!=null).length).toFixed(1)
      : '-';

    container.innerHTML = `
      ${Components.pageHeader(
        '📊 Dashboard',
        'Visão geral da sua escola em tempo real — ' + new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long'}),
        `<button class="btn btn-secondary btn-sm" onclick="DashboardModule.refresh()"><i class="fa-solid fa-rotate"></i>Atualizar</button>`
      )}

      <!-- KPIs principais -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        ${Components.kpiCard({label:'Alunos Ativos', value: alunosAtivos, icon:'👩‍🎓', color:'#6d28d9', trend:`${alunos.length} no total`})}
        ${Components.kpiCard({label:'MRR (Abril)', value: Utils.money(mrr), icon:'💰', color:'#10b981', trend:`${Utils.money(pagoMes)} recebido`, trendType:'up'})}
        ${Components.kpiCard({label:'Leads Ativos', value: leadsAtivos, icon:'🧲', color:'#3b82f6', trend:`Conv: ${taxaConversao}%`})}
        ${Components.kpiCard({label:'Inadimplência', value: Utils.money(valorAtrasado), icon:'⚠️', color:'#ef4444', trend:`${atrasados.length} em atraso (${inadimplenciaPct}%)`, trendType: atrasados.length ? 'down':'up'})}
      </div>

      <!-- KPIs secundários -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        ${Components.kpiCard({label:'Turmas Ativas', value: turmasAtivas, icon:'📚', color:'#f59e0b'})}
        ${Components.kpiCard({label:'NPS Médio', value: npsMedio, icon:'⭐', color:'#8b5cf6'})}
        ${Components.kpiCard({label:'Tarefas Urgentes', value: tarefasAlta, icon:'🔴', color:'#dc2626'})}
        ${Components.kpiCard({label:'Alunos em Risco', value: alunosEmRisco, icon:'🚨', color:'#ea580c', trend: alunosEmRisco ? '2+ faltas seguidas':'Tudo ok'})}
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="card p-4 md:p-5">
          <h3 class="font-bold text-slate-800 mb-3">📈 Leads por Canal</h3>
          <div style="height:260px"><canvas id="chart-canais"></canvas></div>
        </div>
        <div class="card p-4 md:p-5">
          <h3 class="font-bold text-slate-800 mb-3">🎯 Funil de Conversão</h3>
          <div style="height:260px"><canvas id="chart-funil"></canvas></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Alertas -->
        <div class="card p-4 md:p-5 lg:col-span-1">
          <h3 class="font-bold text-slate-800 mb-3">🔔 Alertas de Hoje</h3>
          <div id="alertas-list" class="space-y-2"></div>
        </div>

        <!-- Próximos follow-ups -->
        <div class="card p-4 md:p-5 lg:col-span-2">
          <h3 class="font-bold text-slate-800 mb-3">📞 Próximos Follow-ups</h3>
          <div id="followups-list" class="space-y-2"></div>
        </div>
      </div>
    `;

    this.renderCharts(leads);
    this.renderAlertas(alunos, financeiro, tarefas);
    this.renderFollowups(leads);
  },

  renderCharts(leads) {
    // Canais
    const canais = {};
    leads.forEach(l => {
      canais[l.canal_origem||'Outro'] = (canais[l.canal_origem||'Outro']||0) + 1;
    });
    const ctx1 = document.getElementById('chart-canais');
    if (ctx1) new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: Object.keys(canais),
        datasets: [{
          data: Object.values(canais),
          backgroundColor: ['#6d28d9','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#64748b']
        }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{boxWidth:12, font:{size:11}} }}}
    });

    // Funil
    const etapas = ['Novo Lead','Contato Feito','Interessado','Negociação','Matriculado'];
    const funilData = etapas.map(e => leads.filter(l => l.etapa_funil === e).length);
    const ctx2 = document.getElementById('chart-funil');
    if (ctx2) new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: etapas,
        datasets: [{
          label: 'Leads',
          data: funilData,
          backgroundColor: ['#94a3b8','#3b82f6','#f59e0b','#f97316','#10b981'],
          borderRadius: 6
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}},
        scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 }}}
      }
    });
  },

  renderAlertas(alunos, financeiro, tarefas) {
    const alertas = [];
    alunos.forEach(a => {
      if ((a.aulas_faltadas_seguidas||0) >= 2 && a.status === 'Ativo') {
        alertas.push({ icon:'🚨', text:`${a.nome} faltou ${a.aulas_faltadas_seguidas}x seguidas`, action:()=>location.hash='alunos' });
      }
    });
    financeiro.filter(f => f.status === 'Atrasado').forEach(f => {
      alertas.push({ icon:'💸', text:`${f.aluno_nome} — mensalidade atrasada`, action:()=>location.hash='financeiro' });
    });
    tarefas.filter(t => t.prioridade?.includes('Alta') && t.status !== 'Concluída').slice(0,3).forEach(t => {
      alertas.push({ icon:'🔴', text:t.titulo, action:()=>location.hash='tarefas' });
    });

    const list = document.getElementById('alertas-list');
    if (!alertas.length) {
      list.innerHTML = '<p class="text-sm text-slate-500 py-6 text-center">✨ Tudo em dia!</p>';
      return;
    }
    list.innerHTML = alertas.slice(0,6).map((a,i) => `
      <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer" onclick='DashboardModule._alertAction(${i})'>
        <span class="text-lg">${a.icon}</span>
        <span class="text-sm flex-1">${Utils.escape(a.text)}</span>
        <i class="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
      </div>
    `).join('');
    this._alertas = alertas;
  },

  _alertAction(i) { this._alertas?.[i]?.action?.(); },

  renderFollowups(leads) {
    const proximos = leads
      .filter(l => l.proximo_followup && l.etapa_funil !== 'Matriculado')
      .sort((a,b) => new Date(a.proximo_followup) - new Date(b.proximo_followup))
      .slice(0, 8);

    const list = document.getElementById('followups-list');
    if (!proximos.length) {
      list.innerHTML = '<p class="text-sm text-slate-500 py-6 text-center">Nenhum follow-up agendado</p>';
      return;
    }
    list.innerHTML = proximos.map(l => {
      const d = new Date(l.proximo_followup);
      const isLate = d < new Date();
      return `
        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer" onclick="location.hash='leads'">
          ${Components.avatar(l.nome, 34)}
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-slate-800 truncate">${Utils.escape(l.nome)}</p>
            <p class="text-xs text-slate-500 truncate">${Utils.escape(l.canal_origem||'')} • ${Utils.escape(l.etapa_funil||'')}</p>
          </div>
          <div class="text-right">
            <p class="text-xs font-semibold ${isLate?'text-red-600':'text-slate-700'}">${Utils.dateTime(l.proximo_followup)}</p>
            <p class="text-xs ${isLate?'text-red-500':'text-slate-400'}">${isLate?'⚠️ atrasado':'agendado'}</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Utils.openWhatsApp('${l.whatsapp||''}')"><i class="fa-brands fa-whatsapp text-green-600"></i></button>
        </div>
      `;
    }).join('');
  },

  refresh() {
    Cache.invalidateAll();
    App.navigate('dashboard');
    App.updateBadges();
    Toast.success('Atualizado!');
  }
};

ModuleRegistry['dashboard'] = DashboardModule;
