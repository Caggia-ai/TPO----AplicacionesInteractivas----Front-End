/* Ilustración de una figura: silueta entintada sobre un fondo de manga (enfoque, velocidad, trama o negro).
   Las siluetas están definidas una sola vez en <SvgDefs /> y acá solo se referencian. */
export function FigureArt({ pose, bg, sfx, className = '' }) {
  return (
    <span className={`art bg-${bg} ${className}`.trim()}>
      <svg className="fig" viewBox="0 0 200 240" aria-hidden="true" focusable="false">
        <ellipse cx="100" cy="225" rx="68" ry="11" style={{ fill: 'var(--ai)' }} />
        <ellipse cx="100" cy="220" rx="68" ry="11" style={{ fill: 'var(--ap)', stroke: 'var(--ai)', strokeWidth: 2.5 }} />
        <g className="halo"><use href={`#pose-${pose}`} style={{ fill: '#000', stroke: '#000' }} /></g>
        <use className="f0" href={`#pose-${pose}`} />
        <use className="f1" href={`#pose-${pose}`} mask="url(#m-shade)" />
      </svg>
      <span className="sfx" aria-hidden="true">{sfx}</span>
    </span>
  );
}
