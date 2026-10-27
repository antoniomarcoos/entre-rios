// Optional reproducible snapshot refresh. The published API refreshes independently.
import {writeFile} from 'node:fs/promises';
import {analyzeClimate,climateUrl} from '../backend/lib/climate-data.mjs';
const source_url=climateUrl();const response=await fetch(source_url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('NASA HTTP '+response.status);const raw=await response.json();analyzeClimate(raw);await writeFile(new URL('../backend/lib/climate-snapshot.json',import.meta.url),JSON.stringify({source_url,checked_at:new Date().toISOString(),raw}));console.log('Snapshot NASA validado e atualizado.');
