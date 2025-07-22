import React, { useState, useEffect } from "react";
const v = 0
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
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
function drawGlucoseRing(cx, cy, r, color, fill) {
  return <path d={hexagonPath(cx, cy, r)} stroke={color} strokeWidth={4} fill={fill} />;
}
function drawLink(x1, y1, x2, y2, color) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} />;
}
function benzeneRing(cx, cy, r, rot = 0) {
  return [
    <path key="hex" d={hexagonPath(cx, cy, r, rot)} stroke="#8e24aa" strokeWidth="4" fill="#ede7f6" />, // morado sutil
    <circle key="circ" cx={cx} cy={cy} r={r * 0.4} fill="#d1c4e9" stroke="#8e24aa" strokeWidth="2" />
  ];
}
const HOVER_LABELS = {
  celulosa: "Celulosa (microfibrilla cristalina)",
  hemicelulosa: "Hemicelulosa (cadena ramificada)",
  lignina: "Lignina (red aromática)",
  biochar: "Biochar (matriz amorfa)",
};
function App() {
  const [progress, setProgress] = useState(0);
  const [zoomed, setZoomed] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onScroll = () => {
      const sticky = document.getElementById('sticky-scroll');
      if (!sticky) return;
      const rect = sticky.getBoundingClientRect();
      const winH = window.innerHeight;
      const total = rect.height - winH;
      let scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const p = clamp(progress, 0, 1);
  // --- Celulosa microfibrilla ---
  // Parámetros de la microfibrilla
  const nChains = 4;
  const nRings = 7;
  const baseX = 350, baseY = 600;
  const dx = 60, dy = 40;
  const ringR = 28;
  const color = "#388e3c";
  const fill = "#e8f5e9";
  // Ruptura explosiva: a partir de p > 0.2 los anillos se dispersan como bolas
  let rings = [];
  let links = [];
  let balls = [];
  for (let c = 0; c < nChains; c++) {
    for (let i = 0; i < nRings; i++) {
      // Posición base de cada anillo
      let x = baseX + i * dx;
      let y = baseY + c * dy;
      // Ruptura: a partir de p > 0.2, los anillos se dispersan
      let explode = clamp((p - 0.2) * 2, 0, 1);
      if (explode > 0) {
        // Trayectoria radial aleatoria
        const angle = (Math.PI * 2 * (i + c * nRings) / (nChains * nRings)) + (i % 2 === 0 ? 0.2 : -0.2);
        const dist = 180 * explode * (0.7 + 0.5 * Math.random());
        x += Math.cos(angle) * dist;
        y += Math.sin(angle) * dist;
        // Se convierten en bolas
        balls.push(<circle key={`b${c}-${i}`} cx={x} cy={y} r={18 - 10 * explode} fill={color} opacity={0.7 + 0.3 * (1 - explode)} />);
      } else {
        // Anillo intacto
        rings.push(drawGlucoseRing(x, y, ringR, color, fill));
        // Enlaces entre anillos
        if (i > 0) {
          links.push(drawLink(x - dx, y, x, y, color));
        }
      }
    }
  }
  // Cuando la explosión es total, los puntos se agrupan y mezclan con bolas grises/negro (biochar amorfo)
  let amorphBalls = [];
  if (p > 0.7) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.PI * 2 * i / 40;
      const r = 180 + 60 * Math.sin(i * 0.7);
      const cx = 650 + Math.cos(angle) * r * (1 - (p - 0.7));
      const cy = 800 + Math.sin(angle) * r * (1 - (p - 0.7));
      amorphBalls.push(<circle key={`a${i}`} cx={cx} cy={cy} r={18 * (1 - (p - 0.7)) + 8} fill={i % 3 === 0 ? '#333' : '#888'} opacity={0.7} />);
    }
  }
  // 1. Hemicelulosa
  // Parámetros de la hemicelulosa
  const hemiColor = "#c62828";
  const hemiFill = "#ffcdd2";
  const hemiBaseX = 350, hemiBaseY = 800;
  const hemiMainLen = 6;
  let hemiLinks = [], hemiRings = [], hemiBalls = [];
  for (let i = 0; i < hemiMainLen; i++) {
    let x = hemiBaseX + i * 60;
    let y = hemiBaseY + Math.sin(i * 0.7) * 30;
    let explode = clamp((p - 0.2) * 2, 0, 1);
    if (explode > 0) {
      const angle = Math.PI * 2 * (i + 1) / (hemiMainLen + 2) + 0.5;
      const dist = 120 * explode * (0.7 + 0.5 * Math.random());
      x += Math.cos(angle) * dist;
      y += Math.sin(angle) * dist;
      hemiBalls.push(<circle key={`hb${i}`} cx={x} cy={y} r={14 - 8 * explode} fill={hemiColor} opacity={0.7 + 0.3 * (1 - explode)} />);
    } else {
      hemiRings.push(<ellipse key={`hr${i}`} cx={x} cy={y} rx={18} ry={12} fill={hemiFill} stroke={hemiColor} strokeWidth={4} />);
      if (i > 0) hemiLinks.push(drawLink(x - 60, hemiBaseY + Math.sin((i - 1) * 0.7) * 30, x, y, hemiColor));
      // Ramificaciones
      if (i % 2 === 1) {
        let rx = x + 30, ry = y - 40;
        hemiLinks.push(drawLink(x, y, rx, ry, hemiColor));
        hemiRings.push(<ellipse key={`hrb${i}`} cx={rx} cy={ry} rx={12} ry={8} fill={hemiFill} stroke={hemiColor} strokeWidth={3} />);
      }
    }
  }
  // 2. Lignina
  // Parámetros de la lignina
  const ligninColor = "#fbc02d";
  const ligninFill = "#fffde7";
  const ligninBaseX = 350, ligninBaseY = 1000;
  const nLignin = 5;
  let ligninRings = [], ligninLinks = [], ligninBalls = [];
  for (let i = 0; i < nLignin; i++) {
    let angle = Math.PI * 2 * i / nLignin + 0.5;
    let x = ligninBaseX + Math.cos(angle) * 60;
    let y = ligninBaseY + Math.sin(angle) * 60;
    let explode = clamp((p - 0.2) * 2, 0, 1);
    if (explode > 0) {
      const dist = 100 * explode * (0.7 + 0.5 * Math.random());
      x += Math.cos(angle) * dist;
      y += Math.sin(angle) * dist;
      ligninBalls.push(<circle key={`lb${i}`} cx={x} cy={y} r={16 - 10 * explode} fill={ligninColor} opacity={0.7 + 0.3 * (1 - explode)} />);
    } else {
      ligninRings.push(<circle key={`lr${i}`} cx={x} cy={y} r={20} fill={ligninFill} stroke={ligninColor} strokeWidth={4} />);
      if (i > 0) ligninLinks.push(drawLink(ligninBaseX + Math.cos(Math.PI * 2 * (i - 1) / nLignin + 0.5) * 60, ligninBaseY + Math.sin(Math.PI * 2 * (i - 1) / nLignin + 0.5) * 60, x, y, ligninColor));
    }
  }
  // Modales
  let hemiZoom = null, ligninZoom = null;
  if (zoomed === "hemicelulosa") {
    hemiZoom = <g>
      <ellipse cx={150} cy={150} rx={80} ry={40} fill={hemiFill} stroke={hemiColor} strokeWidth={6} />
      <ellipse cx={230} cy={110} rx={24} ry={14} fill={hemiFill} stroke={hemiColor} strokeWidth={4} />
      <ellipse cx={70} cy={110} rx={24} ry={14} fill={hemiFill} stroke={hemiColor} strokeWidth={4} />
      <line x1={150} y1={150} x2={230} y2={110} stroke={hemiColor} strokeWidth={4} />
      <line x1={150} y1={150} x2={70} y2={110} stroke={hemiColor} strokeWidth={4} />
      <text x={150} y={260} textAnchor="middle" fontSize={22} fill="#333">Hemicelulosa: cadena ramificada</text>
    </g>;
  }
  if (zoomed === "lignina") {
    ligninZoom = <g>
      {Array.from({ length: 6 }).map((_, i) =>
        <circle key={i} cx={150 + Math.cos(Math.PI * 2 * i / 6) * 60} cy={150 + Math.sin(Math.PI * 2 * i / 6) * 60} r={20} fill={ligninFill} stroke={ligninColor} strokeWidth={4} />
      )}
      {Array.from({ length: 6 }).map((_, i) =>
        <line key={i} x1={150 + Math.cos(Math.PI * 2 * i / 6) * 60} y1={150 + Math.sin(Math.PI * 2 * i / 6) * 60} x2={150 + Math.cos(Math.PI * 2 * ((i+1)%6) / 6) * 60} y2={150 + Math.sin(Math.PI * 2 * ((i+1)%6) / 6) * 60} stroke={ligninColor} strokeWidth={4} />
      )}
      <text x={150} y={260} textAnchor="middle" fontSize={22} fill="#333">Lignina: red aromática</text>
    </g>;
  }
  // Línea de temperatura
  const tempBarHeight = 300;
  const tempFill = tempBarHeight * p;
  const tempTicks = [25, 200, 400, 600];
  // --- Render principal ---
  return (
    <div id="sticky-scroll" style={{ height: '3500px', position: 'relative', background: '#fff' }} onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}>
      <div style={{position:'fixed',top:10,left:0,right:0,zIndex:100, textAlign:'center',fontSize:'1.1em',color:'#444',background:'rgba(255,255,255,0.85)',padding:'0.5em 0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
        Transformación molecular de biomasa a biochar: animación interactiva. Haz clic o toca cualquier componente para ver su microestructura.
      </div>
      {hovered && (
        <div className="hover-tooltip" style={{ left: mouse.x + 16, top: mouse.y + 8 }}>{HOVER_LABELS[hovered]}</div>
      )}
      <div style={{ position: "sticky", top: 0, width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, padding: '2vw', boxSizing: 'border-box' }}>
        <svg id="biochar-process" viewBox="0 0 1200 1200" style={{ width: "95vw", height: "95vh", background: "#fff", maxWidth: 1200, maxHeight: 1200, display: 'block', margin: '0 auto' }}>
          <text x="50%" y="80" fill="#333" fontSize="48" textAnchor="middle" style={{fontWeight:'bold'}}>
            Transformación molecular de biomasa a biochar: animación interactiva
          </text>
          {/* Celulosa: microfibrilla y ruptura explosiva */}
          <g id="celulosa" opacity={clamp(1 - p * 2, 0, 1)} onMouseEnter={() => setHovered('celulosa')} onMouseLeave={() => setHovered(null)} onClick={() => setZoomed('celulosa')} style={{ cursor: 'pointer' }}>
            {links}
            {rings}
          </g>
          {/* Ruptura: bolas verdes dispersas */}
          <g id="celulosa-explosion" opacity={clamp((p - 0.2) * 3, 0, 1)}>
            {balls}
          </g>
          {/* Hemicelulosa: cadena ramificada y ruptura explosiva */}
          <g id="hemicelulosa" opacity={clamp(1 - p * 2, 0, 1)} onMouseEnter={() => setHovered('hemicelulosa')} onMouseLeave={() => setHovered(null)} onClick={() => setZoomed('hemicelulosa')} style={{ cursor: 'pointer' }}>{hemiLinks}{hemiRings}</g>
          <g id="hemicelulosa-explosion" opacity={clamp((p - 0.2) * 3, 0, 1)}>{hemiBalls}</g>
          {/* Lignina: red aromática y ruptura explosiva */}
          <g id="lignina" opacity={clamp(1 - p * 2, 0, 1)} onMouseEnter={() => setHovered('lignina')} onMouseLeave={() => setHovered(null)} onClick={() => setZoomed('lignina')} style={{ cursor: 'pointer' }}>{ligninLinks}{ligninRings}</g>
          <g id="lignina-explosion" opacity={clamp((p - 0.2) * 3, 0, 1)}>{ligninBalls}</g>
          {/* Biochar amorfo: bolas grises/negro */}
          <g id="biochar" opacity={clamp((p - 0.7) * 2, 0, 1)} onMouseEnter={() => setHovered('biochar')} onMouseLeave={() => setHovered(null)} onClick={() => setZoomed('biochar')} style={{ cursor: 'pointer' }}>
            {amorphBalls}
          </g>
        </svg>
      </div>
      <div style={{ height: '3500px' }} />
      {zoomed && (
        <div className="zoom-modal" onClick={()=>setZoomed(null)}>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            {zoomed === 'hemicelulosa' && hemiZoom}
            {zoomed === 'lignina' && ligninZoom}
            <div className="zoom-label">{zoomed === 'hemicelulosa' ? "Hemicelulosa: cadena ramificada" : zoomed === 'lignina' ? "Lignina: red aromática" : HOVER_LABELS[zoomed]}</div>
            <button className="close-btn" onClick={()=>setZoomed(null)}>Cerrar</button>
          </div>
        </div>
      )}
      <style>{`
        body { background: #fff; }
        .temp-scale { position: fixed; left: 1rem; top: 50%; transform: translateY(-50%); width: 40px; height: 300px; z-index: 10; }
        .scale-track { position: relative; width: 10px; height: 100%; background: #eee; border-radius: 5px; overflow: hidden; }
        .scale-fill { position: absolute; bottom: 0; width: 100%; background: linear-gradient(to top, #ff8f00, #fdd835); transition: height 0.1s ease-out; }
        .ticks { position: absolute; left: 120%; bottom: 0; list-style: none; padding: 0; margin: 0; }
        .ticks li { position: absolute; font-size: 0.8rem; transform: translateY(50%); white-space: nowrap; }
        .tooltip { position: fixed; right: 2rem; background: rgba(255,255,255,0.95); border-radius: 1em; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 0.7em 1.2em; font-size: 1.1em; color: #333; z-index: 20; pointer-events: none; transition: opacity 0.5s; }
        .hover-tooltip { position: fixed; background: #fff; color: #333; border-radius: 0.7em; box-shadow: 0 2px 8px rgba(0,0,0,0.12); padding: 0.5em 1em; font-size: 1em; pointer-events: none; z-index: 1001; border: 1px solid #e0e0e0; }
        .zoom-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .zoom-content { background: #fff; border-radius: 1.5em; padding: 2em 2em 1em 2em; box-shadow: 0 4px 32px rgba(0,0,0,0.18); display: flex; flex-direction: column; align-items: center; min-width: 320px; }
        .zoom-label { margin: 1em 0 0.5em 0; font-size: 1.1em; color: #222; text-align: center; }
        .close-btn { margin-top: 0.5em; background: #eee; border: none; border-radius: 1em; padding: 0.5em 1.2em; font-size: 1em; cursor: pointer; }
        @media (max-width: 800px) {
          #biochar-process { width: 100vw !important; height: 60vh !important; }
          .zoom-content { min-width: 180px; padding: 1em 0.5em; }
        }
      `}</style>
      <div className="temp-scale">
        <div className="scale-track">
          <div className="scale-fill" style={{ height: `${clamp(p, 0, 1) * 100}%` }} />
          <ul className="ticks">
            {tempTicks.map((t, i) => <li key={i} style={{ bottom: `${(i/3)*100}%` }}>{t + ' °C'}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
export default App;
