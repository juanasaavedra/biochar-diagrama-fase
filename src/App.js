import React, { useState, useEffect } from "react";

// Utilidades para animación y scroll
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
const 0
const TEMP_STAGES = [
  { label: 'Biomasa inicial', temp: 25, desc: 'Celulosa ordenada, hemicelulosa ramificada, lignina amorfa' },
  { label: 'Fase intermedia', temp: 300, desc: 'Hemicelulosa se fragmenta, celulosa se desordena, lignina se rompe' },
  { label: 'Fase avanzada', temp: 500, desc: 'Celulosa amorfa y oscura, lignina carbonizada, poros y cenizas' },
  { label: 'Biochar final', temp: 600, desc: 'Biochar negro y poroso, cenizas inorgánicas' },
];

// Control de progreso del slider
function useSliderProgress() {
  const [progress, setProgress] = useState(0);

  const handleSliderChange = (event) => {
    const newProgress = clamp(event.target.value / 100, 0, 1);
    setProgress(newProgress);
  };

  return { progress, handleSliderChange };
}

// Componente de la barra de temperatura
function TemperatureBarScroll({ progress }) {
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 'max(14px,3vw)', display: 'flex', alignItems: 'center', zIndex: 10 }}>
      <div style={{ position: 'relative', height: '80vh', width: '100%', margin: 'auto', background: '#f5f5f5', borderRadius: '1em', boxShadow: '2px 2px 12px #e0e0e0', overflow: 'visible' }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${progress * 100}%`, background: 'linear-gradient(to top, #ff7043, #ffd740)', transition: 'height 0.3s', borderRadius: '1em', zIndex: 1 }} />
      </div>
    </div>
  );
}

// Componente del tooltip de la fase
function PhaseTooltip({ stageIdx, temp, visible }) {
  return visible ? (
    <div style={{
      position: 'fixed', left: 'max(40px,5vw)', top: '4vh', background: 'rgba(255,255,255,0.97)', padding: '0.7em 1.2em', borderRadius: '1em', boxShadow: '0 2px 8px #e0e0e0', color: '#111', fontWeight: 700, fontSize: '1.1em', zIndex: 1003, pointerEvents: 'none',
      minWidth: 120, textAlign: 'center', transition: 'opacity 0.5s',
      '@media (max-width: 600px)': { left: '12px', fontSize: '0.95em' }
    }}>
      {TEMP_STAGES[stageIdx].label}<br /><span style={{ fontWeight: 400, color: '#111' }}>{temp}°C</span>
    </div>
  ) : null;
}

// Componente BiomassSVG (Celulosa, Hemicelulosa y Lignina)
function BiomassSVG({ stage, progress, onHotspot, hovered, setHovered, setMouse }) {
  const fibrillas = [];
  let celColor = stage < 2 ? '#1976d2' : (stage === 2 ? '#616161' : '#333');
  let celOpacity = stage < 3 ? 1 : 0.2;
  let nFibrillas = 6, nCelRings = 10;

  // Fibrillas de Celulosa
  for (let f = 0; f < nFibrillas; f++) {
    let y = 340 + f * 28 + Math.sin(f) * 6;
    for (let i = 0; i < nCelRings; i++) {
      let x = 120 + i * 44 + (f % 2) * 22 + Math.cos(i * 0.5 + f) * 4;
      let fill = i % 2 === 0 ? '#e3eafc' : '#bbdefb';
      fibrillas.push(
        <ellipse
          key={`cel${f}-${i}`}
          cx={x}
          cy={y}
          rx={20}
          ry={10}
          fill={fill}
          stroke={celColor}
          strokeWidth={3}
          opacity={celOpacity}
          filter={f % 2 === 0 ? 'url(#celshadow)' : ''}
          style={{
            transition: "transform 0.3s, opacity 0.3s",
            transform: `translate(${Math.sin(progress * 5 + f) * 15}px, ${Math.cos(progress * 3 + i) * 10}px)`
          }}
        />
      );
    }
  }

  // Hemicelulosa
  const hemi = [];
  let hemiOpacity = stage < 1 ? 1 : (stage === 1 ? 1 - progress * 2 : 0);
  for (let h = 0; h < 4; h++) {
    let path = `M${140 + h * 40},${350 + 18 * h}`;
    for (let i = 1; i < 8; i++) {
      let x = 140 + h * 40 + i * 44 + Math.sin(i + h) * 18, y = 350 + 18 * h + Math.sin(i * 0.7 + h) * 28 + Math.cos(i + h) * 10;
      path += ` Q${x - 22},${y - 14} ${x},${y}`;
    }
    hemi.push(<path
      key={h}
      d={path}
      fill="none"
      stroke="#b87333"
      strokeWidth={3.5}
      opacity={hemiOpacity}
      style={{ transition: 'opacity 0.3s' }}
    />);
    for (let i = 0; i < 8; i++) {
      let x = 140 + h * 40 + i * 44 + Math.sin(i + h) * 18, y = 350 + 18 * h + Math.sin(i * 0.7 + h) * 28 + Math.cos(i + h) * 10;
      hemi.push(<circle
        key={`hn${h}-${i}`}
        cx={x}
        cy={y}
        r={5}
        fill="#ffe0b2"
        stroke="#b87333"
        strokeWidth={1.5}
        opacity={hemiOpacity}
        style={{
          transition: "transform 0.3s, opacity 0.3s",
          transform: `translate(${Math.sin(progress * 7 + h + i) * 20}px, ${Math.cos(progress * 5 + h + i) * 18}px)`
        }}
      />);
    }
  }

  // Lignina
  let ligninOpacity = stage < 3 ? 0.35 : (stage === 3 ? 0.15 : 0.1);
  let ligninColor = stage < 3 ? '#512da8' : '#333';
  const lignin = [];
  const points = [
    [100, 320], [180, 300], [260, 320], [340, 300], [420, 320], [500, 300], [580, 320],
    [580, 400], [500, 420], [420, 400], [340, 420], [260, 400], [180, 420], [100, 400]
  ];
  for (let i = 0; i < points.length; i++) {
    let [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
    lignin.push(<path key={`lignin${i}`} d={`M${x1},${y1} Q${(x1 + x2) / 2 + Math.sin(i) * 18},${(y1 + y2) / 2 + Math.cos(i) * 18} ${x2},${y2}`} stroke={ligninColor} strokeWidth={5} fill="none" opacity={ligninOpacity} style={{ transition: 'opacity 0.3s' }} />);
  }
  for (let i = 0; i < points.length; i += 2) {
    let [x1, y1] = points[i], [x2, y2] = points[(i + 7) % points.length];
    lignin.push(<line key={`ligninint${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ligninColor} strokeWidth={3.5} opacity={ligninOpacity * 0.7} style={{ transition: 'opacity 0.3s' }} />);
  }

  // Biochar: Círculo con la textura
  const biochar = [];
  if (stage === 3) {
    biochar.push(
      <circle
        key="biochar"
        cx="350"
        cy="250"
        r="150"
        fill="url(#biocharTexture)"  // Usando el patrón de textura
        stroke="#111"
        strokeWidth="5"
      />
    );
  }

  return (
    <svg viewBox="0 0 700 500" style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
      <defs>
        <filter id="celshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#90caf9" />
        </filter>

        {/* Definir el patrón de textura para el biochar */}
        <pattern id="biocharTexture" patternUnits="userSpaceOnUse" width="40" height="40" >
    {/* Círculos deformados con puntos blancos */}
    <circle 
      cx="10" cy="10" r="8" 
      fill="black" 
      opacity="0.7" 
      style={{
        transform: `translate(${Math.sin(progress * 5) * 6}px, ${Math.cos(progress * 3) * 6}px) scale(${1 + progress * 0.5})`,
        transition: 'transform 0.3s'
      }} 
    />
    <circle 
      cx="30" cy="10" r="8" 
      fill="black" 
      opacity="0.6"
      style={{
        transform: `translate(${Math.cos(progress * 4) * 5}px, ${Math.sin(progress * 6) * 5}px) scale(${1 + progress * 0.5})`,
        transition: 'transform 0.3s'
      }}
    />
    <circle 
      cx="10" cy="30" r="8" 
      fill="black" 
      opacity="0.8"
      style={{
        transform: `translate(${Math.sin(progress * 3) * 6}px, ${Math.cos(progress * 2) * 6}px) scale(${1 + progress * 0.5})`,
        transition: 'transform 0.3s'
      }}
    />
    <circle 
      cx="30" cy="30" r="8" 
      fill="black" 
      opacity="0.5"
      style={{
        transform: `translate(${Math.cos(progress * 2) * 6}px, ${Math.sin(progress * 5) * 6}px) scale(${1 + progress * 0.5})`,
        transition: 'transform 0.3s'
      }}
    />
  </pattern>
      </defs>

      {/* Celulosa */}
      <g>{fibrillas}</g>
      <rect x={120} y={320} width={480} height={180} fill="transparent" onMouseEnter={() => setHovered('celulosa')} onClick={() => onHotspot('celulosa')} cursor="pointer" />
      
      {/* Hemicelulosa */}
      <g>{hemi}</g>
      <rect x={120} y={340} width={480} height={80} fill="transparent" onMouseEnter={() => setHovered('hemicelulosa')} onClick={() => onHotspot('hemicelulosa')} cursor="pointer" />
      
      {/* Lignina */}
      <g>{lignin}</g>
      <rect x={80} y={280} width={560} height={160} fill="transparent" onMouseEnter={() => setHovered('lignina')} onClick={() => onHotspot('lignina')} cursor="pointer" />

      {/* Biochar con patrón de textura */}
      {stage === 3 && (
  <circle cx="350" cy="250" r="150" fill="url(#biocharTexture)" stroke="black" strokeWidth="8"/>
)}
    </svg>
  );
}

