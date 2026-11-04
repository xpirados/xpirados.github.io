/** Mina M15: forma observada na imagem local do BF6; geometria autoral. */
export function montarMina(o,parent){
 const {m,grupo,cilindro,caixa,tubo}=o,g=grupo('M15 / mina antitanque',[0,0,0],parent);
 cilindro(g,.67,.21,[0,0,0],m.oliva,'y',.63,48);
 cilindro(g,.59,.037,[0,.122,0],m.aco,'y',.59,48);cilindro(g,.54,.04,[0,.15,0],m.oliva,'y',.54,48);
 cilindro(g,.2,.035,[0,.18,0],m.escuro,'y',.2,24);cilindro(g,.14,.038,[0,.215,0],m.oliva,'y',.14,12);caixa(g,[.21,.018,.047],[0,.242,0],m.aco);
 for(const z of [-.61,.61])tubo(g,[[-.25,-.02,z],[-.26,-.01,z*1.23],[.26,-.01,z*1.23],[.25,-.02,z]],.025,m.aco);
 const paint=o.superficie(g,.69,.3,[0,.176,.31],(c,w,h)=>{c.fillStyle='#b1ab6d';c.font='bold 40px monospace';c.textAlign='center';c.fillText('M15',w/2,h*.55);c.fillStyle='#c86a40';c.fillRect(w*.33,h*.7,w*.34,7);},[-Math.PI/2,0,0],256,128);
 return g;
}
