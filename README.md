# Gogogo Market

Tienda de figuras de anime con estilo manga (blanco y negro), hecha con **React + Vite**, **Tailwind + DaisyUI** y un servidor **Node/Express** que cobra con **Mercado Pago**. Es un proyecto de demostración: los precios, el stock y el alias son inventados.

## Versión demo (un solo archivo, sin instalar nada)

`gogogo-market-demo.html` se abre con doble clic en cualquier navegador. Los pagos son **simulados** dentro de la página: no se cobra nada, no hay servidor ni conexión con Mercado Pago. Sirve para ver y probar todo el recorrido de compra:

- **Mercado Pago:** abre una pantalla que imita a Mercado Pago, donde elegís cómo termina el pago (aprobado, rechazado, pendiente o volver sin pagar).
- **Tarjeta:** formulario simulado que solo acepta las tarjetas de prueba de Mercado Pago. El nombre del titular decide el resultado (`APRO`, `OTHE`, `CONT`, `CALL`, `FUND`, `SECU`). Hay un desplegable que completa los datos de cada escenario.
- **Transferencia:** muestra alias y referencia.

Se genera con `npm run build:demo` (queda en `dist-demo/gogogo-market-demo.html`).

## Estructura

```
index.html              Página de entrada de Vite
vite.config.js          Configuración de Vite (tienda real y demo)
tailwind.config.js      Temas de DaisyUI (manga claro y oscuro)
shared/products.js      Catálogo y reglas de precio: lo usan React Y el servidor
server/server.js        Servidor Express: /api/* y sirve la tienda compilada (dist/)
src/
  main.jsx, App.jsx     Arranque y pantalla completa de la tienda
  index.css             Tailwind + estilos manga
  api.js                Todas las llamadas al servidor (o a la simulación en la demo)
  context/StoreContext  Estado global: carrito, stock, tema, tinta, avisos
  components/           Header, Hero, Catalog, ProductCard, ProductModal, Modal, Toast, Radar…
  cart/                 Carrito -> Datos -> Pago -> Resultado (CartModal y un archivo por paso)
  lib/                  Formato, textos de pago y ayudas de Mercado Pago
  demo/                 Servidor y pantallas simuladas (solo entran en la versión demo)
test/                   Pruebas del servidor y de la interfaz
scripts/finish-demo.js  Deja la demo como un solo archivo
```

## Cómo correrlo

Necesitás Node 18 o más nuevo.

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
# abrí .env y pegá tus credenciales de prueba (ver abajo)
npm start                # compila la tienda y abre el servidor en http://localhost:3000
```

**Para desarrollar** (los cambios se ven al guardar):

```bash
npm run dev:all          # tienda en http://localhost:5173 + servidor en :3000
```

En desarrollo, poné `PUBLIC_URL=http://localhost:5173` en `.env`, así Mercado Pago te devuelve a la tienda de desarrollo. Las llamadas a `/api` se reenvían solas al servidor.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Solo la tienda con recarga en vivo (sin servidor: los pagos no funcionan) |
| `npm run server` | Solo el servidor |
| `npm run dev:all` | Las dos cosas juntas |
| `npm run build` | Compila la tienda en `dist/` |
| `npm start` | Compila y arranca el servidor |
| `npm run build:demo` | Genera la demo de un solo archivo en `dist-demo/` |
| `npm test` | Todas las pruebas |

Si abrís `dist/index.html` con doble clic, la tienda se ve pero no puede pagar: necesita el servidor.

## Credenciales de prueba

1. Entrá al panel de desarrolladores de Mercado Pago (mercadopago.com.ar/developers) con tu cuenta.
2. Creá una aplicación y copiá sus **credenciales de prueba**.
3. En `.env` pegá el **Access Token** en `MP_ACCESS_TOKEN` y la **Public Key** en `MP_PUBLIC_KEY`.

El Access Token es secreto: va solo en el servidor (`.env`), nunca en el código de la tienda (`src/`), y `.env` no se sube a GitHub (ya está en `.gitignore`).

Los nombres de los menús del panel cambian de vez en cuando. Si no encontrás algo, buscá "credenciales de prueba" en la documentación de Mercado Pago.

## Cómo probar cada medio

**Tarjeta.** Usá estas tarjetas de prueba (según la documentación de Mercado Pago Argentina; verificá que sigan vigentes):

