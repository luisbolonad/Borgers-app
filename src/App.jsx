import { useState, useRef, useEffect, useCallback } from "react";
// ── Supabase config ──────────────────────────────────────────────────────────
const SUPA_URL = "https://paqgselmbbtndgmbtbym.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcWdzZWxtYmJ0bmRnbWJ0YnltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjMxODEsImV4cCI6MjA5MDk5OTE4MX0.l_T4xe-Q85kIWblq9OM3mudQftyaD3tzONFZ35q34Zs";
async function supa(table, method="GET", body=null, query="") {
const url = SUPA_URL + "/rest/v1/" + table + query;
const res = await fetch(url, {
method,
headers: {
"apikey": SUPA_KEY,
"Authorization": "Bearer " + SUPA_KEY,
"Content-Type": "application/json",
"Prefer": method==="POST"?"return=representation":"",
},
body: body ? JSON.stringify(body) : null,
});
if(!res.ok) { const e=await res.text(); throw new Error(e); }
const text = await res.text();
return text ? JSON.parse(text) : [];
}
// Helpers
const supaGet = (table, query="") => supa(table, "GET", null, query);
const supaPost = (table, body) => supa(table, "POST", body);
const supaPatch = (table, query, body) => supa(table, "PATCH", body, query);
const supaDelete = (table, query) => supa(table, "DELETE", null, query);
async function supaUpsert(table, body){
  const url = SUPA_URL + "/rest/v1/" + table;
  const res = await fetch(url, {
    method:"POST",
    headers:{"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY,"Content-Type":"application/json",
              "Prefer":"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify(body),
  });
  const text=await res.text();
  return text?JSON.parse(text):[];
}
const BG="#0F0E0C",SRF="#1A1916",CRD="#222018",BRD="#2E2C26";
const ACC="#F5A623",RED="#E84040",GRN="#3ECF8E",BLU="#4A9EFF";
const PRP="#9B72FF",TXT="#F0EDE6",MUT="#8A8578",FNT="#3A3830";
const b1=(c)=>"1px solid "+c;
const iSUCS=["Sucursal Norte","Sucursal Sur","Sucursal Centro"];
const iCATS=["Carnes","Vegetales","Lácteos","Panadería","Salsas","Bebidas","Congelados","Secos","Insumos"];
const iCATV=["Hamburguesas","Papas / Snacks","Bebidas","Postres"];
const iCATS2=["Carnes","Salsas","Panadería","Vegetales","Bebidas","Insumos"];
const iPROVS=[
{id:1,nombre:"Centro de Producción",tipo:"produccion",contacto:"",notas:""},
{id:2,nombre:"Coca-Cola",tipo:"externo",contacto:"",notas:""},
{id:3,nombre:"Tipti",tipo:"externo",contacto:"",notas:""},
{id:4,nombre:"La Masa",tipo:"externo",contacto:"",notas:""},
];
// Ítems base por sucursal: {sucursal, items:[{id,nombre,categoria,unidad}]}
const iINVS=[
{sucursal:"Sucursal Norte",items:[
{id:1,nombre:"Bolita de carne 120g",categoria:"Carnes",unidad:"und",stockMin:300,proveedorId:1},
{id:2,nombre:"Pan de hamburguesa",categoria:"Panadería",unidad:"und",stockMin:120,proveedorId:4},
{id:3,nombre:"Salsa Borgers 1L",categoria:"Salsas",unidad:"litro",stockMin:3,proveedorId:1},
{id:4,nombre:"Coca-Cola 330ml",categoria:"Bebidas",unidad:"lata",stockMin:24,proveedorId:2},
]},
{sucursal:"Sucursal Sur",items:[
{id:1,nombre:"Bolita de carne 120g",categoria:"Carnes",unidad:"und",stockMin:300,proveedorId:1},
{id:2,nombre:"Pan de hamburguesa",categoria:"Panadería",unidad:"und",stockMin:120,proveedorId:4},
{id:3,nombre:"Salsa Borgers 1L",categoria:"Salsas",unidad:"litro",stockMin:3,proveedorId:1},
{id:4,nombre:"Coca-Cola 330ml",categoria:"Bebidas",unidad:"lata",stockMin:24,proveedorId:2},
]},
{sucursal:"Sucursal Centro",items:[
{id:1,nombre:"Bolita de carne 120g",categoria:"Carnes",unidad:"und",stockMin:300,proveedorId:1},
{id:2,nombre:"Pan de hamburguesa",categoria:"Panadería",unidad:"und",stockMin:120,proveedorId:4},
{id:3,nombre:"Salsa Borgers 1L",categoria:"Salsas",unidad:"litro",stockMin:3,proveedorId:1},
{id:4,nombre:"Coca-Cola 330ml",categoria:"Bebidas",unidad:"lata",stockMin:24,proveedorId:2},
]},
];
// Registros diarios de inventario por sucursal
// [{id, sucursal, fecha, filas:[{itemId, invInicial, ingreso, stockReal, obs}]}]
const iREGS=[];
// Usuarios iniciales
const iUSERS=[
{id:1,nombre:"Luis",email:"luis@borgers.com",password:"admin123",rol:"superadmin",sucursal:null,activo:true},
{id:2,nombre:"Admin Norte",email:"norte@borgers.com",password:"norte123",rol:"admin_suc",sucursal:"Sucursal Norte",activo:true},
{id:3,nombre:"Staff Norte",email:"staffnorte@borgers.com",password:"staff123",rol:"staff_suc",sucursal:"Sucursal Norte",activo:true},
{id:4,nombre:"Producción",email:"prod@borgers.com",password:"prod123",rol:"produccion",sucursal:null,activo:true},
];
// Helper de permisos
function puedePor(user,accion){
if(!user)return false;
const r=user.rol;
const p={
// Módulos visibles
ver_inv:        ["superadmin","produccion"],
ver_prod:       ["superadmin","produccion"],
ver_recetas:    ["superadmin","admin_suc","produccion"],
ver_req:        ["superadmin","admin_suc","produccion"],
ver_comp:       ["superadmin","produccion"],
ver_invsuc:     ["superadmin","admin_suc","staff_suc"],
ver_cos:        ["superadmin","admin_suc","staff_suc"],
ver_caja:       ["superadmin","admin_suc","staff_suc"],
ver_hist:       ["superadmin","admin_suc","produccion"],
ver_config:     ["superadmin"],
ver_manual:     ["superadmin","admin_suc","staff_suc","produccion"],
// Acciones
editar_recetas: ["superadmin"],
despacho:       ["superadmin","produccion"],
cerrar_dia:     ["superadmin","admin_suc","staff_suc"],
nuevo_inv:      ["superadmin","admin_suc","staff_suc"],
config_total:   ["superadmin"],
crear_req:      ["superadmin","admin_suc"],
registrar_venta:["superadmin","admin_suc","staff_suc"],
};
return (p[accion]||[]).includes(r);
}
const iINV=[
{id:1,nombre:"Carne de res 80/20",categoria:"Carnes",unidad:"kg",stock:45,stockMin:20,costo:8500,proveedor:"Carnes Premium SA"},
{id:2,nombre:"Pan de hamburguesa",categoria:"Panadería",unidad:"und",stock:120,stockMin:60,costo:350,proveedor:"Panadería Central"},
{id:3,nombre:"Queso cheddar",categoria:"Lácteos",unidad:"kg",stock:12,stockMin:8,costo:9200,proveedor:"Lácteos del Sur"},
{id:4,nombre:"Lechuga",categoria:"Vegetales",unidad:"kg",stock:8,stockMin:5,costo:1200,proveedor:"Verduras Frescas"},
{id:5,nombre:"Tomate",categoria:"Vegetales",unidad:"kg",stock:10,stockMin:6,costo:950,proveedor:"Verduras Frescas"},
{id:6,nombre:"Cebolla morada",categoria:"Vegetales",unidad:"kg",stock:7,stockMin:4,costo:780,proveedor:"Verduras Frescas"},
{id:7,nombre:"Papas congeladas",categoria:"Congelados",unidad:"kg",stock:80,stockMin:40,costo:2100,proveedor:"FoodService"},
{id:8,nombre:"Coca-Cola 330ml",categoria:"Bebidas",unidad:"lata",stock:200,stockMin:80,costo:680,proveedor:"Distribuidora Bebidas"},
{id:9,nombre:"Aceite vegetal",categoria:"Secos",unidad:"litro",stock:25,stockMin:10,costo:1800,proveedor:"FoodService"},
{id:10,nombre:"Tocino",categoria:"Carnes",unidad:"kg",stock:9,stockMin:5,costo:12000,proveedor:"Carnes Premium SA"},
{id:11,nombre:"Huevos",categoria:"Lácteos",unidad:"und",stock:60,stockMin:30,costo:200,proveedor:"Avícola Norte"},
{id:12,nombre:"Mayonesa industrial",categoria:"Salsas",unidad:"kg",stock:5,stockMin:3,costo:3200,proveedor:"FoodService"},
{id:13,nombre:"Mostaza amarilla",categoria:"Salsas",unidad:"kg",stock:4,stockMin:2,costo:2800,proveedor:"FoodService"},
];
const iRP=[
{id:1,nombre:"Bolita de carne 120g",unidad:"und",rendimiento:10,ings:[{invId:1,cantidad:1.3,unidad:"kg"}]},
{id:2,nombre:"Salsa Borgers 1L",unidad:"litro",rendimiento:1,ings:[{invId:6,cantidad:0.15,unidad:"kg"},{invId:4,cantidad:0.08,unidad:"kg"},{invId:12,cantidad:0.1,unidad:"kg"}]},
{id:3,nombre:"Mix papas sazonadas",unidad:"kg",rendimiento:1,ings:[{invId:7,cantidad:1.1,unidad:"kg"},{invId:9,cantidad:0.05,unidad:"litro"}]},
];
const iSP=[{recetaId:1,stock:20},{recetaId:2,stock:5},{recetaId:3,stock:8}];
const iRV=[
{id:1,nombre:"Borger Clásico",categoria:"Hamburguesas",precio:9900,ings:[{tipo:"prod",refId:1,cantidad:1,unidad:"und",sucItemNombre:"Bolita de carne 120g"},{tipo:"inv",refId:2,cantidad:1,unidad:"und",sucItemNombre:"Pan de hamburguesa"},{tipo:"inv",refId:3,cantidad:0.04,unidad:"kg"},{tipo:"inv",refId:4,cantidad:0.03,unidad:"kg"},{tipo:"inv",refId:5,cantidad:0.04,unidad:"kg"},{tipo:"prod",refId:2,cantidad:0.03,unidad:"litro",sucItemNombre:"Salsa Borgers 1L"}]},
{id:2,nombre:"Borger Doble",categoria:"Hamburguesas",precio:13900,ings:[{tipo:"prod",refId:1,cantidad:2,unidad:"und",sucItemNombre:"Bolita de carne 120g"},{tipo:"inv",refId:2,cantidad:1,unidad:"und",sucItemNombre:"Pan de hamburguesa"},{tipo:"inv",refId:3,cantidad:0.06,unidad:"kg"},{tipo:"inv",refId:5,cantidad:0.04,unidad:"kg"},{tipo:"prod",refId:2,cantidad:0.04,unidad:"litro",sucItemNombre:"Salsa Borgers 1L"}]},
{id:3,nombre:"Papas Borgers",categoria:"Papas / Snacks",precio:3500,ings:[{tipo:"prod",refId:3,cantidad:0.2,unidad:"kg"}]},
];
// Requerimientos ahora son por sucursal individual
const iRQ=[
{id:1,sucursal:"Sucursal Norte",fecha:"2025-03-25",semana:"2025-W13",estado:"enviado",items:[{prodId:1,cantidad:40},{prodId:2,cantidad:3}],despacho:[]},
{id:2,sucursal:"Sucursal Sur",fecha:"2025-03-25",semana:"2025-W13",estado:"enviado",items:[{prodId:1,cantidad:30},{prodId:3,cantidad:20}],despacho:[]},
{id:3,sucursal:"Sucursal Centro",fecha:"2025-03-25",semana:"2025-W13",estado:"enviado",items:[{prodId:1,cantidad:25},{prodId:2,cantidad:2}],despacho:[]},
];
const fmt=n=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const fmtN=n=>new Intl.NumberFormat("es-CL",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const fmtC=n=>(parseFloat(n)||0).toFixed(2);
const today=()=>new Date().toISOString().split("T")[0];
const getWeek=()=>{const d=new Date(),j=new Date(d.getFullYear(),0,4),w=Math.ceil(((d-j)/86400000+j.getDay()+1)/7);return d.getFullYear()+"-W"+String(w).padStart(2,"0");};
const globalCss="@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');"
+"*{box-sizing:border-box;margin:0;padding:0}"
+"body{background:"+BG+";color:"+TXT+";font-family:'DM Sans',sans-serif}"
+"::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:"+SRF+"}::-webkit-scrollbar-thumb{background:"+FNT+";border-radius:2px}"
+"input,select{background:"+BG+";color:"+TXT+";border:1px solid "+BRD+";border-radius:6px;padding:8px 12px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none}"
+"input:focus,select:focus{border-color:"+ACC+"}"
+"input:disabled,select:disabled{opacity:0.75;-webkit-text-fill-color:"+TXT+";cursor:default}"
+"input:disabled::-webkit-datetime-edit,input:disabled::-webkit-datetime-edit-fields-wrapper,input:disabled::-webkit-datetime-edit-text,input:disabled::-webkit-datetime-edit-month-field,input:disabled::-webkit-datetime-edit-day-field,input:disabled::-webkit-datetime-edit-year-field,input:disabled::-webkit-datetime-edit-hour-field,input:disabled::-webkit-datetime-edit-minute-field,input:disabled::-webkit-datetime-edit-second-field,input:disabled::-webkit-datetime-edit-ampm-field{-webkit-text-fill-color:"+TXT+"!important}"
+"input::placeholder{opacity:0.35}"
+"button{cursor:pointer;font-family:'DM Sans',sans-serif;border:none}"
+"table{border-collapse:collapse;width:100%}"
+"th{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:"+MUT+";padding:8px 12px;text-align:left;border-bottom:1px solid "+BRD+"}"
+"td{padding:10px 12px;font-size:13px;border-bottom:1px solid "+FNT+"}"
+"tr:hover td{background:"+SRF+"}"
+".tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}";
// ── SheetJS loader ──────────────────────────────────────────────────────────
function useSheetJS(){
const [ready,setReady]=useState(!!window.XLSX);
useEffect(()=>{
if(window.XLSX){setReady(true);return;}
const s=document.createElement("script");
s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
s.onload=()=>setReady(true);
document.head.appendChild(s);
},[]);
return ready;
}
function readXLSX(file){
return new Promise((res,rej)=>{
const r=new FileReader();
r.onload=ev=>{
try{
const wb=window.XLSX.read(ev.target.result,{type:"array"});
const ws=wb.Sheets[wb.SheetNames[0]];
const data=window.XLSX.utils.sheet_to_json(ws,{defval:""});
res(data);
}catch(e){rej(e);}
};
r.onerror=rej;
r.readAsArrayBuffer(file);
});
}
// ── Componentes base ────────────────────────────────────────────────────────
function Bdg({c,children}){
const m={green:[GRN+"22",GRN],red:[RED+"22",RED],orange:[ACC+"22",ACC],blue:[BLU+"22",BLU],purple:[PRP+"22",PRP],muted:[FNT,MUT]};
const[bg,fg]=m[c]||m.muted;
return <span className="tag" style={{background:bg,color:fg}}>{children}</span>;
}
function Btn({children,onClick,v="primary",s="md",disabled,xtra={}}){
const vs={primary:{background:ACC,color:"#000",fontWeight:600},ghost:{background:"transparent",color:TXT,border:b1(BRD)},success:{background:GRN+"22",color:GRN,border:b1(GRN+"44")}};
const sz={sm:{padding:"5px 12px",fontSize:12},md:{padding:"8px 16px",fontSize:13}};
return <button onClick={onClick} disabled={disabled} style={{borderRadius:8,opacity:disabled?0.5:1,...vs[v],...sz[s],...xtra}}>{children}</button>;
}
function Card({children,xtra={}}){return <div style={{background:CRD,border:b1(BRD),borderRadius:12,padding:20,...xtra}}>{children}</div>;}
function LI({label,children}){return <div><label style={{fontSize:11,color:MUT,display:"block",marginBottom:5}}>{label}</label>{children}</div>;}
function SC({label,value,sub,color=ACC,icon}){
return <Card><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontSize:11,color:MUT,fontWeight:600,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{label}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:color,letterSpacing:1}}>{value}</div>{sub&&<div style={{fontSize:12,color:MUT,marginTop:4}}>{sub}</div>}</div>{icon&&<span style={{fontSize:28,opacity:0.5}}>{icon}</span>}</div></Card>;
}
function Mdl({title,onClose,children,wide}){
return <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div style={{background:CRD,border:b1(BRD),borderRadius:16,width:"100%",maxWidth:wide?900:520,maxHeight:"90vh",overflow:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:b1(BRD)}}>
<span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>{title}</span>
<button onClick={onClose} style={{background:FNT,color:MUT,border:"none",borderRadius:6,padding:"4px 10px"}}>X</button>
</div>
<div style={{padding:24}}>{children}</div>
</div>
  </div>;
}
function Confirmar({mensaje,onSi,onNo}){
return <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div style={{background:CRD,border:b1(BRD),borderRadius:16,width:"100%",maxWidth:380,padding:28,textAlign:"center"}}>
<div style={{fontSize:28,marginBottom:12}}>🗑</div>
<div style={{fontWeight:600,fontSize:15,marginBottom:8}}>Confirmar eliminación</div>
<div style={{fontSize:13,color:MUT,marginBottom:24}}>{mensaje}</div>
<div style={{display:"flex",gap:10,justifyContent:"center"}}>
<Btn v="ghost" onClick={onNo}>Cancelar</Btn>
<Btn v="danger" xtra={{background:RED,color:"#fff",fontWeight:600}} onClick={onSi}>Sí, eliminar</Btn>
</div>
</div>
  </div>;
}
// ── Buscador predictivo de ítems ────────────────────────────────────────────
function BuscadorItem({opciones, valorId, onChange, placeholder="Buscar..."}){
const opcsOrdenadas=[...opciones].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));
const seleccionado=opcsOrdenadas.find(o=>o.id===valorId);
const[query,setQuery]=useState(seleccionado?.nombre||"");
const[abierto,setAbierto]=useState(false);
const[highlightIdx,setHighlightIdx]=useState(0);
const ref=useRef();
const filtrados=opcsOrdenadas.filter(o=>o.nombre.toLowerCase().includes(query.toLowerCase()));
useEffect(()=>{
// Si cambia valorId externamente, actualizar texto
const sel=opcsOrdenadas.find(o=>o.id===valorId);
if(sel&&sel.nombre!==query&&!abierto)setQuery(sel.nombre);
},[valorId]);
useEffect(()=>{setHighlightIdx(0);},[query]);
function seleccionar(opc){
setQuery(opc.nombre);
setAbierto(false);
onChange(opc.id);
}
function onKey(e){
if(!abierto){setAbierto(true);return;}
if(e.key==="ArrowDown"){e.preventDefault();setHighlightIdx(i=>Math.min(i+1,filtrados.length-1));}
else if(e.key==="ArrowUp"){e.preventDefault();setHighlightIdx(i=>Math.max(i-1,0));}
else if(e.key==="Enter"){e.preventDefault();if(filtrados[highlightIdx])seleccionar(filtrados[highlightIdx]);}
else if(e.key==="Escape"){setAbierto(false);const sel=opcsOrdenadas.find(o=>o.id===valorId);if(sel)setQuery(sel.nombre);}
}
return(
<div ref={ref} style={{position:"relative",flex:1}}>
<input
value={query}
onChange={e=>{setQuery(e.target.value);setAbierto(true);}}
onFocus={()=>setAbierto(true)}
onBlur={()=>setTimeout(()=>setAbierto(false),150)}
onKeyDown={onKey}
placeholder={placeholder}
style={{width:"100%"}}
autoComplete="off"
/>
{abierto&&filtrados.length>0&&(
<div style={{position:"absolute",top:"100%",left:0,right:0,background:CRD,border:b1(BRD),borderRadius:8,zIndex:500,maxHeight:200,overflowY:"auto",marginTop:2,boxShadow:"0 8px 24px #00000066"}}>
{filtrados.map((o,i)=>(
<div key={o.id}
onMouseDown={()=>seleccionar(o)}
style={{padding:"8px 12px",fontSize:13,cursor:"pointer",background:i===highlightIdx?ACC+"22":"transparent",color:i===highlightIdx?ACC:TXT,borderBottom:i<filtrados.length-1?b1(FNT):"none"}}>
{o.nombre}
{o.unidad&&<span style={{fontSize:11,color:MUT,marginLeft:6}}>{o.unidad}</span>}
</div>
))}
</div>
)}
{abierto&&filtrados.length===0&&query&&(
<div style={{position:"absolute",top:"100%",left:0,right:0,background:CRD,border:b1(BRD),borderRadius:8,zIndex:500,padding:"10px 12px",fontSize:13,color:MUT,marginTop:2}}>
Sin resultados para "{query}"
</div>
)}
</div>
);
}
// ── Buscador predictivo por texto (para sucItemNombre) ─────────────────────
function BuscadorTexto({opciones,valor,onChange,placeholder="Buscar..."}){
const opts=[...opciones].sort((a,b)=>a.localeCompare(b,"es"));
const[query,setQuery]=useState(valor||"");
const[abierto,setAbierto]=useState(false);
const[hi,setHi]=useState(0);
useEffect(()=>{if(!abierto)setQuery(valor||"");},[valor]);
useEffect(()=>{setHi(0);},[query]);
const filtrados=opts.filter(o=>o.toLowerCase().includes(query.toLowerCase()));
function seleccionar(v){setQuery(v);setAbierto(false);onChange(v);}
function onKey(e){
if(!abierto){setAbierto(true);return;}
if(e.key==="ArrowDown"){e.preventDefault();setHi(i=>Math.min(i+1,filtrados.length-1));}
else if(e.key==="ArrowUp"){e.preventDefault();setHi(i=>Math.max(i-1,0));}
else if(e.key==="Enter"){e.preventDefault();if(filtrados[hi])seleccionar(filtrados[hi]);}
else if(e.key==="Escape"){setAbierto(false);setQuery(valor||"");}
}
return <div style={{position:"relative",flex:1}}>
<input value={query}
onChange={e=>{setQuery(e.target.value);setAbierto(true);onChange(e.target.value);}}
onFocus={()=>setAbierto(true)}
onBlur={()=>setTimeout(()=>setAbierto(false),150)}
onKeyDown={onKey}
placeholder={placeholder}
style={{width:"100%"}}
autoComplete="off"
/>
{abierto&&filtrados.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:CRD,border:b1(BRD),borderRadius:8,zIndex:500,maxHeight:180,overflowY:"auto",marginTop:2,boxShadow:"0 8px 24px #00000066"}}>
{filtrados.map((o,i)=><div key={i} onMouseDown={()=>seleccionar(o)}
style={{padding:"8px 12px",fontSize:13,cursor:"pointer",background:i===hi?ACC+"22":"transparent",color:i===hi?ACC:TXT,borderBottom:i<filtrados.length-1?b1(FNT):"none"}}>
{o}
</div>)}
</div>}
{abierto&&filtrados.length===0&&query&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:CRD,border:b1(BRD),borderRadius:8,zIndex:500,padding:"10px 12px",fontSize:13,color:MUT,marginTop:2}}>
Sin resultados
</div>}
  </div>;
}
// ── Login ───────────────────────────────────────────────────────────────────
function Login({users,onLogin}){
const[email,setEmail]=useState("");
const[pass,setPass]=useState("");
const[error,setError]=useState("");
function intentarLogin(){
const u=users.find(u=>u.email.toLowerCase()===email.toLowerCase()&&u.password===pass&&u.activo);
if(u){onLogin(u);setError("");}
else setError("Email o contraseña incorrectos");
}
return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div style={{width:"100%",maxWidth:400}}>
<div style={{textAlign:"center",marginBottom:40}}>
<div style={{fontFamily:"'Bebas Neue'",fontSize:64,color:ACC,letterSpacing:4,lineHeight:1}}>BORGERS</div>
<div style={{fontSize:13,color:MUT,letterSpacing:".1em",marginTop:4}}>SISTEMA DE GESTIÓN</div>
</div>
<Card>
<div style={{marginBottom:20}}>
<div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:TXT,letterSpacing:2,marginBottom:4}}>INICIAR SESIÓN</div>
<div style={{fontSize:12,color:MUT}}>Ingresa tus credenciales para continuar</div>
</div>
<div style={{display:"grid",gap:14,marginBottom:20}}>
<LI label="Email">
<input type="email" value={email} onChange={e=>setEmail(e.target.value)}
onKeyDown={e=>e.key==="Enter"&&intentarLogin()}
style={{width:"100%"}} placeholder="tu@email.com" autoComplete="email"/>
</LI>
<LI label="Contraseña">
<input type="password" value={pass} onChange={e=>setPass(e.target.value)}
onKeyDown={e=>e.key==="Enter"&&intentarLogin()}
style={{width:"100%"}} placeholder="••••••••" autoComplete="current-password"/>
</LI>
</div>
{error&&<div style={{background:RED+"18",color:RED,borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16,border:b1(RED+"44")}}>{error}</div>}
<Btn onClick={intentarLogin} xtra={{width:"100%",textAlign:"center",padding:"12px"}}>Ingresar</Btn>
</Card>
</div>
  </div>;
}
// ── App Root ────────────────────────────────────────────────────────────────
export default function App(){
const xlsxReady=useSheetJS();
const[tab,setTab]=useState("inicio");
const[cargando,setCargando]=useState(true);
const[inv,setInv]=useState(iINV);
const[sp,setSp]=useState(iSP);
const[rp,setRp]=useState(iRP);
const[rv,setRv]=useState(iRV);
const[reqs,setReqs]=useState(iRQ);
const[hI,setHI]=useState([]);
const[hC,setHC]=useState([]);
const[sucs,setSucs]=useState(iSUCS);
const[cats,setCats]=useState(iCATS);
const[catV,setCatV]=useState(iCATV);
const[cats2,setCats2]=useState(iCATS2);
const[invSucs,setInvSucs]=useState(iINVS);
const[regsSucs,setRegsSucs]=useState(iREGS);
const[provs,setProvs]=useState(iPROVS);
const[marcas,setMarcas]=useState([]);
const[sucsMarcas,setSucsMarcas]=useState({});
const[cierresCaja,setCierresCaja]=useState([]);
// SQL para Manual de Procedimientos (ejecutar en Supabase):
// CREATE TABLE IF NOT EXISTS manual_temas (id bigserial PRIMARY KEY, titulo text NOT NULL, descripcion text DEFAULT '', icono text DEFAULT '📄', color text DEFAULT '#F5A623', orden int DEFAULT 0, roles_acceso text[] DEFAULT ARRAY['superadmin','admin_suc','staff_suc','produccion'], created_at timestamptz DEFAULT now());
// CREATE TABLE IF NOT EXISTS manual_articulos (id bigserial PRIMARY KEY, tema_id bigint REFERENCES manual_temas(id) ON DELETE CASCADE, titulo text NOT NULL, contenido jsonb DEFAULT '[]', orden int DEFAULT 0, created_at timestamptz DEFAULT now());
const[manualTemas,setManualTemas]=useState([]);
const[manualArticulos,setManualArticulos]=useState([]);
const[ventas,setVentas]=useState([]);
const[users,setUsers]=useState(iUSERS);
const[userActivo,setUserActivo]=useState(null);
// Cargar datos desde Supabase al iniciar
useEffect(()=>{
async function cargarDatos(){
try{
const[
dbUsers,dbSucs,dbCatsInv,dbCatsVenta,dbCatsInvSuc,
dbProvs,dbInv,dbRp,dbRv,dbReqs,
dbInvSucs,dbRegs,dbVentas,dbMarcas,dbCierres,
dbManualTemas,dbManualArticulos
]=await Promise.all([
supaGet("users","?select=*&order=created_at"),
supaGet("sucursales","?select=*&order=nombre"),
supaGet("categorias_inv","?select=*"),
supaGet("categorias_venta","?select=*"),
supaGet("categorias_inv_suc","?select=*"),
supaGet("proveedores","?select=*&order=created_at"),
supaGet("inventario","?select=*&order=nombre"),
supaGet("recetas_produccion","?select=*&order=nombre"),
supaGet("recetas_venta","?select=*&order=nombre"),
supaGet("requerimientos","?select=*&order=created_at.desc"),
supaGet("inventario_sucursales","?select=*"),
supaGet("registros_sucursales","?select=*&order=fecha.desc"),
supaGet("ventas","?select=*&order=fecha.desc"),
supaGet("marcas","?select=*&order=nombre"),
supaGet("cierres_caja","?select=*&order=created_at.desc"),
supaGet("manual_temas","?select=*&order=orden"),
supaGet("manual_articulos","?select=*&order=orden"),
]);

    if(dbUsers.length>0) setUsers(dbUsers.map(u=>({...u,id:u.id})));
    if(dbSucs.length>0){setSucs(dbSucs.map(s=>s.nombre));const sm={};dbSucs.forEach(s=>{sm[s.nombre]=s.marcas||[];});setSucsMarcas(sm);}
    if(dbCatsInv.length>0) setCats(dbCatsInv.map(c=>c.nombre));
    if(dbCatsVenta.length>0) setCatV(dbCatsVenta.map(c=>c.nombre));
    if(dbCatsInvSuc.length>0) setCats2(dbCatsInvSuc.map(c=>c.nombre));
    if(dbProvs.length>0) setProvs(dbProvs.map((p,i)=>({...p,id:p.id||i+1})));
    if(dbInv.length>0) setInv(dbInv.map(i=>({...i,stockMin:i.stockMin||0})));
    if(dbRp.length>0){
      setRp(dbRp.map(r=>({...r,ings:r.ings||[]})));
      setSp(dbRp.map(r=>({recetaId:r.id,stock:r.stock||0})));
    }
    if(dbRv.length>0) setRv(dbRv.map(r=>({...r,ings:r.ings||[],marcas:r.marcas||[]})));
    if(dbReqs.length>0) setReqs(dbReqs.map(r=>({...r,items:r.items||[],despacho:r.despacho||[]})));
    if(dbInvSucs.length>0) setInvSucs(dbInvSucs.map(s=>({sucursal:s.sucursal,items:s.items||[]})));
    if(dbRegs.length>0) setRegsSucs(dbRegs.map(r=>({...r,numInv:r.numInv||1,filas:r.filas||[],ventas:r.ventas||[]})));
    if(dbVentas.length>0) setVentas(dbVentas.map(v=>({...v,rId:v.rId,cant:v.cant})));
    if(dbMarcas.length>0) setMarcas(dbMarcas);
    if(dbCierres.length>0) setCierresCaja(dbCierres);
    if(dbManualTemas.length>0) setManualTemas(dbManualTemas);
    if(dbManualArticulos.length>0) setManualArticulos(dbManualArticulos);
  }catch(err){
    console.error("Error cargando datos:",err);
  }finally{
    setCargando(false);
  }
}
cargarDatos();

},[]);
const sh={inv,setInv,sp,setSp,rp,setRp,rv,setRv,reqs,setReqs,hI,setHI,hC,setHC,xlsxReady,sucs,setSucs,cats,setCats,catV,setCatV,cats2,setCats2,invSucs,setInvSucs,regsSucs,setRegsSucs,provs,setProvs,ventas,setVentas,users,setUsers,userActivo,setUserActivo,marcas,setMarcas,sucsMarcas,setSucsMarcas,cierresCaja,setCierresCaja};
const[menuAbierto,setMenuAbierto]=useState(true);
// puede debe definirse antes de allTabs — usa userActivo que puede ser null
const puede=(accion)=>puedePor(userActivo,accion);
const allTabs=[
{id:"inicio",l:"Inicio",i:"🏠",perm:null},
{id:"dash",l:"Dashboard",i:"📊",perm:"ver_config"},
{id:"inv",l:"Inventario",i:"📦",perm:"ver_inv"},
{id:"prod",l:"Stock Producción",i:"🏭",perm:"ver_prod"},
{id:"rec",l:"Recetas",i:"📋",perm:"ver_recetas"},
{id:"req",l:"Requerimientos",i:"🏪",perm:"ver_req"},
{id:"comp",l:"Lista Compras",i:"🛒",perm:"ver_comp"},
{id:"invsuc",l:"Inv. Sucursales",i:"🏬",perm:"ver_invsuc"},
{id:"cos",l:"Costos & Ingresos",i:"💰",perm:"ver_cos"},
{id:"caja",l:"Cuadre de Caja",i:"💵",perm:"ver_caja"},
{id:"manual",l:"Manual",i:"📖",perm:"ver_manual"},
{id:"hist",l:"Historial",i:"🕐",perm:"ver_hist"},
{id:"config",l:"Configuración",i:"⚙️",perm:"ver_config"},
];
const T=allTabs.filter(t=>!t.perm||puede(t.perm));
// Pantalla de carga
if(cargando) return <div style={{minHeight:"100vh",background:BG,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
<div style={{fontFamily:"'Bebas Neue'",fontSize:64,color:ACC,letterSpacing:4}}>BORGERS</div>
<div style={{fontSize:13,color:MUT}}>Cargando datos...</div>
<div style={{width:40,height:40,border:"3px solid "+BRD,borderTop:"3px solid "+ACC,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}></div>
<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
// Login gate — después de todos los hooks
if(!userActivo) return <Login users={users} onLogin={setUserActivo}/>;
return <>
<style>{globalCss}</style>
{userActivo&&<Watermark nombre={userActivo.nombre}/>}
<div style={{display:"flex",minHeight:"100vh"}}>
{/* Menú lateral */}
<div style={{width:menuAbierto?220:56,background:SRF,borderRight:b1(BRD),display:"flex",flexDirection:"column",position:"fixed",height:"100vh",zIndex:100,transition:"width 0.2s ease",overflow:"hidden"}}>
<div style={{padding:"16px 12px",borderBottom:b1(BRD),display:"flex",alignItems:"center",justifyContent:menuAbierto?"space-between":"center"}}>
{menuAbierto&&<div>
<div style={{fontFamily:"'Bebas Neue'",fontSize:36,color:ACC,letterSpacing:3,lineHeight:1}}>BORGERS</div>
<div style={{fontSize:11,color:MUT,letterSpacing:".1em",marginTop:2}}>SISTEMA DE GESTIÓN</div>
</div>}
<button onClick={()=>setMenuAbierto(p=>!p)} style={{background:"transparent",border:"none",color:MUT,cursor:"pointer",padding:6,borderRadius:6,display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
<span style={{display:"block",width:18,height:2,background:MUT,borderRadius:1}}></span>
<span style={{display:"block",width:18,height:2,background:MUT,borderRadius:1}}></span>
<span style={{display:"block",width:18,height:2,background:MUT,borderRadius:1}}></span>
</button>
</div>
<nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
{T.map(t=>{const a=tab===t.id;return <button key={t.id} onClick={()=>setTab(t.id)} title={t.l} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 12px",borderRadius:8,marginBottom:2,background:a?ACC+"18":"transparent",color:a?ACC:MUT,border:"none",textAlign:"left",fontSize:13,fontWeight:a?600:400,cursor:"pointer",whiteSpace:"nowrap",overflow:"hidden"}}><span style={{flexShrink:0}}>{t.i}</span>{menuAbierto&&t.l}</button>;})}
</nav>
<div style={{padding:menuAbierto?"12px 16px":"8px",borderTop:b1(BRD)}}>
{menuAbierto
?<div>
<div style={{fontSize:12,fontWeight:600,color:TXT,marginBottom:2}}>{userActivo.nombre}</div>
<div style={{fontSize:11,color:MUT,marginBottom:8}}>{userActivo.rol==="superadmin"?"Superadmin":userActivo.rol==="admin_suc"?"Admin · "+userActivo.sucursal:userActivo.rol==="staff_suc"?"Staff · "+userActivo.sucursal:"Producción"}</div>
<button onClick={()=>{setUserActivo(null);setTab("inicio");}} style={{fontSize:11,color:RED,background:"transparent",border:"none",cursor:"pointer",padding:0}}>Cerrar sesión</button>
</div>
:<button onClick={()=>{setUserActivo(null);setTab("inicio");}} title="Cerrar sesión" style={{background:"transparent",border:"none",color:RED,cursor:"pointer",fontSize:16,width:"100%",textAlign:"center"}}>⏏</button>
}
</div>
</div>
<div style={{marginLeft:menuAbierto?220:56,flex:1,padding:28,minWidth:0,transition:"margin-left 0.2s ease"}}>
{tab==="inicio"&&<Inicio userActivo={userActivo} setTab={setTab} tabs={T}/>
}{tab==="dash"&&<Dash {...sh} puede={puede}/>}
{tab==="inv"&&<Inv {...sh} puede={puede}/>}
{tab==="prod"&&<Prod {...sh} puede={puede}/>}
{tab==="rec"&&<Rec {...sh} puede={puede}/>}
{tab==="req"&&<Req {...sh} puede={puede} userActivo={userActivo}/>}
{tab==="comp"&&<Comp {...sh}/>}
{tab==="invsuc"&&<InvSuc {...sh} puede={puede}/>}
{tab==="cos"&&<Cos {...sh} puede={puede} userActivo={userActivo}/>}
{tab==="caja"&&<CierreCaja cierresCaja={cierresCaja} setCierresCaja={setCierresCaja} sucs={sucs} userActivo={userActivo} puede={puede}/>}
{tab==="manual"&&<Manual manualTemas={manualTemas} setManualTemas={setManualTemas} manualArticulos={manualArticulos} setManualArticulos={setManualArticulos} userActivo={userActivo}/>}
{tab==="hist"&&<Hist {...sh} userActivo={userActivo}/>}
{tab==="config"&&<Config {...sh} puede={puede}/>}
</div>
</div>
</>;
}
// ── Dashboard ───────────────────────────────────────────────────────────────
// ── Inicio (todos los usuarios) ─────────────────────────────────────────────
function Inicio({userActivo,setTab,tabs}){
const modulosAccesibles=(tabs||[]).filter(t=>t.id!=="inicio"&&t.id!=="dash");
const hora=new Date().getHours();
const saludo=hora<12?"Buenos días":hora<18?"Buenas tardes":"Buenas noches";
return <div>
<div style={{marginBottom:32}}>
<div style={{fontFamily:"'Bebas Neue'",fontSize:48,color:ACC,letterSpacing:3,lineHeight:1}}>BORGERS</div>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:1,marginTop:8,marginBottom:4}}>
{saludo}, {userActivo?.nombre}
</h1>
<p style={{color:MUT,fontSize:13}}>{new Date().toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
</div>
<div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:MUT,letterSpacing:1,marginBottom:16}}>TUS MÓDULOS</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
{modulosAccesibles.map(t=><button key={t.id} onClick={()=>setTab(t.id)}
style={{background:CRD,border:b1(BRD),borderRadius:12,padding:"24px 16px",cursor:"pointer",textAlign:"left",display:"block",width:"100%"}}
onMouseEnter={e=>e.currentTarget.style.borderColor=ACC}
onMouseLeave={e=>e.currentTarget.style.borderColor=BRD}>
<div style={{fontSize:32,marginBottom:10}}>{t.i}</div>
<div style={{fontWeight:600,fontSize:14,color:TXT}}>{t.l}</div>
</button>)}
</div>
  </div>;
}
// ── Dashboard (solo superadmin) ──────────────────────────────────────────────
function Dash({inv,sp,rp,rv,reqs}){
const bajo=inv.filter(i=>i.stock<=i.stockMin);
const val=inv.reduce((s,i)=>s+i.stock*i.costo,0);
const pendReqs=reqs.filter(r=>r.estado==="enviado");
const totalUnids=pendReqs.reduce((s,r)=>s+r.items.reduce((ss,i)=>ss+i.cantidad,0),0);
const res=rp.map(r=>{
const sa=sp.find(s=>s.recetaId===r.id)?.stock||0;
const tr=pendReqs.reduce((s,req)=>s+req.items.filter(i=>i.prodId===r.id).reduce((ss,i)=>ss+i.cantidad,0),0);
return{n:r.nombre,sa,tr,el:Math.max(0,tr-sa)};
}).filter(r=>r.tr>0);
return <div>
<div style={{marginBottom:24}}>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>DASHBOARD</h1>
<p style={{color:MUT,fontSize:13}}>{new Date().toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
<SC label="Valor Inventario" value={fmt(val)} sub={inv.length+" ítems"} icon="📦"/>
<SC label="Bajo Stock" value={bajo.length} sub="Ítems bajo mínimo" color={bajo.length>0?RED:GRN} icon="⚠️"/>
<SC label="Reqs. Enviados" value={pendReqs.length} sub={totalUnids+" unidades totales"} color={ACC} icon="🏪"/>
<SC label="Recetas Venta" value={rv.length} sub="Productos activos" color={BLU} icon="📋"/>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
<Card>
<div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:16}}>INVENTARIO BAJO MÍNIMO</div>
{bajo.length===0?<div style={{color:MUT,fontSize:13,textAlign:"center",padding:20}}>Todo en orden</div>:
<table><thead><tr><th>Ítem</th><th>Stock</th><th>Mínimo</th></tr></thead>
<tbody>{bajo.map(i=><tr key={i.id}><td>{i.nombre}</td><td style={{fontFamily:"'DM Mono'",color:RED}}>{fmtN(i.stock)} {i.unidad}</td><td style={{fontFamily:"'DM Mono'",color:MUT}}>{fmtN(i.stockMin)}</td></tr>)}</tbody>
</table>}
</Card>
<Card>
<div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:16}}>PRODUCCIÓN ESTA SEMANA</div>
{res.length===0?<div style={{color:MUT,fontSize:13,textAlign:"center",padding:20}}>Sin requerimientos pendientes</div>:
<table><thead><tr><th>Producto</th><th>Stock</th><th>Req. Total</th><th>Elaborar</th></tr></thead>
<tbody>{res.map((r,i)=><tr key={i}><td style={{fontSize:12}}>{r.n}</td><td style={{fontFamily:"'DM Mono'",color:MUT}}>{r.sa}</td><td style={{fontFamily:"'DM Mono'"}}>{r.tr}</td><td style={{fontFamily:"'DM Mono'",color:r.el>0?ACC:GRN,fontWeight:600}}>{r.el}</td></tr>)}</tbody>
</table>}
</Card>
</div>
  </div>;
}
// ── Inventario ──────────────────────────────────────────────────────────────
function Inv({inv,setInv,setHI,xlsxReady,cats,puede}){
const[modal,setModal]=useState(null);
const[edit,setEdit]=useState(null);
const[mF,setMF]=useState(false);
const[cF,setCF]=useState({});
const[fil,setFil]=useState("");
const[cat,setCat]=useState("Todas");
const[importPreview,setImportPreview]=useState(null);
const[confirmar,setConfirmar]=useState(null);
const refXlsx=useRef();
const f0={nombre:"",categoria:"Carnes",unidad:"kg",stock:0,stockMin:0,costo:0,proveedor:""};
const[form,setForm]=useState(f0);
const lista=inv.filter(i=>(cat==="Todas"||i.categoria===cat)&&i.nombre.toLowerCase().includes(fil.toLowerCase()));
async function save(){
if(!form.nombre)return;
if(edit){
  await supaPatch("inventario","?id=eq."+edit.id,form).catch(console.error);
  setInv(p=>p.map(i=>i.id===edit.id?{...edit,...form}:i));
}else{
  const [created]=await supaPost("inventario",form).catch(()=>[form]);
  setInv(p=>[...p,created||form]);
}
setModal(null);setEdit(null);setForm(f0);
}
function startF(){const cf={};inv.forEach(i=>{cf[i.id]=i.stock;});setCF(cf);setMF(true);}
async function saveF(){
const d=inv.filter(i=>cF[i.id]!==undefined&&cF[i.id]!==i.stock).map(i=>({id:i.id,nombre:i.nombre,anterior:i.stock,nuevo:cF[i.id]}));
setInv(p=>p.map(i=>({...i,stock:cF[i.id]??i.stock})));
setHI(p=>[...p,{id:Date.now(),fecha:today(),tipo:"Inventario Físico",descripcion:d.length+" ítems ajustados",diffs:d}]);
await Promise.all(d.map(d=>supaPatch("inventario","?id=eq."+d.id,{stock:d.nuevo}).catch(console.error)));
setMF(false);alert("Inventario físico guardado. "+d.length+" ítems ajustados.");
}
async function onXlsx(e){
const file=e.target.files[0];if(!file)return;
e.target.value="";
if(!xlsxReady){alert("SheetJS aún cargando, intenta en un momento.");return;}
try{
const rows=await readXLSX(file);
// Mapear columnas flexibles
const mapped=rows.map((row,idx)=>{
const keys=Object.keys(row).map(k=>k.toLowerCase().trim());
const get=(names)=>{for(const n of names){const k=Object.keys(row).find(k=>k.toLowerCase().trim()===n);if(k!==undefined&&row[k]!=="")return row[k];}return "";};
return{
id:Math.max(0,...inv.map(i=>i.id))+idx+1,
nombre:String(get(["nombre","item","ingrediente","name"])||"").trim(),
categoria:String(get(["categoria","categoría","category"])||"Secos").trim(),
unidad:String(get(["unidad","unit","ud"])||"und").trim(),
stock:parseFloat(get(["stock","cantidad","qty","quantity"]))||0,
stockMin:parseFloat(get(["stockmin","stock minimo","stock mínimo","minimo","mínimo","min"]))||0,
costo:parseFloat(get(["costo","costounit","costo unit","precio","price","cost"]))||0,
proveedor:String(get(["proveedor","supplier","prov"])||"").trim(),
};
}).filter(i=>i.nombre);
setImportPreview(mapped);
setModal("preview");
}catch(err){alert("Error leyendo el archivo: "+err.message);}
}
async function confirmarImport(){
const prev=importPreview;
setInv(prev);
setImportPreview(null);
setModal(null);
await supaDelete("inventario","?id=gt.0").catch(console.error);
const {id:_,...rest}=prev[0]||{};
for(const item of prev){
  const{id:__,...data}=item;
  await supaPost("inventario",data).catch(console.error);
}
alert(prev.length+" ítems importados. El inventario fue reemplazado.");
}
function descargarPlantilla(){
if(!xlsxReady){alert("SheetJS cargando...");return;}
const datos=inv.length>0
?inv.map(i=>({nombre:i.nombre,categoria:i.categoria,unidad:i.unidad,stock:i.stock,stockMin:i.stockMin,costo:i.costo,proveedor:i.proveedor}))
:[{nombre:"Carne de res 80/20",categoria:"Carnes",unidad:"kg",stock:45,stockMin:20,costo:8500,proveedor:"Carnes Premium SA"}];
const ws=window.XLSX.utils.json_to_sheet(datos);
const wb=window.XLSX.utils.book_new();
window.XLSX.utils.book_append_sheet(wb,ws,"Inventario");
window.XLSX.writeFile(wb,"plantilla_inventario_borgers.xlsx");
}
if(mF)return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>INVENTARIO FÍSICO</h1></div>
<div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setMF(false)}>Cancelar</Btn><Btn onClick={saveF}>Confirmar</Btn></div>
</div>
<Card xtra={{padding:0}}>
<table><thead><tr><th>Ítem</th><th>Categoría</th><th>Sistema</th><th>Físico</th><th>Diferencia</th></tr></thead>
<tbody>{inv.map(i=>{const d=(cF[i.id]??i.stock)-i.stock;return <tr key={i.id}><td>{i.nombre}</td><td style={{color:MUT}}>{i.categoria}</td><td style={{fontFamily:"'DM Mono'"}}>{i.stock}</td><td><input type="number" value={cF[i.id]??i.stock} step="0.01" onChange={e=>setCF(p=>({...p,[i.id]:parseFloat(e.target.value)||0}))} style={{width:80}}/></td><td style={{fontFamily:"'DM Mono'",color:d===0?MUT:d>0?GRN:RED,fontWeight:d!==0?600:400}}>{d>0?"+":""}{d.toFixed(2)}</td></tr>;})}</tbody>
</table>
</Card>
  </div>;
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>INVENTARIO</h1>
<p style={{color:MUT,fontSize:13}}>{inv.length+" ítems · "+fmt(inv.reduce((s,i)=>s+i.stock*i.costo,0))}</p>
</div>
<div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
{puede("config_total")&&<><Btn v="ghost" s="sm" onClick={descargarPlantilla} disabled={!xlsxReady}>📥 Plantilla Excel</Btn>
<Btn v="ghost" s="sm" onClick={()=>refXlsx.current.click()} disabled={!xlsxReady}>📤 Subir Excel</Btn>
<input ref={refXlsx} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={onXlsx}/></>}
<Btn v="success" s="sm" onClick={startF}>🔢 Inv. Físico</Btn>
{puede("config_total")&&<Btn s="sm" onClick={()=>{setEdit(null);setForm(f0);setModal("f");}}>+ Agregar</Btn>}
</div>
</div>
<div style={{display:"flex",gap:12,marginBottom:20}}>
<input placeholder="Buscar..." value={fil} onChange={e=>setFil(e.target.value)} style={{flex:1}}/>
<select value={cat} onChange={e=>setCat(e.target.value)}>
<option>Todas</option>{cats.map(c=><option key={c}>{c}</option>)}
</select>
</div>
<Card xtra={{padding:0}}>
<table>
<thead><tr><th>Nombre</th><th>Cat.</th><th>Stock</th><th>Mín.</th><th>Costo</th><th>Valor Total</th><th>Proveedor</th><th>Estado</th><th></th></tr></thead>
<tbody>{lista.map(i=>{
const bajo=i.stock<=i.stockMin;
return <tr key={i.id}>
<td style={{fontWeight:500}}>{i.nombre}</td>
<td style={{color:MUT,fontSize:12}}>{i.categoria}</td>
<td style={{fontFamily:"'DM Mono'",color:bajo?RED:TXT}}>{fmtN(i.stock)} {i.unidad}</td>
<td style={{fontFamily:"'DM Mono'",color:MUT}}>{fmtN(i.stockMin)}</td>
<td style={{fontFamily:"'DM Mono'"}}>{fmt(i.costo)}</td>
<td style={{fontFamily:"'DM Mono'",color:ACC}}>{fmt(i.stock*i.costo)}</td>
<td style={{color:MUT,fontSize:12}}>{i.proveedor}</td>
<td><Bdg c={bajo?"red":"green"}>{bajo?"Bajo":"OK"}</Bdg></td>
{puede("config_total")&&<td><div style={{display:"flex",gap:6}}>
<button onClick={()=>{setEdit(i);setForm({nombre:i.nombre,categoria:i.categoria,unidad:i.unidad,stock:i.stock,stockMin:i.stockMin,costo:i.costo,proveedor:i.proveedor});setModal("f");}} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
<button onClick={()=>setConfirmar({msg:"¿Eliminar "+i.nombre+"?",fn:()=>{setInv(p=>p.filter(x=>x.id!==i.id));supaDelete("inventario","?id=eq."+i.id).catch(console.error);}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
</div></td>}
</tr>;
})}</tbody>
</table>
</Card>

{modal==="preview" && importPreview && (
  <Mdl title={"PREVIEW — "+importPreview.length+" ÍTEMS A IMPORTAR"} onClose={()=>setModal(null)} wide>
    <div style={{background:BG,borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:MUT}}>
      Este archivo reemplazará el inventario actual completamente. Verifica que los datos sean correctos.
    </div>
    <div style={{maxHeight:360,overflow:"auto",marginBottom:16}}>
      <table>
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Stock</th><th>Mín.</th><th>Costo</th><th>Proveedor</th></tr></thead>
        <tbody>{importPreview.map((i,idx)=><tr key={idx}><td style={{fontWeight:500}}>{i.nombre}</td><td style={{color:MUT}}>{i.categoria}</td><td style={{color:MUT}}>{i.unidad}</td><td style={{fontFamily:"'DM Mono'"}}>{fmtN(i.stock)}</td><td style={{fontFamily:"'DM Mono'"}}>{fmtN(i.stockMin)}</td><td style={{fontFamily:"'DM Mono'"}}>{fmt(i.costo)}</td><td style={{color:MUT,fontSize:12}}>{i.proveedor}</td></tr>)}</tbody>
      </table>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={confirmarImport}>Confirmar Importación</Btn>
    </div>
  </Mdl>
)}
{modal==="f" && (
  <Mdl title={edit?"EDITAR ÍTEM":"NUEVO ÍTEM"} onClose={()=>setModal(null)}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{gridColumn:"1/3"}}><LI label="Nombre"><input value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI></div>
      <LI label="Categoría"><select value={form.categoria} onChange={e=>setForm(p=>({...p,categoria:e.target.value}))} style={{width:"100%"}}>{cats.map(c=><option key={c}>{c}</option>)}</select></LI>
      <LI label="Unidad"><input value={form.unidad} onChange={e=>setForm(p=>({...p,unidad:e.target.value}))} style={{width:"100%"}}/></LI>
      <LI label="Stock"><input type="number" step="0.01" value={form.stock||""} placeholder="0" onChange={e=>setForm(p=>({...p,stock:parseFloat(e.target.value)||0}))} style={{width:"100%"}}/></LI>
      <LI label="Stock mínimo"><input type="number" step="0.01" value={form.stockMin||""} placeholder="0" onChange={e=>setForm(p=>({...p,stockMin:parseFloat(e.target.value)||0}))} style={{width:"100%"}}/></LI>
      <LI label="Costo ($)"><input type="number" step="0.01" value={form.costo||""} placeholder="0" onChange={e=>setForm(p=>({...p,costo:parseFloat(e.target.value)||0}))} style={{width:"100%"}}/></LI>
      <div style={{gridColumn:"1/3"}}><LI label="Proveedor"><input value={form.proveedor} onChange={e=>setForm(p=>({...p,proveedor:e.target.value}))} style={{width:"100%"}}/></LI></div>
    </div>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"flex-end"}}>
      <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
      <Btn onClick={save}>Guardar</Btn>
    </div>
  </Mdl>
)}
{confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}

  </div>;
}
// ── Stock Producción ────────────────────────────────────────────────────────
function Prod({rp,sp,setSp,inv,reqs,puede}){
const[mF,setMF]=useState(false);
const[cF,setCF]=useState({});
const pendReqs=reqs.filter(r=>r.estado==="enviado");
const gs=id=>sp.find(s=>s.recetaId===id)?.stock||0;
const ss=(id,v)=>setSp(p=>{const e=p.find(s=>s.recetaId===id);return e?p.map(s=>s.recetaId===id?{...s,stock:Math.max(0,v)}:s):[...p,{recetaId:id,stock:Math.max(0,v)}];});
const gr=id=>pendReqs.reduce((s,req)=>s+req.items.filter(i=>i.prodId===id).reduce((ss,i)=>ss+i.cantidad,0),0);
const cc=r=>r.ings.reduce((s,ing)=>{const item=inv.find(i=>i.id===ing.invId);return s+(item?item.costo*ing.cantidad:0);},0);
if(mF)return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>STOCK FÍSICO PRODUCCIÓN</h1>
<div style={{display:"flex",gap:10}}><Btn v="ghost" onClick={()=>setMF(false)}>Cancelar</Btn><Btn onClick={()=>{rp.forEach(r=>{const ns=cF[r.id]??gs(r.id);ss(r.id,ns);supaPatch("recetas_produccion","?id=eq."+r.id,{stock:ns}).catch(console.error);});setMF(false);alert("Stock actualizado.");}}>Confirmar</Btn></div>
</div>
<Card xtra={{padding:0}}>
<table><thead><tr><th>Producto</th><th>Sistema</th><th>Físico</th><th>Diferencia</th></tr></thead>
<tbody>{rp.map(r=>{const sys=gs(r.id),fis=cF[r.id]??sys,d=fis-sys;return <tr key={r.id}><td style={{fontWeight:500}}>{r.nombre}</td><td style={{fontFamily:"'DM Mono'"}}>{fmtN(sys)}</td><td><input type="number" step="0.01" value={fis} onChange={e=>setCF(p=>({...p,[r.id]:parseFloat(e.target.value)||0}))} style={{width:90}}/></td><td style={{fontFamily:"'DM Mono'",color:d===0?MUT:d>0?GRN:RED,fontWeight:d!==0?600:400}}>{d>0?"+":""}{d.toFixed(2)}</td></tr>;})}</tbody>
</table>
</Card>
  </div>;
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>STOCK DE PRODUCCIÓN</h1><p style={{color:MUT,fontSize:13}}>Productos semi-elaborados en el centro de producción</p></div>
<Btn v="success" onClick={()=>{const cf={};rp.forEach(r=>{cf[r.id]=gs(r.id);});setCF(cf);setMF(true);}}>Actualizar Stock Físico</Btn>
</div>
{rp.length===0
?<Card xtra={{textAlign:"center",padding:48,color:MUT}}>Sin productos de producción configurados.</Card>
:<Card xtra={{padding:0}}>
<table>
<thead><tr><th>Producto</th><th>Unidad</th><th>Stock</th><th>Req. Total</th><th>Por Elaborar</th></tr></thead>
<tbody>{rp.map(r=>{
const sa=gs(r.id),req=gr(r.id),el=Math.max(0,req-sa);
return <tr key={r.id}>
<td style={{fontWeight:500}}>{r.nombre}</td>
<td style={{color:MUT,fontSize:12}}>{r.unidad}</td>
<td style={{fontFamily:"'DM Mono'",color:sa>0?GRN:RED,fontWeight:600}}>{fmtN(sa)}</td>
<td style={{fontFamily:"'DM Mono'"}}>{fmtN(req)}</td>
<td style={{fontFamily:"'DM Mono'",color:el>0?ACC:GRN,fontWeight:el>0?700:400}}>{fmtN(el)}</td>
</tr>;
})}</tbody>
</table>
</Card>}
  </div>;
}
// ── Recetas ─────────────────────────────────────────────────────────────────
function Rec({rp,setRp,rv,setRv,inv,setSp,catV,invSucs,puede,marcas}){
const[st,setSt]=useState("v");
const[modal,setModal]=useState(null);
const[editR,setEditR]=useState(null);
const[confirmar,setConfirmar]=useState(null);
const fV={nombre:"",categoria:catV[0]||"",precio:0,ings:[],codigo:"",marcas:[]};
const fP={nombre:"",unidad:"und",rendimiento:1,ings:[]};
const[fv,setFv]=useState(fV);
const[fp,setFp]=useState(fP);
const CV=catV;
// Lista única de nombres de ítems de sucursal para el datalist
const sucItemsUnicos=[...new Set((invSucs||[]).flatMap(s=>s.items.map(i=>i.nombre)))].sort((a,b)=>a.localeCompare(b,"es"));
function ccv(ings){return ings.reduce((s,ing)=>{if(ing.tipo==="inv"){const item=inv.find(i=>i.id===ing.refId);return s+(item?item.costo*ing.cantidad:0);}else{const r=rp.find(x=>x.id===ing.refId);if(!r)return s;const cp=r.ings.reduce((cs,ri)=>{const item=inv.find(i=>i.id===ri.invId);return cs+(item?item.costo*ri.cantidad:0);},0);return s+(cp/r.rendimiento)*ing.cantidad;}},0);}
async function sv(){if(!fv.nombre)return;if(editR){await supaPatch("recetas_venta","?id=eq."+editR.id,fv).catch(console.error);setRv(p=>p.map(r=>r.id===editR.id?{...editR,...fv}:r));}else{const[created]=await supaPost("recetas_venta",fv).catch(()=>[fv]);setRv(p=>[...p,created||fv]);}setModal(null);setEditR(null);setFv(fV);}
async function sp2(){if(!fp.nombre)return;if(editR){await supaPatch("recetas_produccion","?id=eq."+editR.id,fp).catch(console.error);setRp(p=>p.map(r=>r.id===editR.id?{...editR,...fp}:r));}else{const[created]=await supaPost("recetas_produccion",{...fp,stock:0}).catch(()=>[fp]);const nid=created?.id||Date.now();setRp(p=>[...p,{...fp,id:nid}]);setSp(p=>[...p,{recetaId:nid,stock:0}]);}setModal(null);setEditR(null);setFp(fP);}
// FIX: al cambiar ingrediente, actualizar unidad automáticamente
function cambiarIngV(idx,campo,valor){
setFv(p=>({...p,ings:p.ings.map((x,i)=>{
if(i!==idx)return x;
const upd={...x,[campo]:valor};
if(campo==="refId"){
if(x.tipo==="inv"){const item=inv.find(i=>i.id===parseInt(valor));if(item)upd.unidad=item.unidad;}
else{const r=rp.find(r=>r.id===parseInt(valor));if(r)upd.unidad=r.unidad;}
}
return upd;
})}));
}
function cambiarIngP(idx,campo,valor){
setFp(p=>({...p,ings:p.ings.map((x,i)=>{
if(i!==idx)return x;
const upd={...x,[campo]:valor};
if(campo==="invId"){const item=inv.find(i=>i.id===parseInt(valor));if(item)upd.unidad=item.unidad;}
return upd;
})}));
}
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>RECETAS</h1>
{(!puede||puede("editar_recetas"))&&<Btn onClick={()=>{setEditR(null);st==="v"?setFv(fV):setFp(fP);setModal("f");}}>+ Nueva Receta</Btn>}
</div>
<div style={{display:"flex",gap:8,marginBottom:20}}>
{[["v","Productos de Venta"],["p","Producción Interna"]]
.filter(([id])=>id!=="p"||(puede&&(puede("editar_recetas")||puede("ver_prod"))))
.map(([id,l])=>{const a=st===id;return <button key={id} onClick={()=>setSt(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT}}>{l}</button>;})}
</div>

{st==="v"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
  {rv.map(r=>{const c=ccv(r.ings),m=r.precio>0?((r.precio-c)/r.precio*100):0;return <Card key={r.id}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
      <div><div style={{fontWeight:600,fontSize:15}}>{r.nombre}</div><Bdg c="blue">{r.categoria}</Bdg>{r.codigo&&<span style={{fontSize:11,fontFamily:"'DM Mono'",color:MUT,marginLeft:6}}>#{r.codigo}</span>}</div>
      {(!puede||puede("editar_recetas"))&&<div style={{display:"flex",gap:6}}>
        <button onClick={()=>{setEditR(r);setFv({nombre:r.nombre,categoria:r.categoria,precio:r.precio,ings:r.ings,codigo:r.codigo||"",marcas:r.marcas||[]});setModal("f");}} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
        <button onClick={()=>setConfirmar({msg:"¿Eliminar receta "+r.nombre+"?",fn:()=>{setRv(p=>p.filter(x=>x.id!==r.id));supaDelete("recetas_venta","?id=eq."+r.id).catch(console.error);}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
      </div>}
    </div>
    <div style={{borderTop:b1(BRD),paddingTop:12,marginBottom:12}}>
      {r.ings.map((ing,i)=>{
        const n=ing.tipo==="inv"?inv.find(x=>x.id===ing.refId)?.nombre:rp.find(x=>x.id===ing.refId)?.nombre;
        const cIng=ing.tipo==="inv"
          ?(inv.find(x=>x.id===ing.refId)?.costo||0)*ing.cantidad
          :(()=>{const prod=rp.find(x=>x.id===ing.refId);if(!prod)return 0;const cp=prod.ings.reduce((s,ri)=>{const it=inv.find(i=>i.id===ri.invId);return s+(it?it.costo*ri.cantidad:0);},0);return(cp/prod.rendimiento)*ing.cantidad;})();
        return <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
          <span style={{color:ing.tipo==="prod"?ACC:MUT}}>{ing.tipo==="prod"?"[P] ":""}{n||"?"}</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontFamily:"'DM Mono'"}}>{ing.cantidad} {ing.unidad}</span>
            {(!puede||puede("config_total"))&&<span style={{fontFamily:"'DM Mono'",color:MUT,fontSize:11,minWidth:46,textAlign:"right"}}>{fmt(cIng)}</span>}
          </div>
        </div>;
      })}
      <div style={{fontSize:10,color:FNT,marginTop:4}}>[P] = producción interna</div>
    </div>
    {(!puede||puede("editar_recetas"))&&<div style={{borderTop:b1(BRD),paddingTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:MUT}}>Costo</span><span style={{fontFamily:"'DM Mono'",fontSize:12}}>{fmt(c)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:MUT}}>Precio</span><span style={{fontFamily:"'DM Mono'",fontSize:12,color:ACC}}>{fmt(r.precio)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:MUT}}>Margen</span><span style={{fontFamily:"'DM Mono'",fontSize:12,color:m>50?GRN:m>30?ACC:RED}}>{m.toFixed(1)}%</span></div>
    </div>}
  </Card>;})}
</div>}
{st==="p"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
  {rp.map(r=>{const c=r.ings.reduce((s,ing)=>{const item=inv.find(i=>i.id===ing.invId);return s+(item?item.costo*ing.cantidad:0);},0);return <Card key={r.id}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
      <div><div style={{fontWeight:600,fontSize:15}}>{r.nombre}</div><div style={{fontSize:12,color:MUT}}>Rinde {r.rendimiento} {r.unidad}</div></div>
      {(!puede||puede("editar_recetas"))&&<div style={{display:"flex",gap:6}}>
        <button onClick={()=>{setEditR(r);setFp({nombre:r.nombre,unidad:r.unidad,rendimiento:r.rendimiento,ings:r.ings});setModal("f");}} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
        <button onClick={()=>setConfirmar({msg:"¿Eliminar receta "+r.nombre+"?",fn:()=>{setRp(p=>p.filter(x=>x.id!==r.id));setSp(p=>p.filter(x=>x.recetaId!==r.id));supaDelete("recetas_produccion","?id=eq."+r.id).catch(console.error);}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
      </div>}
    </div>
    <div style={{borderTop:b1(BRD),paddingTop:12,marginBottom:12}}>
      {r.ings.map((ing,i)=>{
        const item=inv.find(x=>x.id===ing.invId);
        const cIng=(item?.costo||0)*ing.cantidad;
        return <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
          <span style={{color:MUT}}>{item?.nombre||"?"}</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontFamily:"'DM Mono'"}}>{ing.cantidad} {ing.unidad}</span>
            {(!puede||puede("config_total"))&&<span style={{fontFamily:"'DM Mono'",color:MUT,fontSize:11,minWidth:46,textAlign:"right"}}>{fmt(cIng)}</span>}
          </div>
        </div>;
      })}
    </div>
    <div style={{borderTop:b1(BRD),paddingTop:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:MUT}}>Costo tanda</span><span style={{fontFamily:"'DM Mono'",fontSize:12}}>{fmt(c)}</span></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:MUT}}>Costo/{r.unidad}</span><span style={{fontFamily:"'DM Mono'",fontSize:12,color:ACC}}>{fmt(c/r.rendimiento)}</span></div>
    </div>
  </Card>;})}
</div>}
{modal==="f"&&st==="v"&&<Mdl title={editR?"EDITAR RECETA VENTA":"NUEVA RECETA VENTA"} onClose={()=>setModal(null)} wide>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
    <div style={{gridColumn:"1/3"}}><LI label="Nombre"><input value={fv.nombre} onChange={e=>setFv(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI></div>
    <LI label="Categoría"><select value={fv.categoria} onChange={e=>setFv(p=>({...p,categoria:e.target.value}))} style={{width:"100%"}}>{CV.map(c=><option key={c}>{c}</option>)}</select></LI>
    <LI label="Precio ($)"><input type="number" step="0.01" value={fv.precio||""} placeholder="0" onChange={e=>setFv(p=>({...p,precio:parseFloat(e.target.value)||0}))} style={{width:"100%"}}/></LI>
    {(!puede||puede("config_total"))&&<div style={{gridColumn:"1/3"}}><LI label="Código único (alfanumérico)"><input value={fv.codigo||""} onChange={e=>setFv(p=>({...p,codigo:e.target.value.toUpperCase()}))} placeholder="Ej: BRG-01" style={{width:"100%",fontFamily:"'DM Mono'"}}/></LI></div>}
    <div style={{gridColumn:"1/3"}}><LI label="Marcas">
      <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:4}}>
        {[...(marcas||[])].sort((a,b)=>a.nombre==="General"?-1:b.nombre==="General"?1:a.nombre.localeCompare(b.nombre,"es")).map(m=>{
          const sel=(fv.marcas||[]).includes(m.nombre);
          return <label key={m.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,cursor:"pointer",userSelect:"none"}}>
            <input type="checkbox" checked={sel} onChange={()=>setFv(p=>({...p,marcas:sel?p.marcas.filter(x=>x!==m.nombre):[...(p.marcas||[]),m.nombre]}))}/>
            {m.nombre}
          </label>;
        })}
      </div>
    </LI></div>
  </div>
  <div style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <span style={{fontSize:13,fontWeight:600}}>Ingredientes</span>
      <div style={{display:"flex",gap:8}}>
        <Btn s="sm" v="ghost" onClick={()=>{if(!inv.length)return;const item=inv[0];setFv(p=>({...p,ings:[...p.ings,{tipo:"inv",refId:item.id,cantidad:0.1,unidad:item.unidad}]}));}}>+ Inventario</Btn>
        <Btn s="sm" v="ghost" onClick={()=>{if(!rp.length){alert("Primero crea una receta de producción.");return;}const r=rp[0];setFv(p=>({...p,ings:[...p.ings,{tipo:"prod",refId:r.id,cantidad:1,unidad:r.unidad}]}));}}>+ Producción</Btn>
      </div>
    </div>
    {fv.ings.map((ing,idx)=>(
      <div key={idx} style={{marginBottom:10,background:BG,borderRadius:8,padding:10,border:b1(FNT)}}>
        <div style={{display:"grid",gridTemplateColumns:"90px 1fr 80px 80px 36px",gap:8,marginBottom:8,alignItems:"center"}}>
          <div style={{fontSize:11,padding:"4px 8px",borderRadius:6,textAlign:"center",background:ing.tipo==="prod"?ACC+"18":BLU+"18",color:ing.tipo==="prod"?ACC:BLU}}>{ing.tipo==="prod"?"Prod.":"Inv."}</div>
          <BuscadorItem
            opciones={ing.tipo==="inv"
              ? [...inv].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"))
              : [...rp].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"))
            }
            valorId={ing.refId}
            onChange={id=>cambiarIngV(idx,"refId",id)}
            placeholder={ing.tipo==="inv"?"Buscar ingrediente...":"Buscar producto..."}
          />
          <input type="number" step="0.01" value={ing.cantidad} placeholder="Cant." onChange={e=>cambiarIngV(idx,"cantidad",parseFloat(e.target.value)||0)}/>
          <input value={ing.unidad} placeholder="Unid." onChange={e=>cambiarIngV(idx,"unidad",e.target.value)}/>
          <button onClick={()=>setFv(p=>({...p,ings:p.ings.filter((_,i)=>i!==idx)}))} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,height:34}}>X</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:MUT,flexShrink:0}}>Descontar de inv. sucursal:</span>
          <BuscadorTexto
            opciones={sucItemsUnicos}
            valor={ing.sucItemNombre||""}
            onChange={v=>cambiarIngV(idx,"sucItemNombre",v)}
            placeholder="Buscar ítem de sucursal..."
          />
          {ing.sucItemNombre&&<span style={{fontSize:10,color:GRN,flexShrink:0}}>✓</span>}
        </div>
      </div>
    ))}
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={sv}>Guardar</Btn></div>
</Mdl>}
{modal==="f"&&st==="p"&&<Mdl title={editR?"EDITAR RECETA PROD.":"NUEVA RECETA PROD."} onClose={()=>setModal(null)} wide>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
    <div style={{gridColumn:"1/4"}}><LI label="Nombre"><input value={fp.nombre} onChange={e=>setFp(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI></div>
    <LI label="Unidad"><input value={fp.unidad} onChange={e=>setFp(p=>({...p,unidad:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Rendimiento/tanda"><input type="number" step="0.01" value={fp.rendimiento||""} placeholder="1" onChange={e=>setFp(p=>({...p,rendimiento:parseFloat(e.target.value)||1}))} style={{width:"100%"}}/></LI>
  </div>
  <div style={{marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <span style={{fontSize:13,fontWeight:600}}>Ingredientes (inventario)</span>
      <Btn s="sm" v="ghost" onClick={()=>{if(!inv.length)return;const item=inv[0];setFp(p=>({...p,ings:[...p.ings,{invId:item.id,cantidad:0.1,unidad:item.unidad}]}));}}>+ Agregar</Btn>
    </div>
    {fp.ings.map((ing,idx)=>(
      <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 36px",gap:8,marginBottom:8}}>
        <BuscadorItem
          opciones={[...inv].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"))}
          valorId={ing.invId}
          onChange={id=>cambiarIngP(idx,"invId",id)}
          placeholder="Buscar ingrediente..."
        />
        <input type="number" step="0.01" value={ing.cantidad} placeholder="Cant." onChange={e=>cambiarIngP(idx,"cantidad",parseFloat(e.target.value)||0)}/>
        <input value={ing.unidad} placeholder="Unid." onChange={e=>cambiarIngP(idx,"unidad",e.target.value)}/>
        <button onClick={()=>setFp(p=>({...p,ings:p.ings.filter((_,i)=>i!==idx)}))} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,height:34}}>X</button>
      </div>
    ))}
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={sp2}>Guardar</Btn></div>
</Mdl>}
{confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}

  </div>;
}
// ── Requerimientos (por sucursal individual) ────────────────────────────────
function Req({reqs,setReqs,rp,xlsxReady,sucs,invSucs,regsSucs,provs,puede,userActivo}){
const sucsVisiblesReq=(userActivo&&(userActivo.rol==="admin_suc"||userActivo.rol==="staff_suc"))
?sucs.filter(s=>s===userActivo.sucursal)
:sucs;
const[sucSel,setSucSel]=useState(sucsVisiblesReq[0]||"");
const[modal,setModal]=useState(null); // "nuevo" | "editar" | "despacho"
const[items,setItems]=useState([]);
const[fecha,setFecha]=useState(today());
const[editId,setEditId]=useState(null);
const[despachoId,setDespachoId]=useState(null);
const[despacho,setDespacho]=useState([]);
const refXlsx=useRef();
const[modalAutoReq,setModalAutoReq]=useState(false);
const[autoReqData,setAutoReqData]=useState(null); // {prod:[...], externos:{provId:[...]}}
const reqsDeEsta=reqs.filter(r=>r.sucursal===sucSel);
// Solo puede haber un req en borrador o enviado por sucursal
const activo=reqsDeEsta.find(r=>r.estado==="borrador"||r.estado==="enviado");
const eC={borrador:"muted",enviado:"orange",entregado:"green"};
const eL={borrador:"Borrador",enviado:"Enviado",entregado:"Entregado"};
function generarAutoReq(){
// Obtener último inventario cerrado de esta sucursal
const ultCierre=[...regsSucs]
.filter(r=>r.sucursal===sucSel&&r.estado==="cerrado")
.sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
if(!ultCierre){
alert("No hay inventario cerrado para "+sucSel+". Cierra un inventario primero.");
return;
}
// Obtener ítems de la sucursal
const sucData=invSucs.find(s=>s.sucursal===sucSel);
if(!sucData||!sucData.items.length){
alert("No hay ítems configurados para "+sucSel+".");
return;
}
// Calcular necesidad por ítem: stockMin - stockActual (del último cierre)
const necesidades=sucData.items.map(item=>{
const fila=ultCierre.filas.find(f=>f.itemId===item.id);
const stockActual=fila
?(fila.stockReal!=null&&fila.stockReal!==""
?parseFloat(fila.stockReal)||0
:parseFloat(fila.stockFinal)||0)
:0;
const necesidad=Math.max(0,(item.stockMin||0)-stockActual);
return{item,stockActual,necesidad};
});

// Separar por proveedor — incluir TODOS los ítems, necesidad 0 = no urgente pero editable
const prod=[];
const externos={};
necesidades.forEach(({item,stockActual,necesidad})=>{
  const prov=provs.find(p=>p.id===item.proveedorId);
  if(prov?.tipo==="produccion"){
    const rpMatch=rp.find(r=>r.nombre.toLowerCase()===item.nombre.toLowerCase());
    prod.push({item,stockActual,necesidad,rpId:rpMatch?.id||null,prov});
  }else{
    const pid=item.proveedorId||0;
    if(!externos[pid])externos[pid]={prov:prov||{nombre:"Sin proveedor",tipo:"externo"},items:[]};
    externos[pid].items.push({item,stockActual,necesidad});
  }
});
if(!prod.length&&!Object.keys(externos).length){
  alert("No hay ítems configurados con proveedor para "+sucSel+".");
  return;
}
setAutoReqData({prod,externos,fecha:ultCierre.fecha,sucursal:sucSel});
setModalAutoReq(true);

}
function confirmarAutoReqProd(itemsSeleccionados){
// Incluir TODOS los ítems con cantidad > 0
// Guardar nombre del ítem directamente, sin requerir match con recetas de producción
const items=itemsSeleccionados.filter(i=>i.cantidad>0).map(i=>{
// Intentar match con rp por nombre (opcional, para referencia)
const match=rp.find(r=>
r.nombre.toLowerCase()===( i.itemNombre||"").toLowerCase()||
r.nombre.toLowerCase().includes((i.itemNombre||"").toLowerCase())||
(i.itemNombre||"").toLowerCase().includes(r.nombre.toLowerCase())
);
return {
prodId:i.rpId||match?.id||null,
itemNombre:i.itemNombre, // guardar nombre siempre
cantidad:i.cantidad
};
});
if(!items.length)return;
setReqs(p=>[{id:Date.now(),sucursal:sucSel,fecha:today(),semana:getWeek(),estado:"borrador",items,despacho:[]},...p]);
}
function exportarOrdenCompra(provNombre,items){
if(!xlsxReady){alert("SheetJS cargando...");return;}
const datos=items.map(({item,stockActual,necesidad,cantidad})=>({
fecha:today(),
sucursal:sucSel,
item:item.nombre,
cantidad_pedido:cantidad||necesidad,
}));
const ws=window.XLSX.utils.json_to_sheet(datos);
const wb=window.XLSX.utils.book_new();
window.XLSX.utils.book_append_sheet(wb,ws,"Orden");
window.XLSX.writeFile(wb,"orden_"+provNombre.replace(/ /g,"*")+"*"+sucSel.replace(/ /g,"_")+".xlsx");
}
function abrirNuevo(){
setItems(rp.map(r=>({prodId:r.id,cantidad:0})));
setFecha(today());
setEditId(null);
setModal("form");
}
function abrirEditar(req){
// Precarga con cantidades existentes
const its=rp.map(r=>{
const ex=req.items.find(i=>i.prodId===r.id);
return{prodId:r.id,cantidad:ex?.cantidad||0};
});
setItems(its);
setFecha(req.fecha);
setEditId(req.id);
setModal("form");
}
async function guardar(){
const f=items.filter(i=>i.cantidad>0);
if(!f.length){alert("Agrega al menos una cantidad > 0");return;}
if(editId){
  await supaPatch("requerimientos","?id=eq."+editId,{fecha,items:f}).catch(console.error);
  setReqs(p=>p.map(r=>r.id===editId?{...r,fecha,items:f}:r));
}else{
  const data={sucursal:sucSel,fecha,semana:getWeek(),estado:"borrador",items:f,despacho:[]};
  const[created]=await supaPost("requerimientos",data).catch(()=>[data]);
  setReqs(p=>[{...data,...created},...p]);
}
setModal(null);
}
async function enviar(id){
await supaPatch("requerimientos","?id=eq."+id,{estado:"enviado"}).catch(console.error);
setReqs(p=>p.map(r=>r.id===id?{...r,estado:"enviado"}:r));
}
function abrirDespacho(req){
const d=req.items.map(it=>({prodId:it.prodId,cantDespachada:it.cantidad}));
setDespacho(d);
setDespachoId(req.id);
setModal("despacho");
}
async function guardarDespacho(){
await supaPatch("requerimientos","?id=eq."+despachoId,{estado:"entregado",despacho}).catch(console.error);
setReqs(p=>p.map(r=>r.id===despachoId?{...r,estado:"entregado",despacho}:r));
setModal(null);
}
async function onXlsx(e){
const file=e.target.files[0];if(!file)return;e.target.value="";
if(!xlsxReady){alert("SheetJS cargando...");return;}
try{
const rows=await readXLSX(file);
const get=(row,names)=>{for(const n of names){const k=Object.keys(row).find(k=>k.toLowerCase().trim()===n);if(k!==undefined&&row[k]!=="")return row[k];}return "";};
const firstRow=rows[0]||{};
const sucursalArchivo=String(get(firstRow,["sucursal","branch"])||sucSel).trim();
const fechaArchivo=String(get(firstRow,["fecha","date"])||today()).trim();
const mapped=rows.map(row=>{
const nombreItem=String(get(row,["item","nombre","producto"])||"").trim();
const cant=parseFloat(get(row,["requerimiento","cantidad","qty","req"]))||0;
const prod=rp.find(r=>r.nombre.toLowerCase()===nombreItem.toLowerCase());
return prod?{prodId:prod.id,cantidad:cant}:null;
}).filter(i=>i&&i.cantidad>0);
if(!mapped.length){alert("No se encontraron ítems válidos.");return;}
setReqs(p=>[{id:Date.now(),sucursal:sucursalArchivo,fecha:fechaArchivo,semana:getWeek(),estado:"borrador",items:mapped,despacho:[]},...p]);
alert("Requerimiento importado como borrador: "+mapped.length+" productos.");
}catch(err){alert("Error: "+err.message);}
}
function descargarPlantilla(){
if(!xlsxReady){alert("SheetJS cargando...");return;}
const datos=rp.map(r=>({sucursal:sucSel,fecha:today(),item:r.nombre,unidad:r.unidad,requerimiento:0}));
const ws=window.XLSX.utils.json_to_sheet(datos);
const wb=window.XLSX.utils.book_new();
window.XLSX.utils.book_append_sheet(wb,ws,"Requerimiento");
window.XLSX.writeFile(wb,"requerimiento_"+sucSel.replace(/ /g,"_")+".xlsx");
}
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>REQUERIMIENTOS</h1>
<p style={{color:MUT,fontSize:13}}>Cada sucursal ingresa y envía su pedido al centro de producción</p>
</div>
<div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
<Btn v="success" s="sm" onClick={generarAutoReq}>⚡ Generar automático</Btn>
<Btn v="ghost" s="sm" onClick={descargarPlantilla} disabled={!xlsxReady}>📥 Plantilla</Btn>
<Btn v="ghost" s="sm" onClick={()=>refXlsx.current.click()} disabled={!xlsxReady}>📤 Subir Excel</Btn>
<input ref={refXlsx} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={onXlsx}/>
<Btn onClick={abrirNuevo} disabled={!!activo}>
{activo?"Hay req. activo":"+ Nuevo Requerimiento"}
</Btn>
</div>
</div>

{/* Selector de sucursal */}
<div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
  {sucsVisiblesReq.map(s=>{const a=sucSel===s;return <button key={s} onClick={()=>setSucSel(s)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT}}>{s}</button>;})}
</div>
{/* Requerimiento activo */}
{activo&&<Card xtra={{marginBottom:20,borderColor:activo.estado==="enviado"?ACC+"66":BRD}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
    <div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>
        {activo.estado==="borrador"?"BORRADOR":"ENVIADO"} — {activo.fecha}
      </div>
      <div style={{fontSize:12,color:MUT,marginTop:4}}>
        {activo.sucursal} · <Bdg c={eC[activo.estado]}>{eL[activo.estado]}</Bdg>
        {activo.estado==="borrador"&&<span style={{color:MUT,marginLeft:8}}>Puedes editar hasta enviarlo</span>}
        {activo.estado==="enviado"&&<span style={{color:ACC,marginLeft:8}}>Pedido confirmado — ingresa cantidades despachadas</span>}
      </div>
    </div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
      {activo.estado==="borrador"&&<>
        <Btn s="sm" v="ghost" onClick={()=>abrirEditar(activo)}>Editar</Btn>
        <Btn s="sm" onClick={()=>enviar(activo.id)}>Enviar pedido</Btn>
      </>}
      {activo.estado==="enviado"&&(!puede||puede("despacho"))&&
        <Btn s="sm" v="success" onClick={()=>abrirDespacho(activo)}>Ingresar despacho</Btn>
      }
    </div>
  </div>
  {/* Tabla: solicitado vs despachado */}
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Unidad</th>
        <th>Solicitado</th>
        {activo.estado==="enviado"&&<th style={{color:ACC}}>Despacho (pendiente)</th>}
      </tr>
    </thead>
    <tbody>
      {activo.items.map((it,i)=>{
        const prod=rp.find(r=>r.id===it.prodId);
        const nombA=it.itemNombre||prod?.nombre||"?";
        return <tr key={i}>
          <td style={{fontWeight:500}}>{nombA}</td>
          <td style={{color:MUT}}>{prod?.unidad||it.unidad||""}</td>
          <td style={{fontFamily:"'DM Mono'",color:ACC,fontWeight:600}}>{fmtN(it.cantidad)}</td>
          {activo.estado==="enviado"&&<td style={{color:MUT,fontSize:12}}>— ingresa con "Ingresar despacho"</td>}
        </tr>;
      })}
    </tbody>
  </table>
</Card>}
{/* Historial */}
<Card xtra={{padding:0}}>
  <div style={{padding:"16px 20px",borderBottom:b1(BRD)}}>
    <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>HISTORIAL — {sucSel.toUpperCase()}</span>
  </div>
  {reqsDeEsta.length===0
    ?<div style={{padding:32,textAlign:"center",color:MUT}}>Sin requerimientos registrados</div>
    :<table>
      <thead><tr><th>Fecha</th><th>Producto</th><th>Solicitado</th><th>Despachado</th><th>Estado</th></tr></thead>
      <tbody>
        {reqsDeEsta.map(req=>
          req.items.map((it,i)=>{
            const prod=rp.find(r=>r.id===it.prodId);
            const nomb2=it.itemNombre||prod?.nombre||"?";
            const disp=req.despacho?.find(d=>d.prodId===it.prodId);
            const diff=disp?disp.cantDespachada-it.cantidad:null;
            return <tr key={req.id+"-"+i}>
              {i===0&&<td style={{fontFamily:"'DM Mono'",fontSize:12,color:MUT,verticalAlign:"top"}} rowSpan={req.items.length}>{req.fecha}</td>}
              <td style={{fontWeight:500,fontSize:13}}>{it.itemNombre||prod?.nombre||"?"}</td>
              <td style={{fontFamily:"'DM Mono'"}}>{fmtN(it.cantidad)}</td>
              <td style={{fontFamily:"'DM Mono'",color:disp?diff<0?RED:GRN:MUT}}>
                {disp?fmtN(disp.cantDespachada):"—"}
                {disp&&diff!==0&&<span style={{fontSize:11,marginLeft:6}}>{diff>0?"+":""}{fmtN(diff)}</span>}
              </td>
              {i===0&&<td rowSpan={req.items.length}><Bdg c={eC[req.estado]||"muted"}>{eL[req.estado]||req.estado}</Bdg></td>}
            </tr>;
          })
        )}
      </tbody>
    </table>}
</Card>
{/* Modal: crear/editar requerimiento */}
{/* Modal requerimiento automático */}
{modalAutoReq&&autoReqData&&<ModalAutoReq
  data={autoReqData}
  rp={rp}
  provs={provs}
  xlsxReady={xlsxReady}
  onClose={()=>setModalAutoReq(false)}
  onConfirmProd={confirmarAutoReqProd}
  onExportarCompra={exportarOrdenCompra}
/>}
{modal==="form"&&<Mdl title={(editId?"EDITAR":"NUEVO")+" REQUERIMIENTO — "+sucSel.toUpperCase()} onClose={()=>setModal(null)}>
  <div style={{marginBottom:16}}>
    <LI label="Fecha"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{width:"100%"}}/></LI>
  </div>
  <div style={{marginBottom:12}}>
    <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Cantidades requeridas</div>
    {rp.map(r=>{
      const val=items.find(i=>i.prodId===r.id)?.cantidad||0;
      return <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 110px 60px",gap:10,marginBottom:10,alignItems:"center"}}>
        <div><div style={{fontWeight:500,fontSize:13}}>{r.nombre}</div><div style={{fontSize:11,color:MUT}}>{r.unidad}</div></div>
        <input type="number" min="0" step="0.01" value={val}
          onChange={e=>setItems(p=>[...p.filter(i=>i.prodId!==r.id),{prodId:r.id,cantidad:parseFloat(e.target.value)||0}])}
          style={{textAlign:"center"}}/>
        <span style={{fontSize:11,color:MUT}}>{r.unidad}</span>
      </div>;
    })}
  </div>
  <div style={{background:BG,borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:MUT}}>
    El requerimiento se guardará como <strong style={{color:TXT}}>Borrador</strong>. Podrás seguir editándolo hasta que presiones "Enviar pedido".
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
    <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
    <Btn onClick={guardar}>{editId?"Guardar cambios":"Crear borrador"}</Btn>
  </div>
</Mdl>}
{/* Modal: ingresar despacho */}
{modal==="despacho"&&<Mdl title={"INGRESAR DESPACHO — "+sucSel.toUpperCase()} onClose={()=>setModal(null)}>
  <div style={{background:BG,borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:MUT}}>
    Ingresa las cantidades que <strong style={{color:TXT}}>realmente se despacharán</strong>. Pueden ser iguales o menores a lo solicitado.
  </div>
  <table style={{marginBottom:16}}>
    <thead><tr><th>Producto</th><th>Solicitado</th><th>A despachar</th></tr></thead>
    <tbody>
      {reqs.find(r=>r.id===despachoId)?.items.map((it,i)=>{
        const prod=rp.find(r=>r.id===it.prodId);
        const val=despacho.find(d=>d.prodId===it.prodId)?.cantDespachada??it.cantidad;
        return <tr key={i}>
          <td style={{fontWeight:500}}>{it.itemNombre||prod?.nombre||"?"}</td>
          <td style={{fontFamily:"'DM Mono'",color:MUT}}>{fmtN(it.cantidad)}</td>
          <td>
            <input type="number" min="0" step="0.01" value={val}
              onChange={e=>setDespacho(p=>[...p.filter(d=>d.prodId!==it.prodId),{prodId:it.prodId,cantDespachada:parseFloat(e.target.value)||0}])}
              style={{width:100,textAlign:"center"}}/>
          </td>
        </tr>;
      })}
    </tbody>
  </table>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
    <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
    <Btn v="success" onClick={guardarDespacho}>Confirmar entrega</Btn>
  </div>
</Mdl>}

  </div>;
}
// ── Modal Requerimiento Automático ─────────────────────────────────────────
function ModalAutoReq({data,rp,provs,xlsxReady,onClose,onConfirmProd,onExportarCompra}){
const{prod,externos,fecha,sucursal}=data;
// Estado editable para cantidades de producción
const[prodConfirmado,setProdConfirmado]=useState(false);
const[cantsProd,setCantsProd]=useState(()=>{
const m={};
prod.forEach(({item,necesidad,rpId})=>{
const key=rpId||item.id;
m[key]=necesidad;
});
return m;
});
// Estado editable para cantidades de externos
const[cantsExt,setCantsExt]=useState(()=>{
const m={};
Object.entries(externos).forEach(([pid,{items}])=>{
items.forEach(({item,necesidad})=>{m[item.id]=necesidad;});
});
return m;
});
const hasProd=prod.length>0;
const hasExt=Object.keys(externos).length>0;
return <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div style={{background:CRD,border:b1(BRD),borderRadius:16,width:"100%",maxWidth:900,maxHeight:"90vh",overflow:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:b1(BRD)}}>
<div>
<span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>REQUERIMIENTO AUTOMÁTICO — {sucursal.toUpperCase()}</span>
<div style={{fontSize:12,color:MUT,marginTop:2}}>Basado en inventario cerrado del {fecha} · Edita las cantidades antes de confirmar</div>
</div>
<button onClick={onClose} style={{background:FNT,color:MUT,border:"none",borderRadius:6,padding:"4px 10px"}}>X</button>
</div>
<div style={{padding:24}}>

    {/* ── CENTRO DE PRODUCCIÓN ── */}
    {hasProd&&<div style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Bdg c="orange">Centro de Producción</Bdg>
        <span style={{fontSize:13,color:MUT}}>Se generará como requerimiento borrador editable</span>
        <span style={{fontSize:11,color:MUT}}>({prod.length} ítems)</span>
      </div>
      <table style={{marginBottom:14}}>
        <thead><tr><th>Ítem</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Necesidad</th><th>Cantidad a pedir</th></tr></thead>
        <tbody>
          {prod.map(({item,stockActual,necesidad,rpId})=>{
            const urgente=necesidad>0;
            return <tr key={item.id} style={{opacity:urgente?1:0.6}}>
              <td style={{fontWeight:500}}>
                {item.nombre}
                {urgente
                  ?<span style={{fontSize:10,color:RED,marginLeft:6,fontWeight:600}}>BAJO MÍNIMO</span>
                  :<span style={{fontSize:10,color:MUT,marginLeft:6}}>OK</span>
                }
              </td>
              <td style={{fontFamily:"'DM Mono'",color:urgente?RED:GRN}}>{fmtN(stockActual)}</td>
              <td style={{fontFamily:"'DM Mono'",color:BLU}}>{fmtN(item.stockMin||0)}</td>
              <td style={{fontFamily:"'DM Mono'",color:urgente?ACC:MUT,fontWeight:urgente?700:400}}>{urgente?fmtN(necesidad):"—"}</td>
              <td>
                <input type="number" step="0.01" min="0"
                  value={cantsProd[rpId||item.id]||0}
                  onChange={e=>setCantsProd(p=>({...p,[rpId||item.id]:parseFloat(e.target.value)||0}))}
                  style={{width:90,textAlign:"center",borderColor:urgente?ACC+"66":BRD}}/>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
      {prodConfirmado
        ?<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:GRN+"18",borderRadius:8,border:b1(GRN+"44")}}>
          <span style={{fontSize:18}}>✅</span>
          <div>
            <div style={{fontWeight:600,color:GRN,fontSize:13}}>Borrador creado exitosamente</div>
            <div style={{fontSize:12,color:MUT}}>Puedes editarlo en el módulo de Requerimientos antes de enviarlo</div>
          </div>
        </div>
        :<Btn onClick={()=>{
          const sel=prod.map(({item,rpId,necesidad})=>({
            rpId,
            itemNombre:item.nombre,
            cantidad:cantsProd[rpId||item.id]||necesidad
          }));
          onConfirmProd(sel);
          setProdConfirmado(true);
        }}>Crear requerimiento borrador (Producción)</Btn>
      }
    </div>}
    {/* ── OTROS PROVEEDORES ── */}
    {hasExt&&<div>
      {Object.entries(externos).map(([pid,{prov,items}])=>(
        <div key={pid} style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <Bdg c="blue">{prov.nombre}</Bdg>
              <span style={{fontSize:13,color:MUT}}>Orden de compra exportable a Excel</span>
            </div>
            <Btn s="sm" v="ghost" disabled={!xlsxReady} onClick={()=>{
              const its=items.map(({item,stockActual,necesidad})=>({
                item,stockActual,necesidad,cantidad:cantsExt[item.id]||necesidad
              }));
              onExportarCompra(prov.nombre,its);
            }}>📥 Exportar Excel</Btn>
          </div>
          <table>
            <thead><tr><th>Ítem</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Necesidad</th><th>Cantidad a pedir</th></tr></thead>
            <tbody>
              {items.map(({item,stockActual,necesidad})=><tr key={item.id}>
                <td style={{fontWeight:500}}>{item.nombre}</td>
                <td style={{fontFamily:"'DM Mono'",color:MUT}}>{fmtN(stockActual)}</td>
                <td style={{fontFamily:"'DM Mono'",color:BLU}}>{fmtN(item.stockMin||0)}</td>
                <td style={{fontFamily:"'DM Mono'",color:ACC}}>{fmtN(necesidad)}</td>
                <td>
                  <input type="number" step="0.01" min="0"
                    value={cantsExt[item.id]||0}
                    onChange={e=>setCantsExt(p=>({...p,[item.id]:parseFloat(e.target.value)||0}))}
                    style={{width:90,textAlign:"center"}}/>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ))}
    </div>}
    {!hasProd&&!hasExt&&<div style={{textAlign:"center",padding:32,color:MUT}}>
      No hay necesidades de reposición para esta sucursal.
    </div>}
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16,paddingTop:16,borderTop:b1(BRD)}}>
      <div style={{fontSize:12,color:MUT,flex:1,alignSelf:"center"}}>
        Cuando termines de exportar todas las órdenes, cierra esta pantalla.
      </div>
      <Btn onClick={onClose}>Cerrar y terminar</Btn>
    </div>
  </div>
</div>

  </div>;
}
// ── Lista de Compras ────────────────────────────────────────────────────────
function Comp({inv,sp,rp,reqs,hC,setHC}){
const[filProv,setFilProv]=useState("Todos");
// Todos los reqs pendientes o en proceso de todas las sucursales
const pendReqs=reqs.filter(r=>r.estado==="enviado");
// PASO 1: sumar requerimientos totales por prodId
const reqTotales={};
pendReqs.forEach(req=>{
req.items.forEach(it=>{reqTotales[it.prodId]=(reqTotales[it.prodId]||0)+it.cantidad;});
});
// PASO 2: calcular cuánto hay que elaborar (req total - stock producción)
const plan=rp.map(r=>{
const sa=sp.find(s=>s.recetaId===r.id)?.stock||0;
const tr=reqTotales[r.id]||0;
return{r,sa,tr,el:Math.max(0,tr-sa)};
});
// PASO 3: descomponer elaboración en ingredientes de inventario necesarios
const necProd={};
plan.forEach(({r,el})=>{
if(el<=0)return;
const tandas=el/r.rendimiento;
r.ings.forEach(ing=>{necProd[ing.invId]=(necProd[ing.invId]||0)+ing.cantidad*tandas;});
});
// PASO 4 eliminado — el stock mínimo ahora se incluye directamente en la fórmula del PASO 5
// PASO 5: consolidar — fórmula: Requerimiento + Stock Mínimo - Stock Actual
// Ejemplo: req=10, stockMin=10, stock=2 → comprar = 10 + 10 - 2 = 18
const todos=new Set([...Object.keys(necProd).map(Number),...inv.map(i=>i.id)]);
const lista=[...todos].map(id=>{
const item=inv.find(i=>i.id===id);if(!item)return null;
const porProd=necProd[id]||0;  // ingredientes necesarios para producción
// A comprar = lo que necesita producción + stock mínimo - stock actual
const aComprar=Math.max(0, porProd + item.stockMin - item.stock);
const mot=porProd>0&&item.stock<item.stockMin?"Ambos":porProd>0?"Producción":item.stock<item.stockMin?"Stock mínimo":null;
if(!mot||aComprar<=0.001)return null;
return{item,aComprar,porProd:porProd.toFixed(2),porStock:item.stockMin,sa:item.stock,mot};
}).filter(r=>r&&r.aComprar>0.001);
const provsList=["Todos",...[...new Set(lista.map(r=>r.item.proveedor||"Sin proveedor"))].sort((a,b)=>a.localeCompare(b,"es"))];
const listaFiltrada=filProv==="Todos"?lista:lista.filter(r=>(r.item.proveedor||"Sin proveedor")===filProv);
const tc=listaFiltrada.reduce((s,r)=>s+r.aComprar*r.item.costo,0);
const tcTotal=lista.reduce((s,r)=>s+r.aComprar*r.item.costo,0);
const re=plan.filter(e=>e.el>0);
function confirmar(){
setHC(p=>[{
id:Date.now(),fecha:today(),semana:getWeek(),
sucursales:pendReqs.map(r=>r.sucursal),
items:lista.map(r=>({nombre:r.item.nombre,cantidad:r.aComprar.toFixed(2),unidad:r.item.unidad,costoUnit:r.item.costo,total:r.aComprar*r.item.costo,motivo:r.mot})),
resumenElaboracion:re.map(e=>({producto:e.r.nombre,aElaborar:e.el,unidad:e.r.unidad})),
totalCosto:tc
},...p]);
alert("Lista de compras guardada en historial.");
}
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>LISTA DE COMPRAS SEMANAL</h1><p style={{color:MUT,fontSize:13}}>Requerimientos de todas las sucursales + stock mínimo</p></div>
<div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
{lista.length>0&&<select value={filProv} onChange={e=>setFilProv(e.target.value)} style={{fontSize:13}}>
  {provsList.map(p=><option key={p}>{p}</option>)}
</select>}
{listaFiltrada.length>0&&<Btn v="ghost" s="sm" onClick={()=>{
const style=document.createElement("style");
style.id="print-override";
style.innerHTML="@media print{body *{visibility:hidden!important;}#lista-compras-print,#lista-compras-print *{visibility:visible!important;}#lista-compras-print{position:fixed!important;top:0!important;left:0!important;width:100%!important;background:#fff!important;color:#000!important;padding:20px!important;}table{border-collapse:collapse!important;width:100%!important;}th,td{border:1px solid #ccc!important;padding:6px 10px!important;color:#000!important;background:#fff!important;}th{background:#f0f0f0!important;}}";
document.head.appendChild(style);
window.print();
setTimeout(()=>{const s=document.getElementById("print-override");if(s)s.remove();},1000);
}}>🖨 Imprimir</Btn>}
{listaFiltrada.length>0&&<Btn v="ghost" s="sm" onClick={()=>{
if(!window.XLSX){alert("SheetJS cargando, intenta en un momento.");return;}
const datos=listaFiltrada.map(r=>({
"Proveedor":r.item.proveedor||"Sin proveedor",
"Item":r.item.nombre,
"Categoria":r.item.categoria,
"Unidad":r.item.unidad,
"Stock Actual":r.sa,
"Stock Minimo":r.item.stockMin,
"A Comprar":parseFloat(r.aComprar.toFixed(4)),
"Costo Unit":r.item.costo,
"Total":parseFloat((r.aComprar*r.item.costo).toFixed(2)),
"Motivo":r.mot,
}));
const datos_sorted=[...datos].sort((a,b)=>a["Proveedor"].localeCompare(b["Proveedor"],"es"));
const ws=window.XLSX.utils.json_to_sheet(datos_sorted);
ws["!cols"]=[{wch:22},{wch:28},{wch:15},{wch:10},{wch:12},{wch:12},{wch:10},{wch:12},{wch:12},{wch:14}];
const wb=window.XLSX.utils.book_new();
const sufijo=filProv==="Todos"?"":("_"+filProv.replace(/\s+/g,"_"));
window.XLSX.utils.book_append_sheet(wb,ws,"Lista Compras");
window.XLSX.writeFile(wb,"lista_compras"+sufijo+"_"+today()+".xlsx");
}}>📥 Excel</Btn>}
{lista.length>0&&<Btn onClick={confirmar}>Confirmar Compra</Btn>}
</div>
</div>

{/* Resumen de reqs incluidos */}
{pendReqs.length>0&&<Card xtra={{marginBottom:20,borderColor:ACC+"33"}}>
  <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:ACC,marginBottom:10}}>REQUERIMIENTOS CONSIDERADOS</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10}}>
    {pendReqs.map(r=><div key={r.id} style={{background:BG,borderRadius:8,padding:10}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{r.sucursal}</div>
      <div style={{fontSize:11,color:MUT,marginBottom:6}}>{r.fecha} · <Bdg c="orange">{r.estado}</Bdg></div>
      {r.items.map((it,i)=>{const p=rp.find(x=>x.id===it.prodId);const pn=it.itemNombre||p?.nombre||"?";return <div key={i} style={{fontSize:12,color:MUT}}>{pn}: <span style={{color:TXT,fontFamily:"'DM Mono'"}}>{it.cantidad}</span></div>;})}
    </div>)}
  </div>
</Card>}
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
  <SC label="Ítems a Comprar" value={listaFiltrada.length} sub={filProv==="Todos"?"Todos los proveedores":filProv} icon="🛒"/>
  <SC label="Costo Estimado" value={fmt(tc)} sub={filProv==="Todos"?"Total orden":"Total filtrado · "+fmt(tcTotal)+" total"} color={GRN} icon="💵"/>
  <SC label="Prod. a Elaborar" value={re.length} sub="Tipos de productos" color={ACC} icon="🏭"/>
</div>
{re.length>0&&<Card xtra={{marginBottom:20,borderColor:ACC+"33"}}>
  <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,marginBottom:12}}>PLAN DE ELABORACIÓN</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
    {plan.map(({r,sa,tr,el})=><div key={r.id} style={{background:BG,borderRadius:8,padding:12,border:b1(el>0?ACC+"44":FNT)}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{r.nombre}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,textAlign:"center"}}>
        <div><div style={{fontSize:10,color:MUT}}>Req.</div><div style={{fontFamily:"'DM Mono'",fontSize:16}}>{fmtN(tr)}</div></div>
        <div><div style={{fontSize:10,color:MUT}}>Stock</div><div style={{fontFamily:"'DM Mono'",fontSize:16,color:GRN}}>{fmtN(sa)}</div></div>
        <div><div style={{fontSize:10,color:MUT}}>Elaborar</div><div style={{fontFamily:"'DM Mono'",fontSize:16,color:el>0?ACC:GRN,fontWeight:700}}>{fmtN(el)}</div></div>
      </div>
    </div>)}
  </div>
</Card>}
{lista.length===0
  ?<Card xtra={{textAlign:"center",padding:48}}><div style={{fontSize:32,marginBottom:12}}>OK</div><div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:GRN}}>SIN COMPRAS NECESARIAS</div><div style={{color:MUT,fontSize:13,marginTop:8}}>El inventario cubre todos los requerimientos y stocks mínimos</div></Card>
  :listaFiltrada.length===0
  ?<Card xtra={{textAlign:"center",padding:48,color:MUT}}>Sin ítems para el proveedor seleccionado.</Card>
  :<div id="lista-compras-print"><Card xtra={{padding:0}}>
    <table>
      <thead><tr><th>Proveedor</th><th>Ítem</th><th>Cat.</th><th>Stock Actual</th><th>Nec. Producción</th><th>Stock Mínimo</th><th>A Comprar</th><th>Unidad</th><th>Costo</th><th>Total</th><th>Motivo</th></tr></thead>
      <tbody>
        {[...listaFiltrada].sort((a,b)=>(a.item.proveedor||"").localeCompare(b.item.proveedor||"","es")).map((r,i)=><tr key={i}>
          <td style={{color:MUT,fontSize:12}}>{r.item.proveedor||"—"}</td>
          <td style={{fontWeight:500}}>{r.item.nombre}</td>
          <td style={{color:MUT,fontSize:12}}>{r.item.categoria}</td>
          <td style={{fontFamily:"'DM Mono'",color:MUT}}>{r.sa}</td>
          <td style={{fontFamily:"'DM Mono'",color:BLU}}>{r.porProd}</td>
          <td style={{fontFamily:"'DM Mono'",color:PRP}}>{r.porStock}</td>
          <td style={{fontFamily:"'DM Mono'",color:ACC,fontWeight:700}}>{r.aComprar.toFixed(2)}</td>
          <td style={{color:MUT}}>{r.item.unidad}</td>
          <td style={{fontFamily:"'DM Mono'"}}>{fmt(r.item.costo)}</td>
          <td style={{fontFamily:"'DM Mono'",color:GRN}}>{fmt(r.aComprar*r.item.costo)}</td>
          <td><Bdg c={r.mot==="Ambos"?"purple":r.mot==="Producción"?"blue":"orange"}>{r.mot}</Bdg></td>
        </tr>)}
        <tr><td colSpan={9} style={{textAlign:"right",fontWeight:600,paddingRight:20}}>TOTAL ESTIMADO</td><td style={{fontFamily:"'DM Mono'",color:ACC,fontWeight:700,fontSize:15}}>{fmt(tc)}</td><td></td></tr>
      </tbody>
    </table>
  </Card></div>}

  </div>;
}
// ── Cuadre de Caja ──────────────────────────────────────────────────────────
const BILL_D=[20,10,5,1];
const COIN_K=[100,50,25,10,5,1];
const COIN_V=[1,0.5,0.25,0.1,0.05,0.01];
function calcSaldo(bill,coin){
  const b=BILL_D.reduce((s,d)=>s+d*(parseFloat(bill[d])||0),0);
  const m=COIN_K.reduce((s,k,i)=>s+COIN_V[i]*(parseFloat(coin[k])||0),0);
  return b+m;
}
const F0_BILL={"20":0,"10":0,"5":0,"1":0};
const F0_COIN={"100":0,"50":0,"25":0,"10":0,"5":0,"1":0};
function formCaja0(userActivo,nextNum){
  return{fecha:today(),caja_num:nextNum,responsable:userActivo?.nombre||"",hora_inicio:"",hora_termino:"",ini_billetes:{...F0_BILL},ini_monedas:{...F0_COIN},fin_billetes:{...F0_BILL},fin_monedas:{...F0_COIN},ventas_medianet:0,nota_credito:0,pedidos_ya:0,uber:0,rappi:0,pagina_web:0,transferencias:0,propina:0,observaciones:"",pago_delivery:0,gastos_autorizados:0,reposicion_caja:0,total_contificado:0,venta_efectivo_entregado:0};
}
// Subcomponentes fuera de CierreCaja para evitar desmonte/remonte en cada render
function CajaDenomRow({qty,dVal,onChange,readOnly}){
  const total=dVal*(parseFloat(qty)||0);
  return <tr>
    <td style={{fontFamily:"'DM Mono'",color:MUT,textAlign:"right",paddingRight:12}}>${dVal%1===0?dVal:dVal.toFixed(2)}</td>
    <td>{readOnly
      ?<div style={{fontFamily:"'DM Mono'",textAlign:"center",padding:"4px 8px",color:MUT}}>{qty||0}</div>
      :<input type="number" min="0" placeholder="0" value={qty||""} onChange={e=>onChange(e.target.value)} style={{width:70,textAlign:"center"}}/>}
    </td>
    <td style={{fontFamily:"'DM Mono'",color:ACC,textAlign:"right"}}>${fmtN(total)}</td>
  </tr>;
}
function CajaDenomTable({billData,coinData,billSec,coinSec,onChangeDenom,readOnly}){
  const bTotal=calcSaldo(billData,F0_COIN);
  const cTotal=calcSaldo(F0_BILL,coinData);
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    <div>
      <div style={{fontSize:11,color:MUT,fontWeight:600,marginBottom:8,letterSpacing:1}}>BILLETES</div>
      <table style={{width:"100%"}}><thead><tr><th style={{fontSize:11}}>Denom.</th><th style={{fontSize:11}}>Cantidad</th><th style={{fontSize:11}}>Total</th></tr></thead>
      <tbody>
        {BILL_D.map(d=><CajaDenomRow key={d} qty={billData[d]||0} dVal={d} onChange={v=>onChangeDenom(billSec,String(d),v)} readOnly={readOnly}/>)}
        <tr style={{borderTop:"1px solid "+BRD}}><td colSpan={2} style={{fontWeight:600,fontSize:12,paddingTop:6}}>TOTAL</td><td style={{fontFamily:"'DM Mono'",color:GRN,fontWeight:700,textAlign:"right"}}>${fmtN(bTotal)}</td></tr>
      </tbody></table>
    </div>
    <div>
      <div style={{fontSize:11,color:MUT,fontWeight:600,marginBottom:8,letterSpacing:1}}>MONEDAS</div>
      <table style={{width:"100%"}}><thead><tr><th style={{fontSize:11}}>Denom.</th><th style={{fontSize:11}}>Cantidad</th><th style={{fontSize:11}}>Total</th></tr></thead>
      <tbody>
        {COIN_K.map((k,i)=><CajaDenomRow key={k} qty={coinData[k]||0} dVal={COIN_V[i]} onChange={v=>onChangeDenom(coinSec,String(k),v)} readOnly={readOnly}/>)}
        <tr style={{borderTop:"1px solid "+BRD}}><td colSpan={2} style={{fontWeight:600,fontSize:12,paddingTop:6}}>TOTAL</td><td style={{fontFamily:"'DM Mono'",color:GRN,fontWeight:700,textAlign:"right"}}>${fmtN(cTotal)}</td></tr>
      </tbody></table>
    </div>
  </div>;
}
function CajaValField({label,value,color}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+BRD+"44"}}>
    <span style={{fontSize:13,color:MUT}}>{label}</span>
    <span style={{fontFamily:"'DM Mono'",fontWeight:600,color:color||TXT}}>${fmtN(value)}</span>
  </div>;
}
function CajaNumInput({label,value,onChange,color,readOnly}){
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+BRD+"33"}}>
    <span style={{fontSize:13,color:MUT,flex:1}}>{label}</span>
    <input type="number" step="0.01" min="0" placeholder="0" value={value||""} onChange={e=>!readOnly&&onChange(parseFloat(e.target.value)||0)} disabled={readOnly} style={{width:110,textAlign:"right",fontFamily:"'DM Mono'",borderColor:color?color+"55":BRD}}/>
  </div>;
}
function Watermark({nombre}){
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180'><text x='50%' y='50%' transform='rotate(-25 150 90)' font-family='Arial' font-size='13' fill='rgba(240,237,230,0.055)' text-anchor='middle' dominant-baseline='middle'>${(nombre||"").replace(/[<>&'"]/g,"")}</text></svg>`;
  return <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:9998,backgroundImage:`url("data:image/svg+xml,${encodeURIComponent(svg)}")`,backgroundRepeat:"repeat",backgroundSize:"300px 180px"}}/>;
}
const ROLES_MANUAL=["admin_suc","staff_suc","produccion"];
function ytEmbed(url){const m=(url||"").match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);return m?`https://www.youtube.com/embed/${m[1]}`:null;}
function RenderBloque({b}){
  if(b.type==="heading")return <h3 style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1,marginTop:16,marginBottom:6,color:TXT}}>{b.text}</h3>;
  if(b.type==="paragraph")return <p style={{fontSize:14,lineHeight:1.8,color:TXT,marginBottom:10,whiteSpace:"pre-wrap"}}>{b.text}</p>;
  if(b.type==="bold")return <p style={{fontSize:14,fontWeight:700,color:TXT,marginBottom:10}}>{b.text}</p>;
  if(b.type==="list")return <ul style={{paddingLeft:22,marginBottom:10}}>{(b.items||[]).filter(Boolean).map((x,i)=><li key={i} style={{fontSize:14,lineHeight:1.7,color:TXT,marginBottom:3}}>{x}</li>)}</ul>;
  if(b.type==="image")return <div style={{marginBottom:14}}><img src={b.url} alt={b.caption||""} style={{maxWidth:"100%",borderRadius:8,border:"1px solid "+BRD}} onError={e=>e.target.style.display="none"}/>{b.caption&&<p style={{fontSize:12,color:MUT,marginTop:4,textAlign:"center"}}>{b.caption}</p>}</div>;
  if(b.type==="video"){const e=ytEmbed(b.url||"");return e?<div style={{marginBottom:14}}><div style={{position:"relative",paddingBottom:"56.25%",height:0,borderRadius:8,overflow:"hidden",border:"1px solid "+BRD}}><iframe src={e} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title={b.caption}/></div>{b.caption&&<p style={{fontSize:12,color:MUT,marginTop:4,textAlign:"center"}}>{b.caption}</p>}</div>:<p style={{color:RED,fontSize:12}}>⚠ URL de YouTube no válida</p>;}
  return null;
}
function EditorBloque({b,idx,total,onChange,onDelete,onUp,onDown}){
  return <div style={{border:"1px solid "+BRD,borderRadius:8,padding:12,marginBottom:8,background:SRF}}>
    <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
      <select value={b.type} onChange={e=>onChange({type:e.target.value,text:"",url:"",caption:"",items:[]})} style={{flex:1,fontSize:12}}>
        <option value="heading">Título de sección</option>
        <option value="paragraph">Párrafo</option>
        <option value="bold">Texto destacado</option>
        <option value="list">Lista con viñetas</option>
        <option value="image">Imagen (URL)</option>
        <option value="video">Video YouTube</option>
      </select>
      {idx>0&&<button onClick={onUp} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",cursor:"pointer"}}>↑</button>}
      {idx<total-1&&<button onClick={onDown} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",cursor:"pointer"}}>↓</button>}
      <button onClick={onDelete} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",cursor:"pointer"}}>✕</button>
    </div>
    {["heading","paragraph","bold"].includes(b.type)&&<textarea value={b.text||""} onChange={e=>onChange({...b,text:e.target.value})} rows={b.type==="paragraph"?3:1} style={{width:"100%",fontSize:13,resize:"vertical",background:BG,color:TXT,border:"1px solid "+BRD,borderRadius:6,padding:"6px 10px"}} placeholder={b.type==="heading"?"Título de sección":b.type==="bold"?"Texto importante":"Contenido del párrafo..."}/>}
    {b.type==="list"&&<textarea value={(b.items||[]).join("\n")} onChange={e=>onChange({...b,items:e.target.value.split("\n")})} rows={4} style={{width:"100%",fontSize:13,resize:"vertical",background:BG,color:TXT,border:"1px solid "+BRD,borderRadius:6,padding:"6px 10px"}} placeholder={"Un ítem por línea\nPaso 1\nPaso 2"}/>}
    {(b.type==="image"||b.type==="video")&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
      <input value={b.url||""} onChange={e=>onChange({...b,url:e.target.value})} style={{width:"100%",fontSize:12}} placeholder={b.type==="image"?"URL de imagen (https://...)":"URL de YouTube"}/>
      <input value={b.caption||""} onChange={e=>onChange({...b,caption:e.target.value})} style={{width:"100%",fontSize:12}} placeholder="Descripción opcional"/>
    </div>}
  </div>;
}
function Manual({manualTemas,setManualTemas,manualArticulos,setManualArticulos,userActivo}){
  const esSA=userActivo?.rol==="superadmin";
  const miRol=userActivo?.rol;
  const[vista,setVista]=useState("lista"); // "lista"|"tema"|"art"|"editTema"|"editArt"
  const[temaId,setTemaId]=useState(null);
  const[artId,setArtId]=useState(null);
  const[busq,setBusq]=useState("");
  const[fTema,setFTema]=useState(null);
  const[fArt,setFArt]=useState(null);
  const[confirmar,setConfirmar]=useState(null);

  const temasVis=manualTemas.filter(t=>esSA||(t.roles_acceso||[]).includes(miRol)).sort((a,b)=>a.orden-b.orden);
  const temaAct=manualTemas.find(t=>t.id===temaId);
  const artsDelTema=manualArticulos.filter(a=>a.tema_id===temaId).sort((a,b)=>a.orden-b.orden);
  const artAct=manualArticulos.find(a=>a.id===artId);
  const bq=busq.toLowerCase().trim();
  const temasFil=bq?temasVis.filter(t=>t.titulo.toLowerCase().includes(bq)||t.descripcion.toLowerCase().includes(bq)||manualArticulos.filter(a=>a.tema_id===t.id).some(a=>a.titulo.toLowerCase().includes(bq)||JSON.stringify(a.contenido).toLowerCase().includes(bq))):temasVis;

  function FT0(){return{titulo:"",descripcion:"",icono:"📄",color:ACC,orden:manualTemas.length,roles_acceso:["superadmin",...ROLES_MANUAL]};}
  function FA0(tId){return{tema_id:tId,titulo:"",contenido:[],orden:artsDelTema.length};}
  function chgB(i,v){setFArt(p=>({...p,contenido:p.contenido.map((b,j)=>j===i?v:b)}));}
  function delB(i){setFArt(p=>({...p,contenido:p.contenido.filter((_,j)=>j!==i)}));}
  function movB(i,d){setFArt(p=>{const c=[...p.contenido];const t2=i+d;if(t2<0||t2>=c.length)return p;[c[i],c[t2]]=[c[t2],c[i]];return{...p,contenido:c};});}
  function addB(type){setFArt(p=>({...p,contenido:[...p.contenido,{type,text:"",url:"",caption:"",items:[]}]}));}

  async function saveTema(){
    if(!fTema.titulo.trim()){alert("El título es obligatorio");return;}
    const data={titulo:fTema.titulo.trim(),descripcion:fTema.descripcion,icono:fTema.icono||"📄",color:fTema.color||ACC,orden:typeof fTema.orden==="number"?fTema.orden:manualTemas.length,roles_acceso:fTema.roles_acceso||["superadmin"]};
    if(fTema.id){await supaPatch("manual_temas","?id=eq."+fTema.id,data).catch(console.error);setManualTemas(p=>p.map(t=>t.id===fTema.id?{...t,...data}:t));}
    else{const[cr]=await supaPost("manual_temas",data).catch(()=>[data]);setManualTemas(p=>[...p,{...data,id:cr?.id||Date.now()}]);}
    setFTema(null);
  }
  async function saveArt(){
    if(!fArt.titulo.trim()){alert("El título es obligatorio");return;}
    const data={tema_id:fArt.tema_id,titulo:fArt.titulo.trim(),contenido:fArt.contenido,orden:typeof fArt.orden==="number"?fArt.orden:artsDelTema.length};
    if(fArt.id){await supaPatch("manual_articulos","?id=eq."+fArt.id,data).catch(console.error);setManualArticulos(p=>p.map(a=>a.id===fArt.id?{...a,...data}:a));}
    else{const[cr]=await supaPost("manual_articulos",data).catch(()=>[data]);setManualArticulos(p=>[...p,{...data,id:cr?.id||Date.now()}]);}
    setFArt(null);setVista("tema");
  }

  // ── OVERLAY FORM (tema) ──────────────────────────────────────────────────────
  const overlayStyle={position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20};
  const panelStyle={background:CRD,border:"1px solid "+BRD,borderRadius:12,padding:24,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"};

  if(fTema)return <div style={overlayStyle}>
    <div style={panelStyle}>
      <h2 style={{fontFamily:"'Bebas Neue'",fontSize:22,marginBottom:16}}>{fTema.id?"Editar Tema":"Nuevo Tema"}</h2>
      <LI label="Título *"><input value={fTema.titulo} onChange={e=>setFTema(p=>({...p,titulo:e.target.value}))} placeholder="Ej: Proceso de Limpieza" style={{width:"100%"}}/></LI>
      <LI label="Descripción"><textarea value={fTema.descripcion} onChange={e=>setFTema(p=>({...p,descripcion:e.target.value}))} rows={2} style={{width:"100%",fontSize:13,resize:"vertical",background:BG,color:TXT,border:"1px solid "+BRD,borderRadius:6,padding:"8px 12px"}} placeholder="Breve descripción del tema..."/></LI>
      <LI label="Ícono (emoji)"><input value={fTema.icono} onChange={e=>setFTema(p=>({...p,icono:e.target.value}))} style={{width:72}} maxLength={4}/></LI>
      <LI label="Color de acento">
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[ACC,GRN,BLU,RED,PRP,"#20B2AA","#FF8C00","#9ACD32"].map(c=><button key={c} onClick={()=>setFTema(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:"50%",background:c,border:fTema.color===c?"3px solid "+TXT:"3px solid transparent",cursor:"pointer"}}/>)}
        </div>
      </LI>
      <LI label="¿Quién puede verlo?">
        <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:4}}>
          {ROLES_MANUAL.map(r=>{const chk=(fTema.roles_acceso||[]).includes(r);return <label key={r} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={()=>setFTema(p=>({...p,roles_acceso:chk?p.roles_acceso.filter(x=>x!==r):[...p.roles_acceso,r]}))}/>{r}</label>;})}
          <span style={{fontSize:11,color:MUT,alignSelf:"center"}}>(superadmin siempre tiene acceso)</span>
        </div>
      </LI>
      <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
        <Btn v="ghost" onClick={()=>setFTema(null)}>Cancelar</Btn>
        <Btn onClick={saveTema}>Guardar</Btn>
      </div>
    </div>
  </div>;

  // ── EDIT ARTICLE ─────────────────────────────────────────────────────────────
  if(fArt)return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>{fArt.id?"EDITAR ARTÍCULO":"NUEVO ARTÍCULO"}</h1>
      <div style={{display:"flex",gap:8}}>
        <Btn v="ghost" onClick={()=>{setFArt(null);setVista(fArt.id?"art":"tema");}}>← Cancelar</Btn>
        <Btn onClick={saveArt}>Guardar</Btn>
      </div>
    </div>
    <Card xtra={{marginBottom:16}}>
      <LI label="Título *"><input value={fArt.titulo} onChange={e=>setFArt(p=>({...p,titulo:e.target.value}))} placeholder="Título del artículo" style={{width:"100%"}}/></LI>
    </Card>
    <Card xtra={{marginBottom:16}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Contenido</div>
      {fArt.contenido.map((b,i)=><EditorBloque key={i} b={b} idx={i} total={fArt.contenido.length} onChange={v=>chgB(i,v)} onDelete={()=>delB(i)} onUp={()=>movB(i,-1)} onDown={()=>movB(i,1)}/>)}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
        {[["heading","+ Título"],["paragraph","+ Párrafo"],["bold","+ Destacado"],["list","+ Lista"],["image","+ Imagen"],["video","+ Video"]].map(([t,l])=><button key={t} onClick={()=>addB(t)} style={{fontSize:12,padding:"6px 12px",background:FNT,color:MUT,border:"1px dashed "+BRD,borderRadius:6,cursor:"pointer"}}>{l}</button>)}
      </div>
    </Card>
  </div>;

  // ── VIEW ARTICLE ─────────────────────────────────────────────────────────────
  if(vista==="art"&&artAct)return <div style={{maxWidth:720}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <Btn v="ghost" onClick={()=>setVista("tema")}>← {temaAct?.titulo||"Volver"}</Btn>
      {esSA&&<Btn v="ghost" s="sm" onClick={()=>{setFArt({...artAct});setVista("editArt");}}>✏️ Editar</Btn>}
    </div>
    <Card>
      <h2 style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:1,marginBottom:16,color:temaAct?.color||ACC}}>{artAct.titulo}</h2>
      {(artAct.contenido||[]).map((b,i)=><RenderBloque key={i} b={b}/>)}
    </Card>
  </div>;

  // ── TEMA VIEW (list of articles) ──────────────────────────────────────────────
  if(vista==="tema"&&temaAct)return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div>
        <Btn v="ghost" s="sm" onClick={()=>{setVista("lista");setBusq("");}}>← Manual</Btn>
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:32}}>{temaAct.icono||"📄"}</span>
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:1,color:temaAct.color||ACC}}>{temaAct.titulo}</h1>
            {temaAct.descripcion&&<p style={{color:MUT,fontSize:13,marginTop:2}}>{temaAct.descripcion}</p>}
          </div>
        </div>
      </div>
      {esSA&&<Btn onClick={()=>{setFArt(FA0(temaId));}}>+ Nuevo Artículo</Btn>}
    </div>
    {artsDelTema.length===0
      ?<Card xtra={{textAlign:"center",padding:40,color:MUT}}>No hay artículos en este tema aún.</Card>
      :<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {artsDelTema.map(a=><div key={a.id} style={{background:CRD,border:"1px solid "+BRD,borderRadius:10,padding:"16px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{setArtId(a.id);setVista("art");}}>
          <div>
            <div style={{fontWeight:600,fontSize:14,color:TXT}}>{a.titulo}</div>
            <div style={{fontSize:12,color:MUT,marginTop:2}}>{(a.contenido||[]).length} bloque{(a.contenido||[]).length!==1?"s":""}</div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
            {esSA&&<><button onClick={()=>setFArt({...a})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>✏️ Editar</button>
            <button onClick={()=>setConfirmar({msg:"¿Eliminar «"+a.titulo+"»?",fn:async()=>{await supaDelete("manual_articulos","?id=eq."+a.id).catch(console.error);setManualArticulos(p=>p.filter(x=>x.id!==a.id));}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>✕</button></>}
            <span style={{color:MUT,fontSize:16}}>›</span>
          </div>
        </div>)}
      </div>}
    {confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}
  </div>;

  // ── LISTA PRINCIPAL ───────────────────────────────────────────────────────────
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>MANUAL DE PROCEDIMIENTOS</h1><p style={{color:MUT,fontSize:13}}>Guías, políticas y procesos BORGERS</p></div>
      {esSA&&<Btn onClick={()=>setFTema(FT0())}>+ Nuevo Tema</Btn>}
    </div>
    <div style={{position:"relative",marginBottom:20}}>
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:MUT,pointerEvents:"none",fontSize:14}}>🔍</span>
      <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="Buscar en el manual..." style={{width:"100%",paddingLeft:36}}/>
    </div>
    {temasFil.length===0
      ?<Card xtra={{textAlign:"center",padding:48,color:MUT}}>{busq?"Sin resultados para \""+busq+"\"":(esSA?"Crea el primer tema con el botón + Nuevo Tema":"No hay contenido disponible.")}</Card>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>
        {temasFil.map(t=>{const n=manualArticulos.filter(a=>a.tema_id===t.id).length;return <div key={t.id} style={{background:CRD,border:"1px solid "+BRD,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"border-color 0.15s"}} onClick={()=>{setTemaId(t.id);setBusq("");setVista("tema");}}>
          <div style={{height:5,background:t.color||ACC}}/>
          <div style={{padding:18}}>
            <div style={{fontSize:34,marginBottom:8}}>{t.icono||"📄"}</div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:19,letterSpacing:1,marginBottom:6,color:TXT}}>{t.titulo}</div>
            {t.descripcion&&<p style={{fontSize:12,color:MUT,marginBottom:10,lineHeight:1.6}}>{t.descripcion}</p>}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
              <span style={{fontSize:12,color:MUT}}>{n} artículo{n!==1?"s":""}</span>
              {esSA&&<div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setFTema({...t})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✏️</button>
                <button onClick={()=>setConfirmar({msg:"¿Eliminar tema «"+t.titulo+"» y todos sus artículos?",fn:async()=>{await supaDelete("manual_temas","?id=eq."+t.id).catch(console.error);setManualTemas(p=>p.filter(x=>x.id!==t.id));setManualArticulos(p=>p.filter(x=>x.tema_id!==t.id));}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>}
            </div>
          </div>
        </div>;})}
      </div>}
    {confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}
  </div>;
}
function CierreCaja({cierresCaja,setCierresCaja,sucs,userActivo,puede}){
const esAdmin=puede("config_total")||userActivo?.rol==="admin_suc";
const sucsV=userActivo?.rol==="superadmin"?sucs:sucs.filter(s=>s===userActivo?.sucursal);
const[sucSel,setSucSel]=useState(sucsV[0]||"");
const[vista,setVista]=useState("lista");
const[editId,setEditId]=useState(null);
const[modoVer,setModoVer]=useState(false);
const nextNum=()=>{const ns=cierresCaja.filter(c=>c.sucursal===sucSel);return ns.length>0?Math.max(...ns.map(c=>c.caja_num||0))+1:1;};
const[form,setForm]=useState(()=>formCaja0(userActivo,1));
const[confirmar,setConfirmar]=useState(null);
function F(k,v){setForm(p=>({...p,[k]:v}));}
function FB(sec,denom,val){setForm(p=>({...p,[sec]:{...p[sec],[denom]:parseFloat(val)||0}}));}
// Calculated
const saldoIni=calcSaldo(form.ini_billetes,form.ini_monedas);
const saldoFin=calcSaldo(form.fin_billetes,form.fin_monedas);
const totalEq=["ventas_medianet","nota_credito","pedidos_ya","uber","rappi","pagina_web","transferencias","total_contificado"].reduce((s,k)=>s+(parseFloat(form[k])||0),0);
const ventaEfectivo=saldoFin-saldoIni+(parseFloat(form.pago_delivery)||0)+(parseFloat(form.gastos_autorizados)||0)-(parseFloat(form.reposicion_caja)||0);
const totalContificado=parseFloat(form.total_contificado)||0;
const calcFaltante=Math.max(0,totalContificado-ventaEfectivo);
const calcSobrante=Math.max(0,ventaEfectivo-totalContificado);
const saldoFinalAlCierre=saldoFin-(parseFloat(form.venta_efectivo_entregado)||0);
function abrirNuevo(){
  const nn=nextNum();
  setForm(formCaja0(userActivo,nn));
  setEditId(null);
  setVista("form");
}
function abrirEditar(c){
  setForm({fecha:(c.fecha||"").slice(0,10)||today(),caja_num:c.caja_num,responsable:c.responsable||"",hora_inicio:c.hora_inicio||"",hora_termino:c.hora_termino||"",ini_billetes:{...F0_BILL,...(c.ini_billetes||{})},ini_monedas:{...F0_COIN,...(c.ini_monedas||{})},fin_billetes:{...F0_BILL,...(c.fin_billetes||{})},fin_monedas:{...F0_COIN,...(c.fin_monedas||{})},ventas_medianet:c.ventas_medianet||0,nota_credito:c.nota_credito||0,pedidos_ya:c.pedidos_ya||0,uber:c.uber||0,rappi:c.rappi||0,pagina_web:c.pagina_web||0,transferencias:c.transferencias||0,propina:c.propina||0,observaciones:c.observaciones||"",pago_delivery:c.pago_delivery||0,gastos_autorizados:c.gastos_autorizados||0,reposicion_caja:c.reposicion_caja||0,total_contificado:c.total_contificado||0,venta_efectivo_entregado:c.venta_efectivo_entregado||0});
  setEditId(c.id);
  setModoVer(false);
  setVista("form");
}
function abrirVer(c){
  abrirEditar(c);
  setModoVer(true);
}
const HORA_RX=/^(0[0-9]|1[0-2]):[0-5][0-9] ?(am|pm)$/i;
function horaValida(h){return HORA_RX.test((h||"").trim());}
async function guardar(cerrar){
  if(!form.responsable.trim()){alert("El nombre del responsable es obligatorio.");return;}
  if(!form.caja_num){alert("El número de caja es obligatorio.");return;}
  if(!form.fecha){alert("La fecha es obligatoria.");return;}
  if(!horaValida(form.hora_inicio)){alert("Hora inicio inválida.\nFormato: 09:30 am  o  01:45 pm");return;}
  if(!horaValida(form.hora_termino)){alert("Hora término inválida.\nFormato: 09:30 am  o  01:45 pm");return;}
  if((calcFaltante>0||calcSobrante>0)&&!form.observaciones.trim()){alert("Existe una diferencia (faltante/sobrante). Debe ingresar una observación con la explicación.");return;}
  const esCerradoActual=editId&&cierresCaja.find(c=>c.id===editId)?.estado==="cerrado";
  const data={...form,faltante:calcFaltante,sobrante:calcSobrante,sucursal:sucSel,estado:cerrar||esCerradoActual?"cerrado":"borrador"};
  if(editId){
    await supaPatch("cierres_caja","?id=eq."+editId,data).catch(console.error);
    setCierresCaja(p=>p.map(c=>c.id===editId?{...c,...data}:c));
  }else{
    const[created]=await supaPost("cierres_caja",data).catch(()=>[data]);
    setCierresCaja(p=>[{...data,id:created?.id||Date.now()},...p]);
  }
  setVista("lista");
}
const cierresSuc=[...cierresCaja.filter(c=>c.sucursal===sucSel)].sort((a,b)=>b.caja_num-a.caja_num);
if(vista==="form"){
  const cerrado=editId&&cierresCaja.find(c=>c.id===editId)?.estado==="cerrado";
  const bloqueado=(cerrado&&!esAdmin)||modoVer;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
      <div>
        <h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>CUADRE DE CAJA</h1>
        <p style={{color:MUT,fontSize:13}}>{sucSel}{cerrado&&<Bdg c="green" xtra={{marginLeft:8}}>CERRADO</Bdg>}</p>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn v="ghost" onClick={()=>{setVista("lista");setModoVer(false);}}>← Volver</Btn>
        {!bloqueado&&<Btn v="ghost" onClick={()=>guardar(false)}>💾 Guardar borrador</Btn>}
        {!bloqueado&&<Btn v="success" onClick={()=>setConfirmar({msg:"¿Confirmar y cerrar esta caja? El staff no podrá editarla después.",fn:()=>guardar(true)})}>✓ Cerrar Caja</Btn>}
        {cerrado&&esAdmin&&!modoVer&&<Btn onClick={()=>guardar(false)}>Guardar cambios</Btn>}
        {modoVer&&(!cerrado||esAdmin)&&<Btn v="ghost" onClick={()=>setModoVer(false)}>✏️ Editar</Btn>}
      </div>
    </div>
    {/* Header */}
    <Card xtra={{marginBottom:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
        <LI label="Fecha"><input type="date" value={form.fecha} onChange={e=>F("fecha",e.target.value)} disabled={bloqueado} style={{width:"100%"}}/></LI>
        <LI label="Caja #">
          {esAdmin
            ?<input type="number" value={form.caja_num||""} placeholder="1" onChange={e=>F("caja_num",parseInt(e.target.value)||1)} style={{width:"100%"}}/>
            :<div style={{fontFamily:"'DM Mono'",padding:"8px 12px",background:FNT,borderRadius:6,fontSize:14,fontWeight:600}}>{form.caja_num}</div>}
        </LI>
        <LI label="Responsable *"><input value={form.responsable} onChange={e=>F("responsable",e.target.value)} disabled={bloqueado} placeholder="Nombre completo..." style={{width:"100%",borderColor:!form.responsable.trim()?RED+"66":BRD}}/></LI>
        <LI label="Hora inicio *"><input type="text" value={form.hora_inicio} onChange={e=>F("hora_inicio",e.target.value)} disabled={bloqueado} placeholder="09:30 am" style={{width:"100%",borderColor:!bloqueado&&form.hora_inicio&&!horaValida(form.hora_inicio)?RED+"66":BRD}}/></LI>
        <LI label="Hora término *"><input type="text" value={form.hora_termino} onChange={e=>F("hora_termino",e.target.value)} disabled={bloqueado} placeholder="09:30 am" style={{width:"100%",borderColor:!bloqueado&&form.hora_termino&&!horaValida(form.hora_termino)?RED+"66":BRD}}/></LI>
      </div>
    </Card>
    {/* Sección 1 */}
    <Card xtra={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1}}>1. SALDO INICIAL</div>
        <div style={{fontFamily:"'DM Mono'",fontSize:22,fontWeight:700,color:ACC}}>${fmtN(saldoIni)}</div>
      </div>
      <CajaDenomTable billData={form.ini_billetes} coinData={form.ini_monedas} billSec="ini_billetes" coinSec="ini_monedas" onChangeDenom={FB} readOnly={bloqueado}/>
    </Card>
    {/* Sección 2 — GASTOS */}
    <Card xtra={{marginBottom:16}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:12}}>2. GASTOS</div>
      <CajaNumInput label="Pago delivery" value={form.pago_delivery} onChange={v=>F("pago_delivery",v)} color={RED} readOnly={bloqueado}/>
      <CajaNumInput label="Gastos autorizados" value={form.gastos_autorizados} onChange={v=>F("gastos_autorizados",v)} color={RED} readOnly={bloqueado}/>
      <CajaNumInput label="Reposición de caja" value={form.reposicion_caja} onChange={v=>F("reposicion_caja",v)} readOnly={bloqueado}/>
    </Card>
    {/* Sección 3 — SALDO FINAL EN CAJA */}
    <Card xtra={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1}}>3. SALDO FINAL EN CAJA</div>
        <div style={{fontFamily:"'DM Mono'",fontSize:22,fontWeight:700,color:GRN}}>${fmtN(saldoFin)}</div>
      </div>
      <CajaDenomTable billData={form.fin_billetes} coinData={form.fin_monedas} billSec="fin_billetes" coinSec="fin_monedas" onChangeDenom={FB} readOnly={bloqueado}/>
    </Card>
    {/* Sección 4 — EQUIVALENTES */}
    <Card xtra={{marginBottom:16}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:12}}>4. EQUIVALENTES</div>
      <CajaNumInput label="Total ventas Medianet/Contifico" value={form.ventas_medianet} onChange={v=>F("ventas_medianet",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Nota de crédito Contifico" value={form.nota_credito} onChange={v=>F("nota_credito",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Pedidos Ya" value={form.pedidos_ya} onChange={v=>F("pedidos_ya",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Uber" value={form.uber} onChange={v=>F("uber",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Rappi" value={form.rappi} onChange={v=>F("rappi",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Página web (Tiendita)" value={form.pagina_web} onChange={v=>F("pagina_web",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Transferencias" value={form.transferencias} onChange={v=>F("transferencias",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Propina" value={form.propina} onChange={v=>F("propina",v)} readOnly={bloqueado}/>
      <CajaNumInput label="Total efectivo Contifico" value={form.total_contificado} onChange={v=>F("total_contificado",v)} readOnly={bloqueado}/>
      <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",marginTop:4}}>
        <span style={{fontWeight:600}}>TOTAL EQUIVALENTES</span>
        <span style={{fontFamily:"'DM Mono'",fontWeight:700,fontSize:16,color:ACC}}>${fmtN(totalEq)}</span>
      </div>
    </Card>
    {/* Sección 5 — DIFERENCIAS */}
    <Card xtra={{marginBottom:16,borderColor:calcFaltante>0?RED+"44":calcSobrante>0?GRN+"44":BRD}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:14}}>5. DIFERENCIAS</div>
      {/* Cálculo venta en efectivo */}
      <div style={{background:FNT,borderRadius:8,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:11,color:MUT,fontWeight:600,letterSpacing:1,marginBottom:8}}>CÁLCULO VENTA EN EFECTIVO</div>
        <CajaValField label="Saldo final en caja" value={saldoFin} color={BLU}/>
        <CajaValField label="− Saldo inicial" value={saldoIni} color={RED}/>
        <CajaValField label="+ Gastos (delivery + autorizados)" value={(parseFloat(form.pago_delivery)||0)+(parseFloat(form.gastos_autorizados)||0)} color={GRN}/>
        <CajaValField label="− Reposición de caja" value={parseFloat(form.reposicion_caja)||0} color={RED}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginTop:4,borderTop:"1px solid "+BRD}}>
          <span style={{fontWeight:700,fontSize:13}}>VENTA EN EFECTIVO</span>
          <span style={{fontFamily:"'DM Mono'",fontWeight:700,fontSize:18,color:ventaEfectivo>=0?ACC:RED}}>${fmtN(ventaEfectivo)}</span>
        </div>
      </div>
      <div style={{marginTop:8}}>
        <CajaValField label="Faltante" value={calcFaltante} color={calcFaltante>0?RED:MUT}/>
        <CajaValField label="Sobrante" value={calcSobrante} color={calcSobrante>0?GRN:MUT}/>
      </div>
      {/* Observaciones — obligatorio si hay diferencia */}
      <div style={{marginTop:12}}>
        <div style={{fontSize:12,color:(calcFaltante>0||calcSobrante>0)?RED:MUT,fontWeight:600,marginBottom:4}}>
          {(calcFaltante>0||calcSobrante>0)?"OBSERVACIONES *  (obligatorio — existe diferencia)":"OBSERVACIONES"}
        </div>
        <textarea value={form.observaciones} onChange={e=>F("observaciones",e.target.value)} disabled={bloqueado} rows={2}
          style={{width:"100%",fontSize:13,resize:"vertical",background:BG,color:TXT,border:"1px solid "+((calcFaltante>0||calcSobrante>0)&&!form.observaciones.trim()?RED+"66":BRD),borderRadius:6,padding:"8px 12px"}}
          placeholder={(calcFaltante>0||calcSobrante>0)?"Explique la razón de la diferencia...":"Observaciones generales..."}/>
      </div>
    </Card>
    {/* Entrega y cierre */}
    <Card xtra={{borderColor:ACC+"44",marginBottom:24}}>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:14}}>ENTREGA Y CIERRE</div>
      <CajaNumInput label="Valor de venta efectivo entregado" value={form.venta_efectivo_entregado} onChange={v=>F("venta_efectivo_entregado",v)} readOnly={bloqueado}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:6,borderTop:"1px solid "+BRD}}>
        <span style={{fontWeight:700,fontSize:13}}>SALDO FINAL EN CAJA AL CIERRE</span>
        <span style={{fontFamily:"'DM Mono'",fontWeight:700,fontSize:22,color:saldoFinalAlCierre>=0?ACC:RED}}>${fmtN(saldoFinalAlCierre)}</span>
      </div>
      <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid "+BRD+"44",fontSize:13,color:MUT,lineHeight:1.8}}>
        Se finaliza el presente cuadre de caja. Responsable:{" "}
        <span style={{fontWeight:600,color:TXT}}>{form.responsable||"___________"}</span>.
      </div>
    </Card>
    {confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}
  </div>;
}
// Vista lista / historial
return <div>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
    <div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>CUADRE DE CAJA</h1><p style={{color:MUT,fontSize:13}}>Registro y cierre de caja por sucursal</p></div>
    <Btn onClick={abrirNuevo}>+ Nuevo Cuadre</Btn>
  </div>
  {sucsV.length>1&&<div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
    {sucsV.map(s=>{const a=sucSel===s;return <button key={s} onClick={()=>setSucSel(s)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT}}>{s}</button>;})}
  </div>}
  {cierresSuc.length===0
    ?<Card xtra={{textAlign:"center",padding:48,color:MUT}}>Sin cuadres de caja registrados para {sucSel}.</Card>
    :<Card xtra={{padding:0}}>
      <table>
        <thead><tr><th>Fecha</th><th>Caja #</th><th>Responsable</th><th>Hora Inicio</th><th>Hora Término</th><th>Total Cierre</th><th>Estado</th><th></th></tr></thead>
        <tbody>{cierresSuc.map(c=>{
          const sf=calcSaldo({...F0_BILL,...(c.fin_billetes||{})},{...F0_COIN,...(c.fin_monedas||{})});
          const tc=sf-(c.venta_efectivo_entregado||0);
          const cerrado=c.estado==="cerrado";
          return <tr key={c.id}>
            <td>{c.fecha}</td>
            <td style={{fontFamily:"'DM Mono'",fontWeight:600}}>{c.caja_num}</td>
            <td style={{fontWeight:500}}>{c.responsable}</td>
            <td style={{color:MUT,fontSize:12}}>{c.hora_inicio||"—"}</td>
            <td style={{color:MUT,fontSize:12}}>{c.hora_termino||"—"}</td>
            <td style={{fontFamily:"'DM Mono'",color:ACC,fontWeight:600}}>${fmtN(tc)}</td>
            <td><Bdg c={cerrado?"green":"orange"}>{cerrado?"Cerrado":"Borrador"}</Bdg></td>
            <td>
              <div style={{display:"flex",gap:6}}>
                {(cerrado||esAdmin)&&<button onClick={()=>abrirVer(c)} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Ver</button>}
                {(!cerrado||esAdmin)&&<button onClick={()=>abrirEditar(c)} style={{background:cerrado?ACC+"18":GRN+"18",color:cerrado?ACC:GRN,border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Editar</button>}
                {esAdmin&&<button onClick={()=>setConfirmar({msg:"¿Eliminar este cuadre de caja?",fn:async()=>{await supaDelete("cierres_caja","?id=eq."+c.id).catch(console.error);setCierresCaja(p=>p.filter(x=>x.id!==c.id));}})} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>X</button>}
              </div>
            </td>
          </tr>;
        })}</tbody>
      </table>
    </Card>}
  {confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}
</div>;
}
// ── Inventario Sucursales ───────────────────────────────────────────────────
function InvSuc({sucs,cats2,invSucs,setInvSucs,regsSucs,setRegsSucs,rv,setRv,ventas:ventasProp,xlsxReady,provs,puede,userActivo,marcas,sucsMarcas}){
// Filtrar sucursales según usuario
const sucsVisibles=(userActivo&&(userActivo.rol==="admin_suc"||userActivo.rol==="staff_suc"))
?sucs.filter(s=>s===userActivo.sucursal)
:sucs;
const[sucSel,setSucSel]=useState(sucsVisibles[0]||"");
const[vista,setVista]=useState("hoy");
const[filCat,setFilCat]=useState("Todas");
// Fecha independiente por sucursal: {nombreSucursal: "YYYY-MM-DD"}
const[fechas,setFechas]=useState({});
const[modal,setModal]=useState(null);
const[editItem,setEditItem]=useState(null);
const[formItem,setFormItem]=useState({nombre:"",categoria:cats2[0]||"",unidad:"",stockMin:0,proveedorId:provs[0]?.id||1,marcas:[]});
const[confirmar,setConfirmar]=useState(null);
const[importPreview,setImportPreview]=useState(null);
const[diaCerrado,setDiaCerrado]=useState(false);
const[modalNuevoInv,setModalNuevoInv]=useState(false);
const[nuevaFechaInv,setNuevaFechaInv]=useState("");
const refXlsx=useRef();
const stockMinTimer=useRef({});
// Función auxiliar: normaliza nombre sucursal para columna Excel
const normSuc=s=>"stockMin_"+s;
// Inline stockMin por sucursal
function setStockMinItem(itemId,suc,valor){
const newVal=parseFloat(valor)||0;
setInvSucs(p=>{
const next=p.map(s=>s.sucursal!==suc?s:{...s,items:s.items.map(i=>i.id!==itemId?i:{...i,stockMin:newVal})});
clearTimeout(stockMinTimer.current[suc]);
stockMinTimer.current[suc]=setTimeout(()=>{
const sData=next.find(s=>s.sucursal===suc);
if(sData)syncInvSuc(suc,sData.items);
},800);
return next;
});
}
// Fecha activa de la sucursal seleccionada
const fecha=fechas[sucSel]||today();
function setFecha(f){setFechas(p=>({...p,[sucSel]:f}));}
// Ítems de esta sucursal — si no existe la entrada, la crea
const sucData=invSucs.find(s=>s.sucursal===sucSel)||{sucursal:sucSel,items:[]};
useEffect(()=>{
if(sucSel&&!invSucs.find(s=>s.sucursal===sucSel)){
setInvSucs(p=>[...p,{sucursal:sucSel,items:[]}]);
}
},[sucSel]);
function matchMarcas(itemMarcas,sucMarcasArr){if(!sucMarcasArr||sucMarcasArr.length===0)return true;if(!itemMarcas||itemMarcas.length===0)return true;if(itemMarcas.includes("General"))return true;return itemMarcas.some(m=>sucMarcasArr.includes(m));}
const items=[...sucData.items].filter(i=>matchMarcas(i.marcas,sucsMarcas?.[sucSel]||[])).sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"));
// Registro de hoy para esta sucursal
const regHoy=regsSucs.find(r=>r.sucursal===sucSel&&r.fecha===fecha);
// Sincronizar estado de cierre con el registro real de cada sucursal
useEffect(()=>{
const reg=regsSucs.find(r=>r.sucursal===sucSel&&r.fecha===fecha);
setDiaCerrado(reg?.estado==="cerrado"||false);
},[sucSel,fecha,regsSucs]);
// Verificar si hay ventas del día ya registradas (para mostrar estado)
// Las ventas se acceden desde props ventas global (pasadas por InvSuc si se agrega)
// Por ahora el egreso ya viene calculado en regsSucs via confirmarDia
// Registro del día anterior para pre-cargar inv inicial
const fechaAyer=regsSucs
.filter(r=>r.sucursal===sucSel&&r.fecha<fecha)
.sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
// Calcular egreso desde ventas del día
// ventas viene de Cos — como no tenemos acceso directo, las guardamos en regsSucs
function calcEgreso(itemId,fec,suc,rvList){
// Buscar ventas de esa fecha y sucursal en el registro
const reg=regsSucs.find(r=>r.sucursal===suc&&r.fecha===fec);
const ventasDia=reg?.ventas||[];
// Para cada venta, buscar en las recetas qué ingredientes usa
let total=0;
ventasDia.forEach(v=>{
const rec=rvList.find(r=>r.id===v.rId);
if(!rec)return;
// Buscar si algún ingrediente de la receta coincide con este ítem por nombre
const item=sucData.items.find(i=>i.id===itemId);
if(!item)return;
rec.ings.forEach(ing=>{
if(ing.tipo==="prod")return; // solo ingredientes directos
// match por nombre aproximado
// Para simplificar, dejamos que el usuario lo vincule por nombre exacto
});
});
// Egreso calculado desde ventas guardadas en el registro
const filasReg=reg?.filas||[];
const fila=filasReg.find(f=>f.itemId===itemId);
return fila?.egreso||0;
}
// Obtener valor de una fila del registro de hoy
function getVal(itemId,campo){
if(!regHoy)return "";
const fila=regHoy.filas.find(f=>f.itemId===itemId);
if(!fila)return "";
return fila[campo]??""  ;
}
// Calcular egreso automático desde ventas del día
function calcEgresoAuto(itemId,fec,suc){
const reg=regsSucs.find(r=>r.sucursal===suc&&r.fecha===fec);
const ventasDia=reg?.ventas||[];
const item=sucData.items.find(i=>i.id===itemId);
if(!item)return 0;
let total=0;
ventasDia.forEach(v=>{
const rec=rv.find(r=>r.id===v.rId);
if(!rec)return;
rec.ings.forEach(ing=>{
if(ing.tipo!=="inv")return;
// match por nombre del item del inventario de producción vs item de sucursal
// por ahora match exacto de nombre
if(ing.nombre===item.nombre||
(ing.refNombre&&ing.refNombre.toLowerCase()===item.nombre.toLowerCase()))
total+=ing.cantidad*v.cant;
});
});
return total;
}
// Inicializar o actualizar registro del día
// Calcular próximo número de inventario para una sucursal
function nextNumInv(suc,regsArr){
const regs=regsArr||regsSucs;
const nums=regs.filter(r=>r.sucursal===suc&&r.numInv).map(r=>r.numInv);
return nums.length>0?Math.max(...nums)+1:1;
}
// Obtener día siguiente en formato YYYY-MM-DD
function diaSiguiente(fec){
const d=new Date(fec+"T12:00:00");
d.setDate(d.getDate()+1);
return d.toISOString().split("T")[0];
}
function asegurarReg(fec,suc,itemsList){
const itsToUse=itemsList||sucData.items;
setRegsSucs(p=>{
const existe=p.find(r=>r.sucursal===suc&&r.fecha===fec);
// Solo tomar el último registro CERRADO como base para inv inicial
const ant=[...p]
.filter(r=>r.sucursal===suc&&r.fecha<fec&&r.estado==="cerrado")
.sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];

  function getInvInicial(itemId){
    if(!ant)return 0;
    const filaAnt=ant.filas.find(f=>f.itemId===itemId);
    if(!filaAnt)return 0;
    if(filaAnt.stockReal!=null&&filaAnt.stockReal!=="")
      return parseFloat(filaAnt.stockReal)||0;
    return parseFloat(filaAnt.stockFinal)||0;
  }
  if(!existe){
    const filas=itsToUse.map(i=>{
      const invInicial=getInvInicial(i.id);
      return{itemId:i.id,invInicial,ingreso:0,egreso:0,stockFinal:invInicial,stockReal:"",obs:""};
    });
    const nuevoReg={numInv:nextNumInv(suc,p),sucursal:suc,fecha:fec,filas,ventas:[],estado:"abierto"};
    supaPost("registros_sucursales",nuevoReg).then(([created])=>{
      if(created?.id) setRegsSucs(pp=>pp.map(r=>r.sucursal===suc&&r.fecha===fec&&r.id>1000000000000?{...r,id:created.id}:r));
    }).catch(console.error);
    return[...p,{id:Date.now(),...nuevoReg}];
  }else{
    const idsExistentes=new Set(existe.filas.map(f=>f.itemId));
    const faltantes=itsToUse.filter(i=>!idsExistentes.has(i.id));
    if(faltantes.length===0)return p;
    const nuevasFilas=faltantes.map(i=>{
      const invInicial=getInvInicial(i.id);
      return{itemId:i.id,invInicial,ingreso:0,egreso:0,stockFinal:invInicial,stockReal:"",obs:""};
    });
    return p.map(r=>r.sucursal===suc&&r.fecha===fec?{...r,filas:[...r.filas,...nuevasFilas]}:r);
  }
});

}
// Actualizar campo de una fila
const saveRegTimer=useRef(null);
function setFila(itemId,campo,valor){
setRegsSucs(p=>{
const next=p.map(r=>{
if(r.sucursal!==sucSel||r.fecha!==fecha)return r;
const filas=r.filas.map(f=>{
if(f.itemId!==itemId)return f;
const upd={...f,[campo]:valor};
const ini=parseFloat(upd.invInicial)||0;
const ing=parseFloat(upd.ingreso)||0;
const egr=parseFloat(upd.egreso)||0;
upd.stockFinal=ini+ing-egr;
return upd;
});
return{...r,filas};
});
// debounce save
clearTimeout(saveRegTimer.current);
saveRegTimer.current=setTimeout(()=>{
const reg=next.find(r=>r.sucursal===sucSel&&r.fecha===fecha);
if(reg){
if(reg.id&&reg.id<1000000000000){
supaPatch("registros_sucursales","?id=eq."+reg.id,{filas:reg.filas}).catch(console.error);
}else{
const{id:_,...data}=reg;
supaPost("registros_sucursales",data).then(([created])=>{
if(created?.id) setRegsSucs(pp=>pp.map(r=>r.sucursal===sucSel&&r.fecha===fecha?{...r,id:created.id}:r));
}).catch(console.error);
}
}
},800);
return next;
});
}
function syncInvSuc(suc,nuevoItems){
  supaPatch("inventario_sucursales","?sucursal=eq."+encodeURIComponent(suc),{items:nuevoItems}).catch(console.error);
}
// CRUD ítems (global — aplica a todas las sucursales)
function saveItem(){
if(!formItem.nombre.trim())return;
const oldNombre=editItem?.nombre;
const newNombre=formItem.nombre.trim();
let updated;
if(editItem){
// Editar: actualiza campos globales en TODAS las sucursales, respeta stockMin de cada una
updated=invSucs.map(s=>({...s,items:s.items.map(i=>i.id===editItem.id?{...i,nombre:newNombre,categoria:formItem.categoria,unidad:formItem.unidad,proveedorId:formItem.proveedorId,marcas:formItem.marcas||[]}:i)}));
}else{
// Nuevo ítem: agrega a TODAS las sucursales con stockMin=0
const newId=Math.max(0,...invSucs.flatMap(s=>s.items.map(i=>i.id||0)))+1;
updated=invSucs.map(s=>({...s,items:[...s.items,{id:newId,nombre:newNombre,categoria:formItem.categoria,unidad:formItem.unidad,proveedorId:formItem.proveedorId,stockMin:0,marcas:formItem.marcas||[]}]}));
}
setInvSucs(updated);
updated.forEach(s=>syncInvSuc(s.sucursal,s.items));
// Propagar cambio de nombre a recetas de venta
if(editItem&&oldNombre!==newNombre){
const updatedRv=rv.map(r=>({...r,ings:r.ings.map(ing=>ing.sucItemNombre===oldNombre?{...ing,sucItemNombre:newNombre}:ing)}));
setRv(updatedRv);
updatedRv.filter(r=>r.ings.some(ing=>ing.sucItemNombre===newNombre))
.forEach(r=>supaPatch("recetas_venta","?id=eq."+r.id,{ings:r.ings}).catch(console.error));
}
setModal(null);setEditItem(null);setFormItem({nombre:"",categoria:cats2[0]||"",unidad:"",proveedorId:provs[0]?.id||1,marcas:[]});
}
function eliminarItem(id){
const item=invSucs[0]?.items.find(i=>i.id===id);
setConfirmar({msg:"¿Eliminar ítem \""+(item?.nombre||id)+"\" de TODAS las sucursales?",fn:()=>{
const updated=invSucs.map(s=>({...s,items:s.items.filter(i=>i.id!==id)}));
setInvSucs(updated);
updated.forEach(s=>syncInvSuc(s.sucursal,s.items));
}});
}
// Excel import
async function onXlsx(e){
const file=e.target.files[0];if(!file)return;e.target.value="";
if(!xlsxReady){alert("SheetJS cargando...");return;}
try{
const rows=await readXLSX(file);
const get=(row,names)=>{for(const n of names){const k=Object.keys(row).find(k=>k.toLowerCase().trim()===n);if(k!==undefined&&row[k]!=="")return row[k];}return "";};
// Detectar columnas stockMin por sucursal: "stockMin_NombreSucursal"
const colKeys=rows.length>0?Object.keys(rows[0]):[];
const sucColMap={}; // {sucursal: columnaExcel}
sucs.forEach(suc=>{
const target=normSuc(suc).toLowerCase();
const found=colKeys.find(k=>k.toLowerCase().trim()===target.toLowerCase());
if(found)sucColMap[suc]=found;
});
const existingItems=invSucs[0]?.items||[];
const mapped=rows.map((row,idx)=>{
const nombreProv=String(get(row,["proveedor","supplier","prov"])||"").trim();
const provMatch=provs.find(p=>p.nombre.toLowerCase()===nombreProv.toLowerCase()||p.nombre.toLowerCase().includes(nombreProv.toLowerCase()));
const nombre=String(get(row,["nombre","item","name"])||"").trim();
const existente=existingItems.find(i=>i.nombre.toLowerCase()===nombre.toLowerCase());
const stockMins={};
sucs.forEach(suc=>{
const col=sucColMap[suc];
if(col&&row[col]!==undefined&&row[col]!=="")stockMins[suc]=parseFloat(row[col])||0;
else stockMins[suc]=existente?invSucs.find(s=>s.sucursal===suc)?.items.find(i=>i.nombre.toLowerCase()===nombre.toLowerCase())?.stockMin||0:0;
});
const marcasItem=marcas.filter(m=>{const v=String(row["marca_"+m.nombre]||"").toLowerCase().trim();return v==="si"||v==="sí"||v==="1"||v==="true";}).map(m=>m.nombre);
return{
id:existente?.id||(idx+100),
nombre,
categoria:String(get(row,["categoria","categoría","category"])||cats2[0]||"").trim(),
unidad:String(get(row,["unidad","unit","ud"])||"").trim(),
proveedorId:provMatch?.id||provs[0]?.id||1,
stockMins,
marcas:marcasItem,
};
}).filter(i=>i.nombre);
if(!mapped.length){alert("No se encontraron ítems válidos.");return;}
setImportPreview(mapped);setModal("importar");
}catch(err){alert("Error: "+err.message);}
}
function confirmarImport(){
// Asignar IDs únicos a ítems nuevos (sin id existente)
let maxId=Math.max(0,...invSucs.flatMap(s=>s.items.map(i=>i.id||0)));
const withIds=importPreview.map(i=>{
if(i.id&&i.id<100)return i;
maxId++;return{...i,id:maxId};
});
// Aplicar a TODAS las sucursales con stockMin independiente
const updated=invSucs.map(s=>({
...s,
items:withIds.map(i=>({id:i.id,nombre:i.nombre,categoria:i.categoria,unidad:i.unidad,proveedorId:i.proveedorId,stockMin:i.stockMins[s.sucursal]??0,marcas:i.marcas||[]}))
}));
setInvSucs(updated);
updated.forEach(s=>syncInvSuc(s.sucursal,s.items));
setImportPreview(null);setModal(null);
alert(withIds.length+" ítems importados en todas las sucursales.");
}
function descargarPlantilla(){
if(!xlsxReady){alert("SheetJS cargando...");return;}
// Usar ítems existentes (primera sucursal como referencia) o ejemplos si no hay
const refItems=invSucs[0]?.items||[];
const base=refItems.length>0?refItems:[
{nombre:"Bolita de carne 120g",categoria:"Carnes",unidad:"und",proveedorId:1},
{nombre:"Pan de hamburguesa",categoria:"Panadería",unidad:"und",proveedorId:4},
];
const datos=base.map(i=>{
const prov=provs.find(p=>p.id===i.proveedorId);
const row={nombre:i.nombre,categoria:i.categoria,unidad:i.unidad,proveedor:prov?.nombre||""};
sucs.forEach(suc=>{
const sm=invSucs.find(s=>s.sucursal===suc)?.items.find(x=>x.id===i.id)?.stockMin||0;
row[normSuc(suc)]=sm;
});
marcas.forEach(m=>{row["marca_"+m.nombre]=(i.marcas||[]).includes(m.nombre)?"si":"no";});
return row;
});
const ws=window.XLSX.utils.json_to_sheet(datos);
const colWidths=[{wch:25},{wch:15},{wch:10},{wch:25},...sucs.map(()=>({wch:18})),...marcas.map(()=>({wch:18}))];
ws["!cols"]=colWidths;
const wb=window.XLSX.utils.book_new();
window.XLSX.utils.book_append_sheet(wb,ws,"Items");
window.XLSX.writeFile(wb,"plantilla_items.xlsx");
}
// Al cambiar sucursal o fecha, asegurar registro
useEffect(()=>{
if(sucSel&&fecha&&items.length>0)asegurarReg(fecha,sucSel,items);
},[sucSel,fecha,items.length,regsSucs.filter(r=>r.sucursal===sucSel&&r.estado==="cerrado").length]);
const eC={borrador:"muted",cerrado:"green"};
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>INVENTARIO SUCURSALES</h1>
<p style={{color:MUT,fontSize:13}}>Control diario de stock por sucursal</p>
</div>
<div style={{display:"flex",gap:8}}>
{vista==="items"&&puede("config_total")&&<>
<Btn v="ghost" s="sm" onClick={descargarPlantilla} disabled={!xlsxReady}>📥 Plantilla</Btn>
<Btn v="ghost" s="sm" onClick={()=>refXlsx.current.click()} disabled={!xlsxReady}>📤 Subir Excel</Btn>
<input ref={refXlsx} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={onXlsx}/>
<Btn s="sm" onClick={()=>{setEditItem(null);setFormItem({nombre:"",categoria:cats2[0]||"",unidad:""});setModal("item");}}>+ Agregar ítem</Btn>
</>}
</div>
</div>

{/* Selector sucursal */}
<div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
  {sucsVisibles.map(s=>{const a=sucSel===s;return <button key={s} onClick={()=>setSucSel(s)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT}}>{s}</button>;})}
</div>
{/* Sub-tabs */}
<div style={{display:"flex",gap:8,marginBottom:20}}>
  {[["hoy","📋 Registro del Día"],["items","📦 Ítems"],["historial","🕐 Historial"]].filter(([id])=>id!=="items"||puede("config_total")).map(([id,l])=>{
    const a=vista===id;
    return <button key={id} onClick={()=>setVista(id)} style={{padding:"7px 16px",borderRadius:8,fontSize:12,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT,fontWeight:a?600:400}}>{l}</button>;
  })}
</div>
{/* ── REGISTRO DEL DÍA ── */}
{vista==="hoy"&&<div>
  <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
    <LI label="Fecha del registro">
      <input type="date" value={fecha} onChange={e=>{setFecha(e.target.value);}} style={{width:180}}/>
    </LI>
    {items.length===0&&<div style={{color:MUT,fontSize:13,marginTop:16}}>Esta sucursal no tiene ítems configurados. Ve a la pestaña "Ítems" para agregar.</div>}
  </div>
  {items.length>0&&<>
  <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
    {["Todas",...[...new Set(items.map(i=>i.categoria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"))].map(c=>{
      const a=filCat===c;
      return <button key={c} onClick={()=>setFilCat(c)} style={{padding:"5px 14px",borderRadius:6,fontSize:12,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT,fontWeight:a?600:400}}>{c}</button>;
    })}
  </div>
  <Card xtra={{padding:0}}>
    <div style={{overflowX:"auto"}}>
      <table>
        <thead>
          <tr>
            <th>Ítem</th><th>Categoría</th><th>Unidad</th>
            <th style={{color:BLU}}>Inv. Inicial</th>
            <th style={{color:GRN}}>Ingreso</th>
            <th style={{color:RED}}>Egreso</th>
            <th style={{color:ACC}}>Stock Final</th>
            <th style={{color:PRP}}>Stock Real</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {items.filter(i=>filCat==="Todas"||i.categoria===filCat).map(item=>{
            const fila=regHoy?.filas.find(f=>f.itemId===item.id)||{invInicial:0,ingreso:0,egreso:0,stockFinal:0,stockReal:"",obs:""};
            const sf=(parseFloat(fila.invInicial)||0)+(parseFloat(fila.ingreso)||0)-(parseFloat(fila.egreso)||0);
            const diff=fila.stockReal!==""?(parseFloat(fila.stockReal)||0)-sf:null;
            const esStaff=userActivo?.rol==="staff_suc";
            return <tr key={item.id}>
              <td style={{fontWeight:500,minWidth:140}}>{item.nombre}</td>
              <td style={{color:MUT,fontSize:12}}>{item.categoria}</td>
              <td style={{color:MUT,fontSize:12}}>{item.unidad}</td>
              <td>
                {esStaff
                  ?<div style={{fontFamily:"'DM Mono'",fontSize:13,textAlign:"center",color:BLU,padding:"8px 12px",background:BLU+"0A",borderRadius:6,border:b1(BLU+"22")}}>{fmtN(parseFloat(fila.invInicial)||0)}</div>
                  :<input type="number" step="0.01" placeholder="0" value={fila.invInicial||""}
                    onChange={e=>setFila(item.id,"invInicial",parseFloat(e.target.value)||0)}
                    style={{width:80,textAlign:"center",borderColor:BLU+"66"}}/>}
              </td>
              <td>
                <input type="number" step="0.01" placeholder="0" value={fila.ingreso||""}
                  onChange={e=>setFila(item.id,"ingreso",parseFloat(e.target.value)||0)}
                  style={{width:80,textAlign:"center",borderColor:GRN+"66"}}/>
              </td>
              <td>
                <div style={{fontFamily:"'DM Mono'",fontSize:13,textAlign:"center",color:RED,padding:"8px 12px",background:RED+"0A",borderRadius:6,border:b1(RED+"22")}}>
                  {fmtN(parseFloat(fila.egreso)||0)}
                </div>
              </td>
              <td>
                <div style={{fontFamily:"'DM Mono'",fontSize:13,textAlign:"center",color:ACC,fontWeight:700,padding:"8px 12px"}}>
                  {fmtN(sf)}
                </div>
              </td>
              <td>
                <input type="number" step="0.01" placeholder="0" value={fila.stockReal||""}
                  onChange={e=>setFila(item.id,"stockReal",e.target.value)}
                  style={{width:80,textAlign:"center",borderColor:PRP+"66"}}/>
                {diff!==null&&<div style={{fontSize:10,textAlign:"center",color:diff===0?GRN:diff>0?BLU:RED,marginTop:2}}>{diff>0?"+":""}{fmtN(diff)}</div>}
              </td>
              <td>
                <input value={fila.obs||""}
                  onChange={e=>setFila(item.id,"obs",e.target.value)}
                  placeholder="Observación..."
                  style={{width:160,fontSize:12}}/>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
    <div style={{padding:"12px 20px",borderTop:b1(BRD),display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
      {(()=>{
        // Ventas registradas para esta sucursal y fecha
        const ventasDelDia=(ventasProp||[]).filter(v=>v.sucursal===sucSel&&v.fecha===fecha);
        const hayVentas=ventasDelDia.length>0;
        return <>
          <div style={{fontSize:12,color:MUT}}>
            {hayVentas
              ?ventasDelDia.length+" venta(s) registrada(s) — egresos calculados automáticamente"
              :<span style={{color:ACC}}>⚠ Registra las ventas del día antes de cerrar</span>
            }
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {diaCerrado
              ?<>
                <Bdg c="green">Día cerrado</Bdg>
                <Btn s="sm" v="ghost" onClick={()=>{
                  setRegsSucs(p=>p.map(r=>r.sucursal===sucSel&&r.fecha===fecha?{...r,estado:"abierto"}:r));
                  setDiaCerrado(false);
                }}>Reabrir</Btn>
                <Btn s="sm" onClick={()=>{
                  setNuevaFechaInv(diaSiguiente(fecha));
                  setModalNuevoInv(true);
                }}>+ Abrir nuevo inventario</Btn>
              </>
              :<Btn s="sm" v="success" disabled={!hayVentas}
                xtra={!hayVentas?{opacity:0.4,cursor:"not-allowed"}:{}}
                onClick={async()=>{
                  if(!hayVentas)return;
                  let regFinal=null;
                  setRegsSucs(p=>{
                    const existe=p.find(r=>r.sucursal===sucSel&&r.fecha===fecha);
                    if(existe){
                      regFinal={...existe,estado:"cerrado"};
                      return p.map(r=>r.sucursal===sucSel&&r.fecha===fecha?regFinal:r);
                    }else{
                      const filas=items.map(i=>({itemId:i.id,invInicial:0,ingreso:0,egreso:0,stockFinal:0,stockReal:"",obs:""}));
                      regFinal={id:Date.now(),numInv:nextNumInv(sucSel,p),sucursal:sucSel,fecha,filas,ventas:[],estado:"cerrado"};
                      return[...p,regFinal];
                    }
                  });
                  if(regFinal){
                    if(regFinal.id&&typeof regFinal.id==="number"&&regFinal.id>1000000000000){
                      const{id:_,...data}=regFinal;
                      supaPost("registros_sucursales",data).catch(console.error);
                    }else{
                      supaPatch("registros_sucursales","?id=eq."+regFinal.id,{estado:"cerrado"}).catch(console.error);
                    }
                  }
                  setDiaCerrado(true);
                }}>Cerrar día</Btn>
            }
          </div>
        </>;
      })()}
    </div>
  </Card>
  </>}
</div>}
{/* ── ÍTEMS ── */}
{vista==="items"&&<div>
  {(invSucs[0]?.items||[]).length===0
    ?<Card xtra={{textAlign:"center",padding:48,color:MUT}}>Sin ítems. Agrega manualmente o importa desde Excel.</Card>
    :<Card xtra={{padding:0}}>
      <div style={{overflowX:"auto"}}>
      <table>
        <thead><tr>
          <th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Proveedor</th>
          {sucs.map(s=><th key={s} style={{color:ACC,whiteSpace:"nowrap"}}>StockMín<br/><span style={{fontSize:10,fontWeight:400,color:MUT}}>{s}</span></th>)}
          {puede("config_total")&&<th></th>}
        </tr></thead>
        <tbody>{[...(invSucs[0]?.items||[])].sort((a,b)=>a.nombre.localeCompare(b.nombre,"es")).map(i=>{
          const prov=provs.find(p=>p.id===i.proveedorId);
          return <tr key={i.id}>
            <td style={{fontWeight:500,minWidth:160}}>{i.nombre}</td>
            <td style={{color:MUT}}>{i.categoria}</td>
            <td style={{color:MUT}}>{i.unidad}</td>
            <td style={{fontSize:12}}><Bdg c={prov?.tipo==="produccion"?"orange":"blue"}>{prov?.nombre||"—"}</Bdg></td>
            {sucs.map(suc=>{
              const sm=invSucs.find(s=>s.sucursal===suc)?.items.find(x=>x.id===i.id)?.stockMin||0;
              return <td key={suc}>
                <input type="number" step="0.01" placeholder="0" value={sm||""}
                  onChange={e=>setStockMinItem(i.id,suc,e.target.value)}
                  style={{width:70,textAlign:"center",fontFamily:"'DM Mono'",fontSize:12}}/>
              </td>;
            })}
            {puede("config_total")&&<td><div style={{display:"flex",gap:6}}>
              <button onClick={()=>{setEditItem(i);setFormItem({nombre:i.nombre,categoria:i.categoria,unidad:i.unidad,proveedorId:i.proveedorId||provs[0]?.id||1,marcas:i.marcas||[]});setModal("item");}} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
              <button onClick={()=>eliminarItem(i.id)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
            </div></td>}
          </tr>;
        })}
        </tbody>
      </table>
      </div>
    </Card>}
</div>}
{/* ── HISTORIAL ── */}
{vista==="historial"&&<HistInvSuc regsSucs={regsSucs} sucSel={sucSel} sucData={sucData} items={items}/>}
{/* Modal abrir nuevo inventario */}
{modalNuevoInv&&<Mdl title={"ABRIR NUEVO INVENTARIO — "+sucSel.toUpperCase()} onClose={()=>setModalNuevoInv(false)}>
  <div style={{background:BG,borderRadius:8,padding:14,marginBottom:20,fontSize:13,color:MUT}}>
    Se creará un nuevo registro pre-cargando el <strong style={{color:TXT}}>Inv. Inicial</strong> de cada ítem con el <strong style={{color:TXT}}>Stock Real</strong> del cierre anterior (o el Stock Final si no se ingresó Stock Real).
  </div>
  <LI label="Fecha del nuevo inventario">
    <input type="date" value={nuevaFechaInv} onChange={e=>setNuevaFechaInv(e.target.value)} style={{width:"100%"}}/>
  </LI>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
    <Btn v="ghost" onClick={()=>setModalNuevoInv(false)}>Cancelar</Btn>
    <Btn onClick={()=>{
      if(!nuevaFechaInv){return;}
      let nuevoData=null;
      setRegsSucs(p=>{
        const ultCierre=[...p]
          .filter(r=>r.sucursal===sucSel&&r.estado==="cerrado")
          .sort((a,b)=>b.fecha.localeCompare(a.fecha))[0];
        const filas=items.map(i=>{
          const filaAnt=ultCierre?.filas.find(f=>f.itemId===i.id);
          const invInicial=filaAnt
            ?(filaAnt.stockReal!=null&&filaAnt.stockReal!==""
              ?parseFloat(filaAnt.stockReal)||0
              :parseFloat(filaAnt.stockFinal)||0)
            :0;
          return{itemId:i.id,invInicial,ingreso:0,egreso:0,stockFinal:invInicial,stockReal:"",obs:""};
        });
        const nnum=nextNumInv(sucSel,p);
        nuevoData={numInv:nnum,sucursal:sucSel,fecha:nuevaFechaInv,filas,ventas:[],estado:"abierto"};
        return[...p,{id:Date.now(),...nuevoData}];
      });
      if(nuevoData){
        supaPost("registros_sucursales",nuevoData).then(([created])=>{
          if(created?.id) setRegsSucs(pp=>pp.map(r=>r.sucursal===sucSel&&r.fecha===nuevaFechaInv&&r.id>1000000000000?{...r,id:created.id}:r));
        }).catch(console.error);
      }
      setFecha(nuevaFechaInv);
      setModalNuevoInv(false);
    }}>Confirmar apertura</Btn>
  </div>
</Mdl>}
{/* Modal ítem */}
{modal==="item"&&<Mdl title={editItem?"EDITAR ÍTEM (global)":"NUEVO ÍTEM (global)"} onClose={()=>setModal(null)}>
  <div style={{fontSize:12,color:MUT,marginBottom:14}}>{editItem?"Los cambios aplican a todas las sucursales. El StockMín se edita en la tabla.":"Se agregará a todas las sucursales con StockMín=0. Edita el StockMín en la tabla."}</div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    <div style={{gridColumn:"1/3"}}><LI label="Nombre"><input value={formItem.nombre} onChange={e=>setFormItem(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI></div>
    <LI label="Categoría">
      <select value={formItem.categoria||cats2[0]||""} onChange={e=>setFormItem(p=>({...p,categoria:e.target.value}))} style={{width:"100%"}}>
        {cats2.map(c=><option key={c}>{c}</option>)}
      </select>
    </LI>
    <LI label="Unidad"><input value={formItem.unidad} onChange={e=>setFormItem(p=>({...p,unidad:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Proveedor" xtra={{gridColumn:"1/3"}}>
      <select value={formItem.proveedorId||provs[0]?.id||1} onChange={e=>setFormItem(p=>({...p,proveedorId:parseInt(e.target.value)}))} style={{width:"100%"}}>
        {provs.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
      </select>
    </LI>
    <div style={{gridColumn:"1/3"}}><LI label="Marcas">
      <div style={{display:"flex",gap:12,flexWrap:"wrap",paddingTop:4}}>
        {[...marcas].sort((a,b)=>a.nombre==="General"?-1:b.nombre==="General"?1:a.nombre.localeCompare(b.nombre,"es")).map(m=>{
          const sel=(formItem.marcas||[]).includes(m.nombre);
          return <label key={m.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:13,cursor:"pointer",userSelect:"none"}}>
            <input type="checkbox" checked={sel} onChange={()=>setFormItem(p=>({...p,marcas:sel?p.marcas.filter(x=>x!==m.nombre):[...(p.marcas||[]),m.nombre]}))}/>
            {m.nombre}
          </label>;
        })}
      </div>
    </LI></div>
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
    <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
    <Btn onClick={saveItem}>Guardar</Btn>
  </div>
</Mdl>}
{/* Modal preview importación */}
{modal==="importar"&&importPreview&&<Mdl title={"PREVIEW — "+importPreview.length+" ÍTEMS (todas las sucursales)"} onClose={()=>setModal(null)} wide>
  <div style={{background:BG,borderRadius:8,padding:12,marginBottom:16,fontSize:12,color:MUT}}>
    Estos ítems reemplazarán la lista global. El StockMín se aplicará a cada sucursal según las columnas del archivo.
  </div>
  <div style={{maxHeight:300,overflow:"auto",marginBottom:16}}>
    <table>
      <thead><tr>
        <th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Proveedor</th>
        {sucs.map(s=><th key={s} style={{color:ACC}}>{s}</th>)}
      </tr></thead>
      <tbody>{importPreview.map((i,idx)=>{
        const prov=provs.find(p=>p.id===i.proveedorId);
        return <tr key={idx}>
          <td>{i.nombre}</td>
          <td style={{color:MUT}}>{i.categoria}</td>
          <td style={{color:MUT}}>{i.unidad}</td>
          <td style={{fontSize:12}}><Bdg c={prov?.tipo==="produccion"?"orange":"blue"}>{prov?.nombre||"—"}</Bdg></td>
          {sucs.map(s=><td key={s} style={{fontFamily:"'DM Mono'",color:ACC,fontSize:12}}>{fmtN(i.stockMins?.[s]||0)}</td>)}
        </tr>;
      })}</tbody>
    </table>
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
    <Btn v="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
    <Btn onClick={confirmarImport}>Confirmar importación</Btn>
  </div>
</Mdl>}
{confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}

  </div>;
}
// ── Historial Inventario Sucursal ───────────────────────────────────────────
function HistInvSuc({regsSucs,sucSel,sucData,items}){
const[filFecha,setFilFecha]=useState("");
const[filNum,setFilNum]=useState("");
const regs=[...regsSucs.filter(r=>r.sucursal===sucSel&&r.estado==="cerrado")]
.sort((a,b)=>b.fecha.localeCompare(a.fecha)||b.numInv-a.numInv);
const filtrados=regs.filter(r=>{
if(filFecha&&!r.fecha.includes(filFecha))return false;
if(filNum){
const numStr="INV-"+String(r.numInv||0).padStart(3,"0");
if(!numStr.includes(filNum.toUpperCase()))return false;
}
return true;
});
if(regs.length===0)return <Card xtra={{textAlign:"center",padding:48,color:MUT}}>Sin inventarios cerrados para {sucSel}.</Card>;
return <div>
<div style={{display:"flex",gap:12,marginBottom:16}}>
<input type="date" value={filFecha} onChange={e=>setFilFecha(e.target.value)}
placeholder="Filtrar por fecha" style={{width:180}}/>
<input value={filNum} onChange={e=>setFilNum(e.target.value)}
placeholder="Buscar INV-001..." style={{width:160}}/>
{(filFecha||filNum)&&<Btn s="sm" v="ghost" onClick={()=>{setFilFecha("");setFilNum("");}}>Limpiar</Btn>}
<span style={{fontSize:12,color:MUT,alignSelf:"center"}}>{filtrados.length} registro{filtrados.length!==1?"s":""}</span>
</div>

{filtrados.length===0
  ?<Card xtra={{textAlign:"center",padding:32,color:MUT}}>Sin resultados para ese filtro.</Card>
  :filtrados.map(reg=>{
    return <Card key={reg.id} xtra={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:"'DM Mono'",fontSize:13,color:MUT,background:BG,padding:"4px 10px",borderRadius:6,border:b1(FNT)}}>
            {"INV-"+String(reg.numInv||0).padStart(3,"0")}
          </div>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>{reg.fecha}</div>
          <Bdg c={reg.estado==="cerrado"?"green":"muted"}>{reg.estado==="cerrado"?"Cerrado":"Abierto"}</Bdg>
        </div>
      </div>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Ítem</th><th>Inv. Inicial</th><th>Ingreso</th><th>Egreso</th><th>Stock Final</th><th>Stock Real</th><th>Diferencia</th><th>Observaciones</th></tr></thead>
          <tbody>{reg.filas.map(f=>{
            const it=items.find(i=>i.id===f.itemId)||sucData.items.find(i=>i.id===f.itemId);
            const sf=(parseFloat(f.invInicial)||0)+(parseFloat(f.ingreso)||0)-(parseFloat(f.egreso)||0);
            const diff=f.stockReal!==""?(parseFloat(f.stockReal)||0)-sf:null;
            return <tr key={f.itemId}>
              <td style={{fontWeight:500}}>{it?.nombre||"Ítem #"+f.itemId}</td>
              <td style={{fontFamily:"'DM Mono'",color:BLU}}>{fmtN(parseFloat(f.invInicial)||0)}</td>
              <td style={{fontFamily:"'DM Mono'",color:GRN}}>{fmtN(parseFloat(f.ingreso)||0)}</td>
              <td style={{fontFamily:"'DM Mono'",color:RED}}>{fmtN(parseFloat(f.egreso)||0)}</td>
              <td style={{fontFamily:"'DM Mono'",color:ACC,fontWeight:700}}>{fmtN(sf)}</td>
              <td style={{fontFamily:"'DM Mono'",color:PRP}}>{f.stockReal!==""?fmtN(parseFloat(f.stockReal)||0):"—"}</td>
              <td style={{fontFamily:"'DM Mono'",fontSize:12,color:diff===null?MUT:diff===0?GRN:diff>0?BLU:RED}}>
                {diff===null?"—":((diff>0?"+":"")+fmtN(diff))}
              </td>
              <td style={{fontSize:12,color:MUT}}>{f.obs||"—"}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </Card>;
  })
}

  </div>;
}
// ── Costos & Ingresos ───────────────────────────────────────────────────────
function Cos({inv,rp,rv,sucs,ventas,setVentas,regsSucs,setRegsSucs,invSucs,puede,userActivo,sucsMarcas}){
// Modal de registro diario
const[modal,setModal]=useState(false);
const[dFecha,setDFecha]=useState(today());
const sucsVisiblesCos=(userActivo&&(userActivo.rol==="admin_suc"||userActivo.rol==="staff_suc"))
?sucs.filter(s=>s===userActivo.sucursal)
:sucs;
const[dSuc,setDSuc]=useState(sucsVisiblesCos[0]||"");
const[dBuscar,setDBuscar]=useState("");
// cantidades del día: {rId: cant}
const[dCants,setDCants]=useState({});
function abrirModal(){
setDFecha(today());
setDSuc(sucsVisiblesCos[0]||"");
setDBuscar("");
setDCants({});
setModal(true);
}
function setCant(rId,val){
setDCants(p=>({...p,[rId]:val}));
}
const dResumen=rv.map(r=>({r,cant:dCants[r.id]||0})).filter(x=>x.cant>0);
const dTotalIngreso=dResumen.reduce((s,{r,cant})=>s+r.precio*cant,0);
const dTotalCosto=dResumen.reduce((s,{r,cant})=>s+cc(r)*cant,0);
async function confirmarDia(){
if(!dResumen.length){return;}
const nuevas=dResumen.map(({r,cant})=>({fecha:dFecha,sucursal:dSuc,rId:r.id,cant}));
await Promise.all(nuevas.map(v=>supaPost("ventas",v).catch(console.error)));
setVentas(p=>[...nuevas.map((v,i)=>({...v,id:Date.now()+i})),...p]);

// Calcular egresos por ítem de sucursal según recetas vendidas
const egresosPorItem={};
dResumen.forEach(({r,cant})=>{
  r.ings.forEach(ing=>{
    if(!ing.sucItemNombre)return;
    const nombre=ing.sucItemNombre;
    egresosPorItem[nombre]=(egresosPorItem[nombre]||0)+ing.cantidad*cant;
  });
});
if(Object.keys(egresosPorItem).length===0){setModal(false);return;}
// Obtener ítems de la sucursal para mapear nombre → itemId
const sucData=invSucs.find(s=>s.sucursal===dSuc);
if(!sucData){setModal(false);return;}
// Actualizar egreso en el registro del día de esa sucursal
setRegsSucs(p=>{
  const existe=p.find(r=>r.sucursal===dSuc&&r.fecha===dFecha);
  const filaBase=sucData.items.map(i=>({itemId:i.id,invInicial:0,ingreso:0,egreso:0,stockFinal:0,stockReal:"",obs:""}));
  function actualizarFilas(filas){
    return filas.map(f=>{
      const item=sucData.items.find(i=>i.id===f.itemId);
      if(!item)return f;
      const egresoAdicional=egresosPorItem[item.nombre]||0;
      if(egresoAdicional===0)return f;
      const nuevoEgreso=(parseFloat(f.egreso)||0)+egresoAdicional;
      const ini=parseFloat(f.invInicial)||0;
      const ing=parseFloat(f.ingreso)||0;
      return{...f,egreso:parseFloat(nuevoEgreso.toFixed(4)),stockFinal:ini+ing-nuevoEgreso};
    });
  }
  let regActualizado=null;
  if(existe){
    regActualizado={...existe,filas:actualizarFilas(existe.filas)};
    supaPatch("registros_sucursales","?id=eq."+existe.id,{filas:regActualizado.filas}).catch(console.error);
    return p.map(r=>r.sucursal===dSuc&&r.fecha===dFecha?regActualizado:r);
  }else{
    const filas=actualizarFilas(filaBase);
    regActualizado={id:Date.now(),sucursal:dSuc,fecha:dFecha,filas,ventas:[],estado:"abierto"};
    const{id:_,...data}=regActualizado;
    supaPost("registros_sucursales",data).catch(console.error);
    return[...p,regActualizado];
  }
});
setModal(false);

}
function matchMarcasCos(itemMarcas,sucMarcasArr){if(!sucMarcasArr||sucMarcasArr.length===0)return true;if(!itemMarcas||itemMarcas.length===0)return true;if(itemMarcas.includes("General"))return true;return itemMarcas.some(m=>sucMarcasArr.includes(m));}
function cc(r){
return r.ings.reduce((s,ing)=>{
if(ing.tipo==="inv"){const item=inv.find(i=>i.id===ing.refId);return s+(item?item.costo*ing.cantidad:0);}
else{const p=rp.find(x=>x.id===ing.refId);if(!p)return s;const cp=p.ings.reduce((cs,ri)=>{const item=inv.find(i=>i.id===ri.invId);return cs+(item?item.costo*ri.cantidad:0);},0);return s+(cp/p.rendimiento)*ing.cantidad;}
},0);
}
const ventasVis=(userActivo&&(userActivo.rol==="admin_suc"||userActivo.rol==="staff_suc"))
?ventas.filter(v=>v.sucursal===userActivo.sucursal)
:ventas;
const tI=ventasVis.reduce((s,x)=>{const r=rv.find(r=>r.id===x.rId);return s+(r?r.precio*x.cant:0);},0);
const tC=ventasVis.reduce((s,x)=>{const r=rv.find(r=>r.id===x.rId);return s+(r?cc(r)*x.cant:0);},0);
const u=tI-tC;
const ps=sucsVisiblesCos.map(suc=>{
const vs=ventas.filter(x=>x.sucursal===suc);
const i=vs.reduce((s,x)=>{const r=rv.find(r=>r.id===x.rId);return s+(r?r.precio*x.cant:0);},0);
const c=vs.reduce((s,x)=>{const r=rv.find(r=>r.id===x.rId);return s+(r?cc(r)*x.cant:0);},0);
return{suc,i,c,u:i-c};
});
// Agrupar registro por fecha+sucursal para mostrar en tabla
const ventasFiltradas=(userActivo&&(userActivo.rol==="admin_suc"||userActivo.rol==="staff_suc"))
?ventas.filter(v=>v.sucursal===userActivo.sucursal)
:ventas;
const registros=[...ventasFiltradas].sort((a,b)=>b.fecha.localeCompare(a.fecha));
return <div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>COSTOS & INGRESOS</h1>
{(!puede||puede('registrar_venta'))&&<Btn onClick={abrirModal}>+ Registrar Ventas del Día</Btn>}
</div>

<div style={{display:"grid",gridTemplateColumns:userActivo?.rol==="staff_suc"?"1fr":"repeat(3,1fr)",gap:16,marginBottom:24}}>
  <SC label="Ingresos" value={fmt(tI)} sub="Total ingresos" color={GRN} icon="📈"/>
  {userActivo?.rol!=="staff_suc"&&<SC label="Costos" value={fmt(tC)} sub="Costo ingredientes" color={RED} icon="📉"/>}
  {userActivo?.rol!=="staff_suc"&&<SC label="Utilidad" value={fmt(u)} sub={"Margen: "+(tI>0?(u/tI*100).toFixed(2):0)+"%"} color={u>0?ACC:RED} icon="💰"/>}
</div>
{userActivo?.rol!=="staff_suc"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
  <Card>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:16}}>POR SUCURSAL</div>
    {ps.map(({suc,i,c,u})=>(
      <div key={suc} style={{marginBottom:14,paddingBottom:14,borderBottom:b1(BRD)}}>
        <div style={{fontWeight:600,marginBottom:8}}>{suc}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>INGRESOS</div><div style={{fontFamily:"'DM Mono'",fontSize:13,color:GRN}}>{fmt(i)}</div></div>
          <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>COSTOS</div><div style={{fontFamily:"'DM Mono'",fontSize:13,color:RED}}>{fmt(c)}</div></div>
          <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>UTILIDAD</div><div style={{fontFamily:"'DM Mono'",fontSize:13,color:u>0?ACC:RED}}>{fmt(u)}</div></div>
        </div>
      </div>
    ))}
  </Card>
  <Card>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:16}}>POR PRODUCTO</div>
    {rv.map(r=>{
      const vs=ventas.filter(x=>x.rId===r.id);
      const tv=vs.reduce((s,x)=>s+x.cant,0);
      const ir=vs.reduce((s,x)=>s+r.precio*x.cant,0);
      const mr=ir>0?((ir-cc(r)*tv)/ir*100):0;
      return <div key={r.id} style={{display:"flex",justifyContent:"space-between",marginBottom:12,paddingBottom:12,borderBottom:b1(FNT)}}>
        <div><div style={{fontWeight:500,fontSize:13}}>{r.nombre}</div><div style={{fontSize:11,color:MUT}}>{fmtN(tv)} uds · Costo: {fmt(cc(r))}</div></div>
        <div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Mono'",fontSize:13,color:GRN}}>{fmt(ir)}</div><div style={{fontSize:11,color:mr>50?GRN:mr>30?ACC:RED}}>{mr.toFixed(2)}%</div></div>
      </div>;
    })}
  </Card>
</div>}
<Card xtra={{padding:0}}>
  <div style={{padding:"16px 20px",borderBottom:b1(BRD)}}><span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>REGISTRO DE VENTAS</span></div>
  <table>
    <thead><tr><th>Fecha</th><th>Sucursal</th><th>Producto</th><th>Cant.</th><th>Ingreso</th>{userActivo?.rol!=="staff_suc"&&<th>Costo</th>}{userActivo?.rol!=="staff_suc"&&<th>Utilidad</th>}</tr></thead>
    <tbody>{registros.map(x=>{
      const r=rv.find(r=>r.id===x.rId);
      const ig=(r?.precio||0)*x.cant;
      const co=(r?cc(r):0)*x.cant;
      return <tr key={x.id}>
        <td style={{fontFamily:"'DM Mono'",fontSize:12,color:MUT}}>{x.fecha}</td>
        <td style={{fontSize:13}}>{x.sucursal}</td>
        <td>{r?.nombre||"?"}</td>
        <td style={{fontFamily:"'DM Mono'"}}>{fmtN(x.cant)}</td>
        <td style={{fontFamily:"'DM Mono'",color:GRN}}>{fmt(ig)}</td>
        {userActivo?.rol!=="staff_suc"&&<td style={{fontFamily:"'DM Mono'",color:RED}}>{fmt(co)}</td>}
        {userActivo?.rol!=="staff_suc"&&<td style={{fontFamily:"'DM Mono'",color:ig-co>0?ACC:RED}}>{fmt(ig-co)}</td>}
      </tr>;
    })}</tbody>
  </table>
</Card>
{/* Modal registro diario */}
{modal&&<Mdl title="REGISTRO DE VENTAS DEL DÍA" onClose={()=>setModal(false)} wide>
  {/* Cabecera: fecha y sucursal */}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:12}}>
    <LI label="Fecha">
      <input type="date" value={dFecha} onChange={e=>setDFecha(e.target.value)} style={{width:"100%"}}/>
    </LI>
    <LI label="Sucursal">
      <select value={dSuc} onChange={e=>setDSuc(e.target.value)} style={{width:"100%"}}>
        {sucsVisiblesCos.map(s=><option key={s}>{s}</option>)}
      </select>
    </LI>
  </div>
  {/* Buscador */}
  <input
    placeholder="Buscar por nombre o código..."
    value={dBuscar}
    onChange={e=>setDBuscar(e.target.value)}
    style={{width:"100%",marginBottom:16,boxSizing:"border-box"}}
    autoFocus
  />
  {/* Lista de productos */}
  <div style={{maxHeight:400,overflowY:"auto",marginBottom:16}}>
  <table>
    <thead><tr>
      <th style={{width:80}}>Código</th>
      <th>Producto</th>
      <th style={{width:90}}>Precio</th>
      <th style={{width:130}}>Cantidad</th>
      <th style={{width:90,textAlign:"right"}}>Subtotal</th>
    </tr></thead>
    <tbody>{[...rv]
      .filter(r=>{
        const sm=sucsMarcas?.[dSuc]||[];
        if(!matchMarcasCos(r.marcas,sm))return false;
        const q=dBuscar.toLowerCase().trim();
        if(!q)return true;
        return r.nombre.toLowerCase().includes(q)||(r.codigo||"").toLowerCase().includes(q);
      })
      .sort((a,b)=>a.nombre.localeCompare(b.nombre,"es"))
      .map(r=>{
        const cant=dCants[r.id]||0;
        return <tr key={r.id} style={{background:cant>0?ACC+"0D":"transparent"}}>
          <td style={{fontFamily:"'DM Mono'",fontSize:12,color:MUT}}>{r.codigo||"—"}</td>
          <td>
            <div style={{fontWeight:cant>0?600:400,fontSize:13}}>{r.nombre}</div>
            <div style={{fontSize:11,color:MUT}}>{r.categoria}</div>
          </td>
          <td style={{fontFamily:"'DM Mono'",fontSize:13}}>{fmt(r.precio)}</td>
          <td>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setCant(r.id,Math.max(0,(cant||0)-1))}
                style={{background:FNT,color:TXT,border:"none",borderRadius:6,width:28,height:28,fontSize:16,flexShrink:0,cursor:"pointer"}}>-</button>
              <input type="number" min="0" step="0.01" value={cant||""}
                onChange={e=>setCant(r.id,parseFloat(e.target.value)||0)}
                placeholder="0"
                style={{width:55,textAlign:"center",fontFamily:"'DM Mono'",fontSize:14,fontWeight:600}}/>
              <button onClick={()=>setCant(r.id,(cant||0)+1)}
                style={{background:ACC,color:"#000",border:"none",borderRadius:6,width:28,height:28,fontSize:16,fontWeight:700,flexShrink:0,cursor:"pointer"}}>+</button>
            </div>
          </td>
          <td style={{fontFamily:"'DM Mono'",fontSize:13,color:cant>0?GRN:MUT,textAlign:"right"}}>{cant>0?fmt(r.precio*cant):"—"}</td>
        </tr>;
      })}
    </tbody>
  </table>
  </div>
  {/* Resumen del día */}
  {dResumen.length>0&&<Card xtra={{marginBottom:16,borderColor:GRN+"44"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:GRN,marginBottom:10}}>RESUMEN DEL DÍA</div>
    {dResumen.map(({r,cant})=>(
      <div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}>
        <span>{r.nombre} × {fmtN(cant)}</span>
        <span style={{fontFamily:"'DM Mono'",color:GRN}}>{fmt(r.precio*cant)}</span>
      </div>
    ))}
    <div style={{borderTop:b1(BRD),marginTop:10,paddingTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
      <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>INGRESOS</div><div style={{fontFamily:"'DM Mono'",fontWeight:700,color:GRN}}>{fmt(dTotalIngreso)}</div></div>
      <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>COSTOS</div><div style={{fontFamily:"'DM Mono'",fontWeight:700,color:RED}}>{fmt(dTotalCosto)}</div></div>
      <div><div style={{fontSize:10,color:MUT,marginBottom:2}}>UTILIDAD</div><div style={{fontFamily:"'DM Mono'",fontWeight:700,color:dTotalIngreso-dTotalCosto>0?ACC:RED}}>{fmt(dTotalIngreso-dTotalCosto)}</div></div>
    </div>
  </Card>}
  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
    <Btn v="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
    <Btn onClick={confirmarDia} disabled={!dResumen.length}>Confirmar ventas del día</Btn>
  </div>
</Mdl>}

  </div>;
}
// ── Historial ───────────────────────────────────────────────────────────────
function Hist({hI,hC,reqs,userActivo}){
const[tab,setTab]=useState("c");
return <div>
<div style={{marginBottom:24}}><h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>HISTORIAL</h1></div>
<div style={{display:"flex",gap:8,marginBottom:20}}>
{[["c","Compras"],["i","Inv. Físicos"],["r","Requerimientos"]]
.filter(([id])=>id!=="c"||(userActivo?.rol==="superadmin"||userActivo?.rol==="produccion"))
.filter(([id])=>id!=="i"||(userActivo?.rol==="superadmin"||userActivo?.rol==="produccion"))
.map(([id,l])=>{const a=tab===id;return <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT}}>{l}</button>;})}
</div>
{tab==="c"&&(hC.length===0
?<Card xtra={{textAlign:"center",padding:40,color:MUT}}>No hay compras confirmadas aún</Card>
:hC.map(c=><Card key={c.id} xtra={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
<div><span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>ORDEN DE COMPRA</span><span style={{marginLeft:12,fontFamily:"'DM Mono'",fontSize:12,color:MUT}}>{c.fecha} · {c.semana}</span></div>
<span style={{fontFamily:"'DM Mono'",color:GRN,fontWeight:700}}>{fmt(c.totalCosto)}</span>
</div>
{c.resumenElaboracion?.length>0&&<div style={{background:BG,borderRadius:8,padding:12,marginBottom:12}}>
<div style={{fontSize:11,color:ACC,fontWeight:600,marginBottom:6}}>PLAN DE ELABORACIÓN</div>
{c.resumenElaboracion.map((e,i)=><div key={i} style={{fontSize:12,color:MUT}}>{e.producto}: <span style={{color:ACC,fontFamily:"'DM Mono'"}}>{e.aElaborar} {e.unidad}</span></div>)}
</div>}
<table>
<thead><tr><th>Ítem</th><th>Cantidad</th><th>Unidad</th><th>Costo</th><th>Total</th></tr></thead>
<tbody>{c.items.map((it,i)=><tr key={i}><td>{it.nombre}</td><td style={{fontFamily:"'DM Mono'"}}>{it.cantidad}</td><td style={{color:MUT}}>{it.unidad}</td><td style={{fontFamily:"'DM Mono'"}}>{fmt(it.costoUnit)}</td><td style={{fontFamily:"'DM Mono'",color:ACC}}>{fmt(it.total)}</td></tr>)}</tbody>
</table>
</Card>)
)}
{tab==="i"&&(hI.length===0
?<Card xtra={{padding:40,textAlign:"center",color:MUT}}>No hay inventarios físicos aún</Card>
:<Card xtra={{padding:0}}>
<table>
<thead><tr><th>Fecha</th><th>Descripción</th><th>Ajustes</th></tr></thead>
<tbody>{[...hI].reverse().map(h=><tr key={h.id}>
<td style={{fontFamily:"'DM Mono'",fontSize:12,color:MUT}}>{h.fecha}</td>
<td>{h.descripcion}</td>
<td style={{fontSize:12}}>{h.diffs?.map((d,i)=><div key={i} style={{color:MUT}}>{d.nombre}: {d.anterior} a <span style={{color:d.nuevo>d.anterior?GRN:RED}}>{d.nuevo}</span></div>)}</td>
</tr>)}</tbody>
</table>
</Card>
)}
{tab==="r"&&<Card xtra={{padding:0}}>
<table>
<thead><tr><th>Sucursal</th><th>Fecha</th><th>Items</th><th>Estado</th></tr></thead>
<tbody>{[...reqs].reverse().filter(r=>
(!userActivo||(userActivo.rol!=="admin_suc"&&userActivo.rol!=="staff_suc"))||r.sucursal===userActivo.sucursal
).map(r=>{
const eC={borrador:"muted",enviado:"orange",entregado:"green"};
return <tr key={r.id}><td style={{fontWeight:500}}>{r.sucursal}</td><td style={{fontFamily:"'DM Mono'",fontSize:12,color:MUT}}>{r.fecha}</td><td style={{fontFamily:"'DM Mono'"}}>{r.items.reduce((s,i)=>s+i.cantidad,0)} uds.</td><td><Bdg c={eC[r.estado]||"muted"}>{r.estado}</Bdg></td></tr>;
})}</tbody>
</table>
</Card>}
  </div>;
}
// ── Configuración ───────────────────────────────────────────────────────────
function Config({sucs,setSucs,cats,setCats,catV,setCatV,cats2,setCats2,rp,xlsxReady,invSucs,setInvSucs,setRegsSucs,provs,setProvs,users,setUsers,puede,marcas,setMarcas,sucsMarcas,setSucsMarcas}){
const[seccion,setSeccion]=useState("sucs");
const[editSuc,setEditSuc]=useState(null);
const[nuevaSuc,setNuevaSuc]=useState("");
const[editCat,setEditCat]=useState(null);
const[nuevaCat,setNuevaCat]=useState("");
const[editCatV,setEditCatV]=useState(null);
const[nuevaCatV,setNuevaCatV]=useState("");
const[editCat2,setEditCat2]=useState(null);
const[nuevaCat2,setNuevaCat2]=useState("");
const[editProv,setEditProv]=useState(null);
const[formProv,setFormProv]=useState({nombre:"",tipo:"externo",contacto:"",notas:""});
const[modalProv,setModalProv]=useState(false);
const[editUser,setEditUser]=useState(null);
const[modalUser,setModalUser]=useState(false);
const[formUser,setFormUser]=useState({nombre:"",email:"",password:"",rol:"staff_suc",sucursal:sucs[0]||"",activo:true});
const[confirmar,setConfirmar]=useState(null);
const[nuevaMarca,setNuevaMarca]=useState("");
const[editMarca,setEditMarca]=useState(null);
async function guardarSuc(){
const nombre=editSuc.nombre.trim();
if(!nombre)return;
const anterior=sucs[editSuc.idx];
setSucs(p=>p.map((s,i)=>i===editSuc.idx?nombre:s));
setInvSucs(p=>p.map(s=>s.sucursal===anterior?{...s,sucursal:nombre}:s));
setRegsSucs(p=>p.map(r=>r.sucursal===anterior?{...r,sucursal:nombre}:r));
await supaPatch("sucursales","?nombre=eq."+encodeURIComponent(anterior),{nombre}).catch(console.error);
setEditSuc(null);
}
async function agregarSuc(){
const nombre=nuevaSuc.trim();
if(!nombre||sucs.includes(nombre)){alert("Nombre vacío o ya existe.");return;}
// Heredar ítems globales con stockMin=0
const nuevoItems=(invSucs[0]?.items||[]).map(i=>({...i,stockMin:0}));
setSucs(p=>[...p,nombre]);
setInvSucs(p=>[...p,{sucursal:nombre,items:nuevoItems}]);
await supaPost("sucursales",{nombre,marcas:[]}).catch(console.error);
setSucsMarcas(p=>({...p,[nombre]:[]}));
await supaUpsert("inventario_sucursales",{sucursal:nombre,items:nuevoItems}).catch(console.error);
setNuevaSuc("");
}
function eliminarSuc(idx){
const nom=sucs[idx];
setConfirmar({msg:"Eliminar sucursal "+nom+"?",fn:async()=>{
setSucs(p=>p.filter((_,i)=>i!==idx));
await supaDelete("sucursales","?nombre=eq."+encodeURIComponent(nom)).catch(console.error);
}});
}
function descargarPlantillaSuc(nombre){
if(!xlsxReady){alert("SheetJS cargando...");return;}
const datos=rp.map(r=>({sucursal:nombre,fecha:today(),item:r.nombre,unidad:r.unidad,requerimiento:0}));
const ws=window.XLSX.utils.json_to_sheet(datos);
const wb=window.XLSX.utils.book_new();
window.XLSX.utils.book_append_sheet(wb,ws,"Requerimiento");
window.XLSX.writeFile(wb,"requerimiento*"+nombre.replace(/ /g,"*")+".xlsx");
}
function guardarCat(){const nombre=editCat.nombre.trim();if(!nombre)return;const ant=cats[editCat.idx];setCats(p=>p.map((c,i)=>i===editCat.idx?nombre:c));supaPatch("categorias_inv","?nombre=eq."+encodeURIComponent(ant),{nombre}).catch(console.error);setEditCat(null);}
function agregarCat(){const nombre=nuevaCat.trim();if(!nombre||cats.includes(nombre)){alert("Nombre vacío o ya existe.");return;}setCats(p=>[...p,nombre]);supaPost("categorias_inv",{nombre}).catch(console.error);setNuevaCat("");}
function eliminarCat(idx){const nom=cats[idx];setConfirmar({msg:"Eliminar categoría "+nom+"? Los ítems con esta categoría quedarán sin clasificar.",fn:()=>{setCats(p=>p.filter((_,i)=>i!==idx));supaDelete("categorias_inv","?nombre=eq."+encodeURIComponent(nom)).catch(console.error);}});}
function guardarCatV(){const nombre=editCatV.nombre.trim();if(!nombre)return;const ant=catV[editCatV.idx];setCatV(p=>p.map((c,i)=>i===editCatV.idx?nombre:c));supaPatch("categorias_venta","?nombre=eq."+encodeURIComponent(ant),{nombre}).catch(console.error);setEditCatV(null);}
function agregarCatV(){const nombre=nuevaCatV.trim();if(!nombre||catV.includes(nombre)){alert("Nombre vacío o ya existe.");return;}setCatV(p=>[...p,nombre]);supaPost("categorias_venta",{nombre}).catch(console.error);setNuevaCatV("");}
function eliminarCatV(idx){const nom=catV[idx];setConfirmar({msg:"Eliminar categoría de venta "+nom+"? Las recetas con esta categoría quedarán sin clasificar.",fn:()=>{setCatV(p=>p.filter((_,i)=>i!==idx));supaDelete("categorias_venta","?nombre=eq."+encodeURIComponent(nom)).catch(console.error);}});}
function guardarCat2(){const nombre=editCat2.nombre.trim();if(!nombre)return;const ant=cats2[editCat2.idx];setCats2(p=>p.map((c,i)=>i===editCat2.idx?nombre:c));supaPatch("categorias_inv_suc","?nombre=eq."+encodeURIComponent(ant),{nombre}).catch(console.error);setEditCat2(null);}
function agregarCat2(){const nombre=nuevaCat2.trim();if(!nombre||cats2.includes(nombre)){alert("Nombre vacío o ya existe.");return;}setCats2(p=>[...p,nombre]);supaPost("categorias_inv_suc",{nombre}).catch(console.error);setNuevaCat2("");}
function eliminarCat2(idx){const nom=cats2[idx];setConfirmar({msg:"Eliminar categoría "+nom+"?",fn:()=>{setCats2(p=>p.filter((_,i)=>i!==idx));supaDelete("categorias_inv_suc","?nombre=eq."+encodeURIComponent(nom)).catch(console.error);}});}
function agregarMarca(){const nombre=nuevaMarca.trim().toUpperCase();if(!nombre||marcas.some(m=>m.nombre===nombre)){alert("Nombre vacío o ya existe.");return;}supaPost("marcas",{nombre}).then(([created])=>{setMarcas(p=>[...p,created||{id:Date.now(),nombre}]);}).catch(console.error);setNuevaMarca("");}
function guardarMarca(){const nombre=editMarca.nombre.trim().toUpperCase();if(!nombre)return;const ant=marcas.find(m=>m.id===editMarca.id)?.nombre;supaPatch("marcas","?id=eq."+editMarca.id,{nombre}).catch(console.error);setMarcas(p=>p.map(m=>m.id===editMarca.id?{...m,nombre}:m));setEditMarca(null);}
function eliminarMarca(m){if(m.nombre==="General"){alert("La marca 'General' no se puede eliminar.");return;}setConfirmar({msg:"¿Eliminar marca "+m.nombre+"?",fn:()=>{setMarcas(p=>p.filter(x=>x.id!==m.id));supaDelete("marcas","?id=eq."+m.id).catch(console.error);}});}
async function toggleSucMarca(suc,marcaNombre){const actual=sucsMarcas[suc]||[];const nueva=actual.includes(marcaNombre)?actual.filter(x=>x!==marcaNombre):[...actual,marcaNombre];setSucsMarcas(p=>({...p,[suc]:nueva}));await supaPatch("sucursales","?nombre=eq."+encodeURIComponent(suc),{marcas:nueva}).catch(console.error);}
return <div>
<div style={{marginBottom:24}}>
<h1 style={{fontFamily:"'Bebas Neue'",fontSize:36,letterSpacing:2}}>CONFIGURACIÓN</h1>
<p style={{color:MUT,fontSize:13}}>Gestión de sucursales y categorías del sistema</p>
</div>
<div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
{[["sucs","🏪 Sucursales"],["cats","Categ. Inventario"],["catv","Categ. Productos Venta"],["cat2","Categ. Inv. Sucursales"],["marcas","🏷 Marcas"],["provs","🚚 Proveedores"],["users","👤 Usuarios"]].map(([id,l])=>{
const a=seccion===id;
return <button key={id} onClick={()=>setSeccion(id)} style={{padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",border:b1(a?ACC:BRD),background:a?ACC+"18":"transparent",color:a?ACC:MUT,fontWeight:a?600:400}}>{l}</button>;
})}
</div>

{seccion==="sucs"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16,marginBottom:24}}>
    {sucs.map((s,idx)=><Card key={idx}>
      {editSuc?.idx===idx
        ?<div>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:13,color:MUT,letterSpacing:1,marginBottom:10}}>EDITANDO NOMBRE</div>
          <input value={editSuc.nombre} onChange={e=>setEditSuc(p=>({...p,nombre:e.target.value}))} style={{width:"100%",marginBottom:12}} onKeyDown={e=>{if(e.key==="Enter")guardarSuc();if(e.key==="Escape")setEditSuc(null);}} autoFocus/>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ghost" s="sm" onClick={()=>setEditSuc(null)}>Cancelar</Btn>
            <Btn s="sm" onClick={guardarSuc}>Guardar</Btn>
          </div>
        </div>
        :<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div><div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{s}</div><Bdg c="blue">Activa</Bdg></div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setEditSuc({idx,nombre:s})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
              <button onClick={()=>eliminarSuc(idx)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:MUT,marginBottom:6}}>MARCAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {marcas.map(m=>{
                const sel=(sucsMarcas[s]||[]).includes(m.nombre);
                return <label key={m.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,cursor:"pointer",userSelect:"none"}}>
                  <input type="checkbox" checked={sel} onChange={()=>toggleSucMarca(s,m.nombre)}/>
                  {m.nombre}
                </label>;
              })}
            </div>
          </div>
          <button onClick={()=>descargarPlantillaSuc(s)} disabled={!xlsxReady}
            style={{width:"100%",padding:"8px",borderRadius:6,border:b1(BRD),background:"transparent",color:xlsxReady?TXT:MUT,fontSize:12,cursor:"pointer",textAlign:"center"}}>
            Descargar plantilla requerimiento
          </button>
        </div>
      }
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVA SUCURSAL</div>
    <div style={{display:"flex",gap:10}}>
      <input value={nuevaSuc} onChange={e=>setNuevaSuc(e.target.value)} placeholder="Nombre de la nueva sucursal..." style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")agregarSuc();}}/>
      <Btn onClick={agregarSuc} disabled={!nuevaSuc.trim()}>+ Agregar</Btn>
    </div>
    <div style={{fontSize:11,color:MUT,marginTop:8}}>Al agregar una sucursal podrás descargar su plantilla de requerimiento desde esta misma pantalla.</div>
  </Card>
</div>}
{seccion==="cats"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:24}}>
    {cats.map((c,idx)=><Card key={idx} xtra={{padding:14}}>
      {editCat?.idx===idx
        ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={editCat.nombre} onChange={e=>setEditCat(p=>({...p,nombre:e.target.value}))} style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")guardarCat();if(e.key==="Escape")setEditCat(null);}} autoFocus/>
          <Btn s="sm" v="ghost" onClick={()=>setEditCat(null)}>Cancelar</Btn>
          <Btn s="sm" onClick={guardarCat}>OK</Btn>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:ACC}}></div>
            <span style={{fontWeight:500,fontSize:14}}>{c}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setEditCat({idx,nombre:c})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
            <button onClick={()=>eliminarCat(idx)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
          </div>
        </div>
      }
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVA CATEGORÍA DE INVENTARIO</div>
    <div style={{display:"flex",gap:10}}>
      <input value={nuevaCat} onChange={e=>setNuevaCat(e.target.value)} placeholder="Nombre de la nueva categoría..." style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")agregarCat();}}/>
      <Btn onClick={agregarCat} disabled={!nuevaCat.trim()}>+ Agregar</Btn>
    </div>
    <div style={{fontSize:11,color:MUT,marginTop:8}}>Las nuevas categorías estarán disponibles de inmediato en el inventario.</div>
  </Card>
</div>}
{/* ── CATEGORÍAS DE VENTA ── */}
{seccion==="catv"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:24}}>
    {catV.map((c,idx)=><Card key={idx} xtra={{padding:14}}>
      {editCatV?.idx===idx
        ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={editCatV.nombre} onChange={e=>setEditCatV(p=>({...p,nombre:e.target.value}))} style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")guardarCatV();if(e.key==="Escape")setEditCatV(null);}} autoFocus/>
          <Btn s="sm" v="ghost" onClick={()=>setEditCatV(null)}>Cancelar</Btn>
          <Btn s="sm" onClick={guardarCatV}>OK</Btn>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:BLU}}></div>
            <span style={{fontWeight:500,fontSize:14}}>{c}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setEditCatV({idx,nombre:c})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
            <button onClick={()=>eliminarCatV(idx)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
          </div>
        </div>
      }
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVA CATEGORÍA DE PRODUCTO DE VENTA</div>
    <div style={{display:"flex",gap:10}}>
      <input value={nuevaCatV} onChange={e=>setNuevaCatV(e.target.value)} placeholder="Ej: Ensaladas, Wraps, Combos..." style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")agregarCatV();}}/>
      <Btn onClick={agregarCatV} disabled={!nuevaCatV.trim()}>+ Agregar</Btn>
    </div>
    <div style={{fontSize:11,color:MUT,marginTop:8}}>Las nuevas categorías estarán disponibles de inmediato al crear o editar recetas de venta.</div>
  </Card>
</div>}
{seccion==="cat2"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:24}}>
    {cats2.map((c,idx)=><Card key={idx} xtra={{padding:14}}>
      {editCat2?.idx===idx
        ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={editCat2.nombre} onChange={e=>setEditCat2(p=>({...p,nombre:e.target.value}))} style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")guardarCat2();if(e.key==="Escape")setEditCat2(null);}} autoFocus/>
          <Btn s="sm" v="ghost" onClick={()=>setEditCat2(null)}>Cancelar</Btn>
          <Btn s="sm" onClick={guardarCat2}>OK</Btn>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:PRP}}></div>
            <span style={{fontWeight:500,fontSize:14}}>{c}</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setEditCat2({idx,nombre:c})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
            <button onClick={()=>eliminarCat2(idx)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
          </div>
        </div>
      }
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVA CATEGORÍA INV. SUCURSAL</div>
    <div style={{display:"flex",gap:10}}>
      <input value={nuevaCat2} onChange={e=>setNuevaCat2(e.target.value)} placeholder="Ej: Carnes, Insumos..." style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")agregarCat2();}}/>
      <Btn onClick={agregarCat2} disabled={!nuevaCat2.trim()}>+ Agregar</Btn>
    </div>
    <div style={{fontSize:11,color:MUT,marginTop:8}}>Categorías para ítems del inventario de cada sucursal.</div>
  </Card>
</div>}
{seccion==="marcas"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:24}}>
    {marcas.map(m=><Card key={m.id} xtra={{padding:14}}>
      {editMarca?.id===m.id
        ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input value={editMarca.nombre} onChange={e=>setEditMarca(p=>({...p,nombre:e.target.value}))} style={{flex:1}} onKeyDown={e=>{if(e.key==="Enter")guardarMarca();if(e.key==="Escape")setEditMarca(null);}} autoFocus/>
          <Btn s="sm" v="ghost" onClick={()=>setEditMarca(null)}>Cancelar</Btn>
          <Btn s="sm" onClick={guardarMarca}>OK</Btn>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:ACC}}></div>
            <span style={{fontWeight:500,fontSize:14}}>{m.nombre}</span>
            {m.nombre==="General"&&<Bdg c="green">Fija</Bdg>}
          </div>
          {m.nombre!=="General"&&<div style={{display:"flex",gap:6}}>
            <button onClick={()=>setEditMarca({id:m.id,nombre:m.nombre})} style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
            <button onClick={()=>eliminarMarca(m)} style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>
          </div>}
        </div>}
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVA MARCA</div>
    <div style={{display:"flex",gap:10}}>
      <input value={nuevaMarca} onChange={e=>setNuevaMarca(e.target.value.toUpperCase())} placeholder="Ej: BORGERS, LA ORDEN DEL CONDE..." style={{flex:1,fontFamily:"'DM Mono'"}} onKeyDown={e=>{if(e.key==="Enter")agregarMarca();}}/>
      <Btn onClick={agregarMarca} disabled={!nuevaMarca.trim()}>+ Agregar</Btn>
    </div>
    <div style={{fontSize:11,color:MUT,marginTop:8}}>Las marcas se usan para clasificar ítems de sucursal, productos de venta y asignar a cada sucursal qué marcas maneja. "General" es fija y no se puede eliminar.</div>
  </Card>
</div>}
{seccion==="provs"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,marginBottom:24}}>
    {provs.map((p)=><Card key={p.id}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{p.nombre}</div>
          <Bdg c={p.tipo==="produccion"?"orange":"blue"}>{p.tipo==="produccion"?"Centro de Producción":"Externo"}</Bdg>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setEditProv(p);setFormProv({nombre:p.nombre,tipo:p.tipo,contacto:p.contacto||"",notas:p.notas||""});setModalProv(true);}}
            style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
          {p.tipo!=="produccion"&&<button onClick={()=>setConfirmar({msg:"Eliminar proveedor "+p.nombre+"?",fn:()=>{setProvs(prev=>prev.filter(x=>x.id!==p.id));supaDelete("proveedores","?id=eq."+p.id).catch(console.error);}})}
            style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>}
        </div>
      </div>
      {p.contacto&&<div style={{fontSize:12,color:MUT,marginTop:6}}>Contacto: {p.contacto}</div>}
      {p.notas&&<div style={{fontSize:12,color:MUT,marginTop:4}}>{p.notas}</div>}
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVO PROVEEDOR</div>
    <Btn onClick={()=>{setEditProv(null);setFormProv({nombre:"",tipo:"externo",contacto:"",notas:""});setModalProv(true);}}>+ Agregar proveedor</Btn>
  </Card>
</div>}
{modalProv&&<Mdl title={editProv?"EDITAR PROVEEDOR":"NUEVO PROVEEDOR"} onClose={()=>setModalProv(false)}>
  <div style={{display:"grid",gap:14}}>
    <LI label="Nombre"><input value={formProv.nombre} onChange={e=>setFormProv(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Tipo">
      <select value={formProv.tipo} onChange={e=>setFormProv(p=>({...p,tipo:e.target.value}))} style={{width:"100%"}} disabled={editProv?.tipo==="produccion"}>
        <option value="externo">Externo</option>
        <option value="produccion">Centro de Producción</option>
      </select>
    </LI>
    <LI label="Contacto (opcional)"><input value={formProv.contacto} onChange={e=>setFormProv(p=>({...p,contacto:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Notas (opcional)"><input value={formProv.notas} onChange={e=>setFormProv(p=>({...p,notas:e.target.value}))} style={{width:"100%"}}/></LI>
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
    <Btn v="ghost" onClick={()=>setModalProv(false)}>Cancelar</Btn>
    <Btn onClick={async()=>{
      if(!formProv.nombre.trim())return;
      if(editProv){
        await supaPatch("proveedores","?id=eq."+editProv.id,formProv).catch(console.error);
        setProvs(p=>p.map(x=>x.id===editProv.id?{...editProv,...formProv}:x));
      }else{
        const[created]=await supaPost("proveedores",formProv).catch(()=>[formProv]);
        setProvs(p=>[...p,created||formProv]);
      }
      setModalProv(false);
    }}>Guardar</Btn>
  </div>
</Mdl>}
{seccion==="users"&&<div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16,marginBottom:24}}>
    {users.map(u=><Card key={u.id}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{u.nombre}</div>
          <div style={{fontSize:12,color:MUT,marginBottom:6}}>{u.email}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <Bdg c={u.rol==="superadmin"?"orange":u.rol==="produccion"?"blue":u.rol==="admin_suc"?"green":"muted"}>
              {u.rol==="superadmin"?"Superadmin":u.rol==="admin_suc"?"Admin Suc.":u.rol==="staff_suc"?"Staff Suc.":"Producción"}
            </Bdg>
            {u.sucursal&&<Bdg c="muted">{u.sucursal}</Bdg>}
            {!u.activo&&<Bdg c="red">Inactivo</Bdg>}
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{setEditUser(u);setFormUser({nombre:u.nombre,email:u.email,password:u.password,rol:u.rol,sucursal:u.sucursal||sucs[0]||"",activo:u.activo});setModalUser(true);}}
            style={{background:FNT,color:MUT,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>E</button>
          {u.rol!=="superadmin"&&<button onClick={()=>setConfirmar({msg:"Eliminar usuario "+u.nombre+"?",fn:()=>{setUsers(p=>p.filter(x=>x.id!==u.id));supaDelete("users","?id=eq."+u.id).catch(console.error);}})}
            style={{background:RED+"18",color:RED,border:"none",borderRadius:4,padding:"4px 8px",fontSize:11}}>X</button>}
        </div>
      </div>
    </Card>)}
  </div>
  <Card xtra={{borderColor:ACC+"33"}}>
    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,letterSpacing:1,marginBottom:14}}>NUEVO USUARIO</div>
    <Btn onClick={()=>{setEditUser(null);setFormUser({nombre:"",email:"",password:"",rol:"staff_suc",sucursal:sucs[0]||"",activo:true});setModalUser(true);}}>+ Agregar usuario</Btn>
  </Card>
</div>}
{modalUser&&<Mdl title={editUser?"EDITAR USUARIO":"NUEVO USUARIO"} onClose={()=>setModalUser(false)}>
  <div style={{display:"grid",gap:14}}>
    <LI label="Nombre"><input value={formUser.nombre} onChange={e=>setFormUser(p=>({...p,nombre:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Email"><input type="email" value={formUser.email} onChange={e=>setFormUser(p=>({...p,email:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Contraseña"><input type="password" value={formUser.password} onChange={e=>setFormUser(p=>({...p,password:e.target.value}))} style={{width:"100%"}}/></LI>
    <LI label="Rol">
      <select value={formUser.rol} onChange={e=>setFormUser(p=>({...p,rol:e.target.value}))} style={{width:"100%"}}>
        <option value="superadmin">Superadmin</option>
        <option value="admin_suc">Admin Sucursal</option>
        <option value="staff_suc">Staff Sucursal</option>
        <option value="produccion">Producción</option>
      </select>
    </LI>
    {(formUser.rol==="admin_suc"||formUser.rol==="staff_suc")&&<LI label="Sucursal">
      <select value={formUser.sucursal} onChange={e=>setFormUser(p=>({...p,sucursal:e.target.value}))} style={{width:"100%"}}>
        {sucs.map(s=><option key={s}>{s}</option>)}
      </select>
    </LI>}
    <LI label="Estado">
      <select value={formUser.activo?"activo":"inactivo"} onChange={e=>setFormUser(p=>({...p,activo:e.target.value==="activo"}))} style={{width:"100%"}}>
        <option value="activo">Activo</option>
        <option value="inactivo">Inactivo</option>
      </select>
    </LI>
  </div>
  <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
    <Btn v="ghost" onClick={()=>setModalUser(false)}>Cancelar</Btn>
    <Btn onClick={async()=>{
      if(!formUser.nombre.trim()||!formUser.email.trim()||!formUser.password.trim())return;
      const suc=(formUser.rol==="admin_suc"||formUser.rol==="staff_suc")?formUser.sucursal:null;
      const data={...formUser,sucursal:suc};
      if(editUser){
        await supaPatch("users","?id=eq."+editUser.id,data).catch(console.error);
        setUsers(p=>p.map(u=>u.id===editUser.id?{...editUser,...data}:u));
      }else{
        const[created]=await supaPost("users",data).catch(()=>[data]);
        setUsers(p=>[...p,created||data]);
      }
      setModalUser(false);
    }}>Guardar</Btn>
  </div>
</Mdl>}
{confirmar&&<Confirmar mensaje={confirmar.msg} onSi={()=>{confirmar.fn();setConfirmar(null);}} onNo={()=>setConfirmar(null)}/>}

  </div>;
}