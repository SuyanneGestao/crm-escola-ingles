/* ========================================
   Módulo: CRM Leads - Kanban 5 etapas
   ======================================== */
window.ModuleLeads = {
    async render() {
        const leads = await API.list('leads');
        const etapas = [
            { status: 'Novo', label: '🆕 Novo', color: 'blue' },
            { status: 'Contato', label: '📞 Em Contato', color: 'yellow' },
            { status: 'Proposta', label: '📄 Proposta', color: 'purple' },
            { status: 'Negociação', label: '🤝 Negociação', color: 'orange' },
            { status: 'Fechado', label: '✅ Fechado', color: 'green' },
        ];
        etapas.forEach(e => e.items = leads.filter(l => l.etapa === e.status));

        const renderCard = (l) => {
            const temp = { 'Quente': '🔥', 'Morno': '♨️', 'Frio': '❄️' }[l.temperatura] || '';
            const dias = Utils.daysUntil(l.follow_up);
            const alerta = dias !== null && dias <= 0 ? '<span class="pill pill-red">⏰ Atrasado</span>' : (dias !== null && dias <= 2 ? '<span class="pill pill-yellow">Hoje/Amanhã</span>' : '');
            return `
            <div class="kanban-card" data-id="${l.id}" onclick="ModuleLeads.openDetail('${l.id}')">
                <div class="flex items-center gap-2 mb-2">
                    ${Components.avatar(l.nome, 32)}
                    <div class="min-w-0 flex-1">
                        <p class="font-semibold text-sm truncate">${l.nome}</p>
                        <p class="text-xs text-gray-500 truncate">${l.canal} · ${temp}</p>
                    </div>
                </div>
                ${l.objetivo ? `<p class="text-xs text-brand-700 mb-1"><i class="fas fa-bullseye"></i> ${l.objetivo}</p>` : ''}
                ${l.follow_up ? `<p class="text-xs text-gray-600">📅 ${Utils.formatDate(l.follow_up)}</p>` : ''}
                <div class="flex items-center justify-between mt-2">
                    ${alerta}
                    <a href="${Utils.whatsappLink(l.telefone)}" target="_blank" onclick="event.stopPropagation()" class="text-green-600 hover:text-green-800"><i class="fab fa-whatsapp"></i></a>
                </div>
            </div>`;
        };

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('🧲 CRM de Leads', `${leads.length} leads · funil de 5 etapas`, `
                <button class="btn btn-primary" onclick="ModuleLeads.openForm()"><i class="fas fa-plus"></i> Novo Lead</button>
            `)}
            ${Components.kanbanBoard(etapas, renderCard, 'leads', 'etapa')}
        </div>`;

        Components.setupDragDrop(async (id, status) => {
            await API.update('leads', id, { etapa: status });
            Utils.toast(`Lead movido para "${status}"`, 'success');
            this.render();
        });
    },

    async openForm(id = null) {
        const lead = id ? await API.get('leads', id) : {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Novo'} Lead</h3>
            <form id="lead-form" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Nome *</label><input class="input" name="nome" required value="${lead.nome||''}"></div>
                    <div><label class="label">Telefone</label><input class="input" name="telefone" value="${lead.telefone||''}"></div>
                </div>
                <div><label class="label">Email</label><input type="email" class="input" name="email" value="${lead.email||''}"></div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Canal</label>
                        <select class="select" name="canal">
                            ${['Instagram','Indicação','WhatsApp','Google Ads','Facebook','Site','Outro'].map(c => `<option ${lead.canal===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Etapa</label>
                        <select class="select" name="etapa">
                            ${['Novo','Contato','Proposta','Negociação','Fechado'].map(e => `<option ${lead.etapa===e?'selected':''}>${e}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Temperatura</label>
                        <select class="select" name="temperatura">
                            ${['Frio','Morno','Quente'].map(t => `<option ${lead.temperatura===t?'selected':''}>${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">🎯 Objetivo do Lead</label>
                        <select class="select" name="objetivo">
                            <option value="">Selecione...</option>
                            ${['Viagem','Trabalho','Intercâmbio','Fluência','Prova (IELTS/TOEFL)','Carreira','Hobby','Outro'].map(o => `<option ${lead.objetivo===o?'selected':''}>${o}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">🎂 Data de Nascimento</label><input type="date" class="input" name="data_nascimento" value="${lead.data_nascimento||''}"></div>
                </div>
                <div><label class="label">Próximo Follow-up</label><input type="date" class="input" name="follow_up" value="${lead.follow_up||''}"></div>
                <div><label class="label">Observações</label><textarea class="textarea" name="observacoes" rows="2">${lead.observacoes||''}</textarea></div>
                <div class="flex gap-2 justify-end pt-3">
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('lead-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('lead-form');
            if (id) { await API.update('leads', id, data); Utils.toast('Lead atualizado!', 'success'); }
            else { await API.create('leads', data); Utils.toast('Lead criado!', 'success'); }
            Utils.closeModal();
            this.render();
        };
    },

    async openDetail(id) {
        const l = await API.get('leads', id);
        if (!l) return;
        const idade = Utils.age(l.data_nascimento);
        Utils.openModal(`
        <div class="p-6">
            <div class="flex items-start gap-4 mb-4">
                ${Components.avatar(l.nome, 56)}
                <div class="flex-1">
                    <h3 class="text-xl font-bold">${l.nome}</h3>
                    <p class="text-sm text-gray-500">${l.canal} · ${l.etapa} · ${l.temperatura}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><strong>📞 Telefone:</strong> ${l.telefone||'—'}</div>
                <div><strong>📧 Email:</strong> ${l.email||'—'}</div>
                <div><strong>🎯 Objetivo:</strong> ${l.objetivo||'—'}</div>
                <div><strong>🎂 Nascimento:</strong> ${Utils.formatDate(l.data_nascimento)} ${idade?`(${idade} anos)`:''}</div>
                <div><strong>📅 Follow-up:</strong> ${Utils.formatDate(l.follow_up)}</div>
            </div>
            ${l.observacoes ? `<div class="bg-gray-50 p-3 rounded-lg mb-4 text-sm"><strong>Observações:</strong><br>${l.observacoes}</div>` : ''}
            <div class="flex flex-wrap gap-2">
                <a href="${Utils.whatsappLink(l.telefone, 'Oi ' + l.nome + '! 💜')}" target="_blank" class="btn btn-success"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                <button class="btn btn-secondary" onclick="Utils.closeModal();ModuleLeads.openForm('${id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-primary" onclick="ModuleLeads.converter('${id}')"><i class="fas fa-user-plus"></i> Converter em Aluno</button>
                <button class="btn btn-danger" onclick="ModuleLeads.excluir('${id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`);
    },

    async converter(id) {
        const l = await API.get('leads', id);
        if (!l) return;
        await API.create('alunos', {
            nome: l.nome, email: l.email, telefone: l.telefone,
            objetivo: l.objetivo, data_nascimento: l.data_nascimento,
            canal_origem: l.canal, status: 'Ativo', nivel: 'Básico',
            data_inicio: new Date().toISOString().slice(0,10), progresso: 0
        });
        await API.update('leads', id, { etapa: 'Fechado' });
        Utils.toast(`${l.nome} convertido em aluno! 🎉`, 'success');
        Utils.closeModal();
        this.render();
    },

    excluir(id) {
        Utils.confirm('Excluir este lead?', async () => {
            await API.remove('leads', id);
            Utils.toast('Lead excluído', 'success');
            Utils.closeModal();
            this.render();
        });
    }
};
