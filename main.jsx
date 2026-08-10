import React, {useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import "./styles.css";

const DEFAULTS = {
  jacketStyle:"single", lapelType:"notch", lapelWidth:11.5, shoulder:"natural",
  pocketStyle:"pleatedPatch", vent:"double", buttonCount:2, buttonMaterial:"horn",
  buttonColor:"#4a2b16", sleeveCuff:"surgical", sleeveButtons:4,
  fabric:"#18253a", fabricName:"Navy", pattern:"herringbone", textureScale:1,
  pleats:"flat", hem:"plain", break:"slight"
};

const FABRICS = [
 ["#111216","Black"],["#18253a","Navy"],["#27334a","Slate Navy"],["#41444a","Charcoal"],
 ["#696b6d","Medium Gray"],["#9a9a96","Light Gray"],["#513c2c","Chocolate"],["#755c42","Brown"],
 ["#b49a73","Camel"],["#817e50","Olive"],["#2f4a3a","Forest"],["#6a3030","Burgundy"],
 ["#355b75","Steel Blue"],["#d0c5ae","Stone"],["#e2ddd0","Cream"]
];
const BUTTONS = [
 ["#4a2b16","Dark Brown"],["#171717","Black"],["#6f573d","Horn"],
 ["#c6c2b2","Ivory"],["#9c7a35","Gold"],["#777b7d","Gunmetal"]
];
const PATTERNS = ["solid","herringbone","birdseye","pinstripe","chalk","windowpane","glencheck","fresco","flannel"];
const patternLabel = p => ({solid:"Solid",herringbone:"Herringbone",birdseye:"Birdseye",pinstripe:"Pinstripe",chalk:"Chalk Stripe",windowpane:"Windowpane",glencheck:"Glen Check",fresco:"Fresco",flannel:"Flannel"}[p]);

function saveConfig(c){
  localStorage.setItem("atelier-config", JSON.stringify(c));
}
function loadConfig(){
  try { return {...DEFAULTS, ...JSON.parse(localStorage.getItem("atelier-config") || "{}")}; }
  catch { return {...DEFAULTS}; }
}
function shareConfig(c){
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(c))));
  history.replaceState(null,"",`${location.pathname}?design=${encodeURIComponent(encoded)}`);
}
function loadShared(){
  const p = new URLSearchParams(location.search).get("design");
  if(!p) return null;
  try { return {...DEFAULTS, ...JSON.parse(decodeURIComponent(escape(atob(p))))}; }
  catch { return null; }
}

function App(){
  const [config,setConfig] = useState(loadShared() || loadConfig());
  const [toast,setToast] = useState("");
  const update=(key,value)=>{
    setConfig(c=>{const n={...c,[key]:value}; saveConfig(n); return n;});
  };
  const reset=()=>{const n={...DEFAULTS};setConfig(n);saveConfig(n);history.replaceState(null,"",location.pathname);};
  const share=async()=>{
    shareConfig(config);
    try { await navigator.clipboard.writeText(location.href); setToast("Share link copied"); }
    catch { setToast("Share link created in the address bar"); }
    setTimeout(()=>setToast(""),1800);
  };

  const summary = useMemo(()=>`${config.fabricName} ${patternLabel(config.pattern)} · ${config.jacketStyle==="single"?"Single Breasted":"Double Breasted"} · ${config.lapelWidth.toFixed(1)} cm ${config.lapelType} lapel · ${config.pocketStyle==="pleatedPatch"?"Pleated Patch":config.pocketStyle} pockets · ${config.vent} vent · ${config.sleeveCuff==="surgical"?"Surgical cuffs":"Plain cuffs"}`,[config]);

  return <div className="app">
    <Viewer config={config}/>
    <Configurator config={config} update={update} reset={reset} share={share} summary={summary}/>
    {toast && <div className="toast">{toast}</div>}
  </div>
}

