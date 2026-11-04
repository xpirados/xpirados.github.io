/** M4A1 derivada da malha BF6: pose estática simplificada + pintura/traço autorais.
 * A origem e os hashes estão em testes/rodada-3/proveniencia-m4a1.json.
 */
export async function criar(T){
 const [meta,buffer]=await Promise.all([
  fetch(new URL('./m4a1-estilizada.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Metadados M4A1 indisponíveis');return r.json();}),
  fetch(new URL('./m4a1-estilizada.bin',import.meta.url)).then(r=>{if(!r.ok)throw Error('Malha M4A1 indisponível');return r.arrayBuffer();})
 ]);
 const raiz=new T.Group(),pecas=[],res=[];
 const gradient=new T.DataTexture(new Uint8Array([65,125,185,240]),4,1,T.RedFormat);gradient.needsUpdate=true;gradient.minFilter=gradient.magFilter=T.NearestFilter;res.push(gradient);
 const mat=new T.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:gradient});res.push(mat);
 const linhaMat=new T.LineBasicMaterial({color:'#bcb7a6',transparent:true,opacity:.28});res.push(linhaMat);
 for(const s of meta.partes){
  const q=new Int16Array(buffer,s.offset,s.vertices*3),pos=new Float32Array(q.length),colors=new Float32Array(q.length);
  const c=new T.Color(),laranja=new T.Color('#db753b'),cinza=new T.Color('#526168'),preto=new T.Color('#303b40');
  for(let i=0;i<q.length;i+=3){const x=q[i]/5000,y=q[i+1]/5000,z=q[i+2]/5000;pos[i]=x;pos[i+1]=y;pos[i+2]=z;
   const faixa=(x>1.05&&x<1.6&&y>.52)||(x< -1.45&&x> -2.15&&y>.3&&y<.53)||(y<-.45&&y>-.67&&x>-.25&&x<.8);
   c.copy(faixa?laranja:(s.nome.includes('magazine')?preto:cinza));c.multiplyScalar(.89+Math.sin(x*7+y*5)*.055);colors.set([c.r,c.g,c.b],i);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(new T.BufferAttribute(new Uint16Array(buffer,s.offset+s.vertices*6,s.indices),1));geo.computeVertexNormals();res.push(geo);
  const mesh=new T.Mesh(geo,mat);mesh.name=s.nome;raiz.add(mesh);pecas.push(mesh);
  const raw=new Int16Array(buffer,s.offset_arestas,s.vertices_arestas*3),edges=new Float32Array(raw.length);for(let i=0;i<raw.length;i++)edges[i]=raw[i]/5000;
  const edgeGeo=new T.BufferGeometry();edgeGeo.setAttribute('position',new T.BufferAttribute(edges,3));res.push(edgeGeo);raiz.add(new T.LineSegments(edgeGeo,linhaMat));
 }
 raiz.rotation.z=.065;
 return{raiz,pecas,altura:2.9,aberta:2.9,largura:7.15,angulo:-.22,cameraY:1.3,pose(){},atualizar(){},destruir(){res.forEach(r=>r.dispose());}};
}
