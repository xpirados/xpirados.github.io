/** Recriação autoral pelas imagens locais do RPG-7V2 do BF6. Sem malha extraída. */
export function montarRPG(o,parent){
 const {m,grupo,cilindro,caixa,perfil,tubo}=o,g=grupo('RPG-7V2 / lança-foguetes',[0,0,0],parent);
 cilindro(g,.1,3.65,[0,0,0],m.aco,'x');
 cilindro(g,.124,1.02,[.95,0,0],o.mat('#604b37',.1,.9),'x',.124,16);
 for(const x of [-1.35,-.65,.4,1.47])cilindro(g,.139,.055,[x,0,0],m.borda,'x',.139,16);
 cilindro(g,.11,.42,[1.95,0,0],m.aco,'x',.245,20);cilindro(g,.23,.02,[2.17,0,0],m.preto,'x',.23,20);
 cilindro(g,.17,.18,[-1.88,0,0],m.oliva,'x',.095,24);cilindro(g,.29,.36,[-2.15,0,0],m.oliva,'x',.17,24);cilindro(g,.055,.6,[-2.63,0,0],m.oliva,'x',.29,24);
 for(const x of [-.55,.26]){perfil(g,[[-.08,.05],[.1,.05],[.08,-.53],[-.1,-.5]],.11,[x,-.09,0],m.escuro);for(let j=0;j<5;j++)caixa(g,[.17,.018,.124],[x,-.25-j*.045,0],m.aco);}
 perfil(g,[[-.28,0],[.18,0],[.18,-.36],[-.28,-.36]],.07,[.1,-.11,.01],m.aco,[[[-.22,-.07],[-.22,-.29],[.12,-.29],[.12,-.07]]]);
 caixa(g,[.32,.28,.1],[.35,.22,.09],m.oliva);cilindro(g,.13,.6,[.35,.48,.12],m.aco,'x',.12,16);cilindro(g,.136,.08,[.02,.48,.12],m.preto,'x');
 cilindro(g,.1,.07,[.35,.64,.12],m.escuro);caixa(g,[.07,.35,.08],[-1.15,.27,0],m.aco);
 for(let j=0;j<3;j++)caixa(g,[.02,.16,.008],[.7+j*.07,0,.128],m.laranja);
 o.texto(g,'RPG-7V2',[.93,.02,.14],.64,'#c8c2a7');
 return g;
}
