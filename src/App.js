import React, { useState, useEffect } from "react";

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Utilidades para hexágonos y anillos aromáticos
function hexagonPath(cx, cy, r, rot = 0) {
  const a = Math.PI / 3;
  let d = '';
  for (let i = 0; i < 6; i++) {
    const angle = a * i + rot;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
  }
  d += 'Z';
  return d;
}
function benzeneRing(cx, cy, r, rot = 0) {
  // Hexágono con círculo central
  return [
    <path key="hex" d={hexagonPath(cx, cy, r, rot)} stroke="#8e24aa" strokeWidth="2" fill="#ede7f6" />,
    <circle key="circ" cx={cx} cy={cy} r={r * 0.4} fill="#d1c4e9" stroke="#8e24aa" strokeWidth="1" />
  ];
}

const POROS = [
  { id: "poro1", cx: 320, cy: 370, r: 12, label: "Poro: cavidad interconectada, diámetro ~10 µm" },
  { id: "poro2", cx: 480, cy: 380, r: 10, label: "Poro: cavidad interconectada, diámetro ~8 µm" },
];
const CENIZAS = [
  { id: "ceniza1", points: "365,370 368,372 370,369 368,366", label: "Partícula inorgánica: residuo mineral" },
  { id: "ceniza2", points: "525,365 528,368 530,364 527,362", label: "Partícula inorgánica: residuo mineral" },
];
const ENLACES = [
  { id: "enlace1", x1: 600, y1: 360, x2: 610, y2: 350, label: "Restos de ligación C–C fracturada" },
  { id: "enlace2", x1: 210, y1: 370, x2: 200, y2: 360, label: "Restos de ligación C–C fracturada" },
];

const HOVER_LABELS = {
  hex1: "Celulosa (anillo de glucosa)",
  hex2: "Celulosa (anillo de glucosa)",
  hex3: "Celulosa (anillo de glucosa)",
  hemi1: "Hemicelulosa (rama)",
  hemi2: "Hemicelulosa (rama)",
  lignin1: "Lignina (anillo aromático)",
  lignin2: "Lignina (anillo aromático)",
  poro1: "Poro",
  poro2: "Poro",
  ceniza1: "Ceniza/mineral",
  ceniza2: "Ceniza/mineral",
  enlace1: "Enlace roto",
  enlace2: "Enlace roto"
};

