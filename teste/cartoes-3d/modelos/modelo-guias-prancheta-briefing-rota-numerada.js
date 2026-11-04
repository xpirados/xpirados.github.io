import {oficina} from './oficina.js';
export function criar(T){
 const o=oficina(T),{m,grupo,caixa,perfil,parafuso,superficie,grano}=o;
 const g=grupo('Prancheta de briefing / rota resolvida');g.rotation.x=-.26;
 const base=perfil(g,[[-1.95,-1.23],[1.95,-1.23],[2.03,-1.15],[2.03,1.15],[1.95,1.23],[-1.95,1.23],[-2.03,1.15],[-2.03,-1.15]],.085,[0,0,0],m.aco);
 o.contorno(g,base,'#b2afa4',.5);
 for(const x of [-1.88,1.88])for(const y of [-1.09,1.09])parafuso(g,[x,y,.055],.045);
 superficie(g,3.62,2.12,[0,-.02,.06],(c,W,H)=>{
  c.fillStyle='#c6b995';c.fillRect(0,0,W,H);grano(c,W,H,'#554a38',2400,.12);
  c.strokeStyle='#7e8069';c.lineWidth=1;
  for(let j=0;j<20;j++){c.beginPath();for(let i=0;i<=70;i++){const x=i/70*W*.69,y=80+j*18+Math.sin(i*.13+j*.18)*23+Math.cos(i*.3-j*.2)*12;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
  c.fillStyle='#202a27';c.font='bold 32px sans-serif';c.fillText('GUIA DE CAMPO',28,43);c.fillRect(28,56,W-56,2);
  const ps=[[80,367],[240,263],[438,139]];
  c.strokeStyle='#c75422';c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(...ps[0]);c.bezierCurveTo(200,370,115,260,...ps[1]);c.bezierCurveTo(355,255,317,152,...ps[2]);c.stroke();
  ps.forEach(([x,y],i)=>{c.beginPath();c.arc(x,y,25,0,7);c.fillStyle='#da7036';c.fill();c.strokeStyle='#26302a';c.lineWidth=3;c.stroke();c.fillStyle='#15201c';c.font='bold 32px sans-serif';c.textAlign='center';c.fillText(i+1,x,y+11);});
  c.textAlign='left';c.fillStyle='#26302a';c.font='bold 20px sans-serif';
  ['1  PREPARAR','2  SEGUIR','3  CONCLUIR'].forEach((t,i)=>{const y=125+i*95;c.fillText(t,545,y);c.strokeStyle='#416046';c.lineWidth=4;c.strokeRect(552,y+18,22,22);c.beginPath();c.moveTo(556,y+29);c.lineTo(563,y+36);c.lineTo(581,y+14);c.stroke();});
  c.fillStyle='#38523e';c.fillRect(534,408,207,49);c.fillStyle='#e7dfc4';c.font='bold 23px sans-serif';c.fillText('RESOLVIDO',563,440);
  c.fillStyle='#4c5348';c.font='15px monospace';c.fillText('ROTA ILUSTRATIVA / XP',29,482);
 },[0,0,0]);
 perfil(g,[[-.55,-.14],[.55,-.14],[.55,.07],[.3,.07],[.25,.19],[-.25,.19],[-.3,.07],[-.55,.07]],.06,[0,1.13,.14],m.borda);
 caixa(g,[.9,.025,.02],[0,1.07,.18],m.escuro);
 const lapis=grupo('Lápis do briefing',[1.94,-.06,.16],g);o.cilindro(lapis,.035,1.6,[0,0,0],m.laranja,'y',.035,6);o.cilindro(lapis,.035,.18,[0,.89,0],m.papel,'y',0,6);o.cilindro(lapis,.009,.035,[0,.99,0],m.preto);
 caixa(g,[.13,.23,.1],[1.94,-.5,.12],m.escuro);
 return o.finalizar({altura:3.15,largura:4.85,angulo:-.16,cameraY:1.7});
}
