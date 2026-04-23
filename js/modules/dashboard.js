/* ========================================
   Módulo: Dashboard
   ======================================== */
window.ModuleDashboard = {
    async render() {
        const [leads, alunos, financeiro, tarefas] = await Promise.all([
            API.list('leads'), API.list('alunos'), API.list('financeiro'), API.list('tarefas')
        ]);

        const now = new Date();
        const mesAtual = Utils.currentMonthKey();
        const financeiroMes = financeiro.filter(f => f.mes_ref === mesAtual);
        const receitaMes = financeiroMes.filter(f => f.status === 'Pago').reduce((s, f) => s + Number(f.valor||0), 0);
        const aReceber = financeiroMes.filter(f => f.status === 'Pendente').reduce((s, f) => s + Number(f.valor||0), 0);
        const inadimplencia = financeiroMes.filter(f => f.status === 'Atrasado').reduce((s, f) => s + Number(f.valor||0), 0);

        const alunosAtivos = alunos.filter(a => a.status === 'Ativo').length;
        const leadsQuentes = leads.filter(l => l.temperatura === 'Quente' && l.etapa !== 'Fechado').length;
        const leadsNovos = leads.filter(l => l.etapa === 'Novo').length;

        const aniversariantes = [...alunos, ...leads].filter(p => Utils.isBirthdayThisMonth(p.data_nascimento)).length;

        const tarefasUrgentes = tarefas.filter(t => t.status !== 'Concluída' && t.prioridade === 'Alta').length;
        const followUpsHoje = leads.filter(l => {
            const d = Utils.daysUntil(l.follow_up);
            return d !== null && d <= 1 && l.etapa !== 'Fechado';
        });

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('📊 Dashboard', `Bem-vinda! Visão geral da sua escola em ${Utils.monthName(now.getMonth())} ${now.getFullYear()}`)}

            <!-- KPIs Principais -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${Components.kpiCard({ label: 'Receita do Mês', value: Utils.formatMoney(receitaMes), icon: 'dollar-sign', color: 'green', sub: `A receber: ${Utils.formatMoney(aReceber)}` })}
                ${Components.kpiCard({ label: 'Alunos Ativos', value: alunosAtivos, icon: 'user-graduate', color: 'brand', sub: `${alunos.length} total` })}
                ${Components.kpiCard({ label: 'Leads Quentes', value: leadsQuentes, icon: 'fire', color: 'red', sub: `${leadsNovos} novos` })}
                ${Components.kpiCard({ label: 'Inadimplência', value: Utils.formatMoney(inadimplencia), icon: 'exclamation-triangle', color: 'yellow', sub: `${financeiroMes.filter(f => f.status==='Atrasado').length} cobranças` })}
            </div>

            <!-- Alertas -->
            <div class="grid lg:grid-cols-3 gap-4 mb-6">
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-3xl">🎂</span>
                        <div>
                            <p class="text-xs font-semibold text-pink-700 uppercase">Aniversariantes do mês</p>
                            <p class="text-2xl font-bold text-pink-900">${aniversariantes}</p>
                        </div>
                    </div>
                    <a href="#aniversariantes" class="text-sm text-pink-700 font-semibold hover:underline">Ver lista →</a>
                </div>

                <div class="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-3xl">🚨</span>
                        <div>
                            <p class="text-xs font-semibold text-red-700 uppercase">Tarefas urgentes</p>
                            <p class="text-2xl font-bold text-red-900">${tarefasUrgentes}</p>
                        </div>
                    </div>
                    <a href="#tarefas" class="text-sm text-red-700 font-semibold hover:underline">Resolver agora →</a>
                </div>

                <div class="bg-gradient-to-br from-brand-50 to-brand-100 border-2 border-brand-200 rounded-2xl p-5">
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-3xl">📞</span>
                        <div>
                            <p class="text-xs font-semibold text-brand-700 uppercase">Follow-ups hoje</p>
                            <p class="text-2xl font-bold text-brand-900">${followUpsHoje.length}</p>
                        </div>
                    </div>
                    <a href="#leads" class="text-sm text-brand-700 font-semibold hover:underline">Ver leads →</a>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid lg:grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold text-gray-800 mb-4">Leads por Canal</h3>
                    <div style="height: 260px"><canvas id="chart-canais"></canvas></div>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold text-gray-800 mb-4">Funil de Leads</h3>
                    <div style="height: 260px"><canvas id="chart-funil"></canvas></div>
                </div>
            </div>

            <!-- Follow-ups de Hoje -->
            <div class="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 class="font-bold text-gray-800 mb-4">📞 Follow-ups Próximos</h3>
                ${followUpsHoje.length === 0 ? Components.emptyState('check-circle', 'Nenhum follow-up urgente hoje! 🎉') : `
                <div class="space-y-2">
                    ${followUpsHoje.slice(0, 5).map(l => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                ${Components.avatar(l.nome)}
                                <div>
                                    <p class="font-semibold text-sm">${l.nome}</p>
                                    <p class="text-xs text-gray-500">${l.canal} · ${l.objetivo || 'Sem objetivo'} · Follow-up: ${Utils.formatDate(l.follow_up)}</p>
                                </div>
                            </div>
                            <a href="${Utils.whatsappLink(l.telefone, 'Oi ' + l.nome + '!')}" target="_blank" class="btn btn-success btn-sm">
                                <i class="fab fa-whatsapp"></i> Contatar
                            </a>
                        </div>
                    `).join('')}
                </div>`}
            </div>
        </div>`;

        // Charts
        setTimeout(() => {
            const canais = {};
            leads.forEach(l => { canais[l.canal] = (canais[l.canal]||0) + 1; });
            new Chart(document.getElementById('chart-canais'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(canais),
                    datasets: [{ data: Object.values(canais), backgroundColor: ['#7c3aed','#ec4899','#10b981','#f59e0b','#3b82f6','#6b7280'] }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });

            const etapas = ['Novo','Contato','Proposta','Negociação','Fechado'];
            const countEtapas = etapas.map(e => leads.filter(l => l.etapa === e).length);
            new Chart(document.getElementById('chart-funil'), {
                type: 'bar',
                data: {
                    labels: etapas,
                    datasets: [{ label: 'Leads', data: countEtapas, backgroundColor: '#7c3aed' }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }, 50);
    }
};
