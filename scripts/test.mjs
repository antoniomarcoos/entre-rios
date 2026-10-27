import {spawnSync} from 'node:child_process';
const tests=['environment-data.cjs','live-sources.mjs','inmet-data.mjs','climate-data.mjs','climate-ui.cjs','extended-forecast.mjs','rain-gauges.mjs','react-data.mjs','api-security.mjs'];
for(const test of tests){const r=spawnSync(process.execPath,['--experimental-strip-types','tests/'+test],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
console.log('All '+tests.length+' test suites passed.');
