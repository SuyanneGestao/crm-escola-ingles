/* ========================================
   Módulo: Turmas
   ======================================== */
window.ModuleTurmas = {
    async render() {
        const [turmas, professores, alunos] = await Promise.all([
            API.list('turmas'), API.list('professores'), API.list('alunos')
        ]);
        const profMap = Object.fromEntries(professores.map(p => [p.id, p.nome]));
        const alunosPorTurma = {};
        alunos.forEach(a => {
            if (a.turma_id) alunosPorTurma[a.turma_id] = (alunosPorTurma[a.turma_id]||0) + 1;
        });

        const cols = [
            { status: 'Em formação', label: '🛠️ Em Formação', color: 'yellow' },
            { status: 'Ativa', label: '✅ Ativa', color: 'green' },
            { status: 'Lotada', label: '🎯 Lotada', color: 'purple' },
            { status: 'Encerrada', label: '🔒 Encerrada', color: 'gray' },
        ];
        cols.forEach(c => c.items = turmas.filter(t => t.status === c.status));

        const renderCard = (t) => {
            const ocupacao = alunosPorTurma[t.id] || 0;
            const pct = Math.round((ocupacao / (t.capacidade||8)) * 100);
            return `
            <div class="kanban-card" data-id="${t.id}" onclick="ModuleTurmas.openForm('${t.id}')">
                <p class="font-semibold text-sm mb-1">${t.nome}</p>
                <p class="text-xs text-gray-500">👨‍🏫 ${profMap[t.professor_id]||'Sem professor'}</p>
                <p class="text-xs text-gray-500">📅 ${t.dias||'—'} · ${t.horario||''}</p>
                <div class="progress-bar mt-2"><div class="progress-fill" style="width:${Math.min(pct,100)}%"></div></div>
                <p class="text-xs mt-1">${ocupacao}/${t.capacidade||8} alunos</p>
                ${t.link_aula ? `<a href="${t.link_aula}" target="_blank" onclick="event.stopPropagation()" class="text-xs text-brand-600 hover:underline"><i class="fas fa-video"></i> Link da aula</a>` : ''}
            </div>`;
        };

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('📚 Turmas', `${turmas.length} turmas · coração da operação`, `
                <button class="btn btn-primary" onclick="ModuleTurmas.openForm()"><i class="fas fa-plus"></i> Nova Turma</button>
            `)}
            ${Components.kanbanBoard(cols, renderCard, 'turmas', 'status')}
        </div>`;

        Components.setupDragDrop(async (id, status) => {
            await API.update('turmas', id, { status });
            Utils.toast(`Turma atualizada!`, 'success');
            this.render();
        });
    },

    async openForm(id = null) {
        const [turma, professores] = await Promise.all([
            id ? API.get('turmas', id) : Promise.resolve({}), API.list('professores')
        ]);
        const t = turma || {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Nova'} Turma</h3>
            <form id="turma-form" class="space-y-3">
                <div><label class="label">Nome da Turma *</label><input class="input" name="nome" required value="${t.nome||''}"></div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Professor</label>
                        <select class="select" name="professor_id">
                            <option value="">—</option>
                            ${professores.map(p => `<option value="${p.id}" ${t.professor_id===p.id?'selected':''}>${p.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Nível</label>
                        <select class="select" name="nivel">
                            ${['Básico','Intermediário','Avançado'].map(n => `<option ${t.nivel===n?'selected':''}>${n}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Dias</label><input class="input" name="dias" placeholder="Seg/Qua/Sex" value="${t.dias||''}"></div>
                    <div><label class="label">Horário</label><input class="input" name="horario" placeholder="19:00-20:30" value="${t.horario||''}"></div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Capacidade</label><input type="number" class="input" name="capacidade" value="${t.capacidade||8}"></div>
                    <div><label class="label">Status</label>
                        <select class="select" name="status">
                            ${['Em formação','Ativa','Lotada','Encerrada'].map(s => `<option ${t.status===s?'selected':''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div><label class="label">Link da Aula (Meet/Zoom)</label><input class="input" name="link_aula" placeholder="https://meet.google.com/..." value="${t.link_aula||''}"></div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleTurmas.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('turma-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('turma-form');
            if (id) await API.update('turmas', id, data);
            else await API.create('turmas', data);
            Utils.toast('Turma salva!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir esta turma?', async () => {
            await API.remove('turmas', id);
            Utils.toast('Turma excluída', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
