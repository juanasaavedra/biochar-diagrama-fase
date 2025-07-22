import React, { useState, useRef, useEffect } from "react";

// Utilidades para animación y scroll
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
const STAGES = [
  {
    name: "Secado",
    temp: 100,
    text: "Eliminación de agua libre y ligada.",
    color: "#b3e5fc"
  },
  {
    name: "Descomposición de hemicelulosa",
    temp: 320,
    text: "Cadenas ramificadas se fraccionan, liberan CO, CO₂ y ácidos orgánicos.",
    color: "#ffe0b2"
  },
  {
    name: "Devolatilización de celulosa",
    temp: 400,
    text: "Rotura de polímeros de glucosa, emisión de volátiles (tars, gases ligeros).",
    color: "#b3c6f7"
  },
  {
    name: "Carbonización de lignina",
    temp: 600,
    text: "Polímeros aromáticos se reacomodan, forman carbono amorfo poroso y cenizas inorgánicas.",
    color: "#bdbdbd"
  }
];
const TEMP_MARKS = [0, 100, 320, 400, 600];

function useScrollStage() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = window.innerHeight;
      const y = window.scrollY;
      const total = h * (STAGES.length - 1);
      const p = clamp(y / total, 0, 1);
      setProgress(p);
      setStage(Math.floor(p * STAGES.length));
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return { stage, progress };
}

function TemperatureBar({ progress }) {
  const temp = 600 * progress;
  return (
    <div style={{position:'fixed',left:0,top:0,bottom:0,width:60,display:'flex',alignItems:'center',zIndex:10}}>
      <div style={{position:'relative',height:'70vh',width:18,margin:'auto',background:'#f5f5f5',borderRadius:12,boxShadow:'2px 2px 12px #e0e0e0',overflow:'hidden'}}>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:`${clamp(progress,0,1)*100}%`,background:'linear-gradient(to top,#ff7043,#ffd740)',transition:'height 0.3s',borderRadius:12}}/>
        {TEMP_MARKS.map((t,i)=>(
          <div key={i} style={{position:'absolute',left:22,bottom:`${t/600*100}%`,fontSize:13,color:'#333',fontWeight:500}}>{t+'°C'}</div>
        ))}
      </div>
    </div>
  );
}

