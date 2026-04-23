```javascript
// Adicione no <head> do index.html:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = https://waoinjpwdhdjhiybjuue.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhb2luanB3ZGhkamhpeWJqdXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDE0OTEsImV4cCI6MjA5MjMxNzQ5MX0.kVZx8I9geVvsKifw4-OnUjgr9--kYtdLEjQ_fcstN18
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API = {
  async list(table) {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { data };
  },
  async get(table, id) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(table, data) {
    const { data: row, error } = await supabase.from(table).insert(data).select().single();
    if (error) throw error;
    return row;
  },
  async update(table, id, data) {
    const { data: row, error } = await supabase.from(table).update(data).eq('id', id).select().single();
    if (error) throw error;
    return row;
  },
  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
};

const Cache = {
  _data: {}, _ts: {}, TTL: 30000,
  async get(table, force=false) {
    if (!force && this._data[table] && (Date.now()-this._ts[table]) < this.TTL) return this._data[table];
    const res = await API.list(table);
    this._data[table] = res.data || [];
    this._ts[table] = Date.now();
    return this._data[table];
  },
  invalidate(t) { delete this._data[t]; delete this._ts[t]; },
  invalidateAll() { this._data = {}; this._ts = {}; }
};