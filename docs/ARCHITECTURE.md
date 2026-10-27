# Organização do projeto

```text
frontend/
  src/       telas, componentes, consultas e dados dos bairros
  public/    página, favicon e arquivos gerados
backend/
  api/       implementação das rotas
  lib/       consultas às fontes, processamento e validações
  worker/    entrada do servidor e cabeçalhos
app/         arquivos de entrada e rotas do Vinext
tests/       testes automatizados
```

A interface é uma aplicação React. O navegador consulta diretamente o Open-Meteo para previsão e qualidade do ar. As outras fontes são consultadas pelas rotas do backend, que tratam os dados antes de enviá-los à interface.

As rotas em `app/api/` encaminham as requisições para `backend/api/`. O diretório `app/` fica na raiz porque o Vinext usa essa convenção para localizar rotas.

O projeto não usa login nem banco de dados de usuários. O navegador guarda o tema e o bairro escolhido. As consultas usam cache temporário; quando uma fonte falha, a interface informa a indisponibilidade. Para o histórico da NASA, há também uma cópia salva com a data da consulta.

As APIs aceitam apenas leitura, validam parâmetros e limitam os destinos das consultas externas. Há limites de tempo, tamanho de resposta e requisições por instância; eles não substituem proteção distribuída da hospedagem.

O bundle React é gerado em `frontend/public/dashboard/generated/` durante `pnpm dev` e `pnpm build`. Não é preciso editar os arquivos gerados.
