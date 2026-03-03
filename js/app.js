// Entregable 2 - SolarYA
// Requisitos: DOM + Eventos + localStorage
// IMPORTANTE: no se usan prompt() ni alert() ni consola para interacción con el usuario.

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const POTENCIAS_PANEL_W = [450, 500, 550];

const STORAGE_KEY = "solarya_registros_v1";

let registros = []; // array de objetos { id, mes, consumo, tarifa, costo, fecha }

// --------- Helpers ----------
function $(sel) { return document.querySelector(sel); }

function moneyCOP(num){
  return Number(num).toLocaleString("es-CO");
}

function setMsg(el, text, type){
  el.textContent = text || "";
  el.classList.remove("ok", "err");
  if (type === "ok") el.classList.add("ok");
  if (type === "err") el.classList.add("err");
}

function leerNumero(inputEl){
  const val = Number(inputEl.value);
  return Number.isFinite(val) ? val : NaN;
}

function uid(){
  // id simple (suficiente para el entregable)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// --------- Storage ----------
function guardarEnStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

function cargarDeStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    const data = JSON.parse(raw);
    if(Array.isArray(data)) return data;
    return [];
  }catch(e){
    return [];
  }
}

// --------- Render ----------
function renderMeses(){
  const select = $("#mes");
  select.innerHTML = "";
  for(let i=0; i<MESES.length; i++){
    const op = document.createElement("option");
    op.value = MESES[i];
    op.textContent = MESES[i];
    select.appendChild(op);
  }
}

function renderPaneles(){
  const select = $("#panel");
  select.innerHTML = "";
  for(let i=0; i<POTENCIAS_PANEL_W.length; i++){
    const w = POTENCIAS_PANEL_W[i];
    const op = document.createElement("option");
    op.value = String(w);
    op.textContent = w + " W";
    select.appendChild(op);
  }
}

function renderTabla(){
  const tbody = $("#tabla-registros");
  tbody.innerHTML = "";

  if(registros.length === 0){
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Sin registros todavía.";
    td.style.color = "rgba(255,255,255,.65)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  for(let i=0; i<registros.length; i++){
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

function renderResultadoVacio(){
  const box = $("#resultado");
  box.classList.add("empty");
  box.innerHTML = '<p class="hint">Aún no hay cálculo. Guarda un registro y presiona “Calcular”.</p>';
}

// --------- Lógica del simulador ----------
function agregarRegistro({ mes, consumo, tarifa }){
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

function eliminarRegistro(id){
  const antes = registros.length;
  registros = registros.filter(r => r.id !== id);
  if(registros.length !== antes){
    guardarEnStorage();
    renderTabla();
    return true;
  }
  return false;
}

function calcularSistemaSolarConUltimo({ hsp, cobertura, potenciaPanelW }){
  if(registros.length === 0) return null;

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

function renderResultado(res){
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
function onSubmitRegistro(e){
  e.preventDefault();

  const msg = $("#msg-registro");
  setMsg(msg, "", "");

  const mes = $("#mes").value;
  const consumo = leerNumero($("#consumo"));
  const tarifa = leerNumero($("#tarifa"));

  // Validación básica
  if(!mes){
    setMsg(msg, "Selecciona un mes.", "err");
    return;
  }
  if(!Number.isFinite(consumo) || consumo <= 0){
    setMsg(msg, "Consumo inválido. Debe ser mayor a 0.", "err");
    return;
  }
  if(!Number.isFinite(tarifa) || tarifa <= 0){
    setMsg(msg, "Tarifa inválida. Debe ser mayor a 0.", "err");
    return;
  }

  const nuevo = agregarRegistro({ mes, consumo, tarifa });
  setMsg(msg, `Registro guardado (${nuevo.mes}).`, "ok");

  // limpiar inputs (mantiene el mes seleccionado)
  $("#consumo").value = "";
  $("#tarifa").value = "";
}

function onClickTabla(e){
  const t = e.target;
  if(!(t instanceof HTMLElement)) return;
  if(!t.matches("button[data-id]")) return;

  const id = t.dataset.id;
  if(!id) return;

  const ok = confirm("¿Eliminar este registro?");
  if(!ok) return;

  eliminarRegistro(id);

  // si se elimina el último, el resultado podría quedar desactualizado
  renderResultadoVacio();
  setMsg($("#msg-solar"), "", "");
}

function onSubmitSolar(e){
  e.preventDefault();

  const msg = $("#msg-solar");
  setMsg(msg, "", "");

  if(registros.length === 0){
    setMsg(msg, "Primero guarda un registro mensual.", "err");
    renderResultadoVacio();
    return;
  }

  const hsp = leerNumero($("#hsp"));
  const cobertura = leerNumero($("#cobertura"));
  const potenciaPanelW = Number($("#panel").value);

  if(!Number.isFinite(hsp) || hsp <= 0){
    setMsg(msg, "HSP inválido. Debe ser mayor a 0.", "err");
    return;
  }
  if(!Number.isFinite(cobertura) || cobertura <= 0){
    setMsg(msg, "Cobertura inválida. Debe ser mayor a 0.", "err");
    return;
  }
  if(!Number.isFinite(potenciaPanelW) || potenciaPanelW <= 0){
    setMsg(msg, "Selecciona una potencia de panel.", "err");
    return;
  }

  const res = calcularSistemaSolarConUltimo({ hsp, cobertura, potenciaPanelW });
  if(!res){
    setMsg(msg, "No se pudo calcular. Intenta de nuevo.", "err");
    renderResultadoVacio();
    return;
  }

  renderResultado(res);
  setMsg(msg, "Cálculo listo. Revisa el resultado abajo.", "ok");
}

function onClickLimpiar(){
  const ok = confirm("¿Seguro que deseas borrar todos los registros?");
  if(!ok) return;

  registros = [];
  guardarEnStorage();
  renderTabla();
  renderResultadoVacio();
  setMsg($("#msg-registro"), "", "");
  setMsg($("#msg-solar"), "", "");
}

// --------- Init ----------
function init(){
  renderMeses();
  renderPaneles();

  registros = cargarDeStorage();
  renderTabla();
  renderResultadoVacio();

  $("#form-registro").addEventListener("submit", onSubmitRegistro);
  $("#tabla-registros").addEventListener("click", onClickTabla);
  $("#form-solar").addEventListener("submit", onSubmitSolar);
  $("#btn-limpiar").addEventListener("click", onClickLimpiar);
}

document.addEventListener("DOMContentLoaded", init);
