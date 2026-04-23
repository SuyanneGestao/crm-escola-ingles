/* ========================================
   Módulo: Financeiro
   ======================================== */
window.ModuleFinanceiro = {
    mesFiltro: null,

    async render() {
        const [financeiro, alunos] = await Promise.all([API.list('financeiro'), API.list('alunos')]);
        const alunoMap = Object.fromEntries(alunos.map(a => [a.id, a.nome]));

        if (!this.mesFiltro) this.mesFiltro = Utils.currentMonthKey();
        const filtered = this.mesFiltro === 'todos' ? financeiro : financeiro.filter(f => f.mes_ref === this.mesFiltro);

        const pago = filtered.filter(f => f.status === 'Pago').reduce((s, f) => s + Number(f.valor||0), 0);
        const pendente = filtered.filter(f => f.status === 'Pendente').reduce((s, f) => s + Number(f.valor||0), 0);
        const atrasado = filtered.filter(f => f.status === 'Atrasado').reduce((s, f) => s + Number(f.valor||0), 0);
        const total = pago + pendente + atrasado;

        const meses = [...new Set(financeiro.map(f => f.mes_ref))].filter(Boolean).sort().reverse();

        const cols = [
            { status: 'Pendente', label: '⏳ Pendente', color: 'yellow' },
            { status: 'Pago', label: '✅ Pago', color: 'green' },
            { status: 'Atrasado', label: '🚨 Atrasado', color: 'red' },
            { status: 'Cancelado', label: '❌ Cancelado', color: 'gray' },
        ];
        cols.forEach(c => c.items = filtered.filter(f => f.status === c.status));

        const renderCard = (f) => {
            const diasAtraso = Utils.daysUntil(f.vencimento);
            return `
            <div class="kanban-card" data-id="${f.id}" onclick="ModuleFinanceiro.openForm('${f.id}')">
                <div class="flex justify-between items-start mb-1">
                    <p class="font-semibold text-sm truncate">${alunoMap[f.aluno_id]||'—'}</p>
                    <p class="font-bold text-brand-700">${Utils.formatMoney(f.valor)}</p>
                </div>
                <p class="text-xs text-gray-500">${f.descricao}</p>
                <p class="text-xs text-gray-500 mt-1">📅 Venc: ${Utils.formatDate(f.vencimento)} ${f.forma?`· 💳 ${f.forma}`:''}</p>
                ${f.status === 'Pendente' && diasAtraso !== null && diasAtraso < 0 ? `<span class="pill pill-red mt-1">${Math.abs(diasAtraso)} dias atrasado</span>` : ''}
                ${f.status !== 'Pago' ? `<button class="btn btn-success btn-sm mt-2 w-full" onclick="event.stopPropagation();ModuleFinanceiro.marcarPago('${f.id}')">Marcar como Pago</button>` : ''}
            </div>`;
        };

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('💰 Financeiro', `${filtered.length} cobranças · ${this.mesFiltro}`, `
                <select class="select" onchange="ModuleFinanceiro.setMes(this.value)" style="max-width:200px">
                    <option value="todos" ${this.mesFiltro==='todos'?'selected':''}>Todos os meses</option>
                    ${meses.map(m => `<option value="${m}" ${this.mesFiltro===m?'selected':''}>${m}</option>`).join('')}
                </select>
                <button class="btn btn-primary" onclick="ModuleFinanceiro.openForm()"><i class="fas fa-plus"></i> Nova Cobrança</button>
            `)}

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                ${Components.kpiCard({label:'MRR (Pago)', value: Utils.formatMoney(pago), icon:'check-circle', color:'green'})}
                ${Components.kpiCard({label:'A Receber', value: Utils.formatMoney(pendente), icon:'clock', color:'yellow'})}
                ${Components.kpiCard({label:'Inadimplência', value: Utils.formatMoney(atrasado), icon:'exclamation-triangle', color:'red'})}
                ${Components.kpiCard({label:'Total', value: Utils.formatMoney(total), icon:'dollar-sign', color:'brand'})}
            </div>

            ${Components.kanbanBoard(cols, renderCard, 'financeiro', 'status')}
        </div>`;

        Components.setupDragDrop(async (id, status) => {
            const update = { status };
            if (status === 'Pago') update.data_pagamento = new Date().toISOString().slice(0,10);
            await API.update('financeiro', id, update);
            Utils.toast('Status atualizado!', 'success');
            this.render();
        });
    },

    setMes(m) { this.mesFiltro = m; this.render(); },

    async marcarPago(id) {
        await API.update('financeiro', id, { status: 'Pago', data_pagamento: new Date().toISOString().slice(0,10) });
        Utils.toast('Pagamento confirmado! 💰', 'success');
        this.render();
    },

    async openForm(id = null) {
        const [fin, alunos] = await Promise.all([
            id ? API.get('financeiro', id) : Promise.resolve({}), API.list('alunos')
        ]);
        const f = fin || {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Nova'} Cobrança</h3>
            <form id="fin-form" class="space-y-3">
                <div><label class="label">Aluno *</label>
                    <select class="select" name="aluno_id" required>
                        <option value="">Selecione...</option>
                        ${alunos.map(a => `<option value="${a.id}" ${f.aluno_id===a.id?'selected':''}>${a.nome}</option>`).join('')}
                    </select>
                </div>
                <div><label class="label">Descrição *</label><input class="input" name="descricao" required value="${f.descricao||'Mensalidade'}"></div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Valor (R$) *</label><input type="number" step="0.01" class="input" name="valor" required value="${f.valor||''}"></div>
                    <div><label class="label">Vencimento *</label><input type="date" class="input" name="vencimento" required value="${f.vencimento||''}"></div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Status</label>
                        <select class="select" name="status">
                            ${['Pendente','Pago','Atrasado','Cancelado'].map(s => `<option ${f.status===s?'selected':''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Forma</label>
                        <select class="select" name="forma">
                            <option value="">—</option>
                            ${['PIX','Cartão','Boleto','Dinheiro','Transferência'].map(fm => `<option ${f.forma===fm?'selected':''}>${fm}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Mês Ref</label><input class="input" name="mes_ref" placeholder="2026-04" value="${f.mes_ref||Utils.currentMonthKey()}"></div>
                </div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleFinanceiro.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('fin-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('fin-form');
            if (id) await API.update('financeiro', id, data);
            else await API.create('financeiro', data);
            Utils.toast('Cobrança salva!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir esta cobrança?', async () => {
            await API.remove('financeiro', id);
            Utils.toast('Cobrança excluída', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
