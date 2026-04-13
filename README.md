# SolarYA - Proyecto Final JavaScript

Simulador interactivo con enfoque de tienda web para paneles solares.

## Version entregable

La version final evaluable del proyecto es la web construida con:

- `index.html`
- `css/styles.css`
- `js/app.js`
- `data/info.json`

## Funcionalidades principales

- Catalogo de paneles solares con seleccion de producto.
- Carrito funcional con resumen de productos agregados.
- Registro de consumo electrico mensual.
- Cotizador solar con calculo de tamano de sistema, paneles estimados y ahorro mensual.
- Persistencia de datos del usuario con `localStorage`.
- Carga asincrona de configuracion desde JSON con `fetch`.
- Interacciones y confirmaciones con libreria externa `SweetAlert2`.

## Notas tecnicas

- No se usa React; el proyecto esta hecho en JavaScript puro.
- El flujo de la app es entrada -> procesamiento -> salida en el DOM.
- La interfaz esta pensada para simular un sitio web funcional tipo tienda.
