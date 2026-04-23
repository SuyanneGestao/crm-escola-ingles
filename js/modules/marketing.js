/* ========================================
   Módulo: Marketing / ROI por Canal
   ======================================== */
window.ModuleMarketing = {
    async render() {
        const [marketing, leads, alunos, financeiro] = await Promise.all([
            API.list('marketing'), API.list('leads'), API.list('alunos'), API.list('financeiro')
        ]);

        // Calcular ROI real
        const canais = {};
        marketing.forEach(m => {
            canais[m.canal] = canais[m.canal] || { canal: m.canal, investimento: 0, leads: 0, alunos: 0, receita: 0 };
            canais[m.canal].investimento += Number(m.investimento||0);
            canais[m.canal].leads += Number(m.leads_gerados||0);
            canais[m.canal].alunos += Number(m.alunos_convertidos||0);
        });

        // Complementar com dados reais
        leads.forEach(l => {
            canais[l.canal] = canais[l.canal] || { canal: l.canal, investimento: 0, leads: 0, alunos: 0, receita: 0 };
        });

        alunos.forEach(a => {
            if (a.canal_origem && canais[a.canal_origem]) {
                const receita = financeiro.filter(f => f.aluno_id === a.id && f.status === 'Pago').reduce((s,f) => s + Number(f.valor||0), 0);
                canais[a.canal_origem].receita = (canais[a.canal_origem].receita || 0) + receita;
            }
        });

        const canaisArr = Object.values(canais);
        const totalInvest = canaisArr.reduce((s,c) => s + c.investimento, 0);
        const totalReceita = canaisArr.reduce((s,c) => s + (c.receita||0), 0);
        const roi = totalInvest > 0 ? Math.round(((totalReceita - totalInvest) / totalInvest) * 100) : 0;

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('📣 Marketing / ROI', 'Análise de performance por canal de aquisição', `
                <button class="btn btn-primary" onclick="ModuleMarketing.openForm()"><i class="fas fa-plus"></i> Registro</button>
            `)}

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${Components.kpiCard({label:'Investimento Total', value: Utils.formatMoney(totalInvest), icon:'money-bill', color:'yellow'})}
                ${Components.kpiCard({label:'Receita Atribuída', value: Utils.formatMoney(totalReceita), icon:'chart-line', color:'green'})}
                ${Components.kpiCard({label:'ROI', value: roi + '%', icon:'percent', color: roi >= 0 ? 'green' : 'red'})}
                ${Components.kpiCard({label:'Canais Ativos', value: canaisArr.length, icon:'bullhorn', color:'brand'})}
            </div>

            <div class="grid lg:grid-cols-2 gap-4 mb-6">
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold mb-4">Investimento vs Receita por Canal</h3>
                    <div style="height: 300px"><canvas id="chart-roi"></canvas></div>
                </div>
                <div class="bg-white rounded-2xl p-5 border border-gray-100">
                    <h3 class="font-bold mb-4">Conversão por Canal</h3>
                    <div style="height: 300px"><canvas id="chart-conv"></canvas></div>
                </div>
            </div>

            <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr><th>Canal</th><th>Investimento</th><th>Leads</th><th>Alunos</th><th>Receita</th><th>CAC</th><th>ROI</th></tr>
                    </thead>
                    <tbody>
                        ${canaisArr.map(c => {
                            const cac = c.alunos > 0 ? c.investimento / c.alunos : 0;
                            const canalROI = c.investimento > 0 ? Math.round(((c.receita - c.investimento) / c.investimento) * 100) : 0;
                            return `
                            <tr>
                                <td class="font-semibold">${c.canal}</td>
                                <td>${Utils.formatMoney(c.investimento)}</td>
                                <td>${c.leads}</td>
                                <td>${c.alunos}</td>
                                <td class="text-green-600 font-semibold">${Utils.formatMoney(c.receita||0)}</td>
                                <td>${Utils.formatMoney(cac)}</td>
                                <td>${Components.pill(canalROI+'%', canalROI >= 0 ? 'green' : 'red')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="mt-6">
                <h3 class="font-bold mb-3">📝 Histórico de Registros</h3>
                <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr><th>Mês</th><th>Canal</th><th>Investimento</th><th>Leads</th><th>Alunos</th><th></th></tr>
                        </thead>
                        <tbody>
                            ${marketing.map(m => `
                            <tr class="cursor-pointer" onclick="ModuleMarketing.openForm('${m.id}')">
                                <td>${m.mes_ref}</td>
                                <td>${m.canal}</td>
                                <td>${Utils.formatMoney(m.investimento)}</td>
                                <td>${m.leads_gerados}</td>
                                <td>${m.alunos_convertidos}</td>
                                <td><i class="fas fa-edit text-gray-400"></i></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        setTimeout(() => {
            new Chart(document.getElementById('chart-roi'), {
                type: 'bar',
                data: {
                    labels: canaisArr.map(c => c.canal),
                    datasets: [
                        { label: 'Investimento', data: canaisArr.map(c => c.investimento), backgroundColor: '#f59e0b' },
                        { label: 'Receita', data: canaisArr.map(c => c.receita||0), backgroundColor: '#10b981' },
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
            new Chart(document.getElementById('chart-conv'), {
                type: 'bar',
                data: {
                    labels: canaisArr.map(c => c.canal),
                    datasets: [
                        { label: 'Leads', data: canaisArr.map(c => c.leads), backgroundColor: '#7c3aed' },
                        { label: 'Alunos', data: canaisArr.map(c => c.alunos), backgroundColor: '#ec4899' },
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }, 50);
    },

    async openForm(id = null) {
        const m = id ? (await API.get('marketing', id)) : {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id?'✏️ Editar':'➕ Novo'} Registro</h3>
            <form id="mk-form" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Canal *</label>
                        <select class="select" name="canal" required>
                            ${['Instagram','Indicação','WhatsApp','Google Ads','Facebook','Site','Outro'].map(c => `<option ${m.canal===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Mês Ref *</label><input class="input" name="mes_ref" placeholder="2026-04" value="${m.mes_ref||Utils.currentMonthKey()}" required></div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Investimento</label><input type="number" step="0.01" class="input" name="investimento" value="${m.investimento||0}"></div>
                    <div><label class="label">Leads</label><input type="number" class="input" name="leads_gerados" value="${m.leads_gerados||0}"></div>
                    <div><label class="label">Alunos</label><input type="number" class="input" name="alunos_convertidos" value="${m.alunos_convertidos||0}"></div>
                </div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleMarketing.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('mk-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('mk-form');
            if (id) await API.update('marketing', id, data);
            else await API.create('marketing', data);
            Utils.toast('Registro salvo!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir registro?', async () => {
            await API.remove('marketing', id);
            Utils.toast('Excluído', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
