/* ========================================
   Componentes reutilizáveis
   ======================================== */

window.Components = {
    pageHeader(title, subtitle, actionsHtml = '') {
        return `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
                <h1 class="text-2xl lg:text-3xl font-bold text-gray-900">${title}</h1>
                ${subtitle ? `<p class="text-sm text-gray-500 mt-1">${subtitle}</p>` : ''}
            </div>
            <div class="flex gap-2 flex-wrap">${actionsHtml}</div>
        </div>`;
    },

    kpiCard({ label, value, icon, color = 'brand', sub = '' }) {
        const colors = {
            brand: 'bg-brand-100 text-brand-700',
            green: 'bg-green-100 text-green-700',
            red: 'bg-red-100 text-red-700',
            yellow: 'bg-yellow-100 text-yellow-700',
            blue: 'bg-blue-100 text-blue-700',
            pink: 'bg-pink-100 text-pink-700',
        };
        return `
        <div class="kpi-card">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${label}</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
                    ${sub ? `<p class="text-xs text-gray-500 mt-1">${sub}</p>` : ''}
                </div>
                <div class="w-10 h-10 rounded-xl ${colors[color]||colors.brand} flex items-center justify-center">
                    <i class="fas fa-${icon}"></i>
                </div>
            </div>
        </div>`;
    },

    avatar(name, size = 36) {
        return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.floor(size/3)}px">${Utils.initials(name)}</span>`;
    },

    pill(text, color = 'gray') {
        return `<span class="pill pill-${color}">${text}</span>`;
    },

    searchInput(placeholder, id) {
        return `
        <div class="relative flex-1 max-w-xs">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input id="${id}" class="input pl-9" placeholder="${placeholder}">
        </div>`;
    },

    emptyState(icon, text, actionHtml = '') {
        return `
        <div class="empty-state">
            <i class="fas fa-${icon}"></i>
            <p class="text-base font-medium text-gray-600">${text}</p>
            ${actionHtml ? `<div class="mt-4">${actionHtml}</div>` : ''}
        </div>`;
    },

    kanbanBoard(columns, renderCard, table, statusField) {
        return `
        <div class="kanban-container">
            ${columns.map(col => `
                <div class="kanban-column" data-status="${col.status}">
                    <div class="kanban-column-header">
                        <span>${col.icon || ''} ${col.label}</span>
                        <span class="pill pill-${col.color||'purple'}">${col.items.length}</span>
                    </div>
                    <div class="kanban-cards" data-dropzone data-status="${col.status}" data-table="${table}" data-field="${statusField}">
                        ${col.items.map(renderCard).join('')}
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    setupDragDrop(onMove) {
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.draggable = true;
            card.ondragstart = (e) => {
                card.classList.add('dragging');
                e.dataTransfer.setData('text/plain', card.dataset.id);
            };
            card.ondragend = () => card.classList.remove('dragging');
        });
        document.querySelectorAll('[data-dropzone]').forEach(zone => {
            zone.ondragover = (e) => { e.preventDefault(); zone.parentElement.classList.add('drag-over'); };
            zone.ondragleave = () => zone.parentElement.classList.remove('drag-over');
            zone.ondrop = async (e) => {
                e.preventDefault();
                zone.parentElement.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/plain');
                const status = zone.dataset.status;
                const table = zone.dataset.table;
                const field = zone.dataset.field;
                if (id && status && onMove) await onMove(id, status, table, field);
            };
        });
    }
};
