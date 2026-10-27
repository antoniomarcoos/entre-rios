"""Generate Teresina reference points from IBGE Censo 2022 PI shapefile.
Usage: python scripts/import-neighborhoods.py /path/PI_bairros_CD2022.shp
Requires pyshp and shapely. Source URL is recorded with generated data.
"""
import sys,json,unicodedata,re
from pathlib import Path
import shapefile
from shapely.geometry import shape
from shapely.ops import unary_union
source='https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/UF/PI_bairros_CD2022.zip'
r=shapefile.Reader(sys.argv[1]);groups={}
for item in r.iterShapeRecords():
 rec=item.record.as_dict()
 if rec['CD_MUN']!='2211001':continue
 groups.setdefault(rec['CD_BAIRRO'],{'name':rec['NM_BAIRRO'],'shapes':[]})['shapes'].append(shape(item.shape.__geo_interface__))
def slug(s):return re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('-')
fix={'Iningá':'Ininga','N.S.das Graças':'Nossa Senhora das Graças','Monte castelo':'Monte Castelo','Cidade jardim':'Cidade Jardim','Flor do campo':'Flor do Campo','Angelica':'Angélica','Parque do Piauí':'Parque Piauí'}
rows=[]
for code,item in groups.items():
 geom=unary_union(item['shapes']);point=geom.representative_point();assert geom.covers(point)
 name=fix.get(item['name'],item['name']);rows.append({'id':slug(name),'name':name,'latitude':round(point.y,6),'longitude':round(point.x,6),'ibge_code':code,'source_name':item['name']})
rows.sort(key=lambda x:slug(x['name']))
assert len(rows)==123 and len({r['id'] for r in rows})==123
payload={'source':source,'reference_year':2022,'municipality_code':'2211001','point_method':'Point on surface (Shapely representative_point) inside each IBGE neighborhood polygon','neighborhoods':rows}
Path('frontend/src/data/neighborhoods.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(f'Generated {len(rows)} neighborhoods; all reference points lie inside their source polygons.')
