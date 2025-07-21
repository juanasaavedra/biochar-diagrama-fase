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
    <path key="hex" d={hexagonPath(cx, cy, r, rot)} stroke="#8e24aa" strokeWidth="4" fill="#ede7f6" />, // morado sutil
    <circle key="circ" cx={cx} cy={cy} r={r * 0.4} fill="#d1c4e9" stroke="#8e24aa" strokeWidth="2" />
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

  // Scroll sticky y progress relativo al contenedor
  useEffect(() => {
    const onScroll = () => {
      const sticky = document.getElementById('sticky-scroll');
      if (!sticky) return;
      const rect = sticky.getBoundingClientRect();
      const winH = window.innerHeight;
      const total = rect.height - winH;
      let scrolled = Math.min(Math.max(-rect.top, 0), total);
      // No permitir scroll más allá del final de la animación
      if (scrolled / total > 1) scrolled = total;
      setProgress(total > 0 ? scrolled / total : 0);
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
  // Limita progress a 1
  const p = clamp(progress, 0, 1);
  const op1 = clamp(1 - p * 3, 0, 1);
  const op2 = clamp((p - 0.3) * 3, 0, 1) * clamp((0.7 - p) * 3, 0, 1);
  // Última etapa: completamente opaca y negra al final
  const op3 = p >= 1 ? 1 : clamp((p - 0.7) * 3, 0, 1);

  // Animación de burbujas de gas
  const volatileOpacity1 = clamp((p - 0.3) * 5, 0, 1);
  const volatileOpacity2 = clamp((p - 0.35) * 5, 0, 1);
  const volatileOpacity3 = clamp((p - 0.4) * 5, 0, 1);
  const volatileY1 = 260 - clamp((p - 0.3) * 150, 0, 150);
  const volatileY2 = 240 - clamp((p - 0.35) * 150, 0, 150);
  const volatileY3 = 220 - clamp((p - 0.4) * 150, 0, 150);

  // Animación de hexágonos de celulosa (separación y desorden, color y opacidad)
  const hexProg = clamp((p - 0.1) * 4, 0, 1);
  const hexColor = `rgba(56,142,60,${1-0.5*hexProg})`;
  const hexFill = `rgba(232,245,233,${1-0.5*hexProg})`;

  // Hemicelulosa: ramas se encogen y dispersan, color y opacidad
  const hemiProg = clamp((p - 0.15) * 4, 0, 1);
  const hemiLen = 40 - 30 * hemiProg;
  const hemiAngle = 20 * hemiProg;
  const hemiColor = `rgba(3,155,229,${1-0.5*hemiProg})`;
  const hemiFill = `rgba(179,229,252,${1-0.5*hemiProg})`;

  // Lignina: anillos se deforman y oscurecen
  const ligninProg = clamp((p - 0.2) * 4, 0, 1);
  const ligninColor = `rgba(142,36,170,${0.6 - 0.4 * ligninProg})`;

  // Define aquí, antes del return:
  const extraHex = [
    { x: 500, y: 700, r: 60 },
    { x: 700, y: 700, r: 60 },
    { x: 550, y: 800, r: 40 },
    { x: 650, y: 800, r: 40 },
  ];
  const extraBubbles = [
    { cx: 650, base: 900, r: 18, delay: 0.45 },
    { cx: 750, base: 950, r: 14, delay: 0.5 },
    { cx: 850, base: 900, r: 10, delay: 0.55 },
  ];

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
    <div id="sticky-scroll" style={{ height: '3500px', position: 'relative', background: '#fff' }} onMouseMove={handleMouseMove}>
      {/* Texto auxiliar fijo */}
      <div style={{position:'fixed',top:10,left:0,right:0,zIndex:100, textAlign:'center',fontSize:'1.1em',color:'#444',background:'rgba(255,255,255,0.85)',padding:'0.5em 0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
        Desplázate hacia abajo para ver la transformación de biomasa en biochar. Haz clic en los poros, cenizas o enlaces para ver detalles. Pasa el mouse sobre los elementos para ver su nombre.
      </div>
      {/* Barra de temperatura a la izquierda */}
      <div className="temp-scale">
        <div className="scale-track">
          <div className="scale-fill" style={{ height: `${clamp(p, 0, 1) * 100}%` }} />
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
          style={{ opacity: p > tt.threshold ? 1 : 0, top: tt.top }}
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
      {/* SVG sticky y centrado */}
      <div style={{
        position: "sticky", top: 0, width: "100%", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
        padding: '2vw', boxSizing: 'border-box'
      }}>
        <svg
          id="biochar-process"
          viewBox="0 0 1200 1200"
          style={{ width: "95vw", height: "95vh", background: "#fff", maxWidth: 1200, maxHeight: 1200 }}
        >
          {/* 1. Biomasa cruda */}
          <g id="stage-1" opacity={op1}>
            {/* Celulosa: hexágonos grandes y alineados horizontalmente */}
            <g>
              <path d={hexagonPath(400, 700, 120)} fill={hexFill} stroke={hexColor} strokeWidth={10}
                onMouseEnter={() => setHovered('hex1')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(600, 700, 120)} fill={hexFill} stroke={hexColor} strokeWidth={10}
                onMouseEnter={() => setHovered('hex2')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(800, 700, 120)} fill={hexFill} stroke={hexColor} strokeWidth={10}
                onMouseEnter={() => setHovered('hex3')} onMouseLeave={() => setHovered(null)} />
              {/* extra hexágonos intermedios */}
              {extraHex.map((h, i) => (
                <path key={i} d={hexagonPath(h.x, h.y, h.r)} fill={hexFill} stroke={hexColor} strokeWidth={6} opacity={clamp(p*2-0.2*i,0,1)*0.7} />
              ))}
              {/* enlaces entre hexágonos */}
              <line x1={520} y1={700} x2={480} y2={700} stroke={hexColor} strokeWidth={18} />
              <line x1={720} y1={700} x2={680} y2={700} stroke={hexColor} strokeWidth={18} />
            </g>
            {/* Hemicelulosa: ramas grandes */}
            <g>
              <line x1={900} y1={400} x2={900+hemiLen*10} y2={400-hemiLen*Math.tan(hemiAngle*Math.PI/180)*10} stroke={hemiColor} strokeWidth={16}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <circle cx={900+hemiLen*10} cy={400-hemiLen*Math.tan(hemiAngle*Math.PI/180)*10} r={32} fill={hemiFill} stroke={hemiColor} strokeWidth={8}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <line x1={900} y1={400} x2={900+hemiLen*10} y2={400+hemiLen*Math.tan(hemiAngle*Math.PI/180)*10} stroke={hemiColor} strokeWidth={16}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
              <circle cx={900+hemiLen*10} cy={400+hemiLen*Math.tan(hemiAngle*Math.PI/180)*10} r={32} fill={hemiFill} stroke={hemiColor} strokeWidth={8}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
            </g>
            {/* Lignina: anillos aromáticos grandes y alineados */}
            <g>
              <g onMouseEnter={() => setHovered('lignin1')} onMouseLeave={() => setHovered(null)}>{benzeneRing(900, 900, 80, 0)}</g>
              <g onMouseEnter={() => setHovered('lignin2')} onMouseLeave={() => setHovered(null)}>{benzeneRing(1050, 950, 80, Math.PI/6)}</g>
              <ellipse cx={975} cy={925} rx={60} ry={30} fill={ligninColor} />
            </g>
            <text x="100" y="200" fill="#333" fontSize="64">Biomasa</text>
          </g>
          {/* 2. Pirólisis */}
          <g id="stage-2" opacity={op2}>
            {/* Fragmentos de celulosa y hexágonos intermedios */}
            <g>
              <path d={hexagonPath(400, 900, 80)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={8}
                onMouseEnter={() => setHovered('hex1')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(600, 950, 80)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={8}
                onMouseEnter={() => setHovered('hex2')} onMouseLeave={() => setHovered(null)} />
              <path d={hexagonPath(800, 900, 80)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={8}
                onMouseEnter={() => setHovered('hex3')} onMouseLeave={() => setHovered(null)} />
              {extraHex.map((h, i) => (
                <path key={i} d={hexagonPath(h.x+100, h.y+200, h.r*0.7)} fill="#d7ccc8" stroke="#8d6e63" strokeWidth={4} opacity={clamp((p-0.2*i)*2,0,1)*0.7} />
              ))}
            </g>
            {/* Hemicelulosa: ramas encogidas */}
            <g>
              <line x1={900} y1={400} x2={900+hemiLen*5} y2={400-hemiLen*Math.tan(hemiAngle*Math.PI/180)*5} stroke="#81d4fa" strokeWidth={8}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <circle cx={900+hemiLen*5} cy={400-hemiLen*Math.tan(hemiAngle*Math.PI/180)*5} r={16} fill="#e1f5fe" stroke="#81d4fa" strokeWidth={4}
                onMouseEnter={() => setHovered('hemi1')} onMouseLeave={() => setHovered(null)} />
              <line x1={900} y1={400} x2={900+hemiLen*5} y2={400+hemiLen*Math.tan(hemiAngle*Math.PI/180)*5} stroke="#81d4fa" strokeWidth={8}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
              <circle cx={900+hemiLen*5} cy={400+hemiLen*Math.tan(hemiAngle*Math.PI/180)*5} r={16} fill="#e1f5fe" stroke="#81d4fa" strokeWidth={4}
                onMouseEnter={() => setHovered('hemi2')} onMouseLeave={() => setHovered(null)} />
            </g>
            {/* Lignina: anillos deformados */}
            <g>
              <g onMouseEnter={() => setHovered('lignin1')} onMouseLeave={() => setHovered(null)}>{benzeneRing(900, 900, 60+32*(1-ligninProg), 0)}</g>
              <g onMouseEnter={() => setHovered('lignin2')} onMouseLeave={() => setHovered(null)}>{benzeneRing(1050, 950, 60+32*(1-ligninProg), Math.PI/6)}</g>
              <ellipse cx={975} cy={925} rx={45+24*(1-ligninProg)} ry={22+12*(1-ligninProg)} fill={ligninColor} />
            </g>
            {/* Burbujas de gas animadas, más intermedias */}
            <circle className="volatile" cx="600" cy={volatileY1*3} r="24" fill="#B0BEC5" opacity={volatileOpacity1} />
            <circle className="volatile" cx="700" cy={volatileY2*3} r="20" fill="#B0BEC5" opacity={volatileOpacity2} />
            <circle className="volatile" cx="800" cy={volatileY3*3} r="16" fill="#B0BEC5" opacity={volatileOpacity3} />
            {extraBubbles.map((b, i) => (
              <circle key={i} cx={b.cx} cy={b.base - clamp((p-b.delay)*3,0,1)*400} r={b.r} fill="#B0BEC5" opacity={clamp((p-b.delay)*5,0,1)} />
            ))}
            {/* Capa oscura incipiente */}
            <path d="M0,1100 Q600,900 1200,1100 L1200,1200 L0,1200 Z" fill="#424242" opacity={clamp((p-0.3)*1.5,0,0.7)} />
            <text x="100" y="200" fill="#333" fontSize="64">Pirólisis</text>
          </g>
          {/* 3. Biochar final */}
          <g id="stage-3" opacity={op3}>
            {/* Masa amorfa negra, completamente opaca al final */}
            <path d="M300,1100 Q500,700 900,1100 Q1100,1500 1200,1100 T1200,1200 L0,1200 Z" fill="#111" opacity={p >= 1 ? 1 : 0.9} />
            {/* Poros (clickeables, borde doble y textura) */}
            {POROS.map(por => (
              <g key={por.id} style={{ cursor: "pointer" }} onClick={() => setZoomed(por.id)}
                onMouseEnter={() => setHovered(por.id)} onMouseLeave={() => setHovered(null)}>
                <circle cx={por.cx*3} cy={por.cy*3} r={por.r * 3 * op3} fill="#e0e0e0" stroke="#333" strokeWidth={12} />
                <circle cx={por.cx*3} cy={por.cy*3} r={por.r * 1.8 * op3} fill="#fff" stroke="#bdbdbd" strokeWidth={6} />
                <circle cx={por.cx*3} cy={por.cy*3} r={por.r * 0.9 * op3} fill="#f5f5f5" />
              </g>
            ))}
            {/* Partículas de ceniza (clickeables, formas irregulares) */}
            {CENIZAS.map(c => (
              <polygon key={c.id} points={c.points.split(' ').map(pt=>{
                const [x,y]=pt.split(',');
                return `${parseInt(x)*3},${parseInt(y)*3}`;
              }).join(' ')} fill="#f5f5f5" stroke="#bdbdbd" strokeWidth={8} opacity={op3} style={{ cursor: "pointer" }} onClick={() => setZoomed(c.id)}
                onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)} />
            ))}
            {/* Restos de enlaces colgando (clickeables, fractura) */}
            {ENLACES.map(e => (
              <g key={e.id} style={{ cursor: "pointer" }} onClick={() => setZoomed(e.id)}
                onMouseEnter={() => setHovered(e.id)} onMouseLeave={() => setHovered(null)}>
                <line x1={e.x1*3} y1={e.y1*3} x2={e.x2*3} y2={e.y2*3} stroke="#424242" strokeWidth={12} opacity={op3} />
                <circle cx={e.x2*3} cy={e.y2*3} r={12} fill="#fff" stroke="#424242" strokeWidth={4} />
                <path d={`M${e.x2*3-12},${e.y2*3-12} Q${e.x2*3},${e.y2*3-32} ${e.x2*3+12},${e.y2*3-12}`} stroke="#bdbdbd" strokeWidth={4} fill="none" />
              </g>
            ))}
            <text x="100" y="200" fill="#fff" fontSize="64">Biochar</text>
          </g>
        </svg>
      </div>
      {/* Relleno para forzar scroll */}
      <div style={{ height: '3500px' }} />
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