function BiomassSVG({ onHotspot, hovered, setHovered, setMouse, stage, progress }) {
  // Celulosa: haces paralelos, compactos, con efecto 3D
  const fibrillas = [];
  let celColor = stage<2 ? '#1976d2' : (stage===2 ? '#616161' : '#333');
  let celOpacity = stage<3 ? 1 : 0.2;
  let nFibrillas = 6, nCelRings = 10;
  for(let f=0;f<nFibrillas;f++){
    let y=340+f*28+Math.sin(f)*6;
    for(let i=0;i<nCelRings;i++){
      let x=120+i*44+(f%2)*22+Math.cos(i*0.5+f)*4;
      let fill = i%2===0 ? '#e3eafc' : '#bbdefb';
      fibrillas.push(
        <ellipse key={`cel${f}-${i}`} cx={x} cy={y} rx={20} ry={10} fill={fill} stroke={celColor} strokeWidth={3} opacity={celOpacity} filter={f%2===0?'url(#celshadow)':''}/>
      );
    }
  }
  // Hemicelulosa: cadenas ramificadas, desordenadas, curvas
  const hemi = [];
  let hemiOpacity = stage<1 ? 1 : (stage===1 ? 1-progress*2 : 0);
  for(let h=0;h<4;h++){
    let path = `M${140+h*40},${350+18*h}`;
    for(let i=1;i<8;i++){
      let x=140+h*40+i*44+Math.sin(i+h)*18, y=350+18*h+Math.sin(i*0.7+h)*28+Math.cos(i+h)*10;
      path+=` Q${x-22},${y-14} ${x},${y}`;
    }
    hemi.push(<path key={h} d={path} fill="none" stroke="#b87333" strokeWidth={3.5} opacity={hemiOpacity}/>
    );
    // Nodos
    for(let i=0;i<8;i++){
      let x=140+h*40+i*44+Math.sin(i+h)*18, y=350+18*h+Math.sin(i*0.7+h)*28+Math.cos(i+h)*10;
      hemi.push(<circle key={`hn${h}-${i}`} cx={x} cy={y} r={5} fill="#ffe0b2" stroke="#b87333" strokeWidth={1.5} opacity={hemiOpacity}/>);
    }
  }
  // Lignina: red/malla envolvente 3D
  let ligninOpacity = stage<3 ? 0.35 : (stage===3 ? 0.15 : 0.1);
  let ligninColor = stage<3 ? '#512da8' : '#333';
  const lignin = [];
  // Malla envolvente: curva cerrada + líneas cruzadas
  const points = [
    [100,320],[180,300],[260,320],[340,300],[420,320],[500,300],[580,320],
    [580,400],[500,420],[420,400],[340,420],[260,400],[180,420],[100,400]
  ];
  for(let i=0;i<points.length;i++){
    let [x1,y1]=points[i], [x2,y2]=points[(i+1)%points.length];
    lignin.push(<path key={`lignin${i}`} d={`M${x1},${y1} Q${(x1+x2)/2+Math.sin(i)*18},${(y1+y2)/2+Math.cos(i)*18} ${x2},${y2}`} stroke={ligninColor} strokeWidth={5} fill="none" opacity={ligninOpacity}/>
    );
  }
  // Líneas cruzadas 3D
  for(let i=0;i<points.length;i+=2){
    let [x1,y1]=points[i], [x2,y2]=points[(i+7)%points.length];
    lignin.push(<line key={`ligninint${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ligninColor} strokeWidth={3.5} opacity={ligninOpacity*0.7}/>
    );
  }
  // Hotspots
  return (
    <svg viewBox="0 0 700 500" style={{width:'100%',maxWidth:700,display:'block',margin:'0 auto'}} onMouseMove={e=>setMouse({x:e.clientX,y:e.clientY})}>
      <defs>
        <filter id="celshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#90caf9"/>
        </filter>
      </defs>
      {/* Celulosa */}
      <g>{fibrillas}</g>
      <rect x={120} y={320} width={480} height={180} fill="transparent" onClick={()=>onHotspot('celulosa')} onMouseEnter={e=>setHovered('celulosa')} onMouseLeave={()=>setHovered(null)} cursor="pointer" style={{pointerEvents:'all'}}/>
      {/* Lignina */}
      <g>{lignin}</g>
      <rect x={80} y={280} width={560} height={160} fill="transparent" onClick={()=>onHotspot('lignina')} onMouseEnter={e=>setHovered('lignina')} onMouseLeave={()=>setHovered(null)} cursor="pointer" style={{pointerEvents:'all'}}/>
      {/* Hemicelulosa (AL FRENTE) */}
      <g>{hemi}</g>
      <rect x={120} y={340} width={480} height={80} fill="transparent" onClick={()=>onHotspot('hemicelulosa')} onMouseEnter={e=>setHovered('hemicelulosa')} onMouseLeave={()=>setHovered(null)} cursor="pointer" style={{pointerEvents:'all'}}/>
      {/* Animaciones de transformación */}
      {/* Secado: gotas */}
      {stage===0 && [...Array(7)].map((_,i)=>(<circle key={i} cx={160+i*70} cy={300-30*Math.abs(Math.sin(progress*3+i))} r={10} fill="#81d4fa" opacity={0.7}/>))}
      {/* Descomposición hemicelulosa: burbujas */}
      {stage===1 && [...Array(7)].map((_,i)=>(<circle key={i} cx={160+i*70} cy={320-40*Math.abs(Math.sin(progress*3+i))} r={10} fill="#bdbdbd" opacity={0.7}/>))}
      {/* Devolatilización celulosa: burbujas */}
      {stage===2 && [...Array(7)].map((_,i)=>(<circle key={i} cx={160+i*70} cy={340-40*Math.abs(Math.sin(progress*3+i))} r={10} fill={i%2?"#795548":"#bdbdbd"} opacity={0.7}/>))}
      {/* Carbonización lignina: nube porosa */}
      {stage===3 && <g>
        <ellipse cx={350} cy={370} rx={180} ry={60} fill="#333" opacity={0.8}/>
        {[...Array(18)].map((_,i)=>(<circle key={i} cx={160+i*28} cy={370+Math.sin(i)*40} r={10} fill="#fafafa" opacity={0.7}/>))}
      </g>}
    </svg>
  );
}

function MicrostructureModal({ type, onClose }) {
  let svg, text;
  if(type==='celulosa'){
    svg = <svg viewBox="0 0 300 120" style={{width:260}}>
      {[...Array(2)].map((_,f)=>(
        <g key={f}>{[...Array(7)].map((_,i)=>(
          <polygon key={i} points={`${30+i*36},${40+f*32} ${48+i*36},${40+f*32} ${57+i*36},${56+f*32} ${48+i*36},${72+f*32} ${30+i*36},${72+f*32} ${21+i*36},${56+f*32}`} fill="#e3eafc" stroke="#283593" strokeWidth={2}/>
        ))}</g>
      ))}
    </svg>;
    text = <><b>Celulosa:</b> Microfibrilla compuesta por cadenas de β‑glucosa, alternancia de regiones cristalinas (ordenadas) y amorfas (desordenadas), unidas por puentes de hidrógeno.</>;
  } else if(type==='hemicelulosa'){
    svg = <svg viewBox="0 0 300 120" style={{width:260}}>
      {[...Array(2)].map((_,c)=>(
        <polyline key={c} points={[[20,30+40*c],[60,20+40*c],[100,60+40*c],[160,40+40*c],[220,80+40*c],[260,60+40*c]].map(p=>p.join(",")).join(" ")} fill="none" stroke="#b87333" strokeWidth={4} strokeLinejoin="round"/>
      ))}
      {[...Array(8)].map((_,i)=>(
        <circle key={i} cx={30+i*30} cy={40+Math.sin(i)*18} r={7} fill="#ffe0b2" stroke="#b87333" strokeWidth={2}/>
      ))}
    </svg>;
    text = <><b>Hemicelulosa:</b> Polímero ramificado de pentosas y hexosas, sin empaquetamiento compacto, completamente amorfo.</>;
  } else if(type==='lignina'){
    svg = <svg viewBox="0 0 300 120" style={{width:260}}>
      {[...Array(4)].map((_,c)=>(
        <g key={c}>{[...Array(3)].map((_,i)=>(
          <polygon key={i} points={`${60+i*48},${40+24*c} ${78+i*48},${40+24*c} ${87+i*48},${56+24*c} ${78+i*48},${72+24*c} ${60+i*48},${72+24*c} ${51+i*48},${56+24*c}`} fill="#e8eaf6" stroke="#283593" strokeWidth={2}/>
        ))}</g>
      ))}
      {[...Array(8)].map((_,i)=>(
        <line key={i} x1={60+i*24} y1={40+Math.sin(i)*30} x2={90+i*18} y2={80+Math.cos(i)*30} stroke="#283593" strokeWidth={2}/>
      ))}
    </svg>;
    text = <><b>Lignina:</b> Polímero fenilpropanoide tridimensional, enlaces aleatorios entre anillos aromáticos formando red amorfa fortemente reticulada.</>;
  }
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(30,30,40,0.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'rgba(255,255,255,0.95)',borderRadius:24,boxShadow:'0 4px 32px #bdbdbd',padding:'2em 2em 1em 2em',minWidth:320,maxWidth:340,display:'flex',flexDirection:'column',alignItems:'center'}} onClick={e=>e.stopPropagation()}>
        {svg}
        <div style={{margin:'1.2em 0 0.5em 0',fontSize:'1.1em',color:'#222',textAlign:'center',fontFamily:'sans-serif'}}>{text}</div>
        <button style={{marginTop:'0.5em',background:'#eee',border:'none',borderRadius:16,padding:'0.5em 1.2em',fontSize:'1em',cursor:'pointer',color:'#222',boxShadow:'0 2px 8px #e0e0e0'}} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [modal, setModal] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [mouse, setMouse] = useState({x:0,y:0});
  return (
    <div style={{fontFamily:'sans-serif',background:'#f7fafd'}}>
      <TemperatureBar progress={progress} />
      <div style={{maxWidth:700,margin:'0 auto',padding:'0'}}>
        <input type="range" min={0} max={3} step={0.01} value={stage+progress} onChange={e=>{
          const val = parseFloat(e.target.value);
          setStage(Math.floor(val));
          setProgress(val-Math.floor(val));
        }} style={{width:400,margin:'2em auto 1em auto',display:'block',zIndex:1002,position:'relative'}} />
        <div style={{background:'rgba(255,255,255,0.85)',borderRadius:32,boxShadow:'0 2px 16px #e0e0e0',padding:'2em',marginBottom:'2em'}}>
          <h1 style={{fontWeight:800,fontSize:'2.2em',color:'#283593',marginBottom:8}}>Biomasa molecular</h1>
          <p style={{color:'#333',fontSize:'1.15em',marginBottom:24}}>Haz clic en cada componente para explorar su microestructura real.</p>
          <BiomassSVG onHotspot={setModal} hovered={hovered} setHovered={setHovered} setMouse={setMouse} stage={stage} progress={progress} />
        </div>
      </div>
      {modal && <MicrostructureModal type={modal} onClose={()=>setModal(null)} />}
      {hovered && (
        <div style={{position:'fixed',left:mouse.x+16,top:mouse.y+8,background:'rgba(255,255,255,0.95)',color:'#222',borderRadius:'0.7em',boxShadow:'0 2px 8px #e0e0e0',padding:'0.5em 1em',fontSize:'1em',pointerEvents:'none',zIndex:1001,border:'1px solid #e0e0e0',fontWeight:600}}>
          {hovered.charAt(0).toUpperCase()+hovered.slice(1)}
        </div>
      )}
      <style>{`
        body { background: #f7fafd; }
        .stage-card h2 { letter-spacing: 0.01em; }
        .stage-card { transition: box-shadow 0.3s; }
        .stage-card:hover { box-shadow: 0 4px 32px #bdbdbd; }
      `}</style>
    </div>
  );
}