function Viewer({config}){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current, host=canvas.parentElement;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(34,1,.1,100);
    camera.position.set(0,1.15,5.8);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const controls=new OrbitControls(camera,canvas);
    controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3.7;controls.maxDistance=8;controls.target.set(0,.3,0);

    scene.background=new THREE.Color(0x111419);
    scene.add(new THREE.HemisphereLight(0xffffff,0x171717,2));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(3,5,4);key.castShadow=true;scene.add(key);
    const fill=new THREE.DirectionalLight(0xaec5ff,1.1);fill.position.set(-4,2,2);scene.add(fill);
    const rim=new THREE.DirectionalLight(0xffdfb5,1.3);rim.position.set(0,3,-5);scene.add(rim);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(4,64),new THREE.MeshStandardMaterial({color:0x111214,roughness:.9}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-1.25;floor.receiveShadow=true;scene.add(floor);

    const suit=new THREE.Group();scene.add(suit);
    let model;

    const makeMaterial=()=>{
      const m=new THREE.MeshStandardMaterial({color:config.fabric,roughness:.8,metalness:.02});
      if(config.pattern!=="solid"){
        const c=document.createElement("canvas");c.width=c.height=256;const x=c.getContext("2d");
        x.fillStyle=config.fabric;x.fillRect(0,0,256,256);x.strokeStyle="rgba(255,255,255,.11)";x.lineWidth=2;
        if(config.pattern==="pinstripe"||config.pattern==="chalk"){
          for(let i=0;i<256;i+=config.pattern==="pinstripe"?16:28){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke();}
        } else if(config.pattern==="windowpane"){
          for(let i=0;i<256;i+=48){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(256,i);x.stroke();}
        } else if(config.pattern==="birdseye"||config.pattern==="fresco"){
          for(let y=0;y<256;y+=7) for(let xx=0;xx<256;xx+=7){x.fillStyle="rgba(255,255,255,.10)";x.fillRect(xx,y,1.5,1.5);}
        } else {
          for(let i=-256;i<512;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke();}
        }
        const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/config.textureScale,1/config.textureScale);t.colorSpace=THREE.SRGBColorSpace;m.map=t;
      }
      return m;
    };
    const buttonMat=()=>new THREE.MeshStandardMaterial({color:config.buttonColor,roughness:config.buttonMaterial==="metal"?.25:.55,metalness:config.buttonMaterial==="metal"?.75:.03});
    const skin=new THREE.MeshStandardMaterial({color:0xb88d70,roughness:.75});
    const shirt=new THREE.MeshStandardMaterial({color:0xe8e6df,roughness:.7});
    const box=(w,h,d,mat,x=0,y=0,z=0,rz=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.rotation.z=rz;o.castShadow=true;o.receiveShadow=true;return o;};
    const cyl=(r,h,mat,x,y,z)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),mat);o.position.set(x,y,z);o.rotation.x=Math.PI/2;o.castShadow=true;return o;};

    function rebuild(){
      if(model)suit.remove(model);
      model=new THREE.Group();suit.add(model);
      const mat=makeMaterial(), bm=buttonMat();

      model.add(box(1.72,2.18,.66,mat,0,.05,0));
      model.add(box(1.48,.52,.7,mat,0,-.8,.01));
      const shoulderScale=config.shoulder==="structured"?1.1:config.shoulder==="roped"?1.13:config.shoulder==="soft"?.96:1;
      model.add(box(2*shoulderScale,.25,.7,mat,0,.91,0));
      model.add(cyl(.23,.26,skin,0,1.34,0));
      const head=new THREE.Mesh(new THREE.SphereGeometry(.34,32,24),skin);head.position.y=1.9;head.scale.set(1,.98,.95);head.castShadow=true;model.add(head);
      model.add(box(.42,.92,.71,shirt,0,.72,.03));
      model.add(box(.61,1.85,.58,mat,-.38,-2.35,0));model.add(box(.61,1.85,.58,mat,.38,-2.35,0));model.add(box(1.42,.6,.64,mat,0,-1.32,0));

      const lapelW=.19*config.lapelWidth;
      [-1,1].forEach(side=>{
        const sh=new THREE.Shape();const pts=config.lapelType==="peak"?[[0,0],[lapelW,.45],[lapelW*.55,.82],[lapelW*.2,1.05],[0,1]]:[[0,0],[lapelW,.38],[lapelW*.6,.72],[lapelW*.18,1.03],[0,1]];
        sh.moveTo(0,0);pts.slice(1).forEach(p=>sh.lineTo(p[0]*side,p[1]));sh.lineTo(0,0);
        const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelSize:.01}),mat);mesh.position.set(0,.92,.54);mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;model.add(mesh);
      });

      const count=config.jacketStyle==="double"?4:Number(config.buttonCount);
      for(let i=0;i<count;i++){const x=config.jacketStyle==="double"?(i%2?.28:-.28):0;const y=config.jacketStyle==="double"? .68-Math.floor(i/2)*.34:.63-i*.34;model.add(cyl(.085,.055,bm,x,y,.37));}
      [-1,1].forEach(side=>{
        model.add(box(.52,1.72,.62,mat,side*1.02,.05,.01,side*.035));
        model.add(box(.54,config.sleeveCuff==="surgical"?.22:.14,.64,mat,side*1.02,-.75,.01,side*.035));
        if(config.sleeveCuff==="surgical") for(let i=0;i<config.sleeveButtons;i++) model.add(cyl(.045,.05,bm,side*(.85+i*.055),-.73,.35));
      });

      [-1,1].forEach(side=>{
        const x=side*.72;
        if(["patch","pleatedPatch","patchFlap"].includes(config.pocketStyle)){
          model.add(box(.5,.3,.035,mat,x,-.03,.37,config.pocketStyle==="pleatedPatch"?side*.04:0));
          if(config.pocketStyle==="pleatedPatch") model.add(box(.06,.3,.04,mat,x,-.03,.395));
        } else model.add(box(.55,.09,.04,mat,x,-.03,.39,config.pocketStyle==="slant"?side*.12:0));
      });
      if(config.vent!=="none"){const xs=config.vent==="double"?[-.32,.32]:[0];xs.forEach(x=>model.add(box(.025,.72,.035,mat,x,-.22,-.36)));}

      if(config.pleats!=="flat") [-1,1].forEach(side=>{const n=config.pleats==="double"?2:1;for(let i=0;i<n;i++)model.add(box(.018,.55,.04,mat,side*(.23+i*.09),-1.45,.33));});
      if(config.hem==="cuffed"){model.add(box(.65,.16,.61,mat,-.38,-3.25,0));model.add(box(.65,.16,.61,mat,.38,-3.25,0));}
    }
    rebuild();

    const resize=()=>{const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};
    resize();window.addEventListener("resize",resize);
    let frame;
    const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);};
    animate();
    return()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",resize);controls.dispose();renderer.dispose();};
  },[config]);

  return <section className="viewer">
    <div className="brand">ATELIER <span>CUSTOM TAILORING</span></div>
    <div className="viewer-label">3D PREVIEW</div>
    <canvas ref={ref}/>
    <div className="viewer-help">Drag to rotate · Scroll to zoom</div>
  </section>
}

