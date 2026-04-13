// Entrega final - SolarYA
// Requisitos: DOM + Eventos + localStorage + JSON asíncrono + librería externa.

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const STORAGE_KEY = "solarya_registros_v1";
const PREFS_KEY = "solarya_form_prefs_v1";
const STORE_UI_KEY = "solarya_store_ui_v1";

const DEFAULT_CONFIG = {
  app: "SolarYA",
  version: "EntregaFinal",
  panelesW: [450, 500, 550],
  defaults: {
    hsp: 4.5,
    cobertura: 70,
    panelW: 550
  }
};

let config = { ...DEFAULT_CONFIG };
let registros = []; // array de objetos { id, mes, consumo, tarifa, costo, fecha }
let carritoCount = 0;
let carritoItems = []; // [{ panelW, precio, qty }]

// --------- Helpers ----------
function $(sel) { return document.querySelector(sel); }

function moneyCOP(num) {
  return Number(num).toLocaleString("es-CO");
}

function estimarPrecioPanelCOP(potenciaW) {
  // Precio simulado para comportamiento ecommerce del proyecto final.
  return potenciaW * 4200;
}

function setMsg(el, text, type) {
  el.textContent = text || "";
  el.classList.remove("ok", "err");
  if (type === "ok") el.classList.add("ok");
  if (type === "err") el.classList.add("err");
}

function leerNumero(inputEl) {
  const val = Number(inputEl.value);
  return Number.isFinite(val) ? val : NaN;
}

function uid() {
  // id simple (suficiente para el entregable)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function esNumeroPositivo(val) {
  return Number.isFinite(val) && val > 0;
}

// --------- Storage ----------
function guardarEnStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function cargarDeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return [];
  } catch (e) {
    return [];
  }
}

function guardarPrefs() {
  const prefs = {
    mes: $("#mes").value,
    consumo: $("#consumo").value,
    tarifa: $("#tarifa").value,
    hsp: $("#hsp").value,
    cobertura: $("#cobertura").value,
    panelW: $("#panel").value
  };
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function cargarPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch (e) {
    return null;
  }
}

function guardarUiState() {
  localStorage.setItem(STORE_UI_KEY, JSON.stringify({ carritoCount, carritoItems }));
}

function cargarUiState() {
  try {
    const raw = localStorage.getItem(STORE_UI_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.carritoItems)) {
      carritoItems = data.carritoItems
        .map((item) => ({
          panelW: Number(item.panelW),
          precio: Number(item.precio),
          qty: Number(item.qty)
        }))
        .filter((item) => esNumeroPositivo(item.panelW) && esNumeroPositivo(item.precio) && Number.isInteger(item.qty) && item.qty > 0);
    }

    if (data && Number.isFinite(Number(data.carritoCount)) && Number(data.carritoCount) >= 0) {
      carritoCount = Number(data.carritoCount);
    }

    if (carritoItems.length > 0) {
      carritoCount = carritoItems.reduce((acc, item) => acc + item.qty, 0);
    }
  } catch (e) {
    carritoCount = 0;
    carritoItems = [];
  }
}

// --------- Datos asíncronos ----------
async function cargarConfigRemota() {
  try {
    const res = await fetch("./data/info.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo leer info.json");

    const data = await res.json();
    const panelesW = Array.isArray(data.panelesW) && data.panelesW.length > 0
      ? data.panelesW.filter((x) => Number.isFinite(Number(x)) && Number(x) > 0).map(Number)
      : DEFAULT_CONFIG.panelesW;

    const defaults = data.defaults && typeof data.defaults === "object" ? data.defaults : {};

    config = {
      app: data.app || DEFAULT_CONFIG.app,
      version: data.version || DEFAULT_CONFIG.version,
      panelesW: panelesW.length > 0 ? panelesW : DEFAULT_CONFIG.panelesW,
      defaults: {
        hsp: esNumeroPositivo(Number(defaults.hsp)) ? Number(defaults.hsp) : DEFAULT_CONFIG.defaults.hsp,
        cobertura: esNumeroPositivo(Number(defaults.cobertura)) ? Number(defaults.cobertura) : DEFAULT_CONFIG.defaults.cobertura,
        panelW: esNumeroPositivo(Number(defaults.panelW)) ? Number(defaults.panelW) : DEFAULT_CONFIG.defaults.panelW
      }
    };

    return true;
  } catch (e) {
    config = { ...DEFAULT_CONFIG };
    return false;
  }
}

