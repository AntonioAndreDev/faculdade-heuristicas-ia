<script setup>
import { computed } from 'vue'

const props = defineProps({
  tamanhoGrade: {
    type: Number,
    required: true,
  },
  densidadeObstaculos: {
    type: Number,
    required: true,
  },
  velocidadeAnimacao: {
    type: Number,
    required: true,
  },
  velocidadeAgente: {
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
  permitirDiagonal: {
    type: Boolean,
    required: true,
  },
  mostrarAbertoFechado: {
    type: Boolean,
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
  'atualizar:densidade-obstaculos',
  'atualizar:velocidade-animacao',
  'atualizar:velocidade-agente',
  'atualizar:modo-edicao',
  'atualizar:modo-heuristica',
  'atualizar:permitir-diagonal',
  'atualizar:mostrar-aberto-fechado',
])

const rotuloPausa = computed(() => (props.estaPausado ? 'Retomar' : 'Pausar'))
const percentualDensidade = computed(() => Math.round(props.densidadeObstaculos * 100))

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
      <span>Densidade de obstáculos: {{ percentualDensidade }}%</span>
      <input
        type="range"
        min="0"
        max="0.6"
        step="0.05"
        :value="densidadeObstaculos"
        @input="emit('atualizar:densidade-obstaculos', paraNumero($event))"
      />
    </label>

    <label class="field">
      <span>Velocidade da animação: {{ velocidadeAnimacao }} ms</span>
      <input
        type="range"
        min="40"
        max="1000"
        step="20"
        :value="velocidadeAnimacao"
        @input="emit('atualizar:velocidade-animacao', paraNumero($event))"
      />
    </label>

    <label class="field">
      <span>Velocidade do agente: {{ velocidadeAgente.toFixed(1) }} m/s</span>
      <input
        type="range"
        min="1"
        max="20"
        step="0.5"
        :value="velocidadeAgente"
        @input="emit('atualizar:velocidade-agente', paraNumero($event))"
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

    <label class="field checkbox">
      <input
        type="checkbox"
        :checked="permitirDiagonal"
        @change="emit('atualizar:permitir-diagonal', $event.target.checked)"
      />
      <span>Permitir movimento diagonal</span>
    </label>

    <label class="field">
      <span>Heurística</span>
      <select :value="modoHeuristica" @change="emit('atualizar:modo-heuristica', $event.target.value)">
        <option value="manhattan">Manhattan</option>
        <option value="euclidiana" :disabled="!permitirDiagonal">Euclidiana</option>
      </select>
    </label>

    <label class="field checkbox">
      <input
        type="checkbox"
        :checked="mostrarAbertoFechado"
        @change="emit('atualizar:mostrar-aberto-fechado', $event.target.checked)"
      />
      <span>Mostrar aberto/fechado</span>
    </label>
  </aside>
</template>
