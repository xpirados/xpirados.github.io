/** HOFF-1500: garrafa, corpo de comando e pescoço curvo conforme ícone BF6. */
export function montarReparo(o,parent){
 const {m,grupo,cilindro,caixa,perfil,tubo}=o,g=grupo('HOFF-1500 / maçarico de reparo',[0,0,0],parent);
 cilindro(g,.19,.91,[0,-.26,0],m.azul,'y',.19,24);cilindro(g,.19,.13,[0,.26,0],m.azul,'y',.095,24);cilindro(g,.1,.1,[0,.37,0],m.aco);
 cilindro(g,.197,.036,[0,-.7,0],m.aco);cilindro(g,.195,.03,[0,.14,0],m.aco);
 perfil(g,[[-.11,-.24],[.11,-.24],[.08,.27],[-.18,.32],[-.2,.19],[-.1,.13]],.13,[0,.62,0],m.escuro);
 caixa(g,[.04,.2,.04],[-.13,.52,.075],m.laranja,[0,0,-.2]);
 tubo(g,[[-.06,.88,0],[-.1,1.08,0],[-.28,1.28,0],[-.58,1.36,0]],.027,m.borda);
 cilindro(g,.045,.22,[-.66,1.37,0],m.aco,'x',.047,12);
 cilindro(g,.072,.06,[.1,.9,0],m.aco,'z',.072,12);
 for(const y of [.48,.71])o.parafuso(g,[.04,y,.083],.019);
 o.texto(g,'HOFF',[0,-.2,.195],.26,'#cabd9d');o.texto(g,'1500',[0,-.32,.196],.23,'#cabd9d');
 return g;
}
