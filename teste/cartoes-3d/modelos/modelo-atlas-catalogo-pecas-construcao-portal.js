import {oficina} from './oficina.js';
export function criar(T){
 const o=oficina(T),{m,grupo,caixa,perfil,texto,linhas}=o;
 // Cada peça tem leitura arquitetônica própria; não há caixa nem mala.
 const parede=grupo('P-01 / parede de concreto com janela',[-1.15,.06,-.58]);
 const wall=perfil(parede,[[-.85,-.63],[.85,-.63],[.85,.63],[-.85,.63]],.17,[0,0,0],m.concreto,[[[-.52,-.28],[-.52,.25],[.52,.25],[.52,-.28]]]);o.contorno(parede,wall,'#d2d1c3',.5);
 for(const x of [-.7,.7])for(const y of [-.44,.44])o.cilindro(parede,.023,.008,[x,y,.095],m.escuro,'z',.023,8);
 const escada=grupo('P-02 / escada de concreto',[1.02,-.56,-.82]);escada.scale.setScalar(.84);
 for(let i=0;i<6;i++){const h=(i+1)*.18,z=.65-i*.23;const deg=caixa(escada,[1.25,h,.23],[0,h/2,z],m.concreto);o.contorno(escada,deg,'#c5c6b9',.5);}
 const viga=grupo('P-03 / viga de aço perfil I',[-1.12,-.39,1.25]);
 for(const y of [-.19,.19]){const a=caixa(viga,[1.8,.07,.38],[0,y,0],m.aco);o.contorno(viga,a,'#a0a7a3',.6);}caixa(viga,[1.8,.35,.065],[0,0,0],m.aco);
 const barreira=grupo('P-04 / barreira de concreto',[1.1,-.35,1.66]);
 const barrier=perfil(barreira,[[-.35,-.3],[.35,-.3],[.35,-.18],[.2,.02],[.13,.37],[-.13,.37],[-.2,.02],[-.35,-.18]],1.65,[0,0,0],m.concreto);barrier.rotation.y=Math.PI/2;o.contorno(barreira,barrier,'#c5c6b9',.4);
 const codes=[['P-01',-1.15,-.58],['P-02',1.08,-.58],['P-03',-1.15,1.4],['P-04',1.1,1.94]];
 for(const [t,x,z]of codes){const label=texto(o.raiz,t,[x,-.7,z+.52],.56,'#c6c8bf');label.rotation.x=-Math.PI/2;}
 linhas(o.raiz,[[-2.2,-.72,.4],[2.2,-.72,.4],[0,-.72,-1.55],[0,-.72,2.15]],'#5b6669',.7,true);
 const selection=new T.Box3Helper(new T.Box3(new T.Vector3(-2.05,-.62,-.73),new T.Vector3(-.24,.76,-.43)),0xff8a3d);selection.userData.movel=true;o.raiz.add(selection);
 for(const x of [-2.05,-.24])for(const y of [-.62,.76])caixa(o.raiz,[.065,.065,.065],[x,y,-.42],m.laranja);
 return o.finalizar({altura:3.5,largura:5.6,angulo:-.32,cameraY:6,atualizar(t,ativo){selection.material.opacity=ativo?.95:.7;selection.material.transparent=true;}});
}
