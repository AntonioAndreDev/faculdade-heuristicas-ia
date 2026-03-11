<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import MazeGrid from './components/MazeGrid.vue'
import ControlsPanel from './components/ControlsPanel.vue'
import MetricsPanel from './components/MetricsPanel.vue'
import AiReportPanel from './components/AiReportPanel.vue'
import { useMaze } from './composables/useMaze'
import { executarAEstrela } from './composables/useAStar'
import { explicarExecucao } from './services/openaiService'
import { criarLoggerAEstrela } from './utils/logger'

const labirinto = useMaze(20)

const modoHeuristica = ref('manhattan')

const conjuntoAbertoVisual = ref(new Set())
const conjuntoFechadoVisual = ref(new Set())
const conjuntoCaminhoVisual = ref(new Set())
const chaveAtualVisual = ref('')

const estaAnimando = ref(false)
const estaPausado = ref(false)
const tokenAnimacao = ref(0)

const carregandoIa = ref(false)
const relatorioIa = ref('')
const erroIa = ref('')
const payloadUltimaExecucao = ref(null)

function rotuloHeuristica(modo) {
  return 'Manhattan'
}


function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function criarMetricasPadrao() {
  return {
    status: 'Pronto para executar',
    heuristicaUsada: rotuloHeuristica(modoHeuristica.value),
    iteracoes: 0,
    nosExpandidos: 0,
    passosCaminho: 0,
    distanciaTotalMetros: 0,
    tempoTotalSegundos: 0,
    tempoProcessamentoMs: 0,
    nosExpandidosDijkstra: null,
  }
}

const metricas = ref(criarMetricasPadrao())

function resetarMetricas() {
  metricas.value = criarMetricasPadrao()
}

function limparVisualizacaoBusca() {
  conjuntoAbertoVisual.value = new Set()
  conjuntoFechadoVisual.value = new Set()
  conjuntoCaminhoVisual.value = new Set()
  chaveAtualVisual.value = ''
}

function pararAnimacao() {
  tokenAnimacao.value += 1
  estaAnimando.value = false
  estaPausado.value = false
}

function limparBusca({ manterMetricas = false } = {}) {
  pararAnimacao()
  limparVisualizacaoBusca()
  if (!manterMetricas) {
    resetarMetricas()
  }
}

function aplicarIteracao(snapshot) {
  conjuntoAbertoVisual.value = new Set(snapshot.chavesConjuntoAberto)
  conjuntoFechadoVisual.value = new Set(snapshot.chavesConjuntoFechado)
  chaveAtualVisual.value = snapshot.chaveAtual

  metricas.value = {
    ...metricas.value,
    status: 'Executando passo a passo',
    iteracoes: snapshot.iteracao,
    nosExpandidos: snapshot.chavesConjuntoFechado.length,
  }
}

function aplicarResultadoFinal(resultado) {
  conjuntoAbertoVisual.value = new Set(resultado.chavesAbertasFinais)
  conjuntoFechadoVisual.value = new Set(resultado.chavesFechadasFinais)
  conjuntoCaminhoVisual.value = new Set(resultado.chavesCaminho)
  chaveAtualVisual.value = resultado.chaveAtualFinal

  metricas.value = {
    status: resultado.encontrou ? 'Caminho encontrado' : 'Sem caminho possível',
    heuristicaUsada: rotuloHeuristica(resultado.heuristicaUsada),
    iteracoes: resultado.iteracoes,
    nosExpandidos: resultado.nosExpandidos,
    passosCaminho: resultado.passosCaminho,
    distanciaTotalMetros: resultado.distanciaTotalMetros,
    tempoTotalSegundos: resultado.tempoTotalSegundos,
    tempoProcessamentoMs: resultado.tempoProcessamentoMs,
    nosExpandidosDijkstra: resultado.nosExpandidosDijkstra,
  }
}

function amostrarRastro(rastro, maxItens = 12) {
  if (rastro.length <= maxItens) {
    return rastro.map((item) => ({
      iteracao: item.iteracao,
      atual: item.atual,
      tamanhoAberto: item.chavesConjuntoAberto.length,
      tamanhoFechado: item.chavesConjuntoFechado.length,
      adicionadosNoAberto: item.adicionadosNoAberto,
      motivoDecisao: item.motivoDecisao,
    }))
  }

  const amostra = []
  const passo = (rastro.length - 1) / (maxItens - 1)

  for (let i = 0; i < maxItens; i += 1) {
    const indice = Math.round(i * passo)
    const entrada = rastro[indice]
    amostra.push({
      iteracao: entrada.iteracao,
      atual: entrada.atual,
      tamanhoAberto: entrada.chavesConjuntoAberto.length,
      tamanhoFechado: entrada.chavesConjuntoFechado.length,
      adicionadosNoAberto: entrada.adicionadosNoAberto,
      motivoDecisao: entrada.motivoDecisao,
    })
  }

  return amostra
}

