# Fontes de dados

| Informação | Fonte | Como aparece no site |
| --- | --- | --- |
| Tempo e previsão | [Open-Meteo](https://open-meteo.com/en/docs) | Previsão para pontos de referência dos bairros |
| Qualidade do ar | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Estimativa regional do modelo CAMS, não medição em cada bairro |
| Mapas e avisos | [INMET](https://portal.inmet.gov.br/) | Imagens oficiais, previsão e avisos para Teresina |
| Chuva medida | [CEMADEN](https://mapainterativo.cemaden.gov.br/) | Acumulados disponíveis nos pluviômetros da cidade |
| Focos de fogo | [INPE Queimadas](https://terrabrasilis.dpi.inpe.br/queimadas/portal/) | Detecções por satélite nas últimas 24 horas |
| Qualidade da água | [SEMARH-PI](https://www.semarh.pi.gov.br/qualidade-agua) | Coletas publicadas para estações dos rios em Teresina |
| Nível dos rios | [SGB/SACE](https://sace.sgb.gov.br/) | Cotas das estações CHESF e Fazenda Cantinho II |
| Cenários de inundação | [Geoportal SGB](https://geoportal.sgb.gov.br/) | Cenários fluviais para diferentes tempos de retorno |
| Histórico de temperatura | [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) | Série regional mensal da reanálise MERRA-2 |
| Bairros | [IBGE, Censo 2022](https://www.ibge.gov.br/) | Pontos internos aos polígonos dos 123 bairros |
| Mapa-base | [OpenStreetMap](https://www.openstreetmap.org/copyright) | Cartografia do mapa interativo |

Previsões são estimativas de modelos. Coletas e cotas correspondem ao local e à data da medição. Detecções de satélite não indicam necessariamente incêndios distintos, e os cenários de inundação não são alertas de enchente atual. Os horários de consulta e das informações podem ser diferentes.

## Histórico de temperatura

A série da NASA é uma reanálise regional em uma grade de aproximadamente 55 × 69 km; ela não diferencia bairros. Para cada mês, o site compara a temperatura com a média do mesmo mês entre 1991 e 2020. O cálculo da média anual considera o número de dias de cada mês e exige os 12 meses disponíveis. A tendência linear é descritiva e não atribui causas à mudança de temperatura.

Quando a consulta à NASA falha, o site pode usar uma cópia salva da série. A data dessa cópia aparece na tela. Meses sem dados não são tratados como zero.

A atualização das consultas depende da página estar aberta e dos intervalos de cada fonte. Consulte os termos de uso dos provedores antes de publicar ou ampliar o acesso ao projeto.
