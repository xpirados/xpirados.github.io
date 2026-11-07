import {oficina} from './oficina.js';
export function criar(T){
 const o=oficina(T),{m,grupo,caixa,linhas,superficie,grano}=o;
 const livro=grupo('Caderneta de campo / português espanhol inglês');livro.rotation.y=.08;
 const capaMat=o.mat('#303b31',0,.97);capaMat.map=o.textura(256,256,(c,w,h)=>{c.fillStyle='#68715a';c.fillRect(0,0,w,h);grano(c,w,h,'#d6bd80',2500,.12);c.strokeStyle='#b09d6e';c.lineWidth=3;c.strokeRect(6,6,w-12,h-12);for(let i=0;i<25;i++){c.fillStyle='#a69367';c.fillRect(i*10,1,3,3);}});
 const folhaMat=o.mat('#d2c4a5',0,1);
 for(const lado of [-1,1]){
  const x=lado*.94;caixa(livro,[2.02,.11,2.46],[x,-.2,0],capaMat,[0,0,lado*.035]);
  caixa(livro,[1.78,.14,2.18],[x,-.09,0],folhaMat);
  for(let j=0;j<8;j++)linhas(livro,[[x-.86,-.145+j*.017,1.094],[x+.86,-.145+j*.017,1.094]],'#9a8e73',.5);
 }
 caixa(livro,[.12,.17,2.35],[0,-.12,0],capaMat);
 const pintar=(lado)=>(c,W,H)=>{
  c.fillStyle='#d8c9a5';c.fillRect(0,0,W,H);grano(c,W,H,'#675a3c',2200,.08);
  c.strokeStyle='#9c9072';c.lineWidth=2;c.strokeRect(25,22,W-50,H-44);
  c.fillStyle='#3d4337';c.font='bold 26px sans-serif';c.fillText(lado?'CAMPO / FIELD':'DICIONÁRIO',44,67);
  c.fillStyle='#a65c34';c.fillRect(44,85,W-88,4);
  const termos=lado?['FLANK','COVER','SQUAD']:['FLANCO','COBERTURA','ESQUADRÃO'];
  termos.forEach((t,i)=>{const y=150+i*119;c.fillStyle='#30372d';c.font='bold 34px sans-serif';c.fillText(t,44,y);c.fillStyle='#686d59';c.font='17px sans-serif';c.fillText(lado?['Flanco · Flank','Cobertura · Cover','Escuadrón · Squad'][i]:['PT / ES / EN','Termos da partida','Vocabulário da comunidade'][i],44,y+32);c.strokeStyle='#a99b7b';c.beginPath();c.moveTo(44,y+55);c.lineTo(W-44,y+55);c.stroke();});
  c.font='16px monospace';c.fillStyle='#696c55';c.fillText(lado?'037':'036',W-75,H-40);
 };
 for(const lado of [-1,1])superficie(livro,1.76,2.16,[lado*.94,.001,0],pintar(lado===1),[-Math.PI/2,0,0],512,640);
 // Folha flexível pivotada na lombada; textura própria dos dois lados.
 const folhas=grupo('Folha que vira',[.04,.018,0],livro);folhas.userData.movel=true;
 const geom=new T.PlaneGeometry(1.74,2.14,12,1);geom.rotateX(-Math.PI/2);geom.translate(.87,0,0);
 const p=geom.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setY(i,.045*Math.sin(x/1.74*Math.PI));}geom.computeVertexNormals();
 const mt=new T.MeshStandardMaterial({map:o.textura(512,640,pintar(true)),roughness:1,side:T.DoubleSide});o.recursos.add(mt);o.malha(folhas,geom,mt);
 const abas=[['PT','#9e9c62',-.66],['ES','#bd9255',-.05],['EN','#bdb397',.56]];
 for(const [s,cor,z]of abas){caixa(livro,[.44,.035,.4],[2,-.027,z],o.mat(cor));superficie(livro,.37,.32,[2.03,-.005,z],(c,w,h)=>{c.fillStyle=cor;c.fillRect(0,0,w,h);c.fillStyle='#273126';c.font='bold 70px monospace';c.textAlign='center';c.fillText(s,w/2,h*.72);},[-Math.PI/2,0,0],128,128);}
 for(const lado of [-1,1])for(let i=0;i<14;i++)linhas(livro,[[lado*(1.72+i%3*.07),-.135,1.19-i*.009],[lado*(1.75+i%3*.07),-.134,1.2-i*.009]],'#b7a47f',.7);
 caixa(livro,[.085,.025,2.36],[1.7,.035,0],m.preto);caixa(livro,[.12,.022,.58],[.3,-.17,1.3],m.laranja);
 for(let i=0;i<9;i++)o.tubo(livro,[[-.07,.01,-.93+i*.23],[0,.045,-.93+i*.23],[.07,.01,-.93+i*.23]],.01,m.papel);
 let aberto=false;
 const modelo=o.finalizar({altura:3.3,largura:5.1,angulo:-.13,cameraY:8.5,centroY:.4,pose(a){aberto=a>.05;},atualizar(t,ativo,reduzido){const fase=reduzido?.22:(t%7)/7;const v=ativo?Math.min(1,fase*1.5):Math.max(0,Math.min(1,(fase-.2)/.55));folhas.rotation.z=.1+Math.PI*.86*(.5-.5*Math.cos(v*Math.PI*2));modelo.alturaDinamica=3.3+Math.sin(folhas.rotation.z)*.95;}});return modelo;
}