function App() {
  const [progress, setProgress] = useState(0);
  const [zoomed, setZoomed] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      setProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tooltips intermedios
  const tooltips = [
    { threshold: 0.25, top: "30%", text: <><strong>~200 °C</strong> · ruptura de enlaces</> },
    { threshold: 0.5, top: "50%", text: <><strong>~400 °C</strong> · volátiles liberados</> },
    { threshold: 0.75, top: "70%", text: <><strong>~600 °C</strong> · estructura amorfa</> },
  ];

  // Opacidades y animaciones para cada etapa
  const op1 = clamp(1 - progress * 3, 0, 1);
  const op2 = clamp((progress - 0.3) * 3, 0, 1) * clamp((0.7 - progress) * 3, 0, 1);
  const op3 = clamp((progress - 0.7) * 3, 0, 1);

  // Animación de burbujas de gas
  const volatileOpacity1 = clamp((progress - 0.3) * 5, 0, 1);
  const volatileOpacity2 = clamp((progress - 0.35) * 5, 0, 1);
  const volatileOpacity3 = clamp((progress - 0.4) * 5, 0, 1);
  const volatileY1 = 260 - clamp((progress - 0.3) * 150, 0, 150);
  const volatileY2 = 240 - clamp((progress - 0.35) * 150, 0, 150);
  const volatileY3 = 220 - clamp((progress - 0.4) * 150, 0, 150);

  // Animación de hexágonos de celulosa (separación y desorden, color y opacidad)
  const hexProg = clamp((progress - 0.1) * 4, 0, 1);
  const hex1x = 120 + 60 * hexProg;
  const hex1y = 250 + 30 * hexProg;
  const hex2x = 180 - 40 * hexProg;
  const hex2y = 270 + 50 * hexProg;
  const hex3x = 240 + 30 * hexProg;
  const hex3y = 250 - 40 * hexProg;
  const hexColor = `rgba(56,142,60,${1-0.5*hexProg})`;
  const hexFill = `rgba(232,245,233,${1-0.5*hexProg})`;

  // Hemicelulosa: ramas se encogen y dispersan, color y opacidad
  const hemiProg = clamp((progress - 0.15) * 4, 0, 1);
  const hemiLen = 40 - 30 * hemiProg;
  const hemiAngle = 20 * hemiProg;
  const hemiColor = `rgba(3,155,229,${1-0.5*hemiProg})`;
  const hemiFill = `rgba(179,229,252,${1-0.5*hemiProg})`;

  // Lignina: anillos se deforman y oscurecen
  const ligninProg = clamp((progress - 0.2) * 4, 0, 1);
  const ligninColor = `rgba(142,36,170,${0.6 - 0.4 * ligninProg})`;

  // Poros: aparecen y crecen
  const poroScale = op3;
  // Cenizas: aparecen y dispersan
  const cenizaOp = op3;
  // Enlaces rotos: aparecen progresivamente
  const enlaceOp = op3;

  // Modal zoom: qué mostrar
  let zoomSvg = null, zoomLabel = "";
  if (zoomed) {
    if (zoomed.startsWith("poro")) {
      const p = POROS.find(p => p.id === zoomed);
      zoomSvg = <g>
        <circle cx={150} cy={150} r={100} fill="#e0e0e0" stroke="#333" strokeWidth={10} />
        <circle cx={150} cy={150} r={60} fill="#fff" stroke="#bdbdbd" strokeWidth={6} />
        <circle cx={150} cy={150} r={30} fill="#f5f5f5" />
        <text x={150} y={155} textAnchor="middle" fontSize={22} fill="#333">Poro</text>
      </g>;
      zoomLabel = p.label;
    } else if (zoomed.startsWith("ceniza")) {
      const c = CENIZAS.find(c => c.id === zoomed);
      zoomSvg = <polygon points="80,150 150,80 220,150 150,220" fill="#f5f5f5" stroke="#bdbdbd" strokeWidth={8} />;
      zoomLabel = c.label;
    } else if (zoomed.startsWith("enlace")) {
      zoomSvg = <g>
        <line x1={60} y1={240} x2={240} y2={60} stroke="#424242" strokeWidth={16} strokeDasharray="18 10" strokeLinecap="round" />
        <text x={150} y={150} textAnchor="middle" fontSize={22} fill="#333">C–C</text>
      </g>;
      zoomLabel = ENLACES.find(e => e.id === zoomed).label;
    }
  }

  // Mouse move para tooltip de hover
  function handleMouseMove(e) {
    setMouse({ x: e.clientX, y: e.clientY });
  }

  return (
    <div style={{ minHeight: '300vh', background: '#fff' }} onMouseMove={handleMouseMove}>
      {/* Texto auxiliar fijo */}
      <div style={{position:'fixed',top:10,left:0,right:0,zIndex:100, textAlign:'center',fontSize:'1.1em',color:'#444',background:'rgba(255,255,255,0.85)',padding:'0.5em 0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
        Desplázate hacia abajo para ver la transformación de biomasa en biochar. Haz clic en los poros, cenizas o enlaces para ver detalles. Pasa el mouse sobre los elementos para ver su nombre.
      </div>
      {/* Barra de temperatura a la izquierda */}
      <div className="temp-scale">
        <div className="scale-track">
          <div className="scale-fill" style={{ height: `${clamp(progress, 0, 1) * 100}%` }} />
          <ul className="ticks">
            <li style={{ bottom: '0%' }}>25 °C</li>
            <li style={{ bottom: '33%' }}>200 °C</li>
            <li style={{ bottom: '66%' }}>400 °C</li>
            <li style={{ bottom: '100%' }}>600 °C</li>
          </ul>
        </div>
      </div>
      {/* Tooltips intermedios */}
      {tooltips.map((tt, i) => (
        <div
          key={i}
          className="tooltip"
          style={{ opacity: progress > tt.threshold ? 1 : 0, top: tt.top }}
        >
          {tt.text}
        </div>
      ))}
      {/* Tooltip de hover */}
      {hovered && (
        <div
          className="hover-tooltip"
          style={{ left: mouse.x + 16, top: mouse.y + 8 }}
        >
          {HOVER_LABELS[hovered]}
        </div>
      )}
      {/* SVG multietapa */}
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1, paddingTop: 80 }}>
        <svg
          id="biochar-process"
          viewBox="0 0 800 400"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '400px', display: 'block' }}
        >
          {/* 1. Biomasa cruda */}
          <g id="stage-1" opacity={op1}>
            {/* Celulosa: tres hexágonos enlazados */}
            <g>
              <path d={hexagonPath(hex1x, hex1y, 28)} fill={hexFill} stroke={hexColor} strokeWidth={3}
                onMouseEnter={() => setHovered('hex1')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(hex2x, hex2y, 28)} fill={hexFill} stroke={hexColor} strokeWidth={3}
                onMouseEnter={() => setHovered('hex2')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(hex3x, hex3y, 28)} fill={hexFill} stroke={hexColor} strokeWidth={3}
                onMouseEnter={() => setHovered('hex3')} onMouseLeave={() => setHovered(null)} />
              {/* enlaces entre hexágonos */}
              <line x1={hex1x+24} y1={hex1y+10} x2={hex2x-24} y2={hex2y-10} stroke={hexColor} strokeWidth={5} />
              <line x1={hex2x+24} y1={hex2y+10} x2={hex3x-24} y2={hex3y-10} stroke={hexColor} strokeWidth={5} />
            </g>
            {/* Hemicelulosa: ramas con nodos */}
            <g>
              <line x1={450} y1={300} x2={450+hemiLen} y2={300-hemiLen*Math.tan(hemiAngle*Math.PI/180)} stroke={hemiColor} strokeWidth={5}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <circle cx={450+hemiLen} cy={300-hemiLen*Math.tan(hemiAngle*Math.PI/180)} r={8} fill={hemiFill} stroke={hemiColor} strokeWidth={2}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <line x1={450} y1={300} x2={450+hemiLen} y2={300+hemiLen*Math.tan(hemiAngle*Math.PI/180)} stroke={hemiColor} strokeWidth={5}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
              <circle cx={450+hemiLen} cy={300+hemiLen*Math.tan(hemiAngle*Math.PI/180)} r={8} fill={hemiFill} stroke={hemiColor} strokeWidth={2}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
            </g>
            {/* Lignina: dos anillos aromáticos fusionados */}
            <g>
              <g onMouseEnter={() => setHovered('lignin1')} onMouseLeave={() => setHovered(null)}>{benzeneRing(670, 290, 22, 0)}</g>
              <g onMouseEnter={() => setHovered('lignin2')} onMouseLeave={() => setHovered(null)}>{benzeneRing(690, 310, 22, Math.PI/6)}</g>
              <ellipse cx={680} cy={300} rx={18} ry={8} fill={ligninColor} />
            </g>
            <text x="20" y="40" fill="#333" fontSize="24">Biomasa</text>
          </g>
          {/* 2. Pirólisis */}
          <g id="stage-2" opacity={op2}>
            {/* Fragmentos de celulosa */}
            <g>
              <path d={hexagonPath(hex1x+40, hex1y+60, 18)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={2}
                onMouseEnter={() => setHovered('hex1')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(hex2x-30, hex2y+40, 18)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={2}
                onMouseEnter={() => setHovered('hex2')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(hex3x+20, hex3y-30, 18)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={2}
                onMouseEnter={() => setHovered('hex3')} onMouseLeave={() => setHovered(null)} />
            </g>
            {/* Hemicelulosa: ramas encogidas */}
            <g>
              <line x1={450} y1={300} x2={450+hemiLen*0.5} y2={300-hemiLen*Math.tan(hemiAngle*Math.PI/180)*0.5} stroke="#81d4fa" strokeWidth={3}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <circle cx={450+hemiLen*0.5} cy={300-hemiLen*Math.tan(hemiAngle*Math.PI/180)*0.5} r={5} fill="#e1f5fe" stroke="#81d4fa" strokeWidth={1}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <line x1={450} y1={300} x2={450+hemiLen*0.5} y2={300+hemiLen*Math.tan(hemiAngle*Math.PI/180)*0.5} stroke="#81d4fa" strokeWidth={3}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
              <circle cx={450+hemiLen*0.5} cy={300+hemiLen*Math.tan(hemiAngle*Math.PI/180)*0.5} r={5} fill="#e1f5fe" stroke="#81d4fa" strokeWidth={1}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
            </g>
            {/* Lignina: anillos deformados */}
            <g>
              <g onMouseEnter={() => setHovered('lignin1')} onMouseLeave={() => setHovered(null)}>{benzeneRing(670, 290, 15+8*(1-ligninProg), 0)}</g>
              <g onMouseEnter={() => setHovered('lignin2')} onMouseLeave={() => setHovered(null)}>{benzeneRing(690, 310, 15+8*(1-ligninProg), Math.PI/6)}</g>
              <ellipse cx={680} cy={300} rx={12+6*(1-ligninProg)} ry={5+3*(1-ligninProg)} fill={ligninColor} />
            </g>
            {/* Burbujas de gas animadas */}
            <circle className="volatile" cx="420" cy={volatileY1} r="6" fill="#B0BEC5" opacity={volatileOpacity1} />
            <circle className="volatile" cx="460" cy={volatileY2} r="5" fill="#B0BEC5" opacity={volatileOpacity2} />
            <circle className="volatile" cx="500" cy={volatileY3} r="4" fill="#B0BEC5" opacity={volatileOpacity3} />
            {/* Capa oscura incipiente */}
            <path d="M0,350 Q400,280 800,350 L800,400 L0,400 Z" fill="#424242" opacity={clamp((progress-0.3)*1.5,0,0.7)} />
            <text x="20" y="40" fill="#333" fontSize="24">Pirólisis</text>
          </g>
          {/* 3. Biochar final */}
          <g id="stage-3" opacity={op3}>
            {/* Masa amorfa negra */}
            <path d="M200,360 Q300,260 400,360 Q500,460 600,360 T800,370 L800,400 L200,400 Z" fill="#212121" opacity="0.9" />
            {/* Poros (clickeables, borde doble y textura) */}
            {POROS.map(p => (
              <g key={p.id} style={{ cursor: "pointer" }} onClick={() => setZoomed(p.id)}
                onMouseEnter={() => setHovered(p.id)} onMouseLeave={() => setHovered(null)}>
                <circle cx={p.cx} cy={p.cy} r={p.r * poroScale} fill="#e0e0e0" stroke="#333" strokeWidth={3} />
                <circle cx={p.cx} cy={p.cy} r={p.r * 0.6 * poroScale} fill="#fff" stroke="#bdbdbd" strokeWidth={1.5} />
                <circle cx={p.cx} cy={p.cy} r={p.r * 0.3 * poroScale} fill="#f5f5f5" />
              </g>
            ))}
            {/* Partículas de ceniza (clickeables, formas irregulares) */}
            {CENIZAS.map(c => (
              <polygon key={c.id} points={c.points} fill="#f5f5f5" stroke="#bdbdbd" strokeWidth={2} opacity={cenizaOp} style={{ cursor: "pointer" }} onClick={() => setZoomed(c.id)}
                onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)} />
            ))}
            {/* Restos de enlaces colgando (clickeables, fractura) */}
            {ENLACES.map(e => (
              <g key={e.id} style={{ cursor: "pointer" }} onClick={() => setZoomed(e.id)}
                onMouseEnter={() => setHovered(e.id)} onMouseLeave={() => setHovered(null)}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#424242" strokeWidth={3} opacity={enlaceOp} />
                <circle cx={e.x2} cy={e.y2} r={3} fill="#fff" stroke="#424242" strokeWidth={1} />
                <path d={`M${e.x2-3},${e.y2-3} Q${e.x2},${e.y2-8} ${e.x2+3},${e.y2-3}`} stroke="#bdbdbd" strokeWidth={1} fill="none" />
              </g>
            ))}
            <text x="20" y="40" fill="#333" fontSize="24">Biochar</text>
          </g>
        </svg>
      </div>
      {/* Relleno para forzar scroll */}
      <div style={{ height: '180vh' }} />
      {/* Modal de zoom */}
      {zoomed && (
        <div className="zoom-modal" onClick={()=>setZoomed(null)}>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            <svg width={300} height={300} viewBox="0 0 300 300">
              {zoomSvg}
            </svg>
            <div className="zoom-label">{zoomLabel}</div>
            <button className="close-btn" onClick={()=>setZoomed(null)}>Cerrar</button>
          </div>
        </div>
      )}
      {/* Estilos globales */}
      <style>{`
        body { background: #fff; }
        .temp-scale {
          position: fixed;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 300px;
          z-index: 10;
        }
        .scale-track {
          position: relative;
          width: 10px;
          height: 100%;
          background: #eee;
          border-radius: 5px;
          overflow: hidden;
        }
        .scale-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          background: linear-gradient(to top, #ff8f00, #fdd835);
          transition: height 0.1s ease-out;
        }
        .ticks {
          position: absolute;
          left: 120%;
          bottom: 0;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .ticks li {
          position: absolute;
          font-size: 0.8rem;
          transform: translateY(50%);
          white-space: nowrap;
        }
        .tooltip {
          position: fixed;
          right: 2rem;
          background: rgba(255,255,255,0.95);
          border-radius: 1em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          padding: 0.7em 1.2em;
          font-size: 1.1em;
          color: #333;
          z-index: 20;
          pointer-events: none;
          transition: opacity 0.5s;
        }
        .hover-tooltip {
          position: fixed;
          background: #fff;
          color: #333;
          border-radius: 0.7em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          padding: 0.5em 1em;
          font-size: 1em;
          pointer-events: none;
          z-index: 1001;
          border: 1px solid #e0e0e0;
        }
        .zoom-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .zoom-content {
          background: #fff;
          border-radius: 1.5em;
          padding: 2em 2em 1em 2em;
          box-shadow: 0 4px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 320px;
        }
        .zoom-label {
          margin: 1em 0 0.5em 0;
          font-size: 1.1em;
          color: #222;
          text-align: center;
        }
        .close-btn {
          margin-top: 0.5em;
          background: #eee;
          border: none;
          border-radius: 1em;
          padding: 0.5em 1.2em;
          font-size: 1em;
          cursor: pointer;
        }
        @media (max-width: 600px) {
          .temp-scale { left: 0.2rem; height: 180px; }
          .scale-track { width: 7px; }
          .tooltip { right: 0.5rem; font-size: 0.95em; }
          .hover-tooltip { font-size: 0.9em; }
          .zoom-content { min-width: 180px; padding: 1em 0.5em; }
        }
      `}</style>
    </div>
  );
}

export default App;
