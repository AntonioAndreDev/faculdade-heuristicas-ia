# Labirinto Inteligente (Vue 3 + Vite)

Simulação web de busca heurística com **A\*** em um labirinto em grid.

## O que o projeto demonstra

- Grid de labirinto com interação visual (A, B, paredes).
- Busca **A\*** determinística com visualização de:
  - Open set
  - Closed set
  - Nó atual expandido
  - Caminho final
- Execução normal e execução **passo a passo** com pausa.
- Métricas de execução (distância, tempo, nós expandidos, iterações).
- Logs didáticos no console (`console.group`, `console.groupCollapsed`, `console.table`).
- Integração com OpenAI para gerar relatório explicativo da execução.

## Regras do modelo

- Cada célula representa **500 metros**.
- Custo de movimento ortogonal: **500 m por passo**.
- Movimento diagonal (opcional): custo **500 * sqrt(2) m**.
- Tempo estimado: `distancia / velocidade_do_agente`.

## Algoritmo A\*

- `g(n)`: custo real do início até o nó atual.
- `h(n)`: estimativa do custo até o objetivo.
- `f(n) = g(n) + h(n)`.

Heurística disponível:

- **Manhattan**:
  - `h = (|dx| + |dy|) * 500`

Desempate determinístico no open set:

1. menor `f`
2. menor `h`
3. menor `g`
4. ordem de coordenadas `(y, x)`

## Logs didáticos no console

Durante a execução do A\*:

- Grupo principal da execução.
- Grupo por iteração com:
  - iteração
  - nó atual
  - `g`, `h`, `f`
  - tamanhos de open/closed
  - nós adicionados ao open
  - motivo da decisão do nó escolhido
- `console.table` do open set ordenado por `f` (top 10).

Ao final:

- caminho final
- custo total (metros e segundos)
- nós expandidos
- comparação com Dijkstra (heurística = 0)

## OpenAI (relatório em linguagem natural)

A busca não depende de LLM para encontrar o caminho. O OpenAI é usado como camada explicativa.

### Configuração

Crie `.env` na raiz:

```bash
VITE_OPENAI_API_KEY=sua_chave_aqui
# opcional
VITE_OPENAI_MODEL=gpt-4.1-mini
```

### Fluxo

1. Execute A\* (normal ou passo a passo).
2. Clique em **Gerar relatório IA**.
3. O painel "Relatório da IA" exibirá o texto pronto para apresentação.

## Como rodar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Como usar a UI

1. Ajuste tamanho do grid e densidade.
2. Clique em **Gerar labirinto**.
3. Edite células no modo `Paredes` (clique/arraste).
4. Arraste `A` e `B` no grid ou use os modos `Definir A` e `Definir B`.
5. Execute:
   - **Executar A\***: calcula e mostra resultado final.
   - **Executar passo a passo**: anima expansão dos nós.
6. Use **Pausar/Retomar** e **Reset** para reiniciar a visualização.

## Estrutura principal

- `src/App.vue`: composição da tela e orquestração de estado.
- `src/components/MazeGrid.vue`: render/interação do grid.
- `src/components/ControlsPanel.vue`: botões, sliders e toggles.
- `src/components/MetricsPanel.vue`: métricas da execução.
- `src/components/AiReportPanel.vue`: painel do relatório da IA.
- `src/composables/useMaze.js`: estado e edição do labirinto.
- `src/composables/useAStar.js`: implementação do A\* e comparação com Dijkstra.
- `src/utils/logger.js`: logs didáticos no console.
- `src/services/openaiService.js`: chamada `fetch` para API da OpenAI.

## Observação de segurança

Como a chave está no frontend (`VITE_*`), ela pode ficar exposta no navegador. Para ambientes reais, use backend/proxy para proteger a chave.
