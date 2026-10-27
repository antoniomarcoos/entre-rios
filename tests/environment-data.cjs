const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('backend/lib/fire-data.mjs','utf8');const functions=source.slice(source.indexOf('export function parseCSV('),source.indexOf('let cache,pending;')).replaceAll('export function','function');const ctx={Date,Number,Set,Object,Error};vm.createContext(ctx);vm.runInContext(functions,ctx);
const header='id,lat,lon,data_hora_gmt,satelite,municipio_id';const now=Date.parse('2026-10-23T03:00:00Z');const rows=[
'a,-5.1,-42.8,2026-10-22 03:00:00,"SAT, A",2211001',
'duplicate,-5.1,-42.8,2026-10-22 03:00:00,"SAT, A",2211001',
'old,-5.1,-42.8,2026-10-22 02:59:59,SAT,2211001',
'other,-5.1,-42.8,2026-10-23 02:00:00,SAT,2112209',
'future,-5.1,-42.8,2026-10-23 03:00:01,SAT,2211001',
'blank,,-42.8,2026-10-23 02:00:00,SAT,2211001',
'b,-5.2,-42.7,2026-10-23 02:00:00,SAT,2211001'];
const result=ctx.selectFires([header+'\r\n'+rows.join('\r\n')],now);assert.equal(result.detections.length,2);assert.equal(result.detections[0].time,Date.parse('2026-10-23T02:00:00Z'));assert.equal(result.detections[1].satellite,'SAT, A');assert.throws(()=>ctx.selectFires(['bad,columns\na,b'],now));assert.equal(ctx.selectFires([header+'\n'],now).latest,0);
for(const [layer,years]of [[3,2],[4,5],[5,10]]){const data=JSON.parse(fs.readFileSync(`tests/fixtures/environment/flood-scenario-${layer}.json`));assert(data.features.length);assert(data.features.every(f=>f.properties.TR_ANO===years));assert(!data.exceededTransferLimit);assert(data.source&&data.retrieved_at);}
const water=JSON.parse(fs.readFileSync('tests/fixtures/environment/water-quality.json'));assert.equal(water.stations.length,3);assert(water.stations.every(s=>s.dataColeta));assert(water.stations.every(s=>s.iqa===null));
for(const key of ['chesf','cantinho']){const data=JSON.parse(fs.readFileSync(`tests/fixtures/environment/river-${key}.json`));assert(data.readings.length>1);assert(data.readings.every(p=>Number.isFinite(p.value)&&Number.isFinite(Date.parse(p.time))));assert(Date.parse(data.readings.at(-1).time)-Date.parse(data.readings[0].time)<=48*3600000);}
console.log('PASS: UTC window, deduplication, municipal filter, malformed/missing data, scenario provenance, water dates, river series.');
