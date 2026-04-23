/* ========================================
   Utilidades globais
   ======================================== */

window.Utils = {
    // Formatação
    formatMoney(v) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    },
    formatDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('pt-BR');
    },
    formatDateTime(d) {
        if (!d) return '—';
        return new Date(d).toLocaleString('pt-BR');
    },
    daysUntil(date) {
        if (!date) return null;
        const diff = new Date(date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    },
    initials(name) {
        if (!name) return '?';
        return name.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase();
    },
    monthName(m) {
        return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
    },
    currentMonthKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    },
    // WhatsApp link
    whatsappLink(phone, msg = '') {
        const clean = (phone || '').replace(/\D/g, '');
        return `https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`;
    },
    // Toast
    toast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = { success: 'check-circle', error: 'times-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        const colors = { success: 'text-green-500', error: 'text-red-500', warning: 'text-yellow-500', info: 'text-brand-500' };
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<i class="fas fa-${icons[type]||'info-circle'} ${colors[type]||''} text-lg"></i><span class="flex-1 text-sm">${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
    },
    // Modal
    openModal(html) {
        const container = document.getElementById('modal-container');
        container.innerHTML = `<div class="modal-backdrop" onclick="if(event.target===this)Utils.closeModal()"><div class="modal">${html}</div></div>`;
    },
    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    },
    // Confirmação
    confirm(msg, onOk) {
        this.openModal(`
            <div class="p-6">
                <h3 class="font-bold text-lg mb-2">Confirmar</h3>
                <p class="text-gray-600 mb-6">${msg}</p>
                <div class="flex gap-2 justify-end">
                    <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancelar</button>
                    <button class="btn btn-danger" id="confirm-ok">Confirmar</button>
                </div>
            </div>
        `);
        document.getElementById('confirm-ok').onclick = () => { Utils.closeModal(); onOk && onOk(); };
    },
    // Form helpers
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};
        const data = {};
        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.name) {
                if (el.type === 'checkbox') data[el.name] = el.checked;
                else if (el.type === 'number') data[el.name] = el.value ? Number(el.value) : null;
                else data[el.name] = el.value || null;
            }
        });
        return data;
    },
    // Aniversariante
    isBirthdayThisMonth(dateStr, monthOffset = 0) {
        if (!dateStr) return false;
        const dob = new Date(dateStr);
        if (isNaN(dob)) return false;
        const now = new Date();
        const targetMonth = (now.getMonth() + monthOffset + 12) % 12;
        return dob.getMonth() === targetMonth;
    },
    birthdayDay(dateStr) {
        const d = new Date(dateStr);
        return isNaN(d) ? null : d.getDate();
    },
    age(dateStr) {
        if (!dateStr) return null;
        const dob = new Date(dateStr);
        if (isNaN(dob)) return null;
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        return age;
    },
    // Debounce
    debounce(fn, delay = 300) {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
    }
};
