/* ========================================
   Módulo: Método & Progresso (mentoria autoral)
   ======================================== */
window.ModuleMetodo = {
    async render() {
        const [fases, alunos] = await Promise.all([API.list('metodo_fases'), API.list('alunos')]);
        const fasesOrd = [...fases].sort((a,b) => (a.ordem||0) - (b.ordem||0));

        const alunosPorFase = {};
        fasesOrd.forEach(f => alunosPorFase[f.nome] = alunos.filter(a => a.fase_metodo === f.nome && a.status === 'Ativo'));

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('🎓 Método & Progresso', 'Pipeline da sua mentoria autoral', `
                <button class="btn btn-primary" onclick="ModuleMetodo.openFase()"><i class="fas fa-plus"></i> Nova Fase</button>
            `)}

            <div class="bg-gradient-to-r from-brand-50 to-pink-50 border-2 border-brand-200 rounded-2xl p-5 mb-6">
                <h3 class="font-bold text-brand-800 mb-2">🌟 Jornada do Método</h3>
                <p class="text-sm text-brand-700">Configure as fases do seu método autoral e acompanhe em qual etapa cada aluno está. Funciona como um funil pedagógico.</p>
            </div>

            <!-- Pipeline de fases -->
            <div class="space-y-4 mb-8">
                ${fasesOrd.map((f, i) => {
                    const alunosFase = alunosPorFase[f.nome] || [];
                    const progressoMedio = alunosFase.length > 0 ? Math.round(alunosFase.reduce((s,a) => s + (a.progresso||0), 0) / alunosFase.length) : 0;
                    return `
                    <div class="bg-white rounded-2xl p-5 border-2 border-brand-100 cursor-pointer hover:shadow-lg transition" onclick="ModuleMetodo.openFase('${f.id}')">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">${f.ordem||i+1}</div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-bold text-lg">${f.nome}</h4>
                                    <span class="pill pill-purple">${alunosFase.length} alunos</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${f.descricao||''}</p>
                                <p class="text-xs text-gray-500 mt-2">⏱️ Duração: ${f.duracao_semanas||'—'} semanas · Progresso médio: ${progressoMedio}%</p>
                                ${alunosFase.length > 0 ? `
                                <div class="flex flex-wrap gap-1 mt-3">
                                    ${alunosFase.slice(0,8).map(a => `<span title="${a.nome} · ${a.progresso||0}%">${Components.avatar(a.nome, 28)}</span>`).join('')}
                                    ${alunosFase.length > 8 ? `<span class="text-xs text-gray-500 self-center">+${alunosFase.length-8}</span>` : ''}
                                </div>` : ''}
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <!-- Alunos sem fase -->
            ${alunos.filter(a => !a.fase_metodo && a.status === 'Ativo').length > 0 ? `
            <div class="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5">
                <h3 class="font-bold text-yellow-800 mb-2">⚠️ Alunos sem fase definida</h3>
                <div class="space-y-2">
                    ${alunos.filter(a => !a.fase_metodo && a.status === 'Ativo').map(a => `
                    <div class="flex items-center justify-between bg-white rounded-lg p-3">
                        <div class="flex items-center gap-2">${Components.avatar(a.nome, 32)}<span class="font-semibold text-sm">${a.nome}</span></div>
                        <button class="btn btn-sm btn-primary" onclick="ModuleAlunos.openForm('${a.id}')">Definir fase</button>
                    </div>`).join('')}
                </div>
            </div>` : ''}
        </div>`;
    },

    async openFase(id = null) {
        const f = id ? await API.get('metodo_fases', id) : {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Nova'} Fase do Método</h3>
            <form id="fase-form" class="space-y-3">
                <div class="grid grid-cols-3 gap-3">
                    <div><label class="label">Ordem</label><input type="number" class="input" name="ordem" value="${f.ordem||''}"></div>
                    <div class="col-span-2"><label class="label">Nome da Fase *</label><input class="input" name="nome" required value="${f.nome||''}"></div>
                </div>
                <div><label class="label">Descrição</label><textarea class="textarea" name="descricao" rows="3">${f.descricao||''}</textarea></div>
                <div><label class="label">Duração (semanas)</label><input type="number" class="input" name="duracao_semanas" value="${f.duracao_semanas||''}"></div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleMetodo.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('fase-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('fase-form');
            if (id) await API.update('metodo_fases', id, data);
            else await API.create('metodo_fases', data);
            Utils.toast('Fase salva!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir esta fase?', async () => {
            await API.remove('metodo_fases', id);
            Utils.toast('Fase excluída', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
