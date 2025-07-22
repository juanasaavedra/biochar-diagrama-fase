import React, { useState, useEffect } from "react";

// Función para limitar valores dentro de un rango
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

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

// Representación de los componentes de biomasa
function BiomassSVG({ stage, progress, onHotspot, hovered, setHovered, setMouse }) {
  const fibrillas = [];
  let celColor = stage < 2 ? '#1976d2' : (stage === 2 ? '#616161' : '#333');
  let celOpacity = stage < 3 ? 1 : 0.2;
  let nFibrillas = 6, nCelRings = 10;

  // Agregar el efecto de transición para las fibrillas
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
            transform: `translate(${Math.sin(progress * 5 + f) * 15}px, ${Math.cos(progress * 3 + i) * 10}px) rotate(${progress * 180}deg)`,
          }}
        />
      );
    }
  }

  return (
    <svg viewBox="0 0 700 500" style={{ width: '100%', maxWidth: 700, display: 'block', margin: '0 auto' }}>
      <defs>
        <filter id="celshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#90caf9" />
        </filter>
      </defs>
      <g>{fibrillas}</g>
      <rect
        x={120}
        y={320}
        width={480}
        height={180}
        fill="transparent"
        onMouseEnter={() => setHovered('celulosa')}
        onClick={() => onHotspot('celulosa')}
        cursor="pointer"
      />
    </svg>
  );
}

// Modal de microestructura
function MicrostructureModal({ type, onClose }) {
  let svg, text;

  if (type === 'celulosa') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>
      {[...Array(2)].map((_, f) => (
        <g key={f}>
          {[...Array(7)].map((_, i) => (
            <polygon key={i} points={`${30 + i * 36},${40 + f * 32} ${48 + i * 36},${40 + f * 32} ${57 + i * 36},${56 + f * 32} ${48 + i * 36},${72 + f * 32} ${30 + i * 36},${72 + f * 32} ${21 + i * 36},${56 + f * 32}`} fill="#e3eafc" stroke="#283593" strokeWidth={2} />
          ))}
        </g>
      ))}
    </svg>;
    text = <><b>Celulosa:</b> Microfibrilla compuesta por cadenas de β‑glucosa, alternancia de regiones cristalinas (ordenadas) y amorfas (desordenadas), unidas por puentes de hidrógeno.</>;

  } else if (type === 'hemicelulosa') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>
      {[...Array(2)].map((_, c) => (
        <polyline key={c} points={[[20, 30 + 40 * c], [60, 20 + 40 * c], [100, 60 + 40 * c], [160, 40 + 40 * c], [220, 80 + 40 * c], [260, 60 + 40 * c]].map(p => p.join(",")).join(" ")} fill="none" stroke="#b87333" strokeWidth={4} strokeLinejoin="round" />
      ))}
      {[...Array(8)].map((_, i) => (
        <circle key={i} cx={30 + i * 30} cy={40 + Math.sin(i) * 18} r={7} fill="#ffe0b2" stroke="#b87333" strokeWidth={2} />
      ))}
    </svg>;
    text = <><b>Hemicelulosa:</b> Polímero ramificado de pentosas y hexosas, sin empaquetamiento compacto, completamente amorfo.</>;

  } else if (type === 'lignina') {
    svg = <svg viewBox="0 0 300 120" style={{ width: 260 }}>
      {[...Array(4)].map((_, c) => (
        <g key={c}>{[...Array(3)].map((_, i) => (
          <polygon key={i} points={`${60 + i * 48},${40 + 24 * c} ${78 + i * 48},${40 + 24 * c} ${87 + i * 48},${56 + 24 * c} ${78 + i * 48},${72 + 24 * c} ${60 + i * 48},${72 + 24 * c} ${51 + i * 48},${56 + 24 * c}`} fill="#e8eaf6" stroke="#283593" strokeWidth={2} />
        ))}</g>
      ))}
      {[...Array(8)].map((_, i) => (
        <line key={i} x1={60 + i * 24} y1={40 + Math.sin(i) * 30} x2={90 + i * 18} y2={80 + Math.cos(i) * 30} stroke="#283593" strokeWidth={2} />
      ))}
    </svg>;
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

// Exportación final del componente principal App
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
    <>
      <div style={{ fontFamily: 'sans-serif', background: '#f7fafd', height: '100vh', overflow: 'hidden', color: '#111' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 5 }}>
          <h4 style={{ fontSize: '20px', color: '#333' }}>{TEMP_STAGES[stageIdx].label}</h4>
        </div>
        <div style={{ marginLeft: 'max(18px,3vw)', paddingTop: 40, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', padding: '0', width: '100%' }}>
            <div className="main-card" style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 32, boxShadow: '0 2px 16px #e0e0e0', padding: '2em', marginBottom: '2em', color: '#111' }}>
              <h1 style={{ fontWeight: 800, fontSize: '2.2em', color: '#111', marginBottom: 8 }}>Biomasa molecular</h1>
              <p style={{ color: '#111', fontSize: '1.15em', marginBottom: 24 }}>Haz clic en cada componente para explorar su microestructura real.</p>
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
            background: '#f5f5f5',
            borderRadius: '15px',
            height: '15px',
          }}
        />
      </div>
    </>
  );
}
