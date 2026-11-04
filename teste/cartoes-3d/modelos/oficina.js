/** Primitivas e materiais autorais. Sem modelos/texturas do jogo neste módulo. */
export function oficina(T){
 const raiz=new T.Group(),recursos=new Set(),pecas=[],materiaisLinha=new Map();
 function materialLinha(cor,opacidade){const k=cor+'/'+opacidade;if(!materiaisLinha.has(k)){const ma=new T.LineBasicMaterial({color:cor,transparent:opacidade<1,opacity:opacidade});recursos.add(ma);materiaisLinha.set(k,ma);}return materiaisLinha.get(k);}
 const mat=(cor,metal=.15,rug=.85)=>{const m=new T.MeshStandardMaterial({color:cor,metalness:metal,roughness:rug});
  m.onBeforeCompile=s=>{s.vertexShader='varying vec3 vUso;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvUso=position;');s.fragmentShader='varying vec3 vUso;\nfloat graoXP(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grao=graoXP(floor(vUso*220.));float marca=step(.98,graoXP(floor(vUso*vec3(23.,170.,19.))));diffuseColor.rgb*=.88+grao*.17;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.5+vec3(.06),marca*.2);');};
  recursos.add(m);return m;};
 const m={aco:mat('#40484c',.7,.52),borda:mat('#9b9d96',.45,.65),escuro:mat('#1e2427'),preto:mat('#101518'),oliva:mat('#454b3a'),laranja:mat('#e97430',.2,.7),papel:mat('#c9b993',0,1),concreto:mat('#747a79',0,1),azul:mat('#355562',.4,.6)};
 function grupo(nome,pos=[0,0,0],parent=raiz){const g=new T.Group();g.name=nome;g.position.set(...pos);parent.add(g);pecas.push(g);return g;}
 function malha(g,geo,material,pos=[0,0,0],rot=[0,0,0]){const o=new T.Mesh(geo,material);o.position.set(...pos);o.rotation.set(...rot);g.add(o);recursos.add(geo);return o;}
 const caixa=(g,t,p,ma=m.aco,r=[0,0,0])=>malha(g,new T.BoxGeometry(...t),ma,p,r);
 function perfil(g,pontos,prof,pos,ma=m.aco,furos=[]){const sh=new T.Shape();pontos.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();for(const pts of furos){const h=new T.Path();pts.forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();sh.holes.push(h);}const geo=new T.ExtrudeGeometry(sh,{depth:prof,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,steps:1});geo.translate(0,0,-prof/2);return malha(g,geo,ma,pos);}
 function cilindro(g,r,h,p,ma=m.aco,eixo='y',r2=r,n=20){return malha(g,new T.CylinderGeometry(r2,r,h,n),ma,p,eixo==='x'?[0,0,-Math.PI/2]:eixo==='z'?[Math.PI/2,0,0]:[0,0,0]);}
 function barra(g,a,b,w,ma=m.aco){const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va);const o=caixa(g,[w,d.length(),w],va.clone().add(vb).multiplyScalar(.5).toArray(),ma);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function tubo(g,pts,r,ma=m.aco){return malha(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),18,r,6,false),ma);}
 function linhas(g,pts,cor='#a0a7a5',opacidade=1,segmentos=false){const geo=new T.BufferGeometry().setFromPoints(pts.map(p=>new T.Vector3(...p))),ma=materialLinha(cor,opacidade);recursos.add(geo);const o=segmentos?new T.LineSegments(geo,ma):new T.Line(geo,ma);g.add(o);return o;}
 function contorno(g,obj,cor='#a4aba9',opacidade=.45,angulo=35){const geo=new T.EdgesGeometry(obj.geometry,angulo),ma=materialLinha(cor,opacidade);recursos.add(geo);const l=new T.LineSegments(geo,ma);l.position.copy(obj.position);l.rotation.copy(obj.rotation);l.scale.copy(obj.scale);g.add(l);return l;}
 function textura(w,h,pintar){const c=document.createElement('canvas');c.width=w;c.height=h;pintar(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;recursos.add(t);return t;}
 function superficie(g,w,h,pos,pintar,rot=[-Math.PI/2,0,0],tw=768,th=512){const map=textura(tw,th,pintar),ma=new T.MeshStandardMaterial({map,roughness:1,metalness:0,side:T.DoubleSide});recursos.add(ma);return malha(g,new T.PlaneGeometry(w,h),ma,pos,rot);}
 function texto(g,s,p,w=.65,cor='#ded6c5',fundo=null){const obj=superficie(g,w,w*.32,p,(c,W,H)=>{if(fundo){c.fillStyle=fundo;c.fillRect(0,0,W,H);}c.fillStyle=cor;c.font='bold 56px Consolas,monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(s,W/2,H/2);},[0,0,0],256,82);obj.material.transparent=true;obj.material.depthWrite=false;return obj;}
 function parafuso(g,p,r=.028){cilindro(g,r,.018,p,m.borda,'z',r,8);caixa(g,[r*1.1,.006,.003],[p[0],p[1],p[2]+.01],m.preto);}
 function grano(c,w,h,cor='#000',n=1300,alpha=.08){let seed=1307;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};c.fillStyle=cor;c.globalAlpha=alpha;for(let i=0;i<n;i++)c.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1);c.globalAlpha=1;}
 function finalizar({altura=3.5,angulo=-.24,cameraY=5,centroY=0,largura=5.4,pose=()=>{},atualizar=()=>{}}={}){
  // Funde apenas as malhas estáticas, mantendo folhas, marcadores e seleção animáveis.
  raiz.updateMatrixWorld(true);const porMat=new Map(),retirar=[];
  raiz.traverse(o=>{if(!o.isMesh)return;let p=o,movel=false;while(p&&p!==raiz){if(p.userData.movel){movel=true;break;}p=p.parent;}if(movel||Array.isArray(o.material))return;
   let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const list=porMat.get(o.material)||[];list.push(geo);porMat.set(o.material,list);retirar.push(o);
  });
  for(const [ma,geos] of porMat){const geo=new T.BufferGeometry();for(const key of ['position','normal','uv']){if(!geos.every(g=>g.attributes[key]))continue;const len=geos.reduce((s,g)=>s+g.attributes[key].array.length,0),a=new Float32Array(len);let off=0;for(const g of geos){a.set(g.attributes[key].array,off);off+=g.attributes[key].array.length;}geo.setAttribute(key,new T.BufferAttribute(a,geos[0].attributes[key].itemSize));}recursos.add(geo);raiz.add(new T.Mesh(geo,ma));geos.forEach(g=>g.dispose());}
  retirar.forEach(o=>o.removeFromParent());
  const conjuntos=new Map(),velhas=[];
  raiz.traverse(l=>{if(!l.isLine||Array.isArray(l.material))return;let p=l;while(p&&p!==raiz){if(p.userData.movel)return;p=p.parent;}
   const geo=l.geometry.index?l.geometry.toNonIndexed():l.geometry.clone();geo.applyMatrix4(l.matrixWorld);const pos=geo.attributes.position,col=geo.attributes.color;
   const lista=conjuntos.get(l.material)||{p:[],c:[]};for(let i=0;i<pos.count-1;i+=l.isLineSegments?2:1)for(const k of [i,i+1]){lista.p.push(pos.getX(k),pos.getY(k),pos.getZ(k));if(col)lista.c.push(col.getX(k),col.getY(k),col.getZ(k));}conjuntos.set(l.material,lista);geo.dispose();velhas.push(l);
  });
  for(const [ma,v]of conjuntos){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v.p,3));if(v.c.length)geo.setAttribute('color',new T.Float32BufferAttribute(v.c,3));recursos.add(geo);raiz.add(new T.LineSegments(geo,ma));}velhas.forEach(l=>l.removeFromParent());
  return{raiz,pecas,altura,aberta:altura,angulo,cameraY,centroY,largura,pose,atualizar,destruir(){raiz.traverse(o=>{o.geometry?.dispose();if(o.material){for(const ma of Array.isArray(o.material)?o.material:[o.material]){ma.map?.dispose();ma.gradientMap?.dispose();ma.dispose();}}});recursos.forEach(r=>r.dispose());}};
 }
 return{T,raiz,m,mat,recursos,grupo,malha,caixa,perfil,cilindro,barra,tubo,linhas,contorno,textura,superficie,texto,parafuso,grano,finalizar};
}
