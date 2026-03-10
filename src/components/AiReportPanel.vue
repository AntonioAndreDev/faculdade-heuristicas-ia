<script setup>
const props = defineProps({
  relatorio: {
    type: String,
    default: '',
  },
  carregando: {
    type: Boolean,
    default: false,
  },
  erro: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <aside class="panel ai-report-panel">
    <h2>Relatório da IA</h2>
    <p v-if="carregando" class="hint">Analisando execução...</p>
    <p v-else-if="erro" class="error">{{ erro }}</p>
    <pre v-else-if="relatorio" class="report-content">{{ relatorio }}</pre>
    <p v-else class="hint">
      Execute o A* e clique em "Gerar relatório IA" para obter a explicação em linguagem natural.
    </p>
  </aside>
</template>
