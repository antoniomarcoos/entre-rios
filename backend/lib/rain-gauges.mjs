import {fetchPublic as fetch} from './public-fetch.mjs';
export const GAUGE_SOURCE='https://resources.cemaden.gov.br/dados/311_24.json';
export function parseGauges(text,now=Date.now()){
 const clean=text.trim(),match=/^estacoes\(\s*([\s\S]*)\s*\);?$/.exec(clean),data=JSON.parse(match?match[1]:clean),item=data?.[0];if(!Array.isArray(item?.estacao))throw Error('Arquivo de pluviômetros inválido');
 const ref=String(item.atualizado||''),time=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/.test(ref)?ref.replace(' ','T').replace(' UTC','Z'):null;
 const reference=time&&Number.isFinite(Date.parse(time))&&Date.parse(time)<=now+300000?time:null;
 const stations=item.estacao.filter(s=>Number(s.codibge)===2211001&&s.uf==='PI'&&Number(s.idtipoestacao)===1&&s.sigla==='CEMADEN').map(s=>{
 const lat=Number(s.latitude),lon=Number(s.longitude),n=s.acumulado,active=Number(s.status)===0;
 return {code:String(s.codestacao),name:String(s.nomeestacao||'Estação sem nome'),latitude:Number.isFinite(lat)&&lat>=-6&&lat<=-4?lat:null,longitude:Number.isFinite(lon)&&lon>=-44&&lon<=-41?lon:null,active,rain_mm:active&&typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=3000?n:null};
 });
 return {source:GAUGE_SOURCE,reference,period_hours:24,stale:!reference||now-Date.parse(reference)>3600000,stations};
}
let cached,pending;
export async function rainGauges(){if(cached&&Date.now()-Date.parse(cached.checked_at)<900000)return cached;if(pending)return pending;pending=(async()=>{try{const r=await fetch(GAUGE_SOURCE,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Fonte indisponível');const d=parseGauges(await r.text());cached={...d,available:true,checked_at:new Date().toISOString()};return cached}catch{return {available:false,source:GAUGE_SOURCE,checked_at:new Date().toISOString(),reference:null,stations:[],reason:'Não foi possível consultar o arquivo de pluviômetros do CEMADEN.'}}})().finally(()=>pending=null);return pending;}
