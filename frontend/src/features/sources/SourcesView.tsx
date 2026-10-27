import { Panel, Table, ExternalLink } from "../../shared/ui";
const rows = [
  [
    "Tempo, UV e modelos",
    "Open-Meteo · ECMWF, GFS e ICON",
    "Atualiza conforme o ciclo dos modelos; pontos próximos podem compartilhar dados.",
    "https://open-meteo.com/en/docs",
  ],
  [
    "Ar",
    "CAMS Global via Open-Meteo",
    "Previsão regional, cerca de 45 km. Não é um sensor local.",
    "https://open-meteo.com/en/docs/air-quality-api",
  ],
  [
    "Avisos e mapas",
    "INMET",
    "Validade do aviso e data impressa no produto oficial.",
    "https://portal.inmet.gov.br/",
  ],
  [
    "Chuva medida",
    "CEMADEN",
    "Arquivo com acumulados de 24h; sem horário individual ou garantia de cobertura completa por sensor.",
    "https://mapainterativo.cemaden.gov.br/",
  ],
  [
    "Fogo",
    "INPE",
    "Dois arquivos diários filtrados por município e janela móvel de 24 horas. Detecções não equivalem a incêndios distintos.",
    "https://terrabrasilis.dpi.inpe.br/queimadas/portal/",
  ],
  [
    "Água",
    "SEMARH",
    "Data de coleta, distinta da data de consulta. Parâmetros isolados não confirmam potabilidade.",
    "https://www.semarh.pi.gov.br/qualidade-agua",
  ],
  [
    "Rios e inundação",
    "SGB / SACE",
    "Cota em centímetros da régua. Os cenários de inundação não são alertas atuais.",
    "https://sace.sgb.gov.br/",
  ],
  [
    "Histórico",
    "NASA POWER / MERRA-2",
    "Reanálise regional desde 1981; não distingue bairros.",
    "https://power.larc.nasa.gov/",
  ],
  [
    "Bairros",
    "IBGE · Censo 2022",
    "123 bairros; um ponto interno ao polígono de cada bairro.",
    "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/UF/PI_bairros_CD2022.zip",
  ],
];
export default function SourcesView() {
  return (
    <>
      <Panel title="De onde vêm as informações?">
        <p>
          Os horários usam America/Fortaleza. Uma consulta recente não significa
          que a fonte tenha publicado uma nova medição. Falhas são exibidas como
          indisponibilidade; valores ausentes não viram zero.
        </p>
        <Table
          headers={["Informação", "Fonte", "Como interpretar", "Link"]}
          rows={rows.map(([name, source, detail, url]) => [
            name,
            source,
            detail,
            <ExternalLink href={url} key={url}>
              Consultar fonte
            </ExternalLink>,
          ])}
        />
      </Panel>
      <Panel title="Quando os dados são consultados?">
        <Table
          headers={["Dados", "Intervalo da consulta"]}
          rows={[
            [
              "Tempo, modelos de comparação dos bairros, avisos, rios e mapas do INMET",
              "5 min",
            ],
            [
              "Semana, modelos da semana, UV, ar, focos de fogo, água e pluviômetros",
              "15 min",
            ],
            ["Comparação noturna", "Até 1 hora de cache"],
            [
              "Cenários fluviais e histórico climático",
              "Até 24 horas de cache",
            ],
          ]}
        />
        <p>
          A renovação ocorre com a página visível e a tela correspondente
          aberta. Os intervalos são de consulta, não de publicação da fonte. O
          relógio atualiza a cada segundo e não representa a frequência dos
          dados meteorológicos.
        </p>
      </Panel>
      <Panel title="Privacidade">
        <p>
          O Entre Rios não exige conta e não possui banco de dados de usuários.
          Tema e bairro escolhido ficam no armazenamento local do navegador. Não
          usamos ferramentas de publicidade ou analytics.
        </p>
        <p>
          As consultas meteorológicas enviam ao Open-Meteo o ponto de referência
          do bairro, sem solicitar o GPS do dispositivo. Os mapas consultam os
          servidores do OpenStreetMap. Esses serviços e a hospedagem recebem os
          dados técnicos necessários para atender as requisições, como endereço
          IP.
        </p>
        <p>
          As informações ajudam a acompanhar as fontes públicas e não substituem
          os comunicados da Defesa Civil.
        </p>
      </Panel>
    </>
  );
}
