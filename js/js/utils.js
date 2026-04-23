/**
 * Utilitários globais
 */
const Utils = {
  /** Formata número como BRL */
  money(v) {
    if (v == null || isNaN(v)) return 'R$ 0,00';
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  /** Formata data ISO em DD/MM/AAAA */
  date(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR');
    } catch { return '-'; }
  },

  /** Data + hora curta */
  dateTime(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    } catch { return '-'; }
  },

  /** "há 3 dias" */
  relative(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    if (days < 30) return `há ${Math.floor(days/7)} sem.`;
    return `há ${Math.floor(days/30)} meses`;
  },

  /** Iniciais pro avatar */
  initials(name='') {
    return name.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('');
  },

  /** Hash de cor baseada no nome */
  colorFromName(name='') {
    const colors = ['#6d28d9','#2563eb','#059669','#dc2626','#ea580c','#ca8a04','#7c3aed','#0891b2'];
    let h = 0;
    for (const ch of name) h = (h << 5) - h + ch.charCodeAt(0);
    return colors[Math.abs(h) % colors.length];
  },

  /** Debounce */
  debounce(fn, wait=300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  },

  /** Escapa HTML */
  escape(str='') {
    return String(str).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  },

  /** Mes de referência atual 2026-04 */
  currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  /** Pill status → classe */
  pillClass(status) {
    const map = {
      'Ativo':'pill-green','Ativa':'pill-green','Pago':'pill-green','Concluído':'pill-green','Concluída':'pill-green','Matriculado':'pill-green',
      'Pendente':'pill-yellow','Em Andamento':'pill-yellow','Em andamento':'pill-yellow','Em formação':'pill-yellow','Pausado':'pill-yellow','Negociação':'pill-yellow',
      'Atrasado':'pill-red','Cancelado':'pill-red','Cancelada':'pill-red','Alta':'pill-red',
      'Novo Lead':'pill-gray','Não iniciada':'pill-gray','A Fazer':'pill-gray','Inativo':'pill-gray','Trancado':'pill-gray',
      'Contato Feito':'pill-blue','Em Revisão':'pill-blue',
      'Interessado':'pill-orange','Lotada':'pill-orange','Média':'pill-orange',
      'Baixa':'pill-green'
    };
    // match parcial para prioridades com emoji
    if (status && status.includes('Alta')) return 'pill-red';
    if (status && status.includes('Média')) return 'pill-orange';
    if (status && status.includes('Baixa')) return 'pill-green';
    if (status && status.includes('Quente')) return 'pill-red';
    if (status && status.includes('Morno')) return 'pill-orange';
    if (status && status.includes('Frio')) return 'pill-blue';
    return map[status] || 'pill-gray';
  },

  /** Abre WhatsApp */
  openWhatsApp(phone, message='') {
    const clean = String(phone||'').replace(/\D/g,'');
    if (!clean) { Toast.warning('Sem WhatsApp cadastrado'); return; }
    const full = clean.startsWith('55') ? clean : '55'+clean;
    const url = `https://wa.me/${full}${message?'?text='+encodeURIComponent(message):''}`;
    window.open(url, '_blank');
  }
};

/** Toast system */
const Toast = {
  show(message, type='info', duration=3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    toast.innerHTML = `<span class="text-lg">${icons[type]||'ℹ️'}</span><span>${Utils.escape(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success(m, d) { this.show(m, 'success', d); },
  error(m, d) { this.show(m, 'error', d); },
  warning(m, d) { this.show(m, 'warning', d); },
  info(m, d) { this.show(m, 'info', d); }
};

/** Modal system */
const Modal = {
  open(title, bodyHtml, footerHtml='', opts={}) {
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <div class="modal-header">
        <h3 class="text-lg font-bold text-slate-800">${title}</h3>
        <button onclick="Modal.close()" class="text-slate-400 hover:text-slate-700 text-xl"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    `;
    container.classList.remove('hidden');
    container.classList.add('flex');
    if (opts.maxWidth) content.style.maxWidth = opts.maxWidth;
    else content.style.maxWidth = '';
  },
  close() {
    const container = document.getElementById('modal-container');
    container.classList.add('hidden');
    container.classList.remove('flex');
  },
  confirm(title, message, onConfirm) {
    this.open(title,
      `<p class="text-slate-600">${message}</p>`,
      `<button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-danger" id="modal-confirm-btn">Confirmar</button>`
    );
    document.getElementById('modal-confirm-btn').onclick = () => {
      Modal.close();
      onConfirm();
    };
  }
};

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-container') Modal.close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Modal.close();
});
