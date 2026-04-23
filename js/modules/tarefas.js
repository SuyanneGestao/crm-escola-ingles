/* ========================================
   Módulo: Tarefas e Pendências
   ======================================== */
window.ModuleTarefas = {
    async render() {
        const tarefas = await API.list('tarefas');
        const prioColor = { 'Alta':'red', 'Média':'yellow', 'Baixa':'green' };
        const prioIcon = { 'Alta':'🔴', 'Média':'🟡', 'Baixa':'🟢' };

        const cols = [
            { status: 'A fazer', label: '📋 A fazer', color: 'blue' },
            { status: 'Em andamento', label: '⚡ Em andamento', color: 'yellow' },
            { status: 'Concluída', label: '✅ Concluída', color: 'green' },
            { status: 'Cancelada', label: '❌ Cancelada', color: 'gray' },
        ];
        cols.forEach(c => {
            c.items = tarefas.filter(t => t.status === c.status)
                .sort((a,b) => ['Alta','Média','Baixa'].indexOf(a.prioridade) - ['Alta','Média','Baixa'].indexOf(b.prioridade));
        });

        const renderCard = (t) => {
            const dias = Utils.daysUntil(t.prazo);
            const alerta = t.status !== 'Concluída' && dias !== null && dias <= 1 ? '<span class="pill pill-red">⏰ Urgente</span>' : '';
            return `
            <div class="kanban-card" data-id="${t.id}" onclick="ModuleTarefas.openForm('${t.id}')">
                <div class="flex items-start gap-2 mb-1">
                    <span>${prioIcon[t.prioridade]||''}</span>
                    <p class="font-semibold text-sm flex-1">${t.titulo}</p>
                </div>
                <div class="flex items-center gap-1 flex-wrap">
                    ${Components.pill(t.categoria, 'blue')}
                    ${alerta}
                </div>
                ${t.prazo ? `<p class="text-xs text-gray-500 mt-2">📅 ${Utils.formatDate(t.prazo)}</p>` : ''}
                ${t.responsavel ? `<p class="text-xs text-gray-500">👤 ${t.responsavel}</p>` : ''}
            </div>`;
        };

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('✅ Tarefas', `${tarefas.length} tarefas · para não deixar nada escapar`, `
                <button class="btn btn-primary" onclick="ModuleTarefas.openForm()"><i class="fas fa-plus"></i> Nova Tarefa</button>
            `)}
            ${Components.kanbanBoard(cols, renderCard, 'tarefas', 'status')}
        </div>`;

        Components.setupDragDrop(async (id, status) => {
            await API.update('tarefas', id, { status });
            Utils.toast('Tarefa atualizada!', 'success');
            this.render();
        });
    },

    async openForm(id = null) {
        const tf = id ? await API.get('tarefas', id) : {};
        const t = tf || {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Nova'} Tarefa</h3>
            <form id="tf-form" class="space-y-3">
                <div><label class="label">Título *</label><input class="input" name="titulo" required value="${t.titulo||''}"></div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Categoria</label>
                        <select class="select" name="categoria">
                            ${['Vendas','Pedagógico','Financeiro','Marketing','Administrativo','Outro'].map(c => `<option ${t.categoria===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Prioridade</label>
                        <select class="select" name="prioridade">
                            ${['Alta','Média','Baixa'].map(p => `<option ${t.prioridade===p?'selected':''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Status</label>
                        <select class="select" name="status">
                            ${['A fazer','Em andamento','Concluída','Cancelada'].map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Prazo</label><input type="date" class="input" name="prazo" value="${t.prazo||''}"></div>
                    <div><label class="label">Responsável</label><input class="input" name="responsavel" value="${t.responsavel||''}"></div>
                </div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleTarefas.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    ${id ? `<button type="button" class="btn btn-secondary" onclick="ModuleTarefas.addToCalendar('${id}')"><i class="fab fa-google"></i> Google Calendar</button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('tf-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('tf-form');
            if (id) await API.update('tarefas', id, data);
            else await API.create('tarefas', data);
            Utils.toast('Tarefa salva!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    async addToCalendar(id) {
        const t = await API.get('tarefas', id);
        if (!t) return;
        if (window.ModuleCalendar && window.ModuleCalendar.createEventFromTask) {
            await window.ModuleCalendar.createEventFromTask(t);
        } else {
            Utils.toast('Integração Google Calendar não configurada. Acesse o módulo Google Calendar.', 'warning');
        }
    },

    excluir(id) {
        Utils.confirm('Excluir esta tarefa?', async () => {
            await API.remove('tarefas', id);
            Utils.toast('Tarefa excluída', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
