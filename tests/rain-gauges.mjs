import assert from 'node:assert/strict';import {parseGauges} from '../backend/lib/rain-gauges.mjs';
const now=Date.parse('2026-10-24T02:00:00Z'),station={codibge:2211001,uf:'PI',idtipoestacao:1,sigla:'CEMADEN',status:0,codestacao:'test',nomeestacao:'Local',latitude:-5.05,longitude:-42.8};
const wrap=s=>'estacoes('+JSON.stringify([{atualizado:'2026-10-24 01:20:47 UTC',estacao:s}])+');';
const d=parseGauges(wrap([{...station,acumulado:0},{...station,acumulado:null},{...station,acumulado:-999},{...station,acumulado:3,status:1},{...station,codibge:123,acumulado:90}]),now);
assert.equal(d.stations.length,4);assert.equal(d.stations[0].rain_mm,0);assert.equal(d.stations[1].rain_mm,null);assert.equal(d.stations[2].rain_mm,null);assert.equal(d.stations[3].rain_mm,null);assert.equal(d.reference,'2026-10-24T01:20:47Z');assert.equal(d.stale,false);
assert.equal(parseGauges(wrap([]),now+3600000).stale,true);assert.equal(parseGauges(wrap([]),now-86400000).reference,null);assert.throws(()=>parseGauges('estacoes(alert(1))'));assert.throws(()=>parseGauges('{}'));
console.log('Rain gauge JSONP parsed without evaluation; local filter, missing, zero, stale and future references passed.');
