import {fetchPublic as fetch} from './public-fetch.mjs';
const cache=new Map(),pending=new Map();
export function productPath(field,day=1){
 if(field==='satellite')return 'https://portal.inmet.gov.br/uploads/satelite/BR.jpg';
 if(field==='animation')return 'https://portal.inmet.gov.br/uploads/satelite/BR.gif';
 const fields={rain:'',temperature:'tmax_',minimum:'tmin_',humidity:'umin_',humidity_max:'umax_'};
 if(!Object.hasOwn(fields,field)||!Number.isInteger(day)||day<1||day>7)throw Error('Produto inválido');
 return `https://portal.inmet.gov.br/uploads/previsao/web_BR_${fields[field]}${day}.jpg`;
}
export function normalizeWarnings(data){
 if(!Array.isArray(data?.hoje)||!Array.isArray(data?.futuro))throw Error('Resposta incompleta');
 return ['hoje','futuro'].flatMap(period=>data[period].filter(a=>!a.encerrado).map(a=>({id:a.id,period,title:a.descricao,severity:a.severidade,color:/^#[0-9a-f]{6}$/i.test(a.aviso_cor)?a.aviso_cor:'#e5b43c',start:a.inicio,end:a.fim,teresina:String(a.geocodes).split(',').map(x=>x.trim()).includes('2211001'),states:a.estados,risks:a.riscos,instructions:a.instrucoes,geometry:JSON.parse(a.poligono)})));
}
export async function meteorology(kind,options={}){
 const key=JSON.stringify([kind,options]);const saved=cache.get(key);if(saved&&Date.now()-saved.at<300000)return saved.value;if(pending.has(key))return pending.get(key);
 const job=(async()=>{let url,init={signal:AbortSignal.timeout(25000)};
 if(kind==='warnings')url='https://apiprevmet3.inmet.gov.br/avisos/ativos';
 else if(kind==='forecast'){if(!/^\d{4}-\d{2}-\d{2}$/.test(options.date)||!['manha','tarde','noite'].includes(options.period))throw Error('Seleção inválida');url='https://apiprevmet3.inmet.gov.br/Previsao_Portal';const offset=Math.round((Date.parse(options.date+'T00:00:00-03:00')-Date.parse(new Date(Date.now()-10800000).toISOString().slice(0,10)+'T00:00:00-03:00'))/86400000);if(offset<0||offset>4)throw Error('Data inválida');init={...init,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:options.date,tipo:offset<2?'turno':'diaria',turno:options.period})};}
 else throw Error('Recurso inválido');
 const response=await fetch(url,init);if(!response.ok)throw Error('Fonte indisponível');const raw=await response.json();
 if(kind==='forecast'&&!Array.isArray(raw))throw Error('Previsão incompleta');
 const value={source:url,checked_at:new Date().toISOString(),data:kind==='warnings'?normalizeWarnings(raw):raw.map(a=>({name:a.nome,summary:a.resumo,min:a.temperatura_minima,max:a.temperatura_maxima,color:/^(#[0-9a-f]{6}|hsla?\([\d.,%\s]+\))$/i.test(a.cor)?a.cor:'#b7cdbb',geometry:JSON.parse(a.poligono)}))};for(const [k,v]of cache)if(Date.now()-v.at>=300000)cache.delete(k);if(cache.size>=2)cache.delete(cache.keys().next().value);cache.set(key,{at:Date.now(),value});return value;})();pending.set(key,job);try{return await job}finally{pending.delete(key)}
}
