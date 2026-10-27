import assert from 'node:assert/strict';
import * as F from '../frontend/src/features/forecast/data.ts';
const d={daily:{time:['2026-10-24'],temperature_2m_max:[37],temperature_2m_min:[null],precipitation_sum:[0],wind_gusts_10m_max:[-1],uv_index_max:[12]}};
assert.deepEqual(F.daily(d)[0],{date:'2026-10-24',max:37,min:null,rain:0,gust:null,uv:12});
assert.equal(F.value('30'),null);assert.equal(F.value(NaN),null);assert.throws(()=>F.daily({}));
const models={daily:{time:['2026-10-24'],temperature_2m_max_ecmwf_ifs025:[37],temperature_2m_max_gfs_seamless:[35],precipitation_sum_icon_global:[0]}};
const rows=F.comparison(models,'2026-10-24');assert.equal(rows.length,3);assert.equal(F.spread(rows,'max'),2);assert.equal(F.spread(rows,'rain'),null);assert.deepEqual(F.comparison(models,'2026-10-25'),[]);
assert.equal(F.uvCategory(null),'Sem dado');assert.equal(F.uvCategory(2.9),'Baixo');assert.equal(F.uvCategory(6),'Alto');assert.equal(F.uvCategory(11),'Extremo');
console.log('Seven-day forecast, missing model values, disagreement and UV boundaries passed.');

const urls=F.forecastURLs({id:'centro',name:'Centro',latitude:-5.0892,longitude:-42.8019});
assert.equal(new URL(urls.week).searchParams.get('forecast_days'),'7');
assert.equal(new URL(urls.models).searchParams.get('models'),'ecmwf_ifs025,gfs_seamless,icon_global');
assert.equal(new URL(urls.week).searchParams.get('timezone'),'America/Fortaleza');
assert.equal(new URL(urls.models).searchParams.has('hourly'),false);
assert.throws(()=>F.daily({daily:{time:['malformed']}}));
assert.equal(F.nf(null),'—');assert.equal(F.nf(0),'0');
console.log('Typed model data, request provenance and null rendering passed.');
