/* Gráfico hexagonal con los seis parámetros de la figura (notas de la A a la E), como los stands de JoJo. */
import { GRADES, STAT_NAMES } from '../lib/format.js';

export function Radar({ stats }) {
  const cx = 190, cy = 134, R = 80, n = 6;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = (r) => Array.from({ length: n }, (_, i) => pt(i, r).map((v) => v.toFixed(1)).join(',')).join(' ');
  const label = STAT_NAMES.map((nm, i) => `${nm} ${GRADES[stats[i] - 1]}`).join(', ');
  const shape = stats.map((v, i) => pt(i, (R * v) / 5).map((x) => x.toFixed(1)).join(',')).join(' ');

  return (
    <svg className="radar" viewBox="0 0 380 268" role="img" aria-label={`Parámetros de la figura: ${label}`}>
      <polygon points={poly(R)} style={{ fill: 'var(--paper)' }} />
      {[1, 2, 3, 4, 5].map((k) => (
        <polygon key={k} points={poly((R * k) / 5)} fill="none" stroke="currentColor"
          strokeWidth={k === 5 ? 3 : 1} opacity={k === 5 ? 1 : 0.4} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const e = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={e[0].toFixed(1)} y2={e[1].toFixed(1)} stroke="currentColor" strokeWidth="1" opacity=".5" />;
      })}
      <polygon points={shape} style={{ fill: 'url(#hatch)' }} stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      {/* nombre y nota juntos, alineados hacia afuera para que no se pisen con el hexágono */}
      {STAT_NAMES.map((nm, i) => {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / n;
        const c = Math.cos(a), s = Math.sin(a);
        const lx = cx + (R + 12) * c, ly = cy + (R + 12) * s;
        const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
        const dy = s < -0.3 ? -6 : s > 0.3 ? 17 : 5;
        return (
          <text key={nm} x={lx.toFixed(1)} y={(ly + dy).toFixed(1)} textAnchor={anchor} fill="currentColor">
            <tspan fontSize="11.5" fontWeight="900" style={{ fontFamily: 'var(--font-b)' }}>{nm}</tspan>
            <tspan dx="5" fontSize="18" style={{ fontFamily: 'var(--font-d)' }}>{GRADES[stats[i] - 1]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
