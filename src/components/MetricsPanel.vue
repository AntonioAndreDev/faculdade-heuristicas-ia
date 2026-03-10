<script setup>
import { computed } from 'vue'

const props = defineProps({
  metricas: {
    type: Object,
    required: true,
  },
})

const textoComparacao = computed(() => {
  const { nosExpandidosDijkstra, nosExpandidos } = props.metricas
  if (typeof nosExpandidosDijkstra !== 'number') {
    return 'Sem comparação disponível'
  }

  const diferenca = nosExpandidosDijkstra - nosExpandidos
  if (diferenca > 0) {
    return `A* expandiu ${diferenca} nós a menos que Dijkstra.`
  }
  if (diferenca < 0) {
    return `A* expandiu ${Math.abs(diferenca)} nós a mais que Dijkstra.`
  }
  return 'A* e Dijkstra expandiram a mesma quantidade de nós.'
})
</script>

<template>
  <aside class="panel metrics-panel">
    <h2>Métricas</h2>
    <dl class="metrics-list">
      <div>
        <dt>Status</dt>
        <dd>{{ metricas.status }}</dd>
      </div>
      <div>
        <dt>Heurística usada</dt>
        <dd>{{ metricas.heuristicaUsada }}</dd>
      </div>
      <div>
        <dt>Iterações</dt>
        <dd>{{ metricas.iteracoes }}</dd>
      </div>
      <div>
        <dt>Nós expandidos</dt>
        <dd>{{ metricas.nosExpandidos }}</dd>
      </div>
      <div>
        <dt>Passos do caminho</dt>
        <dd>{{ metricas.passosCaminho }}</dd>
      </div>
      <div>
        <dt>Distância total</dt>
        <dd>{{ metricas.distanciaTotalMetros.toFixed(2) }} m</dd>
      </div>
      <div>
        <dt>Tempo estimado</dt>
        <dd>{{ metricas.tempoTotalSegundos.toFixed(2) }} s</dd>
      </div>
      <div>
        <dt>Tempo de processamento</dt>
        <dd>{{ metricas.tempoProcessamentoMs.toFixed(2) }} ms</dd>
      </div>
      <div>
        <dt>Comparação com Dijkstra</dt>
        <dd>{{ textoComparacao }}</dd>
      </div>
    </dl>
  </aside>
</template>