function Group({title,children}){return <section className="group"><div className="group-title">{title}</div>{children}</section>}
function Select({label,value,onChange,children}){return <label className="select-field"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{children}</select></label>}
function Chips({items,value,onChange}){return <div className="chips">{items.map(([v,l])=><button key={v} className={value===v?"active":""} onClick={()=>onChange(v)}>{l}</button>)}</div>}
function Swatches({items,value,onChange}){return <div className="swatches">{items.map(([v,l])=><button key={v} className={value===v?"active":""} title={l} style={{background:v}} onClick={()=>onChange(v)}><span>{l}</span></button>)}</div>}

function Configurator({config,update,reset,share,summary}){
  return <aside className="panel">
    <header className="panel-header"><div className="eyebrow">BESPOKE CONFIGURATION</div><h1>Custom Suit</h1><p>Configure every visible detail and preview the result in 3D.</p></header>
    <nav className="tabs"><span className="active">Jacket</span><span>Trousers</span><span>Fabric</span><span>Details</span><span>Interior</span></nav>
    <div className="scroll">
      <Group title="Construction">
        <Select label="Style" value={config.jacketStyle} onChange={v=>update("jacketStyle",v)}><option value="single">Single Breasted</option><option value="double">Double Breasted</option></Select>
        <Select label="Front buttons" value={config.buttonCount} onChange={v=>update("buttonCount",Number(v))}><option value="1">1 Button</option><option value="2">2 Buttons</option><option value="3">3 Buttons</option></Select>
      </Group>
      <Group title="Lapels">
        <Chips value={config.lapelType} onChange={v=>update("lapelType",v)} items={[["notch","Notch"],["peak","Peak"],["shawl","Shawl"]]}/>
        <div className="range-row"><span>Lapel width</span><strong>{config.lapelWidth.toFixed(1)} cm</strong></div>
        <input type="range" min="5" max="15" step=".5" value={config.lapelWidth} onChange={e=>update("lapelWidth",Number(e.target.value))}/>
        <div className="range-ends"><span>5.0 cm</span><span>15.0 cm</span></div>
      </Group>
      <Group title="Shoulders & Pockets">
        <Chips value={config.shoulder} onChange={v=>update("shoulder",v)} items={[["soft","Soft"],["natural","Natural"],["structured","Structured"],["roped","Roped"]]}/>
        <Select label="Pocket style" value={config.pocketStyle} onChange={v=>update("pocketStyle",v)}><option value="flap">Straight Flap</option><option value="slant">Slanted Flap</option><option value="jetted">Jetted</option><option value="patch">Patch</option><option value="pleatedPatch">Pleated Patch</option><option value="patchFlap">Patch + Flap</option></Select>
        <Select label="Vent" value={config.vent} onChange={v=>update("vent",v)}><option value="none">No Vent</option><option value="single">Single Vent</option><option value="double">Double Vent</option></Select>
      </Group>
      <Group title="Sleeves & Buttons">
        <Chips value={config.sleeveCuff} onChange={v=>update("sleeveCuff",v)} items={[["plain","Plain"],["surgical","Surgical / Working"]]}/>
        <div className="range-row"><span>Sleeve buttons</span><strong>{config.sleeveButtons}</strong></div>
        <input type="range" min="2" max="5" step="1" value={config.sleeveButtons} onChange={e=>update("sleeveButtons",Number(e.target.value))}/>
        <Select label="Button material" value={config.buttonMaterial} onChange={v=>update("buttonMaterial",v)}><option value="horn">Horn</option><option value="corozo">Corozo</option><option value="mop">Mother of Pearl</option><option value="metal">Metal</option></Select>
        <Swatches items={BUTTONS} value={config.buttonColor} onChange={v=>update("buttonColor",v)}/>
      </Group>
      <Group title="Fabric">
        <Swatches items={FABRICS} value={config.fabric} onChange={v=>{const n=FABRICS.find(x=>x[0]===v);update("fabric",v);update("fabricName",n?.[1]||"Custom")}}/>
        <div className="pattern-list">{PATTERNS.map(p=><button key={p} className={config.pattern===p?"active":""} onClick={()=>update("pattern",p)}>{patternLabel(p)}</button>)}</div>
        <div className="range-row"><span>Texture scale</span><strong>{Number(config.textureScale).toFixed(1)}×</strong></div>
        <input type="range" min=".5" max="2.5" step=".1" value={config.textureScale} onChange={e=>update("textureScale",Number(e.target.value))}/>
      </Group>
      <Group title="Trousers">
        <Chips value={config.pleats} onChange={v=>update("pleats",v)} items={[["flat","Flat Front"],["single","Single Pleat"],["double","Double Pleat"]]}/>
        <Chips value={config.hem} onChange={v=>update("hem",v)} items={[["plain","Plain Hem"],["cuffed","Cuffed"]]}/>
        <Chips value={config.break} onChange={v=>update("break",v)} items={[["none","No Break"],["slight","Slight"],["medium","Medium"],["full","Full"]]}/>
      </Group>
    </div>
    <footer className="summary">
      <div><small>YOUR DESIGN</small><p>{summary}</p></div>
      <div className="actions"><button onClick={reset}>Reset</button><button className="gold" onClick={share}>Share Design</button></div>
    </footer>
  </aside>
}

createRoot(document.getElementById("root")).render(<App/>);
