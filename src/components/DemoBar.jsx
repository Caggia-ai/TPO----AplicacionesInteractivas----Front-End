/* Cartel que aparece solo en la versión demo */
export default function DemoBar() {
  return (
    <div id="demoBar" role="note" className="bg-base-content text-base-100 text-center text-sm font-black px-3 py-2">
      MODO DEMO: los pagos son simulados. No se cobra nada ni se conecta con Mercado Pago.
    </div>
  );
}
