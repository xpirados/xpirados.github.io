/** Parque, Hangar e Doca — três silhuetas reais, uma escala, acabamento gráfico autoral.
 * Derivado estático simplificado; não distribui os GLB/texturas/UV/esqueletos de membros.
 * Medidas e procedência: testes/veiculos/proveniencia.json. Unidade física NÃO SEI.
 * A referência gerada precedeu este módulo: referencias/veiculos/conceito.png.
 */
import {oficina} from './oficina.js';

export async function criar(T){
 const [meta,buffer]=await Promise.all([
  fetch(new URL('./veiculos-estilizados.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Medidas dos veículos indisponíveis');return r.json();}),
  fetch(new URL('./veiculos-estilizados.bin',import.meta.url)).then(r=>{if(!r.ok)throw Error('Modelo dos veículos indisponível');return r.arrayBuffer();})
 ]);
 const o=oficina(T),{raiz,m,caixa,linhas,cilindro,recursos}=o;
 const gradient=new T.DataTexture(new Uint8Array([80,140,196,245]),4,1,T.RedFormat);
 gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=T.NearestFilter;recursos.add(gradient);
 const pintura=new T.MeshToonMaterial({vertexColors:true,gradientMap:gradient,flatShading:true});recursos.add(pintura);
 const traco=new T.LineBasicMaterial({color:'#c0c6b5',transparent:true,opacity:.20});recursos.add(traco);

 // Mesa/pátio autorais; a faixa de água e o cais tornam a Doca legível em tamanho pequeno.
 const concreto=o.mat('#595f5a',.1,.95),agua=o.mat('#294750',.35,.65);
 caixa(raiz,[4.8,.14,3.05],[0,-.91,0],m.escuro);
 caixa(raiz,[3.13,.13,2.99],[-.81,-.785,0],concreto);
 caixa(raiz,[1.6,.065,2.95],[1.57,-.837,0],agua);
 caixa(raiz,[.09,.12,2.99],[.76,-.73,0],m.borda);
 for(const z of [-1.4,-.5,.5,1.4]){
  cilindro(raiz,.035,.095,[.70,-.62,z],m.escuro,'y',.045,8);
  caixa(raiz,[.14,.012,.035],[.5,-.71,z],m.laranja);
 }
 for(const z of [-1.47,1.47])caixa(raiz,[4.65,.012,.025],[0,-.708,z],m.laranja);
 linhas(raiz,[[-2.3,-.711,-.5],[.61,-.711,-.5],[-2.3,-.711,.7],[.61,-.711,.7],[-1.1,-.711,-1.45],[-1.1,-.711,1.45]],'#8d9288',.3,true);
 // Água sem simulação pesada: traços curtos imóveis, nenhum shader animado.
 for(let k=0;k<19;k++){
  const x=.9+(k%4)*.36,z=-1.35+Math.floor(k/4)*.62;
  linhas(raiz,[[x,-.801,z],[x+.16,-.801,z-.025],[x+.25,-.801,z]],'#70939b',.46);
 }

 const colocacao={
  abrams:{p:[-1.13,-.71,.76],g:1.10},
  ah64e:{p:[-.72,.32,-.74],g:1.10},
  cb90:{p:[1.57,-.86,0],g:.16}
 };
 for(const s of meta.veiculos){
  const grupo=o.grupo(s.id),c=colocacao[s.id];grupo.position.set(...c.p);grupo.rotation.y=c.g;
  // O .bin já usa o mesmo fator .15 para os três. Não há scale por veículo.
  const q=new Int16Array(buffer,s.offset,s.vertices*3),pos=new Float32Array(q.length);
  for(let j=0;j<q.length;j++)pos[j]=q[j]/meta.quantizacao;
  const cor=new Uint8Array(buffer,s.offset_cores,s.vertices*3),colors=new Float32Array(cor.length),color=new T.Color();
  for(let j=0;j<cor.length;j+=3){color.setRGB(cor[j]/255,cor[j+1]/255,cor[j+2]/255,T.SRGBColorSpace);colors.set([color.r,color.g,color.b],j);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));
  geo.setIndex(new T.BufferAttribute(new Uint16Array(buffer,s.offset_indices,s.indices),1));geo.computeVertexNormals();recursos.add(geo);
  const mesh=new T.Mesh(geo,pintura);grupo.add(mesh);
  // Preserva cores por vértice; a oficina funde apenas a mesa, não este conjunto.
  grupo.userData.movel=true;
  const edge=new T.BufferGeometry();edge.setAttribute('position',geo.attributes.position);edge.setIndex(new T.BufferAttribute(new Uint16Array(buffer,s.offset_arestas,s.indices_arestas),1));recursos.add(edge);grupo.add(new T.LineSegments(edge,traco));
 }
 return o.finalizar({altura:2.95,largura:5.7,angulo:.29,cameraY:3.4,centroY:-.04});
}