function atualizarPayloadUltimaExecucao(resultado) {
  payloadUltimaExecucao.value = {
    configuracao: {
      tamanhoGrade: labirinto.tamanhoGrade.value,
      heuristica: rotuloHeuristica(resultado.heuristicaUsada),
      distanciaPassoMetros: 500,
    },
    metricas: {
      encontrou: resultado.encontrou,
      iteracoes: resultado.iteracoes,
      nosExpandidos: resultado.nosExpandidos,
      passosCaminho: resultado.passosCaminho,
      distanciaTotalMetros: resultado.distanciaTotalMetros,
      tempoTotalSegundos: resultado.tempoTotalSegundos,
      nosExpandidosDijkstra: resultado.nosExpandidosDijkstra,
      tempoProcessamentoMs: resultado.tempoProcessamentoMs,
    },
    amostraIteracoes: amostrarRastro(resultado.rastro),
    caminho: resultado.caminho,
  }
}

async function animarPassoAPasso(resultado) {
  const tokenLocal = tokenAnimacao.value
  estaAnimando.value = true
  estaPausado.value = false
  conjuntoCaminhoVisual.value = new Set()

  for (const iteracao of resultado.rastro) {
    if (tokenLocal !== tokenAnimacao.value) {
      return
    }

    while (estaPausado.value && tokenLocal === tokenAnimacao.value) {
      await aguardar(80)
    }

    if (tokenLocal !== tokenAnimacao.value) {
      return
    }

    aplicarIteracao(iteracao)
    await aguardar(180)
  }

  if (tokenLocal !== tokenAnimacao.value) {
    return
  }

  aplicarResultadoFinal(resultado)
  estaAnimando.value = false
  estaPausado.value = false
}

function prepararEdicao() {
  if (conjuntoFechadoVisual.value.size > 0 || conjuntoCaminhoVisual.value.size > 0) {
    limparBusca()
    payloadUltimaExecucao.value = null
    relatorioIa.value = ''
    erroIa.value = ''
  }
}

function aoClicarCelula(posicao) {
  if (estaAnimando.value) {
    return
  }

  prepararEdicao()

  const { x, y } = posicao
  const ehInicio = x === labirinto.inicio.value.x && y === labirinto.inicio.value.y
  const ehObjetivo = x === labirinto.objetivo.value.x && y === labirinto.objetivo.value.y

  if (labirinto.modoEdicao.value === 'inicio') {
    labirinto.definirInicio({ x, y })
    return
  }

  if (labirinto.modoEdicao.value === 'objetivo') {
    labirinto.definirObjetivo({ x, y })
    return
  }

  if (ehInicio || ehObjetivo) {
    return
  }

  labirinto.alternarParede(x, y)
}

function executarBuscaAEstrela({ animar }) {
  limparBusca({ manterMetricas: true })

  metricas.value = {
    ...criarMetricasPadrao(),
    status: animar ? 'Preparando execução passo a passo' : 'Executando A*',
  }
  erroIa.value = ''

  const logger = criarLoggerAEstrela({ ativo: true, nomeAlgoritmo: 'A*' })
  const resultado = executarAEstrela({
    grade: labirinto.grade.value,
    inicio: labirinto.inicio.value,
    objetivo: labirinto.objetivo.value,
    modoHeuristica: modoHeuristica.value,
    logger,
  })

  atualizarPayloadUltimaExecucao(resultado)

  if (animar && resultado.rastro.length > 0) {
    void animarPassoAPasso(resultado)
  } else {
    aplicarResultadoFinal(resultado)
  }
}

function aoGerarLabirinto() {
  labirinto.gerarLabirintoAleatorio()
  limparBusca()
  relatorioIa.value = ''
  erroIa.value = ''
  payloadUltimaExecucao.value = null
}

