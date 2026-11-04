/* XPVeiculos — os blindados da batalha do site, vistos de cima, no traço do helicóptero (D-27; peças separadas na D-28).
   Arquivo sem dependência. Carregar com <script src="veiculos.js"></script>; ele cria window.XPVeiculos.

   XPVeiculos.desenha(ctx, tipo, estado)
     ctx     CanvasRenderingContext2D. O estado do contexto (transformação, alfa, traço) volta como estava.
     tipo    "bradley" (M3A3 Bradley) · "abrams" (M1A2 SEPv3) · "cheetah" (Cheetah 1A2, a antiaérea)
     estado  {
       x, y        centro do casco, em px do canvas
       angulo      rumo do casco em radianos; 0 = nariz para +x (o mesmo do helicóptero)
       escala      px por unidade do desenho; 1 unidade = 1 px na escala 1, e 11 unidades = 1 metro
                   (na escala 0,8 o Abrams mede uns 70 px de casco)
       torre       ângulo da torre RELATIVO ao casco, em radianos (0 = canhão para a frente)
       recuo       0..1: 1 logo depois do tiro (canhão todo para trás), 0 em repouso
       lagarta     deslocamento dos elos da lagarta ESQUERDA, em unidades; some a distância que ela andou
       lagartaD    opcional: o da lagarta direita (sem ele, igual à esquerda). Girando parado, as duas andam ao contrário
       dano        0..1: marcas de queima e rachaduras crescendo com o dano
       destruido   true: casco queimado, torre deslocada, lagarta partida
       desmontado  true (com destruido): só o casco queimado, sem torre, lagartas e o resto, que voaram (ver pecas)
       forca       opcional: 1 pinta na cor de areia da segunda força; sem ele, o laranja do site
       radar       opcional: ângulo do radar de busca da antiaérea (sem ele, gira pelo relógio)
       cor         opcional: cor do traço principal (o lampejo de acerto, por exemplo); vale também para o fino
       alfa        opcional: opacidade geral, 0..1
     }

   XPVeiculos.medidas[tipo]
     { comprimento, largura,     tamanho total com o canhão para a frente, em unidades
       casco: {comprimento, largura},
       torreEm: {x, y},          eixo da torre no casco (unidades; +x frente, +y lado direito)
       armas: { nome: {x, y, recuo, tipo} } }  boca de cada arma no sistema da TORRE (unidades);
                                 recuo = quanto o cano anda para trás com recuo 1; tipo "canhao"|"metralhadora"|"missil"|"lanca-granada"

   XPVeiculos.boca(tipo, estado, arma) -> {x, y, angulo}
     onde o tiro sai, em px do canvas, já com casco, torre, escala e recuo aplicados. angulo = rumo do tiro.

   AS PEÇAS (D-28: o veículo destruído se desmonta). O desenho montado É a soma das peças: cada uma tem a sua função de
   desenho e o seu ponto de encaixe, e montado e desmontado são o mesmo veículo.
   XPVeiculos.pecas(tipo) -> [{nome, quadro: "casco"|"torre", tipo, em: {x, y}, raio}]
     tipo da peça: "lagarta" | "roda" | "placa" | "escotilha" | "torre" | "canhao" | "lancador" | "radar" | "grade" | "rampa"
     em = ponto de encaixe, em unidades, no sistema do casco ou da torre; raio = tamanho da peça, em unidades
   XPVeiculos.pecasNoMundo(tipo, estado) -> a mesma lista com {x, y, angulo} em px do canvas, no instante do estado
   XPVeiculos.desenhaPeca(ctx, tipo, nome, estado)
     estado {x, y, angulo, escala, alfa, desenrola, cor}: a peça solta, centrada no ponto de encaixe; desenrola 0..1
     estica a lagarta para trás, como corrente que se soltou. A peça solta sai queimada; cor (opcional) pinta o traço dela
     (a página a usa em brasa no primeiro segundo).

   XPVeiculos.desenhaVetor(ctx, tipo, estado)
     o mesmo desenho, chamada a chamada, sem cache. Serve de referência; na página use desenha().

   Peso: desenha() guarda casco, cada lagarta e torre prontos em imagem (ImageBitmap), uma por combinação de escala na tela,
   cor, força, vivo/morto, fase da lagarta, marcas de dano e recuo, e a cada quadro só gira e cola. O radar da antiaérea gira
   à parte. Escala que muda a cada quadro gera imagem nova a cada 0,05 de escala; o cache se limpa acima de 600. A peça solta
   se desenha em vetor (são poucas, por poucos segundos).

   O tiro, a fumaça, a sombra, o fogo do casco queimado e o voo das peças ficam com a página: aqui é só o desenho. */
