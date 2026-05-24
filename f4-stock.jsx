import { useState, useEffect } from "react";

const INITIAL_ITEMS = [
  { id: 1, name: "Neumáticos slick", category: "neumáticos", unit: "ud", stock: 8, min: 4 },
  { id: 2, name: "Neumáticos lluvia", category: "neumáticos", unit: "ud", stock: 4, min: 2 },
  { id: 3, name: "Pastillas de freno delanteras", category: "frenos", unit: "juego", stock: 3, min: 2 },
  { id: 4, name: "Pastillas de freno traseras", category: "frenos", unit: "juego", stock: 2, min: 2 },
  { id: 5, name: "Aceite motor 5W-40", category: "fluidos", unit: "L", stock: 20, min: 10 },
  { id: 6, name: "Líquido de frenos", category: "fluidos", unit: "L", stock: 3, min: 2 },
  { id: 7, name: "Filtro de aire", category: "motor", unit: "ud", stock: 2, min: 1 },
  { id: 8, name: "Bujías", category: "motor", unit: "ud", stock: 8, min: 4 },
  { id: 9, name: "Cadena de transmisión", category: "transmisión", unit: "ud", stock: 1, min: 1 },
  { id: 10, name: "Cable embrague", category: "transmisión", unit: "ud", stock: 2, min: 1 },
];

const MEMBERS = ["Carlos", "Diego", "Iván", "Marta", "Jefe"];

const CATEGORIES = ["todos", "neumáticos", "frenos", "fluidos", "motor", "transmisión"];

const CAT_COLORS = {
  neumáticos: "#e63946",
  frenos: "#f4a261",
  fluidos: "#457b9d",
  motor: "#2a9d8f",
  transmisión: "#9b5de5",
};

function loadState() {
  try {
    const items = JSON.parse(localStorage.getItem("f4_items") || "null");
    const log = JSON.parse(localStorage.getItem("f4_log") || "null");
    return { items: items || INITIAL_ITEMS, log: log || [] };
  } catch {
    return { items: INITIAL_ITEMS, log: [] };
  }
}

function saveState(items, log) {
  localStorage.setItem("f4_items", JSON.stringify(items));
  localStorage.setItem("f4_log", JSON.stringify(log));
}

