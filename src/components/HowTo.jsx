/* Sección "Cómo comprar": tres viñetas numeradas */
export function HowTo() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 pt-10 pb-2" id="como" aria-labelledby="t-como">
      <h2 className="sec-h" id="t-como">Cómo comprar</h2>
      <div className="grid gap-3.5 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="panel p1"><div className="fx focus" /><span className="n" aria-hidden="true">1</span><div className="tx"><h3>Elegí</h3><p>Filtrá por obra o precio y abrí la figura para ver sus parámetros.</p></div></div>
        <div className="panel p2"><div className="fx toneb" /><span className="n" aria-hidden="true">2</span><div className="tx"><h3>Agregá</h3><p>Sumala al carrito. Si es la última, no se repite en el pedido.</p></div></div>
        <div className="panel p3"><span className="n" aria-hidden="true">3</span><div className="tx"><h3>Confirmá</h3><p>Cargá tus datos, elegí cómo pagar y listo.</p></div></div>
      </div>
    </section>
  );
}
