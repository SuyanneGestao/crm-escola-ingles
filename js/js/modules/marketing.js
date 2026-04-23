/**
 * Módulo Marketing / ROI por canal
 */
const MarketingModule = {
  schema: [
    { name:'canal', label:'Canal', type:'text', options:['Instagram Orgânico','Instagram Ads','Facebook Ads','Google Ads','Indicação','WhatsApp','Site/SEO','YouTube','TikTok'], required:true },
    { name:'mes_referencia', label:'Mês (YYYY-MM)', type:'text', required:true },
    { name:'investimento', label:'Investimento (R$)', type:'number' },
    { name:'leads_gerados', label:'Leads gerados', type:'number' },
    { name:'alunos_convertidos', label:'Alunos convertidos', type:'number' },
    { name:'receita_gerada', label:'Receita (R$)', type:'number' },
    { name:'cac', label:'CAC (R$)', type:'number' },
    { name:'ltv_estimado', label:'LTV estimado (R$)', type:'number' },
    { name:'observacoes', label:'Observações', type:'textarea' }
  ],

  async render(container) {
    const marketing = await Cache.get('marketing');
    const mesAtual = Utils.currentMonth();
    const doMes = marketing.filter(m => m.mes_referencia === mesAtual);

    const invTotal = doMes.reduce((s,m)=>s+(Number(m.investimento)||0),0);
    const leadsTotal = doMes.reduce((s,m)=>s+(Number(m.leads_gerados)||0),0);
    const alunosTotal = doMes.reduce((s,m)=>s+(Number(m.alunos_convertidos)||0),0);
    const receitaTotal = doMes.reduce((s,m)=>s+(Number(m.receita_gerada)||0),0);
    const roi = invTotal ? (((receitaTotal - invTotal)/invTotal)*100).toFixed(0) : '∞';
    const cacMedio = alunosTotal ? Math.round(invTotal/alunosTotal) : 0;

    // Agrupado por canal (do mês atual)
    const canais = doMes.sort((a,b)=>b.alunos_convertidos-a.alunos_convertidos);

    container.innerHTML = `
      ${Components.pageHeader('📣 Marketing / ROI', `Dados de ${mesAtual} • análise por canal`,
        `<button class="btn btn-primary" onclick="MarketingModule.openForm()"><i class="fa-solid fa-plus"></i>Nova Entrada</button>`
      )}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        ${Components.kpiCard({label:'Investimento', value:Utils.money(invTotal), icon:'💸', color:'#ef4444'})}
        ${Components.kpiCard({label:'Leads Gerados', value:leadsTotal, icon:'🎯', color:'#3b82f6'})}
        ${Components.kpiCard({label:'Convertidos', value:alunosTotal, icon:'✅', color:'#10b981', trend:`CAC médio: ${Utils.money(cacMedio)}`})}
        ${Components.kpiCard({label:'ROI', value:roi+'%', icon:'📈', color:'#6d28d9', trend:`Receita: ${Utils.money(receitaTotal)}`, trendType:'up'})}
      </div>

      <!-- Gráfico comparativo -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div class="card p-4">
          <h3 class="font-bold mb-3">💰 CAC por Canal</h3>
          <div style="height:260px"><canvas id="chart-cac"></canvas></div>
        </div>
        <div class="card p-4">
          <h3 class="font-bold mb-3">🎯 Leads vs. Convertidos</h3>
          <div style="height:260px"><canvas id="chart-leads"></canvas></div>
        </div>
      </div>

      <!-- Tabela por canal -->
      <div class="card overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Canal</th><th>Invest.</th><th>Leads</th><th>Convertidos</th><th>Taxa Conv.</th><th class="hide-mobile">CAC</th><th class="hide-mobile">Receita</th><th>ROI</th><th></th></tr></thead>
          <tbody>
            ${canais.map(m => {
              const taxa = m.leads_gerados ? ((m.alunos_convertidos/m.leads_gerados)*100).toFixed(1) : 0;
              const roi = m.investimento ? (((m.receita_gerada - m.investimento)/m.investimento)*100).toFixed(0)+'%' : '∞';
              return `
                <tr>
                  <td class="font-semibold">${Utils.escape(m.canal)}</td>
                  <td>${Utils.money(m.investimento)}</td>
                  <td>${m.leads_gerados||0}</td>
                  <td>${m.alunos_convertidos||0}</td>
                  <td>${taxa}%</td>
                  <td class="hide-mobile">${Utils.money(m.cac)}</td>
                  <td class="hide-mobile font-semibold text-emerald-600">${Utils.money(m.receita_gerada)}</td>
                  <td class="font-bold ${m.receita_gerada>=m.investimento?'text-emerald-600':'text-red-600'}">${roi}</td>
                  <td><button class="btn btn-ghost btn-sm" onclick="MarketingModule.openForm('${m.id}')"><i class="fa-solid fa-pen"></i></button></td>
                </tr>
              `;
            }).join('')||`<tr><td colspan="9" class="text-center py-6 text-slate-500">Sem dados para ${mesAtual}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    // CAC chart
    const ctx1 = document.getElementById('chart-cac');
    if (ctx1 && canais.length) new Chart(ctx1, {
      type:'bar',
      data:{ labels: canais.map(c=>c.canal), datasets:[{ label:'CAC (R$)', data: canais.map(c=>c.cac||0), backgroundColor:'#6d28d9', borderRadius:6 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });

    const ctx2 = document.getElementById('chart-leads');
    if (ctx2 && canais.length) new Chart(ctx2, {
      type:'bar',
      data:{
        labels: canais.map(c=>c.canal),
        datasets:[
          { label:'Leads', data: canais.map(c=>c.leads_gerados||0), backgroundColor:'#3b82f6', borderRadius:6 },
          { label:'Convertidos', data: canais.map(c=>c.alunos_convertidos||0), backgroundColor:'#10b981', borderRadius:6 }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
    });
  },

  async openForm(id=null) {
    let m = { mes_referencia: Utils.currentMonth() };
    if (id) m = await API.get('marketing', id);
    Modal.open(id?'Editar':'+ Nova Entrada', `
      <form id="mkt-form" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${this.schema.map(f => Components.formField(f, m[f.name])).join('')}
      </form>
    `, `
      <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
      <button class="btn btn-primary" onclick="MarketingModule.save('${id||''}')">Salvar</button>
    `);
  },

  async save(id) {
    const form = document.getElementById('mkt-form');
    if (!form.reportValidity()) return;
    const data = Components.readForm(form, this.schema);
    // Calcula CAC automaticamente se não preenchido
    if (!data.cac && data.investimento && data.alunos_convertidos) {
      data.cac = Math.round(data.investimento / data.alunos_convertidos);
    }
    if (id) await API.update('marketing', id, data);
    else await API.create('marketing', data);
    Cache.invalidate('marketing');
    Modal.close();
    Toast.success('Salvo!');
    App.navigate('marketing');
  }
};

ModuleRegistry['marketing'] = MarketingModule;
