/** Manifesto leve: cada módulo e seus dados só entram quando o cartão aparece. */
const modulos={
 montador:'./modelos/modelo-montador-fuzil-m4a1-estilizado.js',
 mapas:'./modelos/modelo-mapas-viewport-godot-terreno.js',
 guias:'./modelos/modelo-guias-prancheta-briefing-rota-numerada.js',
 atlas:'./modelos/modelo-atlas-catalogo-pecas-construcao-portal.js',
 gadgets:'./modelos/modelo-gadgets-conjunto-rpg7v2-m15-hoff1500.js',
 dicionario:'./modelos/modelo-dicionario-caderneta-de-campo.js',
 veiculos:'./modelos/modelo-veiculos-parque-hangar-doca.js'
};
export async function criarModelo(T,tipo){if(!modulos[tipo])throw Error('Cartão desconhecido: '+tipo);return(await import(modulos[tipo])).criar(T);}