function aoLimparLabirinto() {
  labirinto.limparParedes()
  limparBusca()
  relatorioIa.value = ''
  erroIa.value = ''
  payloadUltimaExecucao.value = null
}

function aoResetarBusca() {
  limparBusca()
}

function aoAlternarPausa() {
  if (!estaAnimando.value) {
    return
  }

  estaPausado.value = !estaPausado.value
  metricas.value = {
    ...metricas.value,
    status: estaPausado.value ? 'Pausado' : 'Executando passo a passo',
  }
}

function aoMudarTamanhoGrade(tamanho) {
  labirinto.redimensionarLabirinto(tamanho)
  limparBusca()
  relatorioIa.value = ''
  erroIa.value = ''
  payloadUltimaExecucao.value = null
}

async function aoGerarRelatorioIa() {
  if (!payloadUltimaExecucao.value) {
    erroIa.value = 'Execute o A* antes de gerar o relatório da IA.'
    return
  }

  carregandoIa.value = true
  erroIa.value = ''

  try {
    const relatorio = await explicarExecucao(payloadUltimaExecucao.value)
    relatorioIa.value = relatorio
  } catch (erro) {
    erroIa.value = erro instanceof Error ? erro.message : 'Falha inesperada ao gerar o relatório.'
  } finally {
    carregandoIa.value = false
  }
}

const itensLegenda = [
  { chave: 'A', rotulo: 'Start (A)' },
  { chave: 'B', rotulo: 'Goal (B)' },
  { chave: 'wall', rotulo: 'Obstáculo' },
  { chave: 'open', rotulo: 'Conjunto aberto' },
  { chave: 'closed', rotulo: 'Conjunto fechado' },
  { chave: 'current', rotulo: 'Nó atual' },
  { chave: 'path', rotulo: 'Caminho final' },
]

const podeGerarRelatorio = computed(() => Boolean(payloadUltimaExecucao.value) && !estaAnimando.value)

onBeforeUnmount(() => {
  pararAnimacao()
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <h1>Labirinto Inteligente com A*</h1>
      <p>
        Cada célula vale 500 m. O agente deve ir de A para B com custo mínimo.
        A busca usa A* determinístico com logs didáticos no console.
      </p>
    </header>

    <section class="layout-grid">
      <ControlsPanel
        :tamanho-grade="labirinto.tamanhoGrade.value"
        :modo-edicao="labirinto.modoEdicao.value"
        :modo-heuristica="modoHeuristica"
        :esta-animando="estaAnimando"
        :esta-pausado="estaPausado"
        :pode-gerar-relatorio="podeGerarRelatorio"
        :carregando-ia="carregandoIa"
        @gerar-labirinto="aoGerarLabirinto"
        @limpar-labirinto="aoLimparLabirinto"
        @executar-a-estrela="executarBuscaAEstrela({ animar: false })"
        @executar-passo="executarBuscaAEstrela({ animar: true })"
        @alternar-pausa="aoAlternarPausa"
        @resetar-busca="aoResetarBusca"
        @gerar-relatorio-ia="aoGerarRelatorioIa"
        @atualizar:tamanho-grade="aoMudarTamanhoGrade"
        @atualizar:modo-edicao="(valor) => (labirinto.modoEdicao.value = valor)"
        @atualizar:modo-heuristica="(valor) => (modoHeuristica.value = valor)"
      />

      <main class="board-area">
        <MazeGrid
          :grade="labirinto.grade.value"
          :inicio="labirinto.inicio.value"
          :objetivo="labirinto.objetivo.value"
          :conjunto-aberto="conjuntoAbertoVisual"
          :conjunto-fechado="conjuntoFechadoVisual"
          :conjunto-caminho="conjuntoCaminhoVisual"
          :chave-atual="chaveAtualVisual"
          :desabilitado="estaAnimando"
          @celula-clicada="aoClicarCelula"
        />

        <section class="legend">
          <h2>Legenda</h2>
          <div class="legend-list">
            <div v-for="item in itensLegenda" :key="item.chave" class="legend-item">
              <span class="legend-dot" :class="`dot-${item.chave}`" />
              <span>{{ item.rotulo }}</span>
            </div>
          </div>
        </section>
      </main>

      <section class="right-column">
        <!-- <MetricsPanel :metricas="metricas" /> -->
        <!-- <AiReportPanel :carregando="carregandoIa" :relatorio="relatorioIa" :erro="erroIa" /> -->
      </section>
    </section>
  </div>
</template>