// --------- Render ----------
function renderMeses() {
  const select = $("#mes");
  select.innerHTML = "";
  for (let i = 0; i < MESES.length; i++) {
    const op = document.createElement("option");
    op.value = MESES[i];
    op.textContent = MESES[i];
    select.appendChild(op);
  }
}

function renderPaneles() {
  const select = $("#panel");
  select.innerHTML = "";
  for (let i = 0; i < config.panelesW.length; i++) {
    const w = config.panelesW[i];
    const op = document.createElement("option");
    op.value = String(w);
    op.textContent = w + " W";
    select.appendChild(op);
  }
}

function renderCatalogo() {
  const cont = $("#catalogo-paneles");
  if (!cont) return;

  cont.innerHTML = "";

  for (let i = 0; i < config.panelesW.length; i++) {
    const potencia = config.panelesW[i];
    const precio = estimarPrecioPanelCOP(potencia);

    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <h3 class="product-title">Panel Solar ${potencia} W</h3>
      <p class="product-meta">Monocristalino - eficiencia estimada alta</p>
      <p class="product-price">$${moneyCOP(precio)} COP</p>
      <button class="btn small primary" type="button" data-panel="${potencia}">
        Seleccionar para cotizar
      </button>
    `;

    cont.appendChild(card);
  }
}

function renderTabla() {
  const tbody = $("#tabla-registros");
  tbody.innerHTML = "";

  if (registros.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Sin registros todavía.";
    td.style.color = "rgba(255,255,255,.65)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for (let i = 0; i < registros.length; i++) {
    const r = registros[i];

    const tr = document.createElement("tr");

    const tdMes = document.createElement("td");
    tdMes.textContent = r.mes;

    const tdCons = document.createElement("td");
    tdCons.textContent = moneyCOP(r.consumo);

    const tdTar = document.createElement("td");
    tdTar.textContent = moneyCOP(r.tarifa);

    const tdCosto = document.createElement("td");
    tdCosto.textContent = moneyCOP(r.costo);

    const tdAcc = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "icon-btn";
    btn.type = "button";
    btn.textContent = "Eliminar";
    btn.dataset.id = r.id;
    tdAcc.appendChild(btn);

    tr.appendChild(tdMes);
    tr.appendChild(tdCons);
    tr.appendChild(tdTar);
    tr.appendChild(tdCosto);
    tr.appendChild(tdAcc);

    tbody.appendChild(tr);
  }
}

function renderResultadoVacio() {
  const box = $("#resultado");
  box.classList.add("empty");
  box.innerHTML = '<p class="hint">Aún no hay cálculo. Guarda un registro y presiona “Calcular”.</p>';
}

function renderMeta(usaJsonRemoto) {
  const el = $("#meta-app");
  if (!el) return;
  const origen = usaJsonRemoto ? "JSON remoto" : "valores locales (fallback)";
  el.textContent = `${config.app} ${config.version} - Configuracion cargada desde ${origen}.`;
}

function renderEstadoTienda() {
  const cart = $("#cart-count");
  if (cart) cart.textContent = String(carritoCount);

  const status = $("#shop-status");
  if (status) {
    status.textContent = `Tienes ${carritoCount} panel(es) en carrito y ${carritoItems.length} producto(s) diferente(s). Genera la cotizacion para ver el ahorro estimado.`;
  }
}

function agregarPanelAlCarrito(panelW) {
  const precio = estimarPrecioPanelCOP(panelW);
  const existente = carritoItems.find((item) => item.panelW === panelW);

  if (existente) existente.qty += 1;
  else carritoItems.push({ panelW, precio, qty: 1 });

  carritoCount += 1;
  guardarUiState();
  renderEstadoTienda();
  animarCarrito();

  return precio;
}

function vaciarCarrito() {
  carritoCount = 0;
  carritoItems = [];
  guardarUiState();
  renderEstadoTienda();
}

function animarCarrito() {
  const pill = $(".cart-pill");
  if (!pill) return;
  pill.classList.remove("cart-bump");
  // Fuerza reflow para reiniciar la animación.
  void pill.offsetWidth;
  pill.classList.add("cart-bump");
}

async function popupPanelAgregado({ panelW, precio }) {
  if (!window.Swal) return;
  const res = await window.Swal.fire({
    title: "Panel agregado al carrito",
    html: `
      <p style="margin:0 0 6px;">Agregaste <strong>Panel Solar ${panelW} W</strong>.</p>
      <p style="margin:0;">Precio estimado: <strong>$${moneyCOP(precio)} COP</strong></p>
    `,
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "Ir al cotizador",
    cancelButtonText: "Seguir comprando",
    reverseButtons: true
  });

  if (res.isConfirmed) {
    const formSolar = $("#form-solar");
    if (formSolar) formSolar.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function construirHtmlCarrito() {
  if (carritoItems.length === 0) {
    if (carritoCount > 0) {
      return `
        <p style="margin:0 0 8px;">Tienes ${carritoCount} panel(es) guardados de una sesion anterior.</p>
        <p style="margin:0;color:#8aa2c8;">Agrega nuevos paneles para ver el detalle completo.</p>
      `;
    }
    return "<p style='margin:0;'>Tu carrito esta vacio.</p>";
  }

  const filas = carritoItems.map((item) => {
    const subtotal = item.precio * item.qty;
    return `
      <li style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.08);">
        <span>Panel ${item.panelW} W x${item.qty}</span>
        <strong>$${moneyCOP(subtotal)} COP</strong>
      </li>
    `;
  }).join("");

  const total = carritoItems.reduce((acc, item) => acc + item.precio * item.qty, 0);

  return `
    <ul style="list-style:none;padding:0;margin:0 0 10px;">${filas}</ul>
    <div style="display:flex;justify-content:space-between;gap:10px;">
      <span>Total estimado</span>
      <strong>$${moneyCOP(total)} COP</strong>
    </div>
  `;
}

async function onClickCarrito() {
  if (!window.Swal) return;

  const res = await window.Swal.fire({
    title: "Tu carrito solar",
    html: construirHtmlCarrito(),
    icon: carritoCount > 0 ? "info" : "question",
    showCancelButton: true,
    showDenyButton: carritoCount > 0,
    confirmButtonText: "Ir al cotizador",
    cancelButtonText: "Cerrar",
    denyButtonText: "Vaciar carrito",
    reverseButtons: true
  });

  if (res.isConfirmed) {
    const formSolar = $("#form-solar");
    if (formSolar) formSolar.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (res.isDenied) {
    vaciarCarrito();
    await window.Swal.fire({
      title: "Carrito vaciado",
      text: "Se eliminaron los productos del carrito.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false
    });
  }
}

function precargarFormularios() {
  const prefs = cargarPrefs();
  const ultimo = registros.length > 0 ? registros[registros.length - 1] : null;

  const mes = $("#mes");
  const consumo = $("#consumo");
  const tarifa = $("#tarifa");
  const hsp = $("#hsp");
  const cobertura = $("#cobertura");
  const panel = $("#panel");

  if (prefs && prefs.mes && MESES.includes(prefs.mes)) mes.value = prefs.mes;
  else if (ultimo) mes.value = ultimo.mes;
  else mes.value = MESES[0];

  if (prefs && prefs.consumo) consumo.value = prefs.consumo;
  else if (ultimo) consumo.value = String(ultimo.consumo);

  if (prefs && prefs.tarifa) tarifa.value = prefs.tarifa;
  else if (ultimo) tarifa.value = String(ultimo.tarifa);

  hsp.value = prefs && prefs.hsp ? prefs.hsp : String(config.defaults.hsp);
  cobertura.value = prefs && prefs.cobertura ? prefs.cobertura : String(config.defaults.cobertura);

  const panelDefault = prefs && prefs.panelW ? Number(prefs.panelW) : config.defaults.panelW;
  panel.value = String(panelDefault);
  if (panel.value !== String(panelDefault)) panel.value = String(config.panelesW[0]);
}

async function confirmarAccion({ titulo, texto, confirmText }) {
  if (window.Swal) {
    const res = await window.Swal.fire({
      title: titulo,
      text: texto,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "Cancelar",
      reverseButtons: true
    });
    return res.isConfirmed;
  }
  return window.confirm(texto);
}

// --------- Lógica del simulador ----------
function agregarRegistro({ mes, consumo, tarifa }) {
  const costo = consumo * tarifa;

  const nuevo = {
    id: uid(),
    mes: mes,
    consumo: consumo,
    tarifa: tarifa,
    costo: costo,
    fecha: new Date().toISOString()
  };

  registros.push(nuevo);
  guardarEnStorage();
  renderTabla();

  return nuevo;
}

function eliminarRegistro(id) {
  const antes = registros.length;
  registros = registros.filter(r => r.id !== id);
  if (registros.length !== antes) {
    guardarEnStorage();
    renderTabla();
    return true;
  }
  return false;
}

function calcularSistemaSolarConUltimo({ hsp, cobertura, potenciaPanelW }) {
  if (registros.length === 0) return null;

  const ultimo = registros[registros.length - 1];

  // Normalización
  let pct = cobertura;
  if(pct > 100) pct = 100;
  if(pct < 1) pct = 1;

  // Cálculo simple (aprox):
  // Energía objetivo mes: consumo * (pct/100)
  // Energía diaria: /30
  // Sistema kW: energiaDia / HSP
  const energiaMesObjetivo = ultimo.consumo * (pct / 100);
  const energiaDia = energiaMesObjetivo / 30;
  const tamSistemaKW = energiaDia / hsp;

  const panelKW = potenciaPanelW / 1000;
  const numPaneles = Math.ceil(tamSistemaKW / panelKW);

  const ahorroMensual = ultimo.costo * (pct / 100);

  return {
    mesBase: ultimo.mes,
    consumoMesKWh: ultimo.consumo,
    tarifa: ultimo.tarifa,
    costoMes: ultimo.costo,
    hsp: hsp,
    cobertura: pct,
    potenciaPanelW: potenciaPanelW,
    tamSistemaKW: tamSistemaKW,
    numPaneles: numPaneles,
    ahorroMensual: ahorroMensual
  };
}

function renderResultado(res) {
  const box = $("#resultado");
  box.classList.remove("empty");

  box.innerHTML = `
    <div class="kpi">
      <div class="row"><span>Mes base</span><span><strong>${res.mesBase}</strong></span></div>
      <div class="row"><span>Consumo</span><span><strong>${moneyCOP(res.consumoMesKWh)} kWh</strong></span></div>
      <div class="row"><span>Costo estimado</span><span><strong>$${moneyCOP(res.costoMes)} COP</strong></span></div>

      <div class="row"><span>HSP</span><span><strong>${res.hsp}</strong></span></div>
      <div class="row"><span>Cobertura</span><span><strong>${res.cobertura}%</strong></span></div>
      <div class="row"><span>Panel</span><span><strong>${res.potenciaPanelW} W</strong></span></div>

      <div class="row"><span>Sistema aprox.</span><span><strong>${res.tamSistemaKW.toFixed(2)} kW</strong></span></div>
      <div class="row"><span>Paneles aprox.</span><span><strong>${res.numPaneles}</strong></span></div>
      <div class="row"><span>Ahorro mensual aprox.</span><span><strong>$${moneyCOP(res.ahorroMensual)} COP</strong></span></div>
    </div>
  `;
}

// --------- Eventos ----------
function onSubmitRegistro(e) {
  e.preventDefault();

  const msg = $("#msg-registro");
  setMsg(msg, "", "");

  const mes = $("#mes").value;
  const consumo = leerNumero($("#consumo"));
  const tarifa = leerNumero($("#tarifa"));

  // Validación básica
  if (!mes) {
    setMsg(msg, "Selecciona un mes.", "err");
    return;
  }
  if (!Number.isFinite(consumo) || consumo <= 0) {
    setMsg(msg, "Consumo inválido. Debe ser mayor a 0.", "err");
    return;
  }
  if (!Number.isFinite(tarifa) || tarifa <= 0) {
    setMsg(msg, "Tarifa inválida. Debe ser mayor a 0.", "err");
    return;
  }

  const nuevo = agregarRegistro({ mes, consumo, tarifa });
  setMsg(msg, `Registro guardado (${nuevo.mes}).`, "ok");

  // limpiar inputs (mantiene el mes seleccionado)
  $("#consumo").value = "";
  $("#tarifa").value = "";
  guardarPrefs();
}

async function onClickTabla(e) {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (!t.matches("button[data-id]")) return;

  const id = t.dataset.id;
  if (!id) return;

  const ok = await confirmarAccion({
    titulo: "Eliminar registro",
    texto: "Esta accion quitara el registro seleccionado.",
    confirmText: "Eliminar"
  });
  if (!ok) return;

  eliminarRegistro(id);

  // si se elimina el último, el resultado podría quedar desactualizado
  renderResultadoVacio();
  setMsg($("#msg-solar"), "", "");
}

function onSubmitSolar(e) {
  e.preventDefault();

  const msg = $("#msg-solar");
  setMsg(msg, "", "");

  if (registros.length === 0) {
    setMsg(msg, "Primero guarda un registro mensual.", "err");
    renderResultadoVacio();
    return;
  }

  const hsp = leerNumero($("#hsp"));
  const cobertura = leerNumero($("#cobertura"));
  const potenciaPanelW = Number($("#panel").value);

  if (!Number.isFinite(hsp) || hsp <= 0) {
    setMsg(msg, "HSP inválido. Debe ser mayor a 0.", "err");
    return;
  }
  if (!Number.isFinite(cobertura) || cobertura <= 0) {
    setMsg(msg, "Cobertura inválida. Debe ser mayor a 0.", "err");
    return;
  }
  if (!Number.isFinite(potenciaPanelW) || potenciaPanelW <= 0) {
    setMsg(msg, "Selecciona una potencia de panel.", "err");
    return;
  }

  const res = calcularSistemaSolarConUltimo({ hsp, cobertura, potenciaPanelW });
  if (!res) {
    setMsg(msg, "No se pudo calcular. Intenta de nuevo.", "err");
    renderResultadoVacio();
    return;
  }

  renderResultado(res);
  setMsg(msg, "Cálculo listo. Revisa el resultado abajo.", "ok");
  guardarPrefs();
}

async function onClickLimpiar() {
  const ok = await confirmarAccion({
    titulo: "Borrar todo",
    texto: "Se eliminaran todos los registros guardados.",
    confirmText: "Borrar"
  });
  if (!ok) return;

  registros = [];
  guardarEnStorage();
  renderTabla();
  renderResultadoVacio();
  setMsg($("#msg-registro"), "", "");
  setMsg($("#msg-solar"), "", "");

  vaciarCarrito();
}

async function onClickCatalogo(e) {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("button[data-panel]")) return;

  const panelW = Number(target.dataset.panel);
  if (!esNumeroPositivo(panelW)) return;
  const selectPanel = $("#panel");
  selectPanel.value = String(panelW);

  const precio = agregarPanelAlCarrito(panelW);

  setMsg($("#msg-solar"), `Panel ${panelW} W seleccionado desde el catalogo.`, "ok");
  guardarPrefs();
  await popupPanelAgregado({ panelW, precio });
}

// --------- Init ----------
function enlazarEventos() {
  const formRegistro = $("#form-registro");
  const tablaRegistros = $("#tabla-registros");
  const formSolar = $("#form-solar");
  const btnLimpiar = $("#btn-limpiar");
  const catalogo = $("#catalogo-paneles");
  const btnCart = $("#btn-cart");

  formRegistro.addEventListener("submit", onSubmitRegistro);
  tablaRegistros.addEventListener("click", onClickTabla);
  formSolar.addEventListener("submit", onSubmitSolar);
  btnLimpiar.addEventListener("click", onClickLimpiar);
  if (catalogo) catalogo.addEventListener("click", onClickCatalogo);
  if (btnCart) btnCart.addEventListener("click", onClickCarrito);

  ["#mes", "#consumo", "#tarifa", "#hsp", "#cobertura", "#panel"].forEach((selector) => {
    const el = $(selector);
    el.addEventListener("change", guardarPrefs);
  });
}

async function init() {
  const usaJsonRemoto = await cargarConfigRemota();
  cargarUiState();
  renderMeses();
  renderPaneles();
  renderCatalogo();

  registros = cargarDeStorage();
  renderTabla();
  renderResultadoVacio();
  precargarFormularios();
  renderMeta(usaJsonRemoto);
  renderEstadoTienda();

  enlazarEventos();
}

document.addEventListener("DOMContentLoaded", init);