export default function App() {
  const [{ items, log }, setData] = useState(loadState);
  const [view, setView] = useState("stock"); // stock | log | add
  const [category, setCategory] = useState("todos");
  const [modal, setModal] = useState(null); // { item, type: 'entrada'|'salida' }
  const [form, setForm] = useState({ qty: 1, member: MEMBERS[0], note: "" });
  const [addForm, setAddForm] = useState({ name: "", category: "motor", unit: "ud", stock: 0, min: 1 });
  const [flash, setFlash] = useState(null);

  useEffect(() => { saveState(items, log); }, [items, log]);

  const filtered = category === "todos" ? items : items.filter(i => i.category === category);
  const lowStock = items.filter(i => i.stock <= i.min);

  function showFlash(msg, ok = true) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 2200);
  }

  function openModal(item, type) {
    setModal({ item, type });
    setForm({ qty: 1, member: MEMBERS[0], note: "" });
  }

  function submitMove() {
    const { item, type } = modal;
    const qty = parseInt(form.qty) || 1;
    if (type === "salida" && qty > item.stock) {
      showFlash("No hay suficiente stock", false);
      return;
    }
    const newItems = items.map(i =>
      i.id === item.id
        ? { ...i, stock: type === "entrada" ? i.stock + qty : i.stock - qty }
        : i
    );
    const entry = {
      id: Date.now(),
      itemId: item.id,
      itemName: item.name,
      type,
      qty,
      member: form.member,
      note: form.note,
      date: new Date().toISOString(),
    };
    setData({ items: newItems, log: [entry, ...log] });
    setModal(null);
    showFlash(`${type === "entrada" ? "Entrada" : "Salida"} registrada ✓`);
  }

  function submitAdd() {
    if (!addForm.name.trim()) { showFlash("Ponle nombre al artículo", false); return; }
    const newItem = { ...addForm, id: Date.now(), stock: parseInt(addForm.stock) || 0, min: parseInt(addForm.min) || 1 };
    setData({ items: [...items, newItem], log });
    setAddForm({ name: "", category: "motor", unit: "ud", stock: 0, min: 1 });
    showFlash("Artículo añadido ✓");
    setView("stock");
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }) + " " +
      d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  const statusColor = (item) => {
    if (item.stock === 0) return "#ff2d55";
    if (item.stock <= item.min) return "#ffcc00";
    return "#30d158";
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <div style={styles.logo}>F4 STOCK</div>
            <div style={styles.subtitle}>Control de almacén</div>
          </div>
          {lowStock.length > 0 && (
            <div style={styles.alertBadge}>
              ⚠ {lowStock.length} bajo mínimo
            </div>
          )}
        </div>
        <nav style={styles.nav}>
          {["stock", "log", "add"].map(v => (
            <button
              key={v}
              style={{ ...styles.navBtn, ...(view === v ? styles.navBtnActive : {}) }}
              onClick={() => setView(v)}
            >
              {v === "stock" ? "📦 Stock" : v === "log" ? "📋 Historial" : "➕ Añadir"}
            </button>
          ))}
        </nav>
      </header>

      {/* Flash */}
      {flash && (
        <div style={{ ...styles.flash, background: flash.ok ? "#30d158" : "#ff2d55" }}>
          {flash.msg}
        </div>
      )}

      <main style={styles.main}>

        {/* STOCK VIEW */}
        {view === "stock" && (
          <>
            <div style={styles.catBar}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  style={{
                    ...styles.catBtn,
                    ...(category === c ? { background: "#e63946", color: "#fff", borderColor: "#e63946" } : {}),
                  }}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={styles.grid}>
              {filtered.map(item => {
                const pct = Math.min(100, Math.round((item.stock / (item.min * 3)) * 100));
                const sc = statusColor(item);
                return (
                  <div key={item.id} style={{ ...styles.card, borderLeft: `4px solid ${CAT_COLORS[item.category] || "#888"}` }}>
                    <div style={styles.cardTop}>
                      <span style={styles.cardName}>{item.name}</span>
                      <span style={{ ...styles.statusDot, background: sc }} title={sc === "#30d158" ? "OK" : sc === "#ffcc00" ? "Bajo mínimo" : "Agotado"} />
                    </div>
                    <div style={styles.cardCat}>{item.category}</div>
                    <div style={styles.stockRow}>
                      <span style={styles.stockNum}>{item.stock}</span>
                      <span style={styles.stockUnit}>{item.unit}</span>
                      <span style={styles.minLabel}>mín {item.min}</span>
                    </div>
                    <div style={styles.barBg}>
                      <div style={{ ...styles.barFill, width: `${pct}%`, background: sc }} />
                    </div>
                    <div style={styles.cardBtns}>
                      <button style={styles.btnEntrada} onClick={() => openModal(item, "entrada")}>+ Entrada</button>
                      <button
                        style={{ ...styles.btnSalida, ...(item.stock === 0 ? { opacity: 0.4, cursor: "not-allowed" } : {}) }}
                        onClick={() => item.stock > 0 && openModal(item, "salida")}
                      >
                        − Salida
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* LOG VIEW */}
        {view === "log" && (
          <div style={styles.logList}>
            {log.length === 0 && <div style={styles.empty}>Sin movimientos todavía</div>}
            {log.map(entry => (
              <div key={entry.id} style={styles.logEntry}>
                <div style={{ ...styles.logBadge, background: entry.type === "entrada" ? "#30d158" : "#ff2d55" }}>
                  {entry.type === "entrada" ? "▲" : "▼"}
                </div>
                <div style={styles.logInfo}>
                  <div style={styles.logName}>{entry.itemName}</div>
                  <div style={styles.logMeta}>
                    <span style={{ color: entry.type === "entrada" ? "#30d158" : "#ff2d55", fontWeight: 700 }}>
                      {entry.type === "entrada" ? "+" : "-"}{entry.qty}
                    </span>
                    {" · "}{entry.member}{entry.note ? ` · "${entry.note}"` : ""}
                  </div>
                </div>
                <div style={styles.logDate}>{fmtDate(entry.date)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <div style={styles.addForm}>
            <div style={styles.formTitle}>Nuevo artículo</div>
            {[
              { label: "Nombre", key: "name", type: "text", placeholder: "Ej: Amortiguador delantero" },
              { label: "Stock inicial", key: "stock", type: "number", placeholder: "0" },
              { label: "Mínimo", key: "min", type: "number", placeholder: "1" },
              { label: "Unidad", key: "unit", type: "text", placeholder: "ud / L / kg / juego" },
            ].map(f => (
              <div key={f.key} style={styles.fieldGroup}>
                <label style={styles.label}>{f.label}</label>
                <input
                  style={styles.input}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={addForm[f.key]}
                  onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Categoría</label>
              <select
                style={styles.input}
                value={addForm.category}
                onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.filter(c => c !== "todos").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button style={styles.btnPrimary} onClick={submitAdd}>Añadir artículo</button>
          </div>
        )}
      </main>

      {/* MODAL */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>
              {modal.type === "entrada" ? "📥 Entrada" : "📤 Salida"}
            </div>
            <div style={styles.modalItem}>{modal.item.name}</div>
            <div style={styles.modalStock}>Stock actual: <b>{modal.item.stock} {modal.item.unit}</b></div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Cantidad</label>
              <input
                style={styles.input}
                type="number"
                min="1"
                value={form.qty}
                onChange={e => setForm(p => ({ ...p, qty: e.target.value }))}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Quién</label>
              <select
                style={styles.input}
                value={form.member}
                onChange={e => setForm(p => ({ ...p, member: e.target.value }))}
              >
                {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Nota (opcional)</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Ej: Carrera Valencia"
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button style={{ ...styles.btnPrimary, flex: 1, background: modal.type === "entrada" ? "#30d158" : "#e63946" }} onClick={submitMove}>
                Confirmar
              </button>
              <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Barlow', sans-serif",
    background: "#0a0a0f",
    minHeight: "100vh",
    color: "#f0f0f0",
    maxWidth: 700,
    margin: "0 auto",
  },
  header: {
    background: "#111118",
    borderBottom: "2px solid #e63946",
    padding: "16px 20px 0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerInner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  logo: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 3,
    color: "#fff",
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 2,
  },
  alertBadge: {
    background: "#ffcc00",
    color: "#000",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 4,
    letterSpacing: 1,
  },
  nav: {
    display: "flex",
    gap: 0,
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#666",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 1,
    padding: "10px 18px",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    transition: "all 0.15s",
  },
  navBtnActive: {
    color: "#fff",
    borderBottom: "3px solid #e63946",
  },
  flash: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 1,
    padding: "10px 24px",
    borderRadius: 6,
    zIndex: 100,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    pointerEvents: "none",
  },
  main: {
    padding: "16px",
  },
  catBar: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  catBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#aaa",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 1,
    padding: "5px 12px",
    borderRadius: 4,
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "all 0.15s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#13131a",
    borderRadius: 8,
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    transition: "transform 0.1s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardName: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    lineHeight: 1.2,
    color: "#fff",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 3,
    boxShadow: "0 0 6px currentColor",
  },
  cardCat: {
    fontSize: 11,
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stockRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    marginTop: 4,
  },
  stockNum: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    lineHeight: 1,
    color: "#fff",
  },
  stockUnit: {
    fontSize: 14,
    color: "#888",
  },
  minLabel: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#555",
  },
  barBg: {
    background: "#222",
    borderRadius: 2,
    height: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width 0.4s ease",
  },
  cardBtns: {
    display: "flex",
    gap: 6,
    marginTop: 6,
  },
  btnEntrada: {
    flex: 1,
    background: "rgba(48,209,88,0.15)",
    border: "1px solid #30d158",
    color: "#30d158",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
    padding: "6px 0",
    borderRadius: 4,
    cursor: "pointer",
  },
  btnSalida: {
    flex: 1,
    background: "rgba(230,57,70,0.15)",
    border: "1px solid #e63946",
    color: "#e63946",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.5,
    padding: "6px 0",
    borderRadius: 4,
    cursor: "pointer",
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    textAlign: "center",
    color: "#444",
    padding: 40,
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  logEntry: {
    background: "#13131a",
    borderRadius: 6,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    color: "#fff",
  },
  logInfo: {
    flex: 1,
    minWidth: 0,
  },
  logName: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  logDate: {
    fontSize: 11,
    color: "#444",
    whiteSpace: "nowrap",
    fontFamily: "'Barlow Condensed', sans-serif",
    letterSpacing: 0.5,
  },
  addForm: {
    background: "#13131a",
    borderRadius: 8,
    padding: 20,
    maxWidth: 420,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  formTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#fff",
    marginBottom: 4,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
  },
  input: {
    background: "#1e1e2a",
    border: "1px solid #2a2a3a",
    borderRadius: 5,
    color: "#fff",
    fontFamily: "'Barlow', sans-serif",
    fontSize: 15,
    padding: "9px 12px",
    outline: "none",
    width: "100%",
  },
  btnPrimary: {
    background: "#e63946",
    border: "none",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    padding: "12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  btnSecondary: {
    background: "#1e1e2a",
    border: "1px solid #333",
    color: "#aaa",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
    padding: "12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: 16,
  },
  modalBox: {
    background: "#13131a",
    borderRadius: 10,
    padding: 22,
    width: "100%",
    maxWidth: 360,
    border: "1px solid #2a2a3a",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  modalTitle: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#fff",
  },
  modalItem: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 600,
    fontSize: 17,
    color: "#ccc",
  },
  modalStock: {
    fontSize: 13,
    color: "#666",
  },
};