(function(){
  "use strict";
  var U = 11; /* unidades por metro */
  var PASSO = 5; /* distância entre os elos da lagarta, em unidades */

  var medidas = {
    abrams: {comprimento: 110, largura: 40, casco: {comprimento: 87, largura: 40}, torreEm: {x: 6, y: 0},
      armas: {canhao: {x: 60, y: 0, recuo: 7, tipo: "canhao"}, coax: {x: 18, y: 3.5, recuo: 0, tipo: "metralhadora"},
              rws: {x: 13, y: 8.5, recuo: 0, tipo: "metralhadora"}}},
    bradley: {comprimento: 81, largura: 40, casco: {comprimento: 72, largura: 40}, torreEm: {x: 2, y: 3},
      armas: {canhao: {x: 41, y: 0, recuo: 3, tipo: "canhao"}, coax: {x: 14, y: 3.5, recuo: 0, tipo: "metralhadora"},
              tow: {x: 6, y: -15, recuo: 0, tipo: "missil"}}},
    cheetah: {comprimento: 81, largura: 42, casco: {comprimento: 75, largura: 41}, torreEm: {x: -2, y: 0},
      armas: {canhaoE: {x: 45, y: -14.5, recuo: 4, tipo: "canhao"}, canhaoD: {x: 45, y: 14.5, recuo: 4, tipo: "canhao"},
              missilE: {x: -1, y: -19.5, recuo: 0, tipo: "missil"}, missilD: {x: -1, y: 19.5, recuo: 0, tipo: "missil"}}}
  };

  /* as cores do site: laranja forte no contorno, laranja claro nos detalhes finos, fundo quase preto por dentro; a segunda
     força no areia que a página já usa para ela */
  var VIVO = {linha: "rgba(255,138,61,.9)", fino: "rgba(255,178,122,.62)", casco: "rgba(12,13,15,.93)", torre: "rgba(14,15,17,.97)", esteira: "rgba(8,9,10,.95)"};
  var AREIA = {linha: "rgba(222,208,180,.88)", fino: "rgba(236,226,206,.55)", casco: "rgba(12,13,15,.93)", torre: "rgba(14,15,17,.97)", esteira: "rgba(8,9,10,.95)"};
  var MORTO = {linha: "rgba(150,128,105,.62)", fino: "rgba(118,100,84,.45)", casco: "rgba(22,17,13,.95)", torre: "rgba(26,19,14,.97)", esteira: "rgba(14,11,9,.95)"};

  function poli(c, p){ c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); }
  function roda(c, x, y, r){ c.moveTo(x + r, y); c.arc(x, y, r, 0, 6.2832); }
  function traco(c, x0, y0, x1, y1){ c.moveTo(x0, y0); c.lineTo(x1, y1); }
  function resto(v, m){ return (((v || 0) % m) + m) % m; }
  function fino(c, pal, lw){ c.strokeStyle = pal.fino; c.lineWidth = lw.fino; c.stroke(); }
  function grosso(c, pal, lw){ c.strokeStyle = pal.linha; c.lineWidth = lw.linha; c.stroke(); }

  /* uma lagarta (lado -1 = esquerda, y < 0; +1 = direita): faixa escura, elos que correm com o deslocamento e as rodas de apoio
     por baixo. Partida = a esquerda rompida, com a ponta solta (veículo destruído sem desmontar). Desenrola = a peça solta: a
     corrente estica para trás da traseira, fazendo curva, como lagarta que saiu das rodas */
  function lagarta(c, m, est, pal, lw, lado){
    var x0 = m.x0, x1 = m.x1, a = m.dentro, b = m.fora, y0 = lado < 0 ? -b : a, alt = b - a, passo = PASSO;
    var off = resto(lado > 0 && est.lagartaD != null ? est.lagartaD : est.lagarta, passo);
    var partida = est.destruido && !est.solta && lado < 0, u = est.solta ? (est.desenrola || 0) : 0, x;
    c.fillStyle = pal.esteira; c.beginPath(); c.rect(x0, y0, x1 - x0, alt); c.fill();
    c.beginPath();
    for (x = x0 + off; x < x1; x += passo){ if (partida && x > m.quebra - 3 && x < m.quebra + 4) continue; traco(c, x, y0, x, y0 + alt); }
    if (lw.s >= 1.5 && !est.solta){ /* as rodas só aparecem grandes: no tamanho da página viram ruído em cima dos elos */
      var n = m.rodas, d = (x1 - x0 - 6) / (n - 1), meio = lado * (a + b) / 2;
      for (var k = 0; k < n; k++) roda(c, x0 + 3 + k * d, meio, 1.5); }
    fino(c, pal, lw);
    c.beginPath();
    if (partida){ c.rect(x0, y0, m.quebra - 3 - x0, alt); c.rect(m.quebra + 4, y0, x1 - m.quebra - 4, alt); traco(c, m.quebra - 3, -b, m.quebra + 5, -b - 6); }
    else c.rect(x0, y0, x1 - x0, alt);
    c.strokeStyle = pal.fino; c.lineWidth = lw.linha; c.stroke();   /* a lagarta fica no traço fino: quem manda na silhueta é o casco */
    if (u > 0){ /* a corrente solta: elos atrás da traseira, curvando para fora */
      var fim = x0 - u * (x1 - x0) * 0.9, L = x1 - x0;
      c.fillStyle = pal.esteira; c.beginPath();
      for (x = x0 - passo; x > fim; x -= passo){ var k2 = (x0 - x) / L, dy = lado * k2 * k2 * 26 * u; c.rect(x, y0 + dy, passo - 1, alt); }
      c.fill(); c.strokeStyle = pal.fino; c.lineWidth = lw.fino; c.stroke(); }
  }
  /* uma roda de apoio solta: disco com cubo */
  function rodaSolta(c, x, y, pal, lw){ c.fillStyle = pal.esteira; c.beginPath(); roda(c, x, y, 3.4); c.fill(); grosso(c, pal, lw); c.beginPath(); roda(c, x, y, 1.2); fino(c, pal, lw); }
  /* uma placa da saia: montada é só a emenda (ou os parafusos); solta é a chapa inteira */
  function placa(c, est, pal, lw, x0, y0, x1, y1, montada){
    if (est.solta){ c.fillStyle = pal.casco; c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.fill(); grosso(c, pal, lw); }
    c.beginPath(); montada(c); fino(c, pal, lw); }

  /* marcas de queima e rachadura, em posições fixas por veículo (sem acaso: o mesmo dano desenha igual) */
  var MARCAS = [[-18, -6, 6.5], [14, 7, 5.5], [-30, 9, 5], [24, -9, 4.5], [-6, 11, 4], [4, -11, 3.5]];
  function marcas(c, est, raioX){
    var n = est.destruido ? MARCAS.length : Math.round((est.dano || 0) * 5); if (!n) return;
    c.fillStyle = "rgba(4,4,5,.82)"; c.beginPath();
    for (var i = 0; i < n; i++){ var q = MARCAS[i], x = q[0] * raioX / 40; c.moveTo(x + q[2], q[1]); c.ellipse(x, q[1], q[2], q[2] * 0.7, 0.6, 0, 6.2832); }
    c.fill();
  }
  /* o casco que ficou sem a torre: o anel aberto onde ela estava */
  function anel(c, m, pal, lw, r){ if (!m.desmontado) return; c.fillStyle = "rgba(3,3,4,.9)"; c.beginPath(); roda(c, m.tx, m.ty, r); c.fill(); grosso(c, pal, lw); }

  /* ===== M1A2 SEPv3 Abrams: casco largo e baixo; torre grande em cunha com cesto atrás; canhão longo de 120 mm com o
     evacuador no meio; estação de arma remota no comandante (direita), visor independente à esquerda; grade do motor e
     escapamento na traseira; sete rodas por lagarta ===== */
  var ABR = {x0: -43, x1: 43, dentro: 13, fora: 20, rodas: 7, quebra: -6};
  function abramsCasco(c, est, pal, lw){
    c.fillStyle = pal.casco; c.beginPath(); poli(c, [43.5, -10, 40, -14, -43.5, -14, -43.5, 14, 40, 14, 43.5, 10]); c.fill();
    grosso(c, pal, lw);
    c.beginPath();
    traco(c, 36, -12, 36, -5); traco(c, 36, 5, 36, 12);          /* fim da chapa da frente, aberta onde passa o canhão */
    c.rect(33, -3, 6, 6);                                        /* escotilha do motorista, no centro */
    c.rect(-38, -11, 18, 9); c.rect(-38, 2, 18, 9);              /* as duas grades do motor */
    for (var g = -36; g < -20; g += 3){ traco(c, g, -10, g, -3); traco(c, g, 3, g, 10); }
    c.rect(-43.5, -12, 3, 24);                                   /* grade do escapamento, na chapa de trás */
    for (var e = -10; e <= 10; e += 4) traco(c, -43.5, e, -40.5, e);
    traco(c, -18, -13, -18, 13);
    fino(c, pal, lw);
    marcas(c, est, 40);
    anel(c, {desmontado: est.desmontado, tx: 6, ty: 0}, pal, lw, 12);
  }
  function abramsTorre(c, est, pal, lw){
    c.fillStyle = pal.torre; c.beginPath(); c.rect(-23, -13, 11, 26); c.fill();             /* cesto de carga, atrás */
    c.beginPath(); poli(c, [18, -4.5, 9, -16.5, -12, -16.5, -14, -14, -14, 14, -12, 16.5, 9, 16.5, 18, 4.5]); c.fill();
    grosso(c, pal, lw);
    c.beginPath();
    c.rect(-23, -13, 11, 26); for (var k = -20; k < -12; k += 3) traco(c, k, -13, k, 13); traco(c, -23, 0, -12, 0);
    roda(c, 8, -10, 2.2);                                                                     /* visor independente */
    c.rect(6, 2.5, 5, 3.5);                                                                    /* visor do atirador */
    traco(c, 18, 3.5, 13, 3.5);                                                                /* coaxial */
    fino(c, pal, lw);
  }
  function abramsCanhao(c, est, pal, lw){
    var r = (est.recuo || 0) * medidas.abrams.armas.canhao.recuo;
    c.strokeStyle = pal.linha; c.beginPath(); c.lineWidth = 3; traco(c, 17 - r, 0, 60 - r, 0); c.stroke();   /* canhão de 120 mm */
    c.beginPath(); c.lineWidth = 4.4; traco(c, 35 - r, 0, 41 - r, 0); c.stroke();             /* evacuador */
    c.lineWidth = lw.linha; c.beginPath(); c.rect(15, -4, 5, 8); c.stroke();                  /* mantelete */
  }
  function abramsEscC(c, est, pal, lw){ c.beginPath(); roda(c, -3, 8.5, 4.2); if (est.solta){ c.fillStyle = pal.torre; c.fill(); } fino(c, pal, lw); }  /* comandante */
  function abramsRws(c, est, pal, lw){ c.beginPath(); c.rect(1, 6, 5, 5); traco(c, 6, 8.5, 13, 8.5); if (est.solta){ c.fillStyle = pal.torre; c.fill(); } fino(c, pal, lw); }  /* arma remota */
  function abramsEscL(c, est, pal, lw){ c.beginPath(); roda(c, -3, -8.5, 3.4); traco(c, -1, -10.5, 6, -12); if (est.solta){ c.fillStyle = pal.torre; c.fill(); } fino(c, pal, lw); }  /* carregador */

  /* ===== M3A3 Bradley: casco alto, anguloso, com placas de blindagem nos lados; grade do motor na frente direita e o
     motorista na frente esquerda; torre pequena desviada para a direita; canhão fino de 25 mm; caixa do TOW na
     esquerda da torre; escotilha de carga e rampa atrás; seis rodas por lagarta ===== */
  var BRA = {x0: -36, x1: 35, dentro: 13, fora: 20, rodas: 6, quebra: 4};
  function bradleyCasco(c, est, pal, lw){
    c.fillStyle = pal.casco; c.beginPath(); poli(c, [36, -9, 30, -15, -36, -15, -36, 15, 30, 15, 36, 9]); c.fill();
    grosso(c, pal, lw);
    c.beginPath();
    poli(c, [30, -11, 25, -12, -30, -12, -30, 12, 25, 12, 30, 11]);                            /* teto, menor que a base: lados inclinados */
    c.rect(20, 2, 11, 9); for (var g = 22; g < 31; g += 3) traco(c, g, 2, g, 11);             /* grade do motor, frente direita */
    roda(c, 25, -7, 3.2);                                                                      /* motorista */
    fino(c, pal, lw);
    marcas(c, est, 34);
    anel(c, {desmontado: est.desmontado, tx: 2, ty: 3}, pal, lw, 10);
  }
  function bradleyEscotilha(c, est, pal, lw){ c.beginPath(); c.rect(-27, -10, 13, 8); if (est.solta){ c.fillStyle = pal.casco; c.fill(); } fino(c, pal, lw); }   /* escotilha de carga */
  function bradleyRampa(c, est, pal, lw){ c.beginPath(); c.rect(-36, -10, 5, 20); traco(c, -36, 0, -31, 0); if (est.solta){ c.fillStyle = pal.casco; c.fill(); } fino(c, pal, lw); } /* rampa traseira */
  function bradleyPlaca(x0, x1, lado){ /* placas laterais: montadas, os parafusos; soltas, a chapa */
    return function(c, est, pal, lw){ var y0 = lado < 0 ? -15 : 12;
      placa(c, est, pal, lw, x0, y0, x1, y0 + 3, function(c){ for (var p = x0 + 2; p < x1; p += 8) traco(c, p, y0, p, y0 + 3); }); }; }
  function bradleyTorre(c, est, pal, lw){
    c.fillStyle = pal.torre; c.beginPath(); poli(c, [12, -7, 8, -11, -11, -11, -14, -8, -14, 8, -11, 11, 8, 11, 12, 7]); c.fill();
    grosso(c, pal, lw);
    c.beginPath(); c.rect(-12, 6, 4, 3.5); c.rect(2, -8, 4, 3); traco(c, 14, 3.5, 9, 3.5); fino(c, pal, lw);   /* visores e coaxial */
  }
  function bradleyCanhao(c, est, pal, lw){
    var r = (est.recuo || 0) * medidas.bradley.armas.canhao.recuo;
    c.strokeStyle = pal.linha; c.beginPath(); c.lineWidth = 1.6; traco(c, 12 - r, 0, 41 - r, 0); c.stroke();             /* 25 mm */
    c.lineWidth = lw.linha; c.beginPath(); c.rect(38.5 - r, -1.4, 3, 2.8); c.rect(9, -3, 4, 6); c.stroke();
  }
  function bradleyTow(c, est, pal, lw){
    c.fillStyle = pal.torre; c.beginPath(); c.rect(-12, -19, 18, 7); c.fill(); grosso(c, pal, lw);
    c.beginPath(); traco(c, -12, -15.5, 6, -15.5); roda(c, 4.5, -17.3, 1.2); roda(c, 4.5, -13.8, 1.2); fino(c, pal, lw);  /* os dois tubos do TOW */
  }
  function bradleyEscC(c, est, pal, lw){ c.beginPath(); roda(c, -6, 4.5, 3.4); if (est.solta){ c.fillStyle = pal.torre; c.fill(); } fino(c, pal, lw); }  /* comandante */
  function bradleyEscA(c, est, pal, lw){ c.beginPath(); roda(c, -6, -4, 2.8); if (est.solta){ c.fillStyle = pal.torre; c.fill(); } fino(c, pal, lw); }  /* atirador */

  /* ===== Cheetah 1A2: casco de Leopard 1 com o nariz em cunha e o motor atrás; torre larga com um canhão de 35 mm de
     cada lado, por fora; radar de tiro na frente da torre e radar de busca atrás, girando; casulos de mísseis
     atrás dos canhões; sete rodas por lagarta ===== */
  var CHE = {x0: -37, x1: 36, dentro: 14, fora: 20.5, rodas: 7, quebra: 10};
  function cheetahCasco(c, est, pal, lw){
    c.fillStyle = pal.casco; c.beginPath(); poli(c, [37.5, -8, 31, -14.5, -37.5, -14.5, -37.5, 14.5, 31, 14.5, 37.5, 8]); c.fill();
    grosso(c, pal, lw);
    c.beginPath();
    traco(c, 31, -14.5, 31, 14.5);                                                             /* dobra do nariz */
    roda(c, 27, 8, 2.8);                                                                       /* motorista, frente direita */
    fino(c, pal, lw);
    marcas(c, est, 36);
    anel(c, {desmontado: est.desmontado, tx: -2, ty: 0}, pal, lw, 12);
  }
  function cheetahGrade(c, est, pal, lw){ /* grades do motor, atrás */
    c.beginPath(); c.rect(-35, -12, 20, 24); if (est.solta){ c.fillStyle = pal.casco; c.fill(); }
    traco(c, -35, 0, -15, 0); for (var g = -33; g < -15; g += 3) traco(c, g, -12, g, 12); fino(c, pal, lw); }
  function cheetahTorre(c, est, pal, lw){
    c.fillStyle = pal.torre; c.beginPath(); poli(c, [14, -8, 10, -12, -14, -12, -15, -10, -15, 10, -14, 12, 10, 12, 14, 8]); c.fill();
    grosso(c, pal, lw);
    c.beginPath(); roda(c, 1, -6, 2.8); roda(c, 1, 6, 2.8); fino(c, pal, lw);                  /* escotilhas */
  }
  function cheetahCanhao(lado){ /* caixa do canhão, por fora da torre, e o cano de 35 mm */
    return function(c, est, pal, lw){ var r = (est.recuo || 0) * medidas.cheetah.armas.canhaoE.recuo, y = lado * 14.5;
      c.fillStyle = pal.torre; c.beginPath(); c.rect(-6, lado < 0 ? -17 : 12, 16, 5); c.fill(); grosso(c, pal, lw);
      c.beginPath(); c.lineWidth = 2; traco(c, 10 - r, y, 45 - r, y); c.stroke();
      c.lineWidth = lw.linha; c.beginPath(); c.rect(42 - r, y - 1.5, 4, 3); c.stroke(); }; }
  function cheetahCasulo(lado){ /* casulo de mísseis, atrás do canhão, com três bocas */
    return function(c, est, pal, lw){
      c.fillStyle = pal.torre; c.beginPath(); c.rect(-13, lado < 0 ? -21 : 17, 11, 4); c.fill(); grosso(c, pal, lw);
      c.beginPath(); for (var t = -11; t < -2; t += 3.5) roda(c, t + 1.8, lado * 19, 1.1); fino(c, pal, lw); }; }
  function cheetahRadarTiro(c, est, pal, lw){
    if (est.solta){ c.fillStyle = pal.torre; c.beginPath(); roda(c, 17.5, 0, 4); c.fill(); }
    c.beginPath(); roda(c, 17.5, 0, 4); grosso(c, pal, lw);
    c.beginPath(); traco(c, 14, -4, 17.5, -4); traco(c, 14, 4, 17.5, 4); fino(c, pal, lw); }
  /* o radar de busca gira sozinho: fica fora da imagem guardada da torre e se desenha a cada quadro */
  function radarBusca(c, est, pal, lw){
    var ar = est.solta ? 0 : est.radar != null ? est.radar : (est.destruido ? 0.7 : (typeof performance !== "undefined" ? performance.now() : 0) * 0.004);
    c.save(); c.translate(-10, 0); c.rotate(ar);
    c.fillStyle = pal.torre; c.strokeStyle = pal.linha; c.lineWidth = lw.linha; c.beginPath(); c.rect(-1.8, -10, 3.6, 20); c.fill(); c.stroke();
    c.beginPath(); roda(c, 0, 0, 1.6); c.strokeStyle = pal.fino; c.lineWidth = lw.fino; c.stroke(); c.restore();
  }

  /* ===== as peças de cada veículo, na ordem em que se desenham (de baixo para cima). quadro: onde a peça mora (casco ou
     torre); em: o ponto de encaixe, que é o centro da peça solta; fica: não se solta (o casco queimado fica no lugar);
     montada false: só existe solta (as rodas, que no tamanho da página não se desenham montadas); radar: gira à parte ===== */
  function roda3(m){ /* três rodas de cada lado viram peça solta: a 2ª, a 4ª e a 6ª */
    var l = [], d = (m.x1 - m.x0 - 6) / (m.rodas - 1), meio = (m.dentro + m.fora) / 2;
    [1, 3, 5].forEach(function(k){ [-1, 1].forEach(function(lado){ var x = m.x0 + 3 + k * d, y = lado * meio;
      l.push({nome: "roda" + k + (lado < 0 ? "E" : "D"), quadro: "casco", tipo: "roda", em: {x: x, y: y}, raio: 3.4, montada: false,
        fn: function(c, est, pal, lw){ rodaSolta(c, x, y, pal, lw); }}); }); });
    return l; }
  function lagartas2(m){ var meio = (m.dentro + m.fora) / 2, raio = (m.x1 - m.x0) / 2;
    return [{nome: "lagartaE", quadro: "casco", tipo: "lagarta", em: {x: (m.x0 + m.x1) / 2, y: -meio}, raio: raio, fn: function(c, est, pal, lw){ lagarta(c, m, est, pal, lw, -1); }},
            {nome: "lagartaD", quadro: "casco", tipo: "lagarta", em: {x: (m.x0 + m.x1) / 2, y: meio}, raio: raio, fn: function(c, est, pal, lw){ lagarta(c, m, est, pal, lw, 1); }}]; }
  function abramsPlaca(x0, x1, lado){ var y0 = lado < 0 ? -20 : 16;
    return function(c, est, pal, lw){ placa(c, est, pal, lw, x0, y0, x1, y0 + 4, function(c){ traco(c, x0, y0, x0, y0 + 4); traco(c, x1, y0, x1, y0 + 4); }); }; }
  var PECAS = {
    abrams: lagartas2(ABR).concat(roda3(ABR), [
      {nome: "casco", quadro: "casco", tipo: "casco", em: {x: 0, y: 0}, raio: 40, fica: true, fn: abramsCasco},
      {nome: "placaE1", quadro: "casco", tipo: "placa", em: {x: -16.5, y: -18}, raio: 11, fn: abramsPlaca(-27, -6, -1)},
      {nome: "placaE2", quadro: "casco", tipo: "placa", em: {x: 4.5, y: -18}, raio: 11, fn: abramsPlaca(-6, 15, -1)},
      {nome: "placaD1", quadro: "casco", tipo: "placa", em: {x: -16.5, y: 18}, raio: 11, fn: abramsPlaca(-27, -6, 1)},
      {nome: "placaD2", quadro: "casco", tipo: "placa", em: {x: 4.5, y: 18}, raio: 11, fn: abramsPlaca(-6, 15, 1)},
      {nome: "torre", quadro: "torre", tipo: "torre", em: {x: -2, y: 0}, raio: 20, fn: abramsTorre},
      {nome: "canhao", quadro: "torre", tipo: "canhao", em: {x: 38, y: 0}, raio: 22, fn: abramsCanhao},
      {nome: "escotilhaC", quadro: "torre", tipo: "escotilha", em: {x: -3, y: 8.5}, raio: 4.2, fn: abramsEscC},
      {nome: "armaRemota", quadro: "torre", tipo: "lancador", em: {x: 7, y: 8.5}, raio: 6, fn: abramsRws},
      {nome: "escotilhaL", quadro: "torre", tipo: "escotilha", em: {x: -2, y: -9.5}, raio: 4, fn: abramsEscL}]),
    bradley: lagartas2(BRA).concat(roda3(BRA), [
      {nome: "casco", quadro: "casco", tipo: "casco", em: {x: 0, y: 0}, raio: 36, fica: true, fn: bradleyCasco},
      {nome: "escotilha", quadro: "casco", tipo: "escotilha", em: {x: -20.5, y: -6}, raio: 7, fn: bradleyEscotilha},
      {nome: "rampa", quadro: "casco", tipo: "rampa", em: {x: -33.5, y: 0}, raio: 10, fn: bradleyRampa},
      {nome: "placaE1", quadro: "casco", tipo: "placa", em: {x: -15, y: -13.5}, raio: 15, fn: bradleyPlaca(-30, 0, -1)},
      {nome: "placaE2", quadro: "casco", tipo: "placa", em: {x: 15, y: -13.5}, raio: 15, fn: bradleyPlaca(0, 30, -1)},
      {nome: "placaD1", quadro: "casco", tipo: "placa", em: {x: -15, y: 13.5}, raio: 15, fn: bradleyPlaca(-30, 0, 1)},
      {nome: "placaD2", quadro: "casco", tipo: "placa", em: {x: 15, y: 13.5}, raio: 15, fn: bradleyPlaca(0, 30, 1)},
      {nome: "torre", quadro: "torre", tipo: "torre", em: {x: -1, y: 0}, raio: 13, fn: bradleyTorre},
      {nome: "canhao", quadro: "torre", tipo: "canhao", em: {x: 25, y: 0}, raio: 16, fn: bradleyCanhao},
      {nome: "tow", quadro: "torre", tipo: "lancador", em: {x: -3, y: -15.5}, raio: 9, fn: bradleyTow},
      {nome: "escotilhaC", quadro: "torre", tipo: "escotilha", em: {x: -6, y: 4.5}, raio: 3.4, fn: bradleyEscC},
      {nome: "escotilhaA", quadro: "torre", tipo: "escotilha", em: {x: -6, y: -4}, raio: 2.8, fn: bradleyEscA}]),
    cheetah: lagartas2(CHE).concat(roda3(CHE), [
      {nome: "casco", quadro: "casco", tipo: "casco", em: {x: 0, y: 0}, raio: 37, fica: true, fn: cheetahCasco},
      {nome: "grade", quadro: "casco", tipo: "grade", em: {x: -25, y: 0}, raio: 13, fn: cheetahGrade},
      {nome: "torre", quadro: "torre", tipo: "torre", em: {x: 0, y: 0}, raio: 15, fn: cheetahTorre},
      {nome: "canhaoE", quadro: "torre", tipo: "canhao", em: {x: 19, y: -14.5}, raio: 26, fn: cheetahCanhao(-1)},
      {nome: "canhaoD", quadro: "torre", tipo: "canhao", em: {x: 19, y: 14.5}, raio: 26, fn: cheetahCanhao(1)},
      {nome: "casuloE", quadro: "torre", tipo: "lancador", em: {x: -7.5, y: -19}, raio: 6, fn: cheetahCasulo(-1)},
      {nome: "casuloD", quadro: "torre", tipo: "lancador", em: {x: -7.5, y: 19}, raio: 6, fn: cheetahCasulo(1)},
      {nome: "radarTiro", quadro: "torre", tipo: "radar", em: {x: 17.5, y: 0}, raio: 4, fn: cheetahRadarTiro},
      {nome: "radarBusca", quadro: "torre", tipo: "radar", em: {x: -10, y: 0}, raio: 10, radar: true, fn: radarBusca}])
  };
  var PECA = {}; Object.keys(PECAS).forEach(function(t){ PECA[t] = {}; PECAS[t].forEach(function(p){ PECA[t][p.nome] = p; }); });

  /* o desenho montado: as peças do quadro, em ordem. lagartas à parte (têm imagem própria no cache); o radar à parte (gira) */
  function quadro(c, tipo, q, est, pal, lw, filtro){
    var l = PECAS[tipo];
    for (var i = 0; i < l.length; i++){ var p = l[i];
      if (p.quadro !== q || p.montada === false || p.radar || !filtro(p)) continue;
      if (est.desmontado && !p.fica) continue;
      p.fn(c, est, pal, lw); } }
  function semLagarta(p){ return p.tipo !== "lagarta"; }
  function tudo(){ return true; }

  function paleta(est){
    var base = est.destruido || est.solta ? MORTO : est.forca === 1 ? AREIA : VIVO;
    return est.cor ? {linha: est.cor, fino: est.cor, casco: base.casco, torre: base.torre, esteira: base.esteira} : base;
  }
  /* traço em px constante, em qualquer escala: 1,35 px no contorno e 0,8 px no detalhe (os canos engrossam com a escala) */
  function espessuras(s){ return {linha: 1.35 / s, fino: 0.8 / s, s: s}; }

  /* o desenho vetorial, chamada a chamada. É a fonte das imagens guardadas e serve de referência para conferir o cache */
  function desenhaVetor(c, tipo, est){
    var m = medidas[tipo]; if (!PECAS[tipo]) return;
    var s = est.escala || 1, pal = paleta(est), lw = espessuras(s);
    c.save();
    if (est.alfa != null) c.globalAlpha *= est.alfa;
    c.translate(est.x, est.y); c.rotate(est.angulo || 0); c.scale(s, s);
    c.lineJoin = "round"; c.lineCap = "round";
    quadro(c, tipo, "casco", est, pal, lw, tudo);
    if (!est.desmontado){
      c.translate(m.torreEm.x, m.torreEm.y);
      if (est.destruido){ c.translate(-3, 4); c.rotate(0.38); }       /* a torre saiu do anel */
      c.rotate(est.torre || 0);
      quadro(c, tipo, "torre", est, pal, lw, tudo);
      if (tipo === "cheetah") radarBusca(c, est, pal, lw); }
    c.restore();
  }

  /* ===== o cache: casco, cada lagarta e torre viram imagem pronta, uma por combinação, e cada quadro só gira e cola a imagem.
     Raster de 60 veículos vetoriais custava 6,8 ms; colar imagem custa uma fração disso (medido na amostra da D-27).
     Chave: tipo, escala na tela (de 0,05 em 0,05, já com o devicePixelRatio), cor, força, vivo/morto; no casco o número de
     marcas e se está desmontado; na lagarta o lado e a fase (6 por elo); na torre o recuo (8 passos). ===== */
  var CAIXA = { /* limites do desenho, em unidades, com folga para o traço */
    abrams: {casco: [-47, -24, 47, 24], torre: [-26, -20, 63, 20]},
    bradley: {casco: [-40, -19, 39, 19], torre: [-16, -22, 44, 15]},
    cheetah: {casco: [-41, -18, 40, 18], torre: [-17, -24, 48, 24]}};
  var GEO = {abrams: ABR, bradley: BRA, cheetah: CHE};
  function caixaLagarta(m, lado){ return lado < 0 ? [m.x0 - 3, -m.fora - 9, m.x1 + 3, -m.dentro + 2] : [m.x0 - 3, m.dentro - 2, m.x1 + 3, m.fora + 2]; }
  var FASES = 6, cache = new Map();
  function imagem(chave, caixa, k, pinta){
    var sp = cache.get(chave); if (sp) return sp;
    if (cache.size > 600){ cache.forEach(function(v){ if (v.img.close) v.img.close(); }); cache.clear(); }
    /* OffscreenCanvas -> ImageBitmap: a imagem fica pronta na placa e colar custa um quadrilátero; sem ele, um canvas comum */
    var x0 = caixa[0], y0 = caixa[1], w = Math.ceil((caixa[2] - x0) * k) + 2, h = Math.ceil((caixa[3] - y0) * k) + 2;
    var fora = typeof OffscreenCanvas !== "undefined", cv = fora ? new OffscreenCanvas(w, h) : document.createElement("canvas");
    if (!fora){ cv.width = w; cv.height = h; }
    var g = cv.getContext("2d"); g.scale(k, k); g.translate(-x0, -y0); g.lineJoin = "round"; g.lineCap = "round"; pinta(g);
    sp = {img: fora && cv.transferToImageBitmap ? cv.transferToImageBitmap() : cv, w: w, h: h, x0: x0, y0: y0, k: k}; cache.set(chave, sp); return sp;
  }
  function cola(c, sp, s){ c.drawImage(sp.img, sp.x0 * s, sp.y0 * s, sp.w * s / sp.k, sp.h * s / sp.k); }
  function escalaDaTela(c){ var t = c.getTransform ? c.getTransform() : null; return t ? Math.hypot(t.a, t.b) || 1 : 1; }
  function fase(v){ return Math.floor(resto(v, PASSO) / PASSO * FASES) % FASES; }

  function desenha(c, tipo, est){
    var m = medidas[tipo], geo = GEO[tipo]; if (!PECAS[tipo]) return;
    var s = est.escala || 1, dev = escalaDaTela(c), k = Math.max(0.2, Math.round(s * dev * 20) / 20), sq = k / dev;
    var morto = !!est.destruido, desm = morto && !!est.desmontado, pal = paleta(est), lw = espessuras(sq), cor = est.cor || "", fz = est.forca === 1 ? 1 : 0;
    var base = tipo + "|" + k + "|" + cor + "|" + fz + "|" + morto;
    var nMarcas = morto ? 6 : Math.round((est.dano || 0) * 5), rq = Math.round((est.recuo || 0) * 8) / 8;
    var casco = imagem(base + "|c|" + nMarcas + "|" + desm, CAIXA[tipo].casco, k, function(g){
      quadro(g, tipo, "casco", {dano: nMarcas / 5, destruido: morto, desmontado: desm}, pal, lw, semLagarta); });
    c.save();
    if (est.alfa != null) c.globalAlpha *= est.alfa;
    c.translate(est.x, est.y); c.rotate(est.angulo || 0);
    if (!desm) [-1, 1].forEach(function(lado){ var f = morto ? 0 : fase(lado > 0 && est.lagartaD != null ? est.lagartaD : est.lagarta);
      cola(c, imagem(base + "|l|" + lado + "|" + f, caixaLagarta(geo, lado), k, function(g){
        lagarta(g, geo, {lagarta: f * PASSO / FASES, lagartaD: f * PASSO / FASES, destruido: morto}, pal, lw, lado); }), s); });
    cola(c, casco, s);
    if (!desm){
      var torre = imagem(base + "|t|" + rq, CAIXA[tipo].torre, k, function(g){
        quadro(g, tipo, "torre", {recuo: rq, destruido: morto}, pal, {linha: lw.linha, fino: lw.fino, s: lw.s}, tudo); });
      c.translate(m.torreEm.x * s, m.torreEm.y * s);
      if (morto){ c.translate(-3 * s, 4 * s); c.rotate(0.38); }
      c.rotate(est.torre || 0);
      cola(c, torre, s);
      if (tipo === "cheetah"){ c.scale(s, s); radarBusca(c, est, pal, espessuras(s)); } }
    c.restore();
  }

  function boca(tipo, est, nome){
    var m = medidas[tipo], w = m.armas[nome], s = est.escala || 1, t = est.torre || 0, a = est.angulo || 0;
    var px = w.x - (est.recuo || 0) * w.recuo, py = w.y;
    var hx = m.torreEm.x + Math.cos(t) * px - Math.sin(t) * py, hy = m.torreEm.y + Math.sin(t) * px + Math.cos(t) * py;
    return {x: est.x + (Math.cos(a) * hx - Math.sin(a) * hy) * s, y: est.y + (Math.sin(a) * hx + Math.cos(a) * hy) * s, angulo: a + t};
  }

  /* ===== as peças soltas ===== */
  function pecas(tipo){ return (PECAS[tipo] || []).filter(function(p){ return !p.fica; }).map(function(p){
    return {nome: p.nome, quadro: p.quadro, tipo: p.tipo, em: {x: p.em.x, y: p.em.y}, raio: p.raio}; }); }
  /* onde cada peça está no instante do estado: o ponto de encaixe levado ao canvas, e o rumo dela */
  function pecasNoMundo(tipo, est){
    var m = medidas[tipo], s = est.escala || 1, a = est.angulo || 0, t = est.torre || 0, ca = Math.cos(a), sa = Math.sin(a);
    return pecas(tipo).map(function(p){
      var hx = p.em.x, hy = p.em.y, ang = a;
      if (p.quadro === "torre"){ hx = m.torreEm.x + Math.cos(t) * p.em.x - Math.sin(t) * p.em.y; hy = m.torreEm.y + Math.sin(t) * p.em.x + Math.cos(t) * p.em.y; ang = a + t; }
      p.x = est.x + (ca * hx - sa * hy) * s; p.y = est.y + (sa * hx + ca * hy) * s; p.angulo = ang; return p; }); }
  function desenhaPeca(c, tipo, nome, est){
    var p = PECA[tipo] && PECA[tipo][nome]; if (!p) return;
    var s = est.escala || 1, e2 = {solta: true, destruido: true, desenrola: est.desenrola || 0, cor: est.cor}, pal = paleta(e2), lw = espessuras(s);
    c.save();
    if (est.alfa != null) c.globalAlpha *= est.alfa;
    c.translate(est.x, est.y); c.rotate(est.angulo || 0); c.scale(s, s); c.translate(-p.em.x, -p.em.y);
    c.lineJoin = "round"; c.lineCap = "round";
    p.fn(c, e2, pal, lw);
    c.restore();
  }

  window.XPVeiculos = {desenha: desenha, desenhaVetor: desenhaVetor, medidas: medidas, boca: boca, unidadesPorMetro: U,
    pecas: pecas, pecasNoMundo: pecasNoMundo, desenhaPeca: desenhaPeca,
    nomes: {bradley: "M3A3 Bradley", abrams: "M1A2 SEPv3", cheetah: "Cheetah 1A2"}};
})();
