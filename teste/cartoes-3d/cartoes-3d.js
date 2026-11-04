/** Cartões XPirados — API pública: iniciarCartoes3D(canvas | raiz).
 * Um WebGLRenderer para a página inteira; viewports/scissors por cartão.
 * Importação, geometria e shaders apenas depois da primeira interseção real.
 * Os canvases originais nunca perdem o contexto 2D nem são substituídos.
 */
export const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
const TIPOS=['montador','mapas','guias','atlas','gadgets','dicionario','veiculos'];
let unico;
export function iniciarCartoes3D(alvo=document,opcoes={}) {
  if(!unico)unico=criarGestor(opcoes);
  unico.adicionar(alvo);return unico;
}
function criarGestor(opcoes){
  const itens=new Map(), abort=new AbortController(), reduz=matchMedia('(prefers-reduced-motion: reduce)');
  const metricas={cpu:[],gpu:[],intervalos:[],preparacao:[],quadros:0,importacaoMs:null,primeiraMaquinaMs:null,erro:null};
  let T,criarModelo,renderer,promessa,raf=0,anterior=0,ultimoAtivo=0,relogio=0,modo='auto',pausado=false,destruido=false,disponivel=true,dim='',layout=true;
  let gl,ext,filaGPU=[],amostraGPU=0,inicio=0,ultimoDesenho=0,medirGPU=!!opcoes.medirGPU,ambiente,sombra;
  const folha=document.createElement('style');folha.dataset.cartoes3d='estilos';
  folha.textContent=`.ferramenta[data-maquina3d]{transform:none!important}
    .ferramenta[data-maquina3d]:has(canvas:focus-visible){outline:2px solid #ff8a3d;outline-offset:3px}
    canvas[data-desenho][data-maquina3d]{touch-action:pan-y;cursor:grab;background:transparent!important}
    canvas[data-desenho][data-maquina3d]:active{cursor:grabbing}
    canvas[data-desenho][data-maquina3d]:focus-visible{outline:2px solid #ff8a3d;outline-offset:3px}
    .maquinas-3d-camada{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;contain:strict}`;
  document.head.append(folha);
  const ouvir=(el,tipo,fn,opts={})=>el.addEventListener(tipo,fn,{...opts,signal:abort.signal});
  function agendar(){if(!raf&&!destruido&&!document.hidden&&disponivel)raf=requestAnimationFrame(quadro);}
  function evento(item,estado,extra={}){item.cv.dispatchEvent(new CustomEvent('cartao3d:estado',{bubbles:true,detail:{tipo:item.tipo,estado,...extra}}));}
  function mostrarFallback(){for(const i of itens.values()){i.cv.style.opacity=i.opacidade;delete i.cv.dataset.pronto3d;evento(i,'fallback',{motivo:metricas.erro});}}
  async function carregar(){
    if(promessa)return promessa;
    inicio=performance.now();
    promessa=(async()=>{
      try{
        [T,{criarModelo}]=await Promise.all([import(THREE_URL),import('./modelos.js')]);
        if(destruido)return;
        metricas.importacaoMs=performance.now()-inicio;
        renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
        renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
        renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
        renderer.autoClear=false;renderer.info.autoReset=false;
        const cv=renderer.domElement;cv.className='maquinas-3d-camada';cv.setAttribute('aria-hidden','true');
        if(opcoes.zIndex!==undefined)cv.style.zIndex=String(opcoes.zIndex);
        document.body.append(cv);gl=renderer.getContext();ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
        ouvir(cv,'webglcontextlost',e=>{e.preventDefault();disponivel=false;cancelAnimationFrame(raf);raf=0;metricas.erro='contexto WebGL perdido';mostrarFallback();});
        ouvir(cv,'webglcontextrestored',()=>{disponivel=true;filaGPU=[];metricas.erro=null;dim='';agendar();});
        const ts=performance.now();await prepararEstudio();metricas.preparacao.push({etapa:'estudio pre-calculado',inicio:ts,duracao:performance.now()-ts,incluiImportacao:true});if(!destruido)agendar();
      }catch(e){metricas.erro=String(e.message||e);disponivel=false;renderer?.domElement.remove();mostrarFallback();}
    })();return promessa;
  }
  async function prepararEstudio(){
    // Mesmo ambiente autoral, pré-filtrado na preparação local. Nenhum PMREM em runtime.
    const tex=await new T.TextureLoader().loadAsync(new URL('./modelos/ambiente-estudio-cubeuv.png',import.meta.url).href);
    tex.mapping=T.CubeUVReflectionMapping;tex.colorSpace=T.LinearSRGBColorSpace;tex.flipY=false;tex.generateMipmaps=false;tex.minFilter=tex.magFilter=T.LinearFilter;
    if(destruido){tex.dispose();return;}ambiente={texture:tex,dispose(){tex.dispose();}};
    const sc=document.createElement('canvas');sc.width=sc.height=64;const ctx=sc.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,31);
    g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.4,'rgba(0,0,0,.32)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);sombra=new T.CanvasTexture(sc);
  }
  let filaConstrucao=Promise.resolve();
  function construir(i){
    if(i.carregando)return;i.carregando=true;
    // Cada construção e compilação ganha sua própria tarefa; seis cartões visíveis
    // não acumulam todo o trabalho de preparação em uma única microtarefa longa.
    filaConstrucao=filaConstrucao.then(()=>new Promise(r=>setTimeout(r,0))).then(()=>montar(i));
  }
  async function montar(i){
    if(destruido)return;
    try{
    const ti=performance.now(),modelo=await criarModelo(T,i.tipo);metricas.preparacao.push({etapa:'modelo '+i.tipo,inicio:ti,duracao:performance.now()-ti,incluiImportacao:true});if(destruido){modelo.destruir();return;}i.modelo=modelo;
    i.cena=new T.Scene();i.pivo=new T.Group();i.pivo.add(i.modelo.raiz);i.cena.add(i.pivo);
    i.cena.environment=ambiente.texture;
    i.cena.add(new T.HemisphereLight(0xb9c7cf,0x333128,i.tipo==='montador'?.85:1.25));
    const key=new T.DirectionalLight(0xffe2bc,i.tipo==='montador'?1.6:2.8);key.position.set(-3,4,6);i.cena.add(key);
    const borda=new T.DirectionalLight(0x86b6ce,1.5);borda.position.set(3,2,-4);i.cena.add(borda);
    const fria=new T.DirectionalLight(0xc3d8e8,.7);fria.position.set(2,1,5);i.cena.add(fria);
    const sg=new T.PlaneGeometry(i.tipo==='montador'?6.8:3.8,2.8),sm=new T.MeshBasicMaterial({map:sombra,transparent:true,depthWrite:false});
    i.sombra=new T.Mesh(sg,sm);i.sombra.rotation.x=-Math.PI/2;i.sombra.position.y=i.tipo==='montador'?-1.67:-1.05;i.cena.add(i.sombra);
    i.camera=new T.OrthographicCamera(-3,3,2,-2,.1,50);
    i.camera.position.set(0,i.modelo.cameraY??4.5,9);i.camera.lookAt(0,i.modelo.centroY||0,0);
    i.giro=i.modelo.angulo; i.pivo.rotation.y=i.giro;
    i.compilando=true;
    const tc=performance.now(),compilacao=renderer.compileAsync(i.cena,i.camera);metricas.preparacao.push({etapa:'chamada compile '+i.tipo,inicio:tc,duracao:performance.now()-tc});await compilacao;if(!destruido){i.compilando=false;agendar();}
    }catch(e){i.erro=String(e);i.compilando=false;evento(i,'fallback',{motivo:i.erro});}
  }
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){const i=itens.get(e.target);if(!i)continue;i.visivel=e.isIntersecting&&e.intersectionRatio>0;if(!i.visivel){i.ativo=false;i.toque=false;}}
    layout=true;if([...itens.values()].some(i=>i.visivel)){carregar();agendar();}else agendar();
  },{threshold:[0,.01]});
  const resize=new ResizeObserver(()=>{layout=true;agendar();});
  function adicionar(alvo){
    const lista=alvo.matches?.('canvas[data-desenho]')?[alvo]:alvo.querySelectorAll('canvas[data-desenho]');
    for(const cv of lista){
      const tipo=cv.dataset.desenho;if(itens.has(cv)||!TIPOS.includes(tipo))continue;
      const cartao=cv.closest('.ferramenta')||cv;
      const i={cv,cartao,tipo,visivel:false,ativo:false,toque:false,abertura:0,giro:0,inclinacao:0,zoom:1,
        opacidade:cv.style.opacity,atributos:Object.fromEntries(['tabindex','role','aria-hidden','aria-label'].map(a=>[a,cv.getAttribute(a)]))};
      itens.set(cv,i);cv.dataset.maquina3d='';cartao.dataset.maquina3d='';
      cv.tabIndex=0;cv.setAttribute('role','img');cv.removeAttribute('aria-hidden');
      cv.setAttribute('aria-label',`Modelo de ${tipo}. Enter ativa a exploração. Setas giram. Mais e menos ajustam o zoom. Escape restaura a vista.`);
      ouvir(cartao,'pointerenter',e=>{if(e.pointerType==='mouse'){i.ativo=true;agendar();}});
      ouvir(cartao,'pointerleave',e=>{if(e.pointerType==='mouse'&&!i.arrasto){i.ativo=false;agendar();}});
      ouvir(cv,'pointerdown',e=>{
        if(e.button!==0||!i.modelo||!cv.dataset.pronto3d)return;
        i.arrasto={x:e.clientX,y:e.clientY,origX:e.clientX,origY:e.clientY,moveu:false,tipo:e.pointerType};
        if(e.pointerType==='mouse'){i.ativo=true;cv.setPointerCapture(e.pointerId);}
        agendar();
      });
      ouvir(cv,'pointermove',e=>{
        const a=i.arrasto;if(!a)return;
        const dx=e.clientX-a.x,dy=e.clientY-a.y;
        if(Math.hypot(e.clientX-a.origX,e.clientY-a.origY)>5)a.moveu=true;
        if(a.moveu){i.giro+=dx*.009;if(e.pointerType==='mouse')i.inclinacao=Math.max(-.7,Math.min(.7,i.inclinacao+dy*.007));i.ativo=true;}
        a.x=e.clientX;a.y=e.clientY;agendar();
      });
      ouvir(cv,'pointerup',e=>{
        const a=i.arrasto;if(!a)return;
        if(e.pointerType!=='mouse'&&!a.moveu){for(const outro of itens.values()){if(outro!==i){outro.toque=false;outro.ativo=false;}}i.toque=!i.toque;i.ativo=i.toque;}
        if(e.pointerType!=='mouse'&&a.moveu){i.toque=true;i.ativo=true;}
        if(e.pointerType==='mouse'&&!cartao.matches(':hover'))i.ativo=false;
        i.arrasto=null;agendar();
      });
      ouvir(cv,'pointercancel',()=>{i.arrasto=null;i.ativo=i.toque=false;agendar();});
      // O cartão é um link: sem isto o navegador arrasta o link e cancela o giro logo no começo.
      ouvir(cartao,'dragstart',e=>{if(i.arrasto)e.preventDefault();});
      // Explorar o desenho não navega o link que envolve o cartão; título/texto continuam links.
      ouvir(cv,'click',e=>{if(cv.dataset.pronto3d){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
      ouvir(cv,'wheel',e=>{if(!i.ativo||!e.ctrlKey)return;e.preventDefault();i.zoom=Math.max(.72,Math.min(1.4,i.zoom-e.deltaY*.001));agendar();},{passive:false});
      ouvir(cv,'keydown',e=>{
        if(!['Enter',' ','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;
        if(!cv.dataset.pronto3d)return;e.preventDefault();e.stopPropagation();
        if(e.key==='Enter'||e.key===' ')i.ativo=i.toque=!i.toque;
        if(e.key==='Escape'){i.ativo=i.toque=false;i.zoom=1;i.giro=i.modelo.angulo;i.inclinacao=0;}
        if(e.key==='ArrowLeft')i.giro-=.18;if(e.key==='ArrowRight')i.giro+=.18;
        if(e.key==='ArrowUp')i.inclinacao=Math.max(-.7,i.inclinacao-.12);if(e.key==='ArrowDown')i.inclinacao=Math.min(.7,i.inclinacao+.12);
        if(['+','='].includes(e.key))i.zoom=Math.min(1.4,i.zoom+.1);if(e.key==='-')i.zoom=Math.max(.72,i.zoom-.1);agendar();
      });
      ouvir(cv,'blur',()=>{i.ativo=i.toque=false;agendar();});observer.observe(cv);resize.observe(cv);
    }
  }
  ouvir(document,'pointerdown',e=>{if(!e.target.closest('canvas[data-desenho]')){for(const i of itens.values()){i.toque=false;if(e.pointerType!=='mouse')i.ativo=false;}agendar();}},{passive:true});
  ouvir(window,'scroll',()=>{layout=true;agendar();},{passive:true,capture:true});
  ouvir(window,'resize',()=>{layout=true;agendar();},{passive:true});
  ouvir(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;anterior=0;}else{layout=true;agendar();}});
  ouvir(reduz,'change',()=>{agendar();});
  function guardar(lista,n){lista.push(n);if(lista.length>1800)lista.shift();}
  function quadro(agora){
    raf=0;if(!renderer||document.hidden||destruido||!disponivel)return;
    // Monitores de 165/240 Hz não precisam repetir uma rotação lenta nessa taxa.
    if(!layout&&modo==='auto'&&!reduz.matches&&agora-ultimoDesenho<1000/60-.5){agendar();return;}
    ultimoDesenho=agora;
    const t0=performance.now(),delta=anterior?Math.min((agora-anterior)/1000,.05):0;anterior=agora;
    const animar=!reduz.matches&&!pausado&&modo==='auto';if(animar)relogio+=delta;
    const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,opcoes.pixelRatioMaximo||1.25);
    const tamanho=`${w}/${h}/${dpr}`;if(tamanho!==dim){renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);dim=tamanho;layout=true;}
    if(layout){for(const i of itens.values())i.rect=i.cv.getBoundingClientRect();layout=false;}
    const visiveis=[...itens.values()].filter(i=>i.visivel&&i.cv.isConnected&&i.rect.width>0&&i.rect.height>0&&i.rect.bottom>0&&i.rect.top<h);
    // A leitura do timer é assíncrona: nunca força gl.finish nem bloqueia a GPU.
    if(medirGPU&&ext){while(filaGPU.length&&gl.getQueryParameter(filaGPU[0],gl.QUERY_RESULT_AVAILABLE)){
      const q=filaGPU.shift();if(!gl.getParameter(ext.GPU_DISJOINT_EXT))guardar(metricas.gpu,gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);
    }}
    let query;if(medirGPU&&ext&&visiveis.length&&++amostraGPU%4===0&&filaGPU.length<8){query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);}
    renderer.info.reset();renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
    let transicao=false,desenhados=0,estreia=false;
    for(const i of visiveis){
      if(i.erro)continue;if(!i.modelo){construir(i);continue;}if(i.compilando)continue;
      if(!i.cv.dataset.pronto3d){if(estreia){transicao=true;continue;}estreia=true;}
      const alvo=modo==='explodido'?1:modo==='montado'?0:i.ativo?1:0;
      i.abertura=reduz.matches||modo!=='auto'?alvo:i.abertura+(alvo-i.abertura)*(1-Math.exp(-delta*6));
      if(Math.abs(i.abertura-alvo)>.001)transicao=true;
      i.modelo.pose(i.abertura);i.modelo.atualizar?.(relogio,i.ativo,reduz.matches);
      const oscilacao=modo==='auto'&&!reduz.matches?Math.sin(relogio*.24)*(i.tipo==='mapas'?.15:.065):0;
      i.pivo.rotation.set(i.inclinacao,i.giro+oscilacao,0);
      const r=i.rect,aspecto=r.width/r.height;
      const largura=i.modelo.largura||0;
      const altura=Math.max(i.modelo.alturaDinamica||i.modelo.altura+(i.modelo.aberta-i.modelo.altura)*i.abertura,largura/aspecto)/i.zoom;
      const camera=i.camera;camera.left=-altura*aspecto/2;camera.right=-camera.left;camera.top=altura/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();
      renderer.setViewport(r.left,h-r.bottom,r.width,r.height);
      renderer.setScissor(Math.max(0,r.left),Math.max(0,h-r.bottom),Math.min(w,r.right)-Math.max(0,r.left),Math.min(h,r.bottom)-Math.max(0,r.top));
      renderer.render(i.cena,camera);desenhados++;
      if(!i.cv.dataset.pronto3d){i.cv.dataset.pronto3d='true';i.cv.style.opacity='0';evento(i,'pronto',{pecas:i.modelo.pecas.length});
        if(metricas.primeiraMaquinaMs===null)requestAnimationFrame(()=>{if(metricas.primeiraMaquinaMs===null)metricas.primeiraMaquinaMs=performance.now()-inicio;});
      }
    }
    if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);filaGPU.push(query);}
    if(desenhados){guardar(metricas.cpu,performance.now()-t0);if(ultimoAtivo&&agora-ultimoAtivo<100)guardar(metricas.intervalos,agora-ultimoAtivo);ultimoAtivo=agora;metricas.quadros++;}
    else ultimoAtivo=0;
    if(visiveis.length&&(animar||transicao))agendar();else anterior=0;
  }
  function resumo(a){const s=[...a].sort((a,b)=>a-b),n=s.length;return{amostras:n,media:n?s.reduce((a,b)=>a+b,0)/n:null,p50:n?s[Math.floor((n-1)*.5)]:null,p95:n?s[Math.floor((n-1)*.95)]:null,max:n?s[n-1]:null};}
  const api={adicionar,
    medirGPU(valor=true){medirGPU=valor;},
    estado(valor='auto'){if(!['auto','montado','explodido'].includes(valor))throw Error('Estado inválido');modo=valor;for(const i of itens.values()){i.giro=i.modelo?.angulo||0;i.inclinacao=0;i.zoom=1;}agendar();},
    pausar(valor=true){pausado=valor;agendar();},
    medir(){return{three:THREE_URL,contextos:renderer?1:0,quadros:metricas.quadros,preparacao:metricas.preparacao,importacaoMs:metricas.importacaoMs,primeiraMaquinaMs:metricas.primeiraMaquinaMs,cpuMs:resumo(metricas.cpu),gpuMs:resumo(metricas.gpu),intervaloMs:resumo(metricas.intervalos),timerGpuDisponivel:!!ext,erro:metricas.erro,reduzido:reduz.matches,modo,desenho:renderer?{chamadas:renderer.info.render.calls,triangulos:renderer.info.render.triangles}:null,cartoes:[...itens.values()].map(i=>({tipo:i.tipo,visivel:i.visivel,construido:!!i.modelo,pronto:!!i.cv.dataset.pronto3d,pecas:i.modelo?.pecas.length||0,abertura:i.abertura,giro:i.giro}))};},
    zerarMedicao(){metricas.cpu=[];metricas.gpu=[];metricas.intervalos=[];ultimoAtivo=0;},
    destruir(){destruido=true;cancelAnimationFrame(raf);observer.disconnect();resize.disconnect();abort.abort();
      for(const i of itens.values()){i.modelo?.destruir();i.cv.style.opacity=i.opacidade;delete i.cv.dataset.maquina3d;delete i.cv.dataset.pronto3d;delete i.cartao.dataset.maquina3d;
        i.sombra?.geometry.dispose();i.sombra?.material.dispose();
        for(const [a,v] of Object.entries(i.atributos))v===null?i.cv.removeAttribute(a):i.cv.setAttribute(a,v);
      }
      for(const q of filaGPU)gl.deleteQuery(q);ambiente?.dispose();sombra?.dispose();renderer?.dispose();renderer?.domElement.remove();folha.remove();itens.clear();unico=null;
    }
  };return api;
}
