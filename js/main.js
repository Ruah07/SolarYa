// Entregable 1 - SolarYA
// Profe continuando con mi carrera de diseño ux/ui, quiero enfocar este simulador a mi app de SolarYA

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const POTENCIAS_PANEL_W = [450, 500, 550];

let nombre = "";
let registros = []; // { mes, tarifa, consumo, costo }

// ----------------- ENTRADAS -----------------
function pedirTexto(mensaje) {
  let v = prompt(mensaje);
  if (v === null) return null;

  v = v.trim();
  while (v.length === 0) {
    v = prompt("⚠️ Debes escribir algo.\n" + mensaje);
    if (v === null) return null;
    v = v.trim();
  }
  return v;
}

function pedirNumero(mensaje) {
  let v = prompt(mensaje);
  if (v === null) return null;

  v = v.replace(",", ".").trim();
  let n = Number(v);

  while (!Number.isFinite(n) || n <= 0) {
    v = prompt("⚠️ Ingresa un número válido mayor a 0.\n" + mensaje);
    if (v === null) return null;
    v = v.replace(",", ".").trim();
    n = Number(v);
  }
  return n;
}

function elegirOpcion(titulo, opciones) {
  let texto = titulo + "\n\n";
  for (let i = 0; i < opciones.length; i++) {
    texto += (i + 1) + ") " + opciones[i] + "\n";
  }
  texto += "\nEscribe el número:";

  let v = prompt(texto);
  if (v === null) return null;

  let idx = Number(v) - 1;
  while (!Number.isInteger(idx) || idx < 0 || idx >= opciones.length) {
    v = prompt("⚠️ Opción inválida.\n\n" + texto);
    if (v === null) return null;
    idx = Number(v) - 1;
  }
  return opciones[idx];
}

// ----------------- PROCESO + SALIDA -----------------
function cargarRegistroMensual() {
  const mes = elegirOpcion("¿De qué mes quieres registrar datos?", MESES);
  if (mes === null) return false;

  const tarifa = pedirNumero("Tarifa promedio ($/kWh). Ejemplo: 900");
  if (tarifa === null) return false;

  const consumo = pedirNumero("Consumo del mes (kWh). Ejemplo: 320");
  if (consumo === null) return false;

  const costo = consumo * tarifa;

  const registro = { mes, tarifa, consumo, costo };
  registros.push(registro);

  console.log("✅ Registro guardado:");
  console.table([registro]);
  alert("✅ Registro guardado. Revisa la consola (F12).");

  return true;
}

function calcularSistemaSolar() {
  if (registros.length === 0) {
    alert("Primero registra al menos 1 mes (consumo + tarifa).");
    console.warn("No hay registros para calcular.");
    return null;
  }

  const ultimo = registros[registros.length - 1];

  const horasSol = pedirNumero(
    "Horas sol pico (HSP) promedio al día.\nEjemplo: 4.5"
  );
  if (horasSol === null) return null;

  const porcentaje = pedirNumero(
    "¿Qué % del consumo quieres cubrir con solar?\nEjemplo: 70"
  );
  if (porcentaje === null) return null;

  let pct = porcentaje;
  if (pct > 100) pct = 100;

  if (pct < 10) {
    const ok = confirm("Ese porcentaje es muy bajo. ¿Seguro que quieres seguir?");
    if (!ok) return null;
  }

  const potenciaPanel = elegirOpcion(
    "Elige la potencia del panel (W):",
    POTENCIAS_PANEL_W.map(w => w + " W")
  );
  if (potenciaPanel === null) return null;

  const potenciaPanelNum = Number(potenciaPanel.split(" ")[0]);

  // Cálculo simple (aproximado)
  const energiaMesObjetivo = ultimo.consumo * (pct / 100); // kWh/mes
  const energiaDia = energiaMesObjetivo / 30;              // kWh/día
  const tamSistemaKW = energiaDia / horasSol;              // kW

  const panelKW = potenciaPanelNum / 1000;
  const numPaneles = Math.ceil(tamSistemaKW / panelKW);

  const ahorroMensual = ultimo.costo * (pct / 100);

  return {
    mesBase: ultimo.mes,
    consumoMesKWh: ultimo.consumo,
    costoMes: ultimo.costo,
    horasSol,
    porcentajeCobertura: pct,
    potenciaPanelW: potenciaPanelNum,
    tamSistemaKW,
    numPaneles,
    ahorroMensual
  };
}

function mostrarResultadoSolar(resultado) {
  if (!resultado) return;

  console.clear();
  console.log("====================================");
  console.log("🌞 SolarYA — Resultado estimado");
  console.log("====================================");
  console.table([{
    "Mes base": resultado.mesBase,
    "Consumo (kWh)": resultado.consumoMesKWh,
    "Costo (COP)": Math.round(resultado.costoMes),
    "HSP": resultado.horasSol,
    "% cobertura": resultado.porcentajeCobertura,
    "Panel (W)": resultado.potenciaPanelW,
    "Sistema (kW)": Number(resultado.tamSistemaKW.toFixed(2)),
    "N° paneles": resultado.numPaneles,
    "Ahorro mensual (COP)": Math.round(resultado.ahorroMensual)
  }]);

  console.log("Tip: si quieres comparar meses, registra varios y usa 'Listar registros'.");
  alert("🌞 Cálculo listo. Mira el detalle en la consola (F12).");
}

// Extra: ver el array completo
function listarRegistros() {
  if (registros.length === 0) {
    alert("No hay registros todavía.");
    return;
  }
  console.log("📒 Registros guardados:");
  console.table(registros);
  alert("📒 Listo. Registros mostrados en consola (console.table).");
}

function reiniciar() {
  const ok = confirm("¿Seguro que quieres borrar los registros?");
  if (!ok) return;

  registros = [];
  console.clear();
  alert("Listo, se borraron los registros.");
}

// ----------------- MENÚ -----------------
function iniciar() {
  console.clear();

  nombre = pedirTexto("Hola 👋 ¿Cuál es tu nombre?");
  if (nombre === null) {
    alert("Cancelaste el inicio. Recarga la página para comenzar de nuevo.");
    return;
  }

  alert("Bienvenido/a " + nombre + ".\nAbre la consola (F12) para ver resultados.");

  let salir = false;

  while (!salir) {
    let op = prompt(
      "Menú — SolarYA\n\n" +
      "1) Registrar consumo + tarifa (mes)\n" +
      "2) Calcular sistema solar (con último mes)\n" +
      "3) Listar registros en consola\n" +
      "4) Reiniciar\n" +
      "5) Salir\n\n" +
      "Escribe el número:"
    );

    if (op === null) {
      salir = confirm("Cancelaste el menú. ¿Quieres salir?");
      continue;
    }

    switch (op) {
      case "1":
        cargarRegistroMensual();
        break;
      case "2":
        const res = calcularSistemaSolar();
        mostrarResultadoSolar(res);
        break;
      case "3":
        listarRegistros();
        break;
      case "4":
        reiniciar();
        break;
      case "5":
        salir = true;
        break;
      default:
        alert("⚠️ Opción inválida. Intenta de nuevo.");
        break;
    }

    if (!salir) {
      const volver = confirm("¿Volver al menú?");
      if (!volver) salir = true;
    }
  }

  console.log("Fin del simulador. Gracias,", nombre);
  alert("Simulador finalizado.\nGracias " + nombre + ".");
}

// Invocación
iniciar();
