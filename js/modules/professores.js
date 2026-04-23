/* ========================================
   Módulo: Professores
   ======================================== */
window.ModuleProfessores = {
    async render() {
        const professores = await API.list('professores');
        document.getElementById('module-content').innerHTML = `
        <div class="module-fade">
            ${Components.pageHeader('👨‍🏫 Professores', `${professores.length} professores`, `
                <button class="btn btn-primary" onclick="ModuleProfessores.openForm()"><i class="fas fa-plus"></i> Novo Professor</button>
            `)}
            ${professores.length === 0 ? Components.emptyState('chalkboard-teacher', 'Nenhum professor cadastrado') : `
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${professores.map(p => {
                    const niveis = Array.isArray(p.niveis) ? p.niveis : (p.niveis ? [p.niveis] : []);
                    return `
                    <div class="bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer hover:shadow-lg transition" onclick="ModuleProfessores.openForm('${p.id}')">
                        <div class="flex items-center gap-3 mb-3">
                            ${Components.avatar(p.nome, 48)}
                            <div>
                                <p class="font-bold">${p.nome}</p>
                                <p class="text-xs text-gray-500">${p.email||''}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1 mb-3">
                            ${niveis.map(n => Components.pill(n, 'blue')).join('')}
                        </div>
                        <p class="text-xs text-gray-600 mb-1"><i class="fas fa-calendar"></i> ${p.dias||'—'}</p>
                        <p class="text-xs text-gray-600 mb-1"><i class="fas fa-clock"></i> ${p.disponibilidade||'—'}</p>
                        ${p.valor_hora ? `<p class="text-sm font-semibold text-green-600 mt-2">${Utils.formatMoney(p.valor_hora)}/hora</p>` : ''}
                    </div>`;
                }).join('')}
            </div>`}
        </div>`;
    },

    async openForm(id = null) {
        const prof = id ? await API.get('professores', id) : {};
        const p = prof || {};
        const niveisAtuais = Array.isArray(p.niveis) ? p.niveis : [];
        Utils.openModal(`
        <div class="p-6">
            <h3 class="text-xl font-bold mb-4">${id ? '✏️ Editar' : '➕ Novo'} Professor</h3>
            <form id="prof-form" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Nome *</label><input class="input" name="nome" required value="${p.nome||''}"></div>
                    <div><label class="label">Telefone</label><input class="input" name="telefone" value="${p.telefone||''}"></div>
                </div>
                <div><label class="label">Email</label><input type="email" class="input" name="email" value="${p.email||''}"></div>
                <div>
                    <label class="label">Níveis que ensina</label>
                    <div class="flex gap-3">
                        ${['Básico','Intermediário','Avançado'].map(n => `
                            <label class="flex items-center gap-2">
                                <input type="checkbox" class="nivel-check" value="${n}" ${niveisAtuais.includes(n)?'checked':''}>
                                <span class="text-sm">${n}</span>
                            </label>`).join('')}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="label">Disponibilidade</label><input class="input" name="disponibilidade" placeholder="Noite, Sábado" value="${p.disponibilidade||''}"></div>
                    <div><label class="label">Dias</label><input class="input" name="dias" placeholder="Ter, Qui, Sáb" value="${p.dias||''}"></div>
                </div>
                <div><label class="label">Valor/Hora (R$)</label><input type="number" step="0.01" class="input" name="valor_hora" value="${p.valor_hora||''}"></div>
                <div class="flex gap-2 justify-end pt-3">
                    ${id ? `<button type="button" class="btn btn-danger mr-auto" onclick="ModuleProfessores.excluir('${id}')"><i class="fas fa-trash"></i></button>` : ''}
                    <button type="button" class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Salvar</button>
                </div>
            </form>
        </div>`);
        document.getElementById('prof-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = Utils.getFormData('prof-form');
            data.niveis = Array.from(document.querySelectorAll('.nivel-check:checked')).map(c => c.value);
            if (id) await API.update('professores', id, data);
            else await API.create('professores', data);
            Utils.toast('Professor salvo!', 'success');
            Utils.closeModal(); this.render();
        };
    },

    excluir(id) {
        Utils.confirm('Excluir este professor?', async () => {
            await API.remove('professores', id);
            Utils.toast('Professor excluído', 'success');
            Utils.closeModal(); this.render();
        });
    }
};