| Tarjeta | Número | Código | Vencimiento |
|---|---|---|---|
| Mastercard crédito | 5031 7557 3453 0604 | 123 | 11/30 |
| Visa crédito | 4509 9535 6623 3704 | 123 | 11/30 |
| American Express | 3711 803032 57522 | 1234 | 11/30 |
| Mastercard débito | 5287 3383 1025 3304 | 123 | 11/30 |
| Visa débito | 4002 7686 9439 5619 | 123 | 11/30 |

El resultado del pago lo decide el **nombre del titular** que escribas en el formulario:

| Titular | Resultado |
|---|---|
| `APRO` (DNI 12345678) | Pago aprobado |
| `OTHE` (DNI 12345678) | Rechazado por error general |
| `CONT` | Pendiente |
| `CALL` | Rechazado, hay que autorizar con el banco |
| `FUND` | Rechazado por fondos insuficientes |
| `SECU` | Rechazado por código de seguridad inválido |

**Mercado Pago.** Te lleva a la página de Mercado Pago. Para pagar en modo prueba, Mercado Pago pide usar **usuarios de prueba** (uno vendedor y uno comprador) que se crean desde el panel de desarrolladores. Iniciá sesión con el usuario comprador de prueba.

**Transferencia.** Cambiá `TRANSFER_ALIAS` en `.env`.

## Probar con la URL pública (ngrok)

Con `localhost`, Mercado Pago no puede avisarle al servidor cuando cambia un pago (webhook) ni devolver al comprador automáticamente: en ese caso, el comprador vuelve con el botón "Volver al sitio". Si querés probar eso:

1. Corré `ngrok http 3000`.
2. En `.env` poné `PUBLIC_URL=https://tu-direccion.ngrok-free.app`.
3. Reiniciá el servidor y abrí la tienda desde esa dirección.

Con `PUBLIC_URL` en `https`, el servidor activa solo `auto_return` y `notification_url`. Con `http://localhost` no los manda, porque Mercado Pago rechaza el pago con `invalid_auto_return`.

## Qué hace el servidor para cuidar el dinero

- **Calcula el total él mismo** con los precios de `shared/products.js`. Los montos que manda el navegador se ignoran.
- Valida cantidades, figuras y stock antes de hablar con Mercado Pago.
- **Verifica cada pago con Mercado Pago** antes de mostrar "Compra confirmada". No confía en lo que dice la URL al volver.
- El webhook vuelve a consultar el pago por su id, así nadie puede falsear un estado mandando una notificación inventada.
- Cada intento de pago con tarjeta usa una clave de idempotencia nueva.

## Cambiar el diseño

- **Pantallas y comportamiento:** editá los componentes de `src/`. Vite recarga la página al guardar.
- **CSS propio, colores o temas:** `src/index.css` y `tailwind.config.js`. Las clases nuevas de Tailwind o DaisyUI que escribas en los componentes se incluyen solas.
- **Figuras y precios:** `shared/products.js`. Sirve para la tienda y para el servidor a la vez.
- **Siluetas de las figuras:** `src/components/SvgDefs.jsx`.
- El formulario de tarjeta lo dibuja Mercado Pago dentro de un iframe: solo se puede cambiar lo que permite su opción `customVariables` (colores y bordes). Está en `brickStyle()` de `src/lib/mercadopago.js`.

## Pruebas

```bash
npm test
```

- `npm run test:server` compila la tienda y prueba el servidor contra un Mercado Pago simulado (14 pruebas).
- `npm run test:front` prueba la interfaz con Vitest y Testing Library: catálogo, carrito, validación de datos, transferencia, Mercado Pago, vuelta y verificación, tarjeta y la versión demo (58 pruebas).

No usan internet ni credenciales.

## Límites de este proyecto (para tener en cuenta)

- Los pedidos y el stock del servidor están **en memoria**: se pierden al reiniciar. Para algo real, usá una base de datos.
- El stock que se ve en la página se guarda en el navegador de cada persona. El del servidor es el que manda al cobrar.
- Las **transferencias no se verifican solas**: alguien tendría que confirmarlas a mano.
- El webhook no valida la firma `x-signature` que manda Mercado Pago. Está mitigado consultando el pago por id, pero para producción conviene agregarla.
- No hay límite de intentos ni protección contra abuso en la API.

## Para pasar a producción

1. Cambiá las credenciales de prueba por las de **producción** en `.env`.
2. Publicalo en un servidor con **HTTPS** y poné esa dirección en `PUBLIC_URL`.
3. Agregá una base de datos para pedidos y stock.
4. Validá la firma del webhook.
5. Reemplazá los datos inventados (precios, stock, costo de envío, alias) por los reales.
