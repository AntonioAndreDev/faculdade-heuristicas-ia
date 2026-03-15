<script setup>
import { onBeforeUnmount, ref } from 'vue'
import MazeGrid from './components/MazeGrid.vue'
import ControlsPanel from './components/ControlsPanel.vue'
import { useMaze } from './composables/useMaze'
import { executarAEstrela } from './composables/useAStar'

const labirinto = useMaze(20)

const modoHeuristica = ref('manhattan')

const conjuntoAbertoVisual = ref(new Set())
const conjuntoFechadoVisual = ref(new Set())
const conjuntoCaminhoVisual = ref(new Set())
const chaveAtualVisual = ref('')

const estaAnimando = ref(false)
const estaPausado = ref(false)
const tokenAnimacao = ref(0)

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

function limparBusca() {
  pararAnimacao()
  limparVisualizacaoBusca()
}

function aplicarIteracao(snapshot) {
  conjuntoAbertoVisual.value = new Set(snapshot.chavesConjuntoAberto)
  conjuntoFechadoVisual.value = new Set(snapshot.chavesConjuntoFechado)
  chaveAtualVisual.value = snapshot.chaveAtual
}

function aplicarResultadoFinal(resultado) {
  conjuntoAbertoVisual.value = new Set(resultado.chavesAbertasFinais)
  conjuntoFechadoVisual.value = new Set(resultado.chavesFechadasFinais)
  conjuntoCaminhoVisual.value = new Set(resultado.chavesCaminho)
  chaveAtualVisual.value = resultado.chaveAtualFinal
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
  limparBusca()

  const resultado = executarAEstrela({
    grade: labirinto.grade.value,
    inicio: labirinto.inicio.value,
    objetivo: labirinto.objetivo.value,
    modoHeuristica: modoHeuristica.value,
  })

  if (animar && resultado.rastro.length > 0) {
    void animarPassoAPasso(resultado)
  } else {
    aplicarResultadoFinal(resultado)
  }
}

function aoGerarLabirinto() {
  labirinto.gerarLabirintoAleatorio()
  limparBusca()
}

function aoLimparLabirinto() {
  labirinto.limparParedes()
  limparBusca()
}

function aoResetarBusca() {
  limparBusca()
}

function aoAlternarPausa() {
  if (!estaAnimando.value) {
    return
  }

  estaPausado.value = !estaPausado.value
}

function aoMudarTamanhoGrade(tamanho) {
  labirinto.redimensionarLabirinto(tamanho)
  limparBusca()
}

const itensLegenda = [
  {
    chave: 'A',
    rotulo: 'Start (A)',
    descricao: 'nó inicial do algoritmo; ponto de partida do agente. O A* expande a busca a partir daqui, calculando o custo g=0',
  },
  {
    chave: 'B',
    rotulo: 'Goal (B)',
    descricao: 'nó destino; o algoritmo encerra quando este nó é retirado do conjunto aberto. Todo o cálculo de heurística Manhattan aponta para cá',
  },
  {
    chave: 'wall',
    rotulo: 'Obstáculo',
    descricao: 'célula ignorada pelo A* durante a expansão de vizinhos',
  },
  {
    chave: 'open',
    rotulo: 'Conjunto aberto',
    descricao: 'fila de prioridade do A*; contém nós descobertos ordenados pelo menor valor de f(n) = g(n) + h(n)',
  },
  {
    chave: 'closed',
    rotulo: 'Conjunto fechado',
    descricao: 'nós cujo custo ótimo já foi determinado; o A* não os reexpande',
  },
  {
    chave: 'current',
    rotulo: 'Nó atual',
    descricao: 'nó com menor f(n) retirado do conjunto aberto neste passo; seus vizinhos serão avaliados a seguir',
  },
  {
    chave: 'path',
    rotulo: 'Caminho final',
    descricao: 'sequência reconstruída pelo backtracking dos nós pai, do Goal até o Start; representa o menor caminho em distância Manhattan',
  },
]

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
        A busca usa A* determinístico com visualização passo a passo.
      </p>
    </header>

    <section class="layout-grid">
      <ControlsPanel
        :tamanho-grade="labirinto.tamanhoGrade.value"
        :modo-edicao="labirinto.modoEdicao.value"
        :modo-heuristica="modoHeuristica"
        :esta-animando="estaAnimando"
        :esta-pausado="estaPausado"
        @gerar-labirinto="aoGerarLabirinto"
        @limpar-labirinto="aoLimparLabirinto"
        @executar-a-estrela="executarBuscaAEstrela({ animar: false })"
        @executar-passo="executarBuscaAEstrela({ animar: true })"
        @alternar-pausa="aoAlternarPausa"
        @resetar-busca="aoResetarBusca"
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
              <div class="legend-copy">
                <span class="legend-title">{{ item.rotulo }}</span>
                <span class="legend-description">{{ item.descricao }}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </section>
  </div>
</template>