function MicrostructureModal({ type, onClose }) {
  let svg, text;

  if (type === 'celulosa') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>{/* SVG de celulosa */}</svg>;
    text = <><b>Celulosa:</b> Microfibrilla compuesta por cadenas de β‑glucosa, alternancia de regiones cristalinas (ordenadas) y amorfas (desordenadas), unidas por puentes de hidrógeno.</>;
  } else if (type === 'hemicelulosa') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>{/* SVG de hemicelulosa */}</svg>;
    text = <><b>Hemicelulosa:</b> Polímero ramificado de pentosas y hexosas, sin empaquetamiento compacto, completamente amorfo.</>;
  } else if (type === 'lignina') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>{/* SVG de lignina */}</svg>;
    text = <><b>Lignina:</b> Polímero fenilpropanoide tridimensional, enlaces aleatorios entre anillos aromáticos formando red amorfa fortemente reticulada.</>;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(30,30,40,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 24, boxShadow: '0 4px 32px #bdbdbd', padding: '2em 2em 1em 2em', minWidth: 320, maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
        {svg}
        <div style={{ margin: '1.2em 0 0.5em 0', fontSize: '1.1em', color: '#222', textAlign: 'center', fontFamily: 'sans-serif' }}>{text}</div>
        <button style={{ marginTop: '0.5em', background: '#eee', border: 'none', borderRadius: 16, padding: '0.5em 1.2em', fontSize: '1em', cursor: 'pointer', color: '#222', boxShadow: '0 2px 8px #e0e0e0' }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default function App() {
  const { progress, handleSliderChange } = useSliderProgress();
  const temp = Math.round(25 + progress * (600 - 25));
  let stageIdx = 0;
  for (let i = 0; i < TEMP_STAGES.length; i++) {
    if (temp >= TEMP_STAGES[i].temp) stageIdx = i;
  }
  let showTooltip = Math.abs(progress - (stageIdx / 3)) < 0.07;
  const [modal, setModal] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f7fafd', height: '100vh', overflow: 'hidden', color: '#111' }}>
      <TemperatureBarScroll progress={progress} />
      <PhaseTooltip stageIdx={stageIdx} temp={temp} visible={showTooltip} />
      <div style={{ marginLeft: 'max(18px,3vw)', paddingTop: 40, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0', width: '100%' }}>
          <div className="main-card" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 32, boxShadow: '0 2px 16px #e0e0e0', padding: '2em', marginBottom: '2em', color: '#111' }}>
            <h1 style={{ fontWeight: 800, fontSize: '2.2em', color: '#111', marginBottom: 8 }}>Biomasa molecular</h1>
            <p style={{ color: '#111', fontSize: '1.15em', marginBottom: 24 }}>
              Haz clic en cada componente para explorar su microestructura real.
            </p>
            <BiomassSVG onHotspot={setModal} hovered={hovered} setHovered={setHovered} setMouse={setMouse} stage={stageIdx} progress={progress} />
          </div>
        </div>
      </div>

      {/* Microstructure Modal */}
      {modal && <MicrostructureModal type={modal} onClose={() => setModal(null)} />}

      {/* Hover effect display */}
      {hovered && (
        <div style={{
          position: 'fixed',
          left: mouse.x + 16,
          top: mouse.y + 8,
          background: 'rgba(255,255,255,0.95)',
          color: '#111',
          borderRadius: '0.7em',
          boxShadow: '0 2px 8px #e0e0e0',
          padding: '0.5em 1em',
          fontSize: '1em',
          pointerEvents: 'none',
          zIndex: 1001,
          border: '1px solid #e0e0e0',
          fontWeight: 600
        }}>
          {hovered.charAt(0).toUpperCase() + hovered.slice(1)}
        </div>
      )}

      {/* Slider for controlling progress */}
      <input
        type="range"
        min="0"
        max="100"
        value={progress * 100}
        onChange={handleSliderChange}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          zIndex: 2,
          background: 'transparent',
        }}
      />
    </div>
  );
}
