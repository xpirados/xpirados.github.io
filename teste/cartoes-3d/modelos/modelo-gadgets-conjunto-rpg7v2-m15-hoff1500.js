import {oficina} from './oficina.js';
import {montarRPG} from './modelo-gadgets-rpg7v2-lanca-foguetes.js';
import {montarMina} from './modelo-gadgets-mina-antitanque-m15.js';
import {montarReparo} from './modelo-gadgets-macarico-reparo-hoff1500.js';
export function criar(T){
 const o=oficina(T),rpg=montarRPG(o,o.raiz);rpg.position.set(.27,.65,-.35);rpg.rotation.z=.06;
 const mina=montarMina(o,o.raiz);mina.position.set(-1.25,-.6,.65);mina.scale.setScalar(1.15);
 const reparo=montarReparo(o,o.raiz);reparo.position.set(1.55,-.26,.64);reparo.rotation.z=-.24;reparo.scale.setScalar(.87);
 return o.finalizar({altura:3.3,largura:6,angulo:-.12,cameraY:3.5});
}
