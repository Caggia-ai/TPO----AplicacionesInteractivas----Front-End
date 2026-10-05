/* Siluetas, tramas y filtros de tinta que comparten todas las figuras.
   Se dibuja UNA sola vez en la página; el resto de los SVG los usan con <use href="#pose-a"> y compañía. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="4" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4"/>
        </filter>
        <filter id="halo-p" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="d"/>
          <feFlood style={{ floodColor: 'var(--paper)' }}/>
          <feComposite in2="d" operator="in"/>
        </filter>
        <filter id="halo-i" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="3.5" result="d"/>
          <feFlood style={{ floodColor: 'var(--ink)' }}/>
          <feComposite in2="d" operator="in"/>
        </filter>
        <pattern id="tone-p" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.15" style={{ fill: 'var(--paper)' }}/></pattern>
        <pattern id="tone-i" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.5" cy="2.5" r="1.15" style={{ fill: 'var(--ink)' }}/></pattern>
        <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" style={{ stroke: 'var(--ink)', strokeWidth: '2' }}/></pattern>
        <linearGradient id="g-sh" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stopColor="#000"/><stop offset=".85" stopColor="#fff"/></linearGradient>
        <mask id="m-shade" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="240"><rect width="200" height="240" fill="url(#g-sh)"/></mask>

        <g id="pose-a" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="96,150 76,182 68,206" fill="none" strokeWidth="17"/>
          <polyline points="112,150 132,176 138,206" fill="none" strokeWidth="17"/>
          <path d="M52,209 L80,209 L76,199 Z" strokeWidth="5"/>
          <path d="M128,209 L156,209 L142,199 Z" strokeWidth="5"/>
          <path d="M76,92 L124,88 L134,192 L118,180 L104,194 L90,180 L66,194 Z" strokeWidth="6"/>
          <polyline points="78,98 48,112 58,74" fill="none" strokeWidth="13"/>
          <polyline points="122,96 152,80 172,58" fill="none" strokeWidth="13"/>
          <circle cx="58" cy="70" r="8" stroke="none"/>
          <circle cx="173" cy="56" r="7" stroke="none"/>
          <path d="M173,56 L184,36" fill="none" strokeWidth="5"/>
          <rect x="94" y="74" width="12" height="18" strokeWidth="4"/>
          <ellipse cx="100" cy="64" rx="15" ry="17" stroke="none"/>
          <path d="M84,58 L80,36 L92,48 L96,26 L104,46 L116,30 L116,52 L124,60 Z" strokeWidth="3"/>
        </g>
        <g id="pose-b" strokeLinecap="round" strokeLinejoin="round">
          <path d="M78,92 L36,120 L18,202 L46,184 L58,208 L74,150 Z" strokeWidth="4"/>
          <polyline points="94,150 64,180 50,206" fill="none" strokeWidth="17"/>
          <polyline points="110,150 140,176 152,206" fill="none" strokeWidth="17"/>
          <path d="M38,209 L66,209 L60,199 Z" strokeWidth="5"/>
          <path d="M140,209 L168,209 L156,199 Z" strokeWidth="5"/>
          <path d="M76,92 L126,92 L114,152 L92,152 Z" strokeWidth="8"/>
          <circle cx="76" cy="95" r="12" stroke="none"/>
          <circle cx="126" cy="95" r="12" stroke="none"/>
          <polyline points="126,98 146,118 148,92" fill="none" strokeWidth="13"/>
          <polyline points="76,98 54,122 70,142" fill="none" strokeWidth="13"/>
          <line x1="158" y1="214" x2="138" y2="16" fill="none" strokeWidth="5"/>
          <path d="M138,14 L172,22 L160,46 L142,40 Z" strokeWidth="3"/>
          <path d="M138,14 L128,2 L142,30 Z" strokeWidth="2"/>
          <rect x="94" y="74" width="12" height="18" strokeWidth="4"/>
          <ellipse cx="101" cy="68" rx="15" ry="17" stroke="none"/>
          <path d="M86,58 L84,34 L100,48 L118,32 L116,56 L130,76 L112,66 Z" strokeWidth="3"/>
        </g>
        <g id="pose-c" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="100,150 84,182 58,204" fill="none" strokeWidth="17"/>
          <polyline points="110,150 138,170 142,206" fill="none" strokeWidth="17"/>
          <path d="M40,209 L68,209 L64,197 Z" strokeWidth="5"/>
          <path d="M130,209 L158,209 L146,199 Z" strokeWidth="5"/>
          <path d="M84,94 L128,86 L118,150 L96,152 Z" strokeWidth="8"/>
          <polyline points="86,100 68,120 92,126" fill="none" strokeWidth="13"/>
          <polyline points="126,96 152,84 178,80" fill="none" strokeWidth="11" opacity=".4"/>
          <polyline points="126,96 152,112 178,108" fill="none" strokeWidth="11" opacity=".4"/>
          <polyline points="126,96 152,98 176,94" fill="none" strokeWidth="14"/>
          <circle cx="184" cy="94" r="12" stroke="none"/>
          <rect x="104" y="76" width="12" height="18" strokeWidth="4"/>
          <ellipse cx="113" cy="66" rx="15" ry="17" stroke="none"/>
          <path d="M99,60 L82,50 L100,46 L90,32 L110,42 L118,26 L124,46 L130,60 Z" strokeWidth="3"/>
        </g>
      </defs>
    </svg>
  );
}
