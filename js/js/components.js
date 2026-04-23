/**
 * Componentes reutilizáveis de UI
 */
const Components = {
  pageHeader(title, subtitle, actionsHtml='') {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">${title}</h1>
          ${subtitle ? `<p class="page-subtitle">${subtitle}</p>` : ''}
        </div>
        ${actionsHtml ? `<div class="flex flex-wrap gap-2">${actionsHtml}</div>` : ''}
      </div>
    `;
  },

  kpiCard({label, value, icon='', trend='', trendType='', color='#6d28d9'}) {
    return `
      <div class="kpi-card" style="border-color:${color}">
        <div class="flex items-start justify-between">
          <div>
            <p class="kpi-label">${label}</p>
            <p class="kpi-value">${value}</p>
            ${trend ? `<p class="kpi-trend ${trendType}">${trend}</p>` : ''}
          </div>
          ${icon ? `<div class="text-3xl opacity-60">${icon}</div>` : ''}
        </div>
      </div>
    `;
  },

  avatar(name, size=36) {
    const initials = Utils.initials(name);
    const color = Utils.colorFromName(name);
    return `<div class="avatar" style="width:${size}px;height:${size}px;background:${color};font-size:${size*0.4}px">${initials}</div>`;
  },

  pill(status) {
    if (!status) return '';
    return `<span class="pill ${Utils.pillClass(status)}">${Utils.escape(status)}</span>`;
  },

  emptyState(icon='📭', title='Nada por aqui ainda', subtitle='') {
    return `
      <div class="text-center py-12 text-slate-500">
        <div class="text-5xl mb-3">${icon}</div>
        <p class="font-semibold text-slate-700">${title}</p>
        ${subtitle?`<p class="text-sm mt-1">${subtitle}</p>`:''}
      </div>
    `;
  },

  /** Renderiza um formulário a partir de schema */
  formField(field, value='') {
    const { name, label, type='text', required=false, options=null, placeholder='' } = field;
    const req = required ? 'required' : '';
    const val = value == null ? '' : value;
    let input = '';
    if (options && Array.isArray(options)) {
      const opts = options.map(o => `<option value="${Utils.escape(o)}" ${o===val?'selected':''}>${Utils.escape(o)}</option>`).join('');
      input = `<select name="${name}" class="form-select" ${req}><option value="">— selecione —</option>${opts}</select>`;
    } else if (type === 'textarea') {
      input = `<textarea name="${name}" class="form-textarea" placeholder="${placeholder}" ${req}>${Utils.escape(val)}</textarea>`;
    } else if (type === 'datetime') {
      let dtval = '';
      if (val) {
        try { dtval = new Date(val).toISOString().slice(0,16); } catch {}
      }
      input = `<input type="datetime-local" name="${name}" class="form-input" value="${dtval}" ${req}>`;
    } else if (type === 'date') {
      let dval = '';
      if (val) { try { dval = new Date(val).toISOString().slice(0,10); } catch {} }
      input = `<input type="date" name="${name}" class="form-input" value="${dval}" ${req}>`;
    } else if (type === 'number') {
      input = `<input type="number" step="any" name="${name}" class="form-input" value="${val}" placeholder="${placeholder}" ${req}>`;
    } else if (type === 'array') {
      const arr = Array.isArray(val) ? val.join(', ') : val;
      input = `<input type="text" name="${name}" class="form-input" value="${Utils.escape(arr)}" placeholder="Separe com vírgula" ${req}>`;
    } else {
      input = `<input type="${type}" name="${name}" class="form-input" value="${Utils.escape(val)}" placeholder="${placeholder}" ${req}>`;
    }
    return `
      <div>
        <label class="form-label">${label}${required?' <span class="text-red-500">*</span>':''}</label>
        ${input}
      </div>
    `;
  },

  /** Lê um <form> e retorna objeto */
  readForm(form, schema=[]) {
    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      const field = schema.find(f => f.name === k);
      if (field && field.type === 'number') {
        data[k] = v === '' ? null : Number(v);
      } else if (field && field.type === 'array') {
        data[k] = v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
      } else if (field && (field.type === 'datetime' || field.type === 'date')) {
        data[k] = v ? new Date(v).toISOString() : null;
      } else if (field && field.type === 'bool') {
        data[k] = v === 'on' || v === 'true';
      } else {
        data[k] = v || null;
      }
    }
    return data;
  },

  searchInput(placeholder='Buscar...', onInput) {
    const id = 'search-'+Math.random().toString(36).slice(2,8);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', Utils.debounce(e => onInput(e.target.value), 250));
    }, 0);
    return `
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        <input id="${id}" type="text" placeholder="${placeholder}" class="form-input pl-9" style="min-width:200px">
      </div>
    `;
  }
};
