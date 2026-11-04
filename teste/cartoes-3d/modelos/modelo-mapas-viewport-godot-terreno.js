import {oficina} from './oficina.js';
export function criar(T){
 const o=oficina(T),{raiz,m,grupo,malha,caixa,linhas,texto,cilindro}=o;
 const g=grupo('Viewport de editor / terreno triangulado');
 const grid=new T.GridHelper(5.6,28,'#596368','#303b40');grid.position.y=-.7;g.add(grid);
 const N=19,verts=[],ix=[];
 const altura=(x,z)=>-.55+1.16*Math.exp(-((x+.65)**2+(z+.35)**2)*2)+.87*Math.exp(-((x-1.05)**2+(z-.45)**2)*2.6)+.19*Math.sin(x*4+z*2)*Math.cos(z*3);
 for(let z=0;z<=N;z++)for(let x=0;x<=N;x++){const X=(x/N-.5)*4.2,Z=(z/N-.5)*2.8;verts.push(X,altura(X,Z),Z);}
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){const a=z*(N+1)+x,b=a+1,c=a+N+1,d=c+1;ix.push(a,c,b,b,c,d);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(ix);geo.computeVertexNormals();
 const terreno=malha(g,geo,o.mat('#56646b',.15,.96));const wg=new T.WireframeGeometry(geo);const wire=new T.LineSegments(wg,new T.LineBasicMaterial({color:'#a3c6ce',transparent:true,opacity:.25}));wire.position.y=.006;g.add(wire);
 const pinos=[[-1.35,-.75,'A'],[.05,-.45,'B'],[1.25,.9,'C']];
 for(const [x,z,t] of pinos){const y=altura(x,z);cilindro(g,.013,.42,[x,y+.21,z],m.borda);const tex=o.textura(128,128,(c,w,h)=>{c.fillStyle='#236989';c.fillRect(0,0,w,h);c.strokeStyle='#b9d1d5';c.lineWidth=5;c.strokeRect(3,3,w-6,h-6);c.fillStyle='#f1efe6';c.font='bold 86px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t,w/2,h/2+3);});const ma=new T.SpriteMaterial({map:tex});o.recursos.add(ma);const l=new T.Sprite(ma);l.position.set(x,y+.55,z);l.scale.set(.31,.31,1);g.add(l);}
 // Gizmo XYZ de editor, geometria e cores deliberadamente familiares.
 const origem=new T.Vector3(2.25,.1,.9);
 for(const [d,c] of [[[1,0,0],0xe46155],[[0,1,0],0x6fb674],[[0,0,1],0x559ad4]])g.add(new T.ArrowHelper(new T.Vector3(...d),origem,.65,c,.12,.07));
 texto(g,'X',[2.99,.05,.9],.21,'#ee7165');texto(g,'Y',[2.25,.9,.9],.21,'#78d083');texto(g,'Z',[2.25,.05,1.7],.21,'#78a9ed');
 // Câmera e frustum visíveis, não uma ilustração de câmera em 2D.
 const cam=grupo('Câmera do editor',[-2.5,.15,1.35]);caixa(cam,[.28,.2,.2],[0,0,0],m.aco);
 const a=[.08,0,0],corners=[[.72,.28,-.35],[.72,.28,.35],[.72,-.28,.35],[.72,-.28,-.35]];
 linhas(cam,corners.flatMap((p,i)=>[a,p,p,corners[(i+1)%4]]),'#b8c4c9',.7,true);
 const luz=grupo('Luz do editor',[-2.2,.6,-.8]);malha(luz,new T.IcosahedronGeometry(.095),m.laranja);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;linhas(luz,[[Math.cos(a)*.16,Math.sin(a)*.16,0],[Math.cos(a)*.27,Math.sin(a)*.27,0]],'#e5ba72');}
 const sel=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,x=.5+Math.cos(a)*.65,z=.35+Math.sin(a)*.49;sel.push([x,altura(x,z)+.02,z]);}linhas(g,sel,'#ff8a3d');
 return o.finalizar({altura:3.5,largura:6.4,angulo:-.35,cameraY:6.4});
}
