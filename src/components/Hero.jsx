/* Portada en dos viñetas: título con líneas de velocidad y figura en negativo con líneas de enfoque */
import FigureArt from './FigureArt.jsx';

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1100px] px-4 pt-6 pb-1" aria-labelledby="h1">
      <div className="page flex flex-col">
        <div className="pn title cut-b">
          <div className="fx speed" />
          <div className="fx toneb" />
          <span className="vsfx jit" aria-hidden="true">ゴゴゴゴゴゴ</span>
          <div className="tin">
            <h1 className="h1" id="h1"><span className="l1">Llevate</span><span className="l2">tu figura</span><span className="l3">de anime</span></h1>
            <p className="narr">Figuras de Shuumatsu no Valkyrie, JoJo y más. Elegí la que te falta y armá tu pedido.</p>
            <div className="flex flex-wrap gap-3">
              <a className="btn btn-primary" href="#comprar">Ver figuras</a>
              <a className="btn btn-outline" href="#como">Cómo comprar</a>
            </div>
          </div>
        </div>
        <div className="pn inv figpn cut-t">
          <div className="bubble">¡La quiero!</div>
          <FigureArt pose="a" bg="ink" sfx="ゴゴゴ" className="hero-art" />
        </div>
      </div>
    </section>
  );
}
