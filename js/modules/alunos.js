/* ========================================
   Módulo: Alunos (com objetivo + data_nascimento)
   ======================================== */
window.ModuleAlunos = {
    view: 'lista',

    async render() {
        const [alunos, turmas] = await Promise.all([API.list('alunos'), API.list('turmas')]);
        const turmaMap = Object.fromEntries(turmas.map(t => [t.id, t.nome]));

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('👩‍🎓 Alunos', `${alunos.length} alunos cadastrados`, `
                <div class="flex rounded-lg bg-gray-100 p-1">
                    <button class="btn btn-sm ${this.view==='lista'?'bg-white shadow':''}" onclick="ModuleAlunos.setView('lista')">📋 Lista</button>
                    <button class="btn btn-sm ${this.view==='kanban'?'bg-white shadow':''}" onclick="ModuleAlunos.setView('kanban')">📊 Kanban</button>
                </div>
                <button class="btn btn-primary" onclick="ModuleAlunos.openForm()"><i class="fas fa-plus"></i> Novo Aluno</button>
            `)}

            ${this.view === 'lista' ? this.renderLista(alunos, turmaMap) : this.renderKanban(alunos, turmaMap)}
        </div>`;

        if (this.view === 'kanban') {
            Components.setupDragDrop(async (id, status) => {
                await API.update('alunos', id, { status });
                Utils.toast(`Aluno movido para "${status}"`, 'success');
                this.render();
            });
        }
    },

    setView(v) { this.view = v; this.render(); },

    renderLista(alunos, turmaMap) {
        if (alunos.length === 0) return Components.emptyState('user-graduate', 'Nenhum aluno ainda', `<button class="btn btn-primary" onclick="ModuleAlunos.openForm()">Cadastrar primeiro</button>`);
        return `
        <div class="bg-white rounded-2xl overflow-hidden border border-gray-100 overflow-x-auto">
            <table class="table">
                <thead>
                    <tr><th>Aluno</th><th>Objetivo</th><th>Nível</th><th>Turma</th><th>Progresso</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                    ${alunos.map(a => `
                    <tr class="cursor-pointer" onclick="ModuleAlunos.openDetail('${a.id}')">
                        <td>
                            <div class="flex items-center gap-2">
                                ${Components.avatar(a.nome, 32)}
                                <div>
                                    <p class="font-semibold text-sm">${a.nome}</p>
                                    <p class="text-xs text-gray-500">${a.telefone||''}</p>
                                </div>
                            </div>
                        </td>
                        <td><span class="pill pill-purple">🎯 ${a.objetivo||'—'}</span></td>
                        <td>${Components.pill(a.nivel||'—','blue')}</td>
                        <td class="text-xs">${turmaMap[a.turma_id]||'—'}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <div class="progress-bar w-20"><div class="progress-fill" style="width:${a.progresso||0}%"></div></div>
                                <span class="text-xs">${a.progresso||0}%</span>
                            </div>
                        </td>
                        <td>${Components.pill(a.status, {'Ativo':'green','Pausado':'yellow','Cancelado':'red','Concluído':'purple'}[a.status]||'gray')}</td>
                        <td>
                            <a href="${Utils.whatsappLink(a.telefone)}" target="_blank" onclick="event.stopPropagation()" class="text-green-600 hover:text-green-800 text-lg"><i class="fab fa-whatsapp"></i></a>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    },

    renderKanban(alunos, turmaMap) {
        const cols = [
            { status: 'Ativo', label: '✅ Ativos', color: 'green' },
            { status: 'Pausado', label: '⏸️ Pausados', color: 'yellow' },
            { status: 'Concluído', label: '🎓 Concluídos', color: 'purple' },
            { status: 'Cancelado', label: '❌ Cancelados', color: 'red' },
        ];
        cols.forEach(c => c.items = alunos.filter(a => a.status === c.status));

        const renderCard = (a) => `
        <div class="kanban-card" data-id="${a.id}" onclick="ModuleAlunos.openDetail('${a.id}')">
            <div class="flex items-center gap-2 mb-2">
                ${Components.avatar(a.nome, 32)}
                <div class="min-w-0 flex-1"><p class="font-semibold text-sm truncate">${a.nome}</p>
                <p class="text-xs text-gray-500">${a.nivel||''} · ${turmaMap[a.turma_id]||'Sem turma'}</p></div>
            </div>
            ${a.objetivo ? `<span class="pill pill-purple text-[10px]">🎯 ${a.objetivo}</span>` : ''}
            <div class="progress-bar mt-2"><div class="progress-fill" style="width:${a.progresso||0}%"></div></div>
            <p class="text-xs text-gray-500 mt-1">${a.fase_metodo||'Sem fase'} · ${a.progresso||0}%</p>
        </div>`;

        return Components.kanbanBoard(cols, renderCard, 'alunos', 'status');
    },

    async openForm(id = null) {
        const [aluno, turmas, fases] = await Promise.all([
            id ? API.get('alunos', id) : Promise.resolve({}),
            API.list('turmas'), API.list('metodo_fases')
        ]);
        const a = aluno || {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Novo'} Aluno</h3>
            <form id="aluno-form" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Nome *</label><input class="input" name="nome" required value="${a.nome||''}"></div>
                    <div><label class="label">Telefone</label><input class="input" name="telefone" value="${a.telefone||''}"></div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Email</label><input type="email" class="input" name="email" value="${a.email||''}"></div>
                    <div><label class="label">🎂 Data de Nascimento</label><input type="date" class="input" name="data_nascimento" value="${a.data_nascimento||''}"></div>
                </div>
                <div class="bg-brand-50 border-2 border-brand-200 rounded-xl p-3">
                    <label class="label text-brand-700">🎯 Objetivo do Aluno</label>
                    <select class="select" name="objetivo">
                        <option value="">Selecione o objetivo principal...</option>
                        ${['Viagem','Trabalho','Intercâmbio','Fluência','Prova (IELTS/TOEFL)','Carreira','Negócios','Hobby','Outro'].map(o => `<option ${a.objetivo===o?'selected':''}>${o}</option>`).join('')}
                    </select>
                    <p class="text-xs text-brand-600 mt-1">💡 Direciona o foco do método e das aulas</p>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Nível</label>
                        <select class="select" name="nivel">
                            ${['Básico','Intermediário','Avançado'].map(n => `<option ${a.nivel===n?'selected':''}>${n}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Turno</label>
                        <select class="select" name="turno">
                            <option value="">—</option>
                            ${['Manhã','Tarde','Noite','Sábado'].map(t => `<option ${a.turno===t?'selected':''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Status</label>
                        <select class="select" name="status">
                            ${['Ativo','Pausado','Cancelado','Concluído'].map(s => `<option ${a.status===s?'selected':''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Turma</label>
                        <select class="select" name="turma_id">
                            <option value="">—</option>
                            ${turmas.map(t => `<option value="${t.id}" ${a.turma_id===t.id?'selected':''}>${t.nome}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="label">Fase do Método</label>
                        <select class="select" name="fase_metodo">
                            <option value="">—</option>
                            ${fases.map(f => `<option ${a.fase_metodo===f.nome?'selected':''}>${f.nome}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Progresso (%)</label><input type="number" min="0" max="100" class="input" name="progresso" value="${a.progresso||0}"></div>
                    <div><label class="label">Data de Início</label><input type="date" class="input" name="data_inicio" value="${a.data_inicio||''}"></div>
                </div>
                <div class="flex gap-2 justify-end pt-3">
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('aluno-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('aluno-form');
            if (id) await API.update('alunos', id, data);
            else await API.create('alunos', data);
            Utils.toast('Aluno salvo!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    async openDetail(id) {
        const [a, turmas] = await Promise.all([API.get('alunos', id), API.list('turmas')]);
        if (!a) return;
        const turma = turmas.find(t => t.id === a.turma_id);
        const idade = Utils.age(a.data_nascimento);
        Utils.openModal(`
        <div class="p-6">
            <div class="flex items-start gap-4 mb-4">
                ${Components.avatar(a.nome, 64)}
                <div class="flex-1">
                    <h3 class="text-xl font-bold">${a.nome}</h3>
                    <p class="text-sm text-gray-500">${a.nivel} · ${Components.pill(a.status, 'green')}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><strong>📞</strong> ${a.telefone||'—'}</div>
                <div><strong>📧</strong> ${a.email||'—'}</div>
                <div class="col-span-2 bg-brand-50 p-3 rounded-lg"><strong>🎯 Objetivo:</strong> ${a.objetivo||'—'}</div>
                <div><strong>🎂</strong> ${Utils.formatDate(a.data_nascimento)} ${idade?`(${idade} anos)`:''}</div>
                <div><strong>📚 Turma:</strong> ${turma?.nome||'—'}</div>
                <div><strong>📖 Fase:</strong> ${a.fase_metodo||'—'}</div>
                <div><strong>📅 Início:</strong> ${Utils.formatDate(a.data_inicio)}</div>
            </div>
            <div class="mb-4">
                <p class="text-sm font-semibold mb-1">Progresso no método</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${a.progresso||0}%"></div></div>
                <p class="text-xs text-gray-500 mt-1">${a.progresso||0}% concluído</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <a href="${Utils.whatsappLink(a.telefone)}" target="_blank" class="btn btn-success"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                <button class="btn btn-secondary" onclick="Utils.closeModal();ModuleAlunos.openForm('${id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn btn-danger" onclick="ModuleAlunos.excluir('${id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>`);
    },

    excluir(id) {
        Utils.confirm('Excluir este aluno?', async () => {
            await API.remove('alunos', id);
            Utils.toast('Aluno excluído', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
