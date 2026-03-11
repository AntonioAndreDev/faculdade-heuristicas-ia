<script setup>
import { computed } from 'vue'

const props = defineProps({
  tamanhoGrade: {
    type: Number,
    required: true,
  },
  modoEdicao: {
    type: String,
    required: true,
  },
  modoHeuristica: {
    type: String,
    required: true,
  },
  estaAnimando: {
    type: Boolean,
    required: true,
  },
  estaPausado: {
    type: Boolean,
    required: true,
  },
  podeGerarRelatorio: {
    type: Boolean,
    required: true,
  },
  carregandoIa: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'gerar-labirinto',
  'limpar-labirinto',
  'executar-a-estrela',
  'executar-passo',
  'alternar-pausa',
  'resetar-busca',
  'gerar-relatorio-ia',
  'atualizar:tamanho-grade',
  'atualizar:modo-edicao',
  'atualizar:modo-heuristica',
])

const rotuloPausa = computed(() => (props.estaPausado ? 'Retomar' : 'Pausar'))

function paraNumero(evento) {
  return Number(evento.target.value)
}
</script>

<template>
  <aside class="panel controls-panel">
    <h2>Controles</h2>

    <div class="buttons-grid">
      <button type="button" @click="emit('gerar-labirinto')">Gerar labirinto</button>
      <button type="button" @click="emit('limpar-labirinto')">Limpar</button>
      <button type="button" @click="emit('executar-a-estrela')" :disabled="estaAnimando">Executar A*</button>
      <button type="button" @click="emit('executar-passo')" :disabled="estaAnimando">Executar passo a passo</button>
      <button type="button" @click="emit('alternar-pausa')" :disabled="!estaAnimando">{{ rotuloPausa }}</button>
      <button type="button" @click="emit('resetar-busca')">Reset</button>
      <button
        type="button"
        class="button-report"
        @click="emit('gerar-relatorio-ia')"
        :disabled="!podeGerarRelatorio || carregandoIa"
      >
        {{ carregandoIa ? 'Gerando relatório...' : 'Gerar relatório IA' }}
      </button>
    </div>

    <label class="field">
      <span>Tamanho do grid: {{ tamanhoGrade }}x{{ tamanhoGrade }}</span>
      <input
        type="range"
        min="8"
        max="40"
        step="1"
        :value="tamanhoGrade"
        @input="emit('atualizar:tamanho-grade', paraNumero($event))"
      />
    </label>

    <label class="field">
      <span>Modo de edição</span>
      <select :value="modoEdicao" @change="emit('atualizar:modo-edicao', $event.target.value)">
        <option value="parede">Paredes</option>
        <option value="inicio">Definir A</option>
        <option value="objetivo">Definir B</option>
      </select>
    </label>

    <label class="field">
      <span>Heurística</span>
      <select :value="modoHeuristica" @change="emit('atualizar:modo-heuristica', $event.target.value)">
        <option value="manhattan">Manhattan</option>
      </select>
    </label>
  </aside>
</template>
