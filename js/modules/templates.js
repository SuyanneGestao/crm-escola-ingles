/* ========================================
   Módulo: Templates de Mensagem
   ======================================== */
window.ModuleTemplates = {
    async render() {
        const templates = await API.list('templates');
        const agrupado = {};
        templates.forEach(t => { agrupado[t.categoria||'Outros'] = agrupado[t.categoria||'Outros'] || []; agrupado[t.categoria||'Outros'].push(t); });

        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('💬 Templates de Mensagem', `${templates.length} templates prontos`, `
                <button class="btn btn-primary" onclick="ModuleTemplates.openForm()"><i class="fas fa-plus"></i> Novo Template</button>
            `)}

            <div class="bg-brand-50 border-2 border-brand-200 rounded-xl p-4 mb-6">
                <p class="text-sm text-brand-800">💡 Use <code class="bg-white px-1 rounded">{{nome}}</code>, <code class="bg-white px-1 rounded">{{mes}}</code>, <code class="bg-white px-1 rounded">{{vencimento}}</code> como variáveis.</p>
            </div>

            ${Object.keys(agrupado).length === 0 ? Components.emptyState('comment-dots', 'Nenhum template ainda') : `
            <div class="space-y-6">
                ${Object.entries(agrupado).map(([cat, items]) => `
                    <div>
                        <h3 class="font-bold text-gray-700 mb-3">${cat}</h3>
                        <div class="grid md:grid-cols-2 gap-3">
                            ${items.map(t => `
                            <div class="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition">
                                <div class="flex items-start justify-between mb-2">
                                    <div>
                                        <p class="font-semibold">${t.nome}</p>
                                        <span class="pill pill-blue">${t.canal}</span>
                                    </div>
                                    <div class="flex gap-1">
                                        <button class="text-brand-600 hover:text-brand-800 p-1" onclick="ModuleTemplates.copyContent('${t.id}')" title="Copiar"><i class="fas fa-copy"></i></button>
                                        <button class="text-gray-400 hover:text-gray-600 p-1" onclick="ModuleTemplates.openForm('${t.id}')"><i class="fas fa-edit"></i></button>
                                    </div>
                                </div>
                                <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">${t.conteudo}</div>
                            </div>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>`}
        </div>`;
    },

    async copyContent(id) {
        const t = await API.get('templates', id);
        if (!t) return;
        try {
            await navigator.clipboard.writeText(t.conteudo);
            Utils.toast('Copiado! Cole no WhatsApp 📋', 'success');
        } catch {
            Utils.toast('Não foi possível copiar', 'error');
        }
    },

    async openForm(id = null) {
        const t = id ? (await API.get('templates', id)) : {};
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id?'✏️ Editar':'➕ Novo'} Template</h3>
            <form id="tpl-form" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Nome *</label><input class="input" name="nome" required value="${t.nome||''}"></div>
                    <div><label class="label">Categoria</label>
                        <select class="select" name="categoria">
                            ${['Boas-vindas','Follow-up','Cobrança','Reengajamento','Aniversário','Conversão','Outro'].map(c => `<option ${t.categoria===c?'selected':''}>${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div><label class="label">Canal</label>
                    <select class="select" name="canal">
                        ${['WhatsApp','Instagram','Email','SMS'].map(c => `<option ${t.canal===c?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div><label class="label">Conteúdo *</label><textarea class="textarea" name="conteudo" rows="5" required>${t.conteudo||''}</textarea></div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleTemplates.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('tpl-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('tpl-form');
            if (id) await API.update('templates', id, data);
            else await API.create('templates', data);
            Utils.toast('Template salvo!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir template?', async () => {
            await API.remove('templates', id);
            Utils.toast('Excluído', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
