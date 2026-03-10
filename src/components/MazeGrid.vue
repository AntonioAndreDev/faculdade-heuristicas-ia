<script setup>
import { computed } from 'vue'

const props = defineProps({
  grade: {
    type: Array,
    required: true,
  },
  inicio: {
    type: Object,
    required: true,
  },
  objetivo: {
    type: Object,
    required: true,
  },
  conjuntoAberto: {
    type: Object,
    default: () => new Set(),
  },
  conjuntoFechado: {
    type: Object,
    default: () => new Set(),
  },
  conjuntoCaminho: {
    type: Object,
    default: () => new Set(),
  },
  chaveAtual: {
    type: String,
    default: '',
  },
  mostrarAbertoFechado: {
    type: Boolean,
    default: true,
  },
  desabilitado: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['celula-clicada'])

function chavePorCoordenadas(x, y) {
  return `${x},${y}`
}

const celulasAchatadas = computed(() => {
  const celulas = []

  for (let y = 0; y < props.grade.length; y += 1) {
    for (let x = 0; x < props.grade.length; x += 1) {
      celulas.push({
        x,
        y,
        chave: chavePorCoordenadas(x, y),
        bloqueada: Boolean(props.grade[y][x]),
      })
    }
  }

  return celulas
})

const estiloGrade = computed(() => ({
  gridTemplateColumns: `repeat(${props.grade.length}, minmax(0, 1fr))`,
}))

function classesCelula(celula) {
  const classes = {
    cell: true,
    'is-start': celula.x === props.inicio.x && celula.y === props.inicio.y,
    'is-goal': celula.x === props.objetivo.x && celula.y === props.objetivo.y,
    'is-wall': celula.bloqueada,
    'is-current': props.chaveAtual === celula.chave,
  }

  if (classes['is-start'] || classes['is-goal'] || classes['is-wall']) {
    return classes
  }

  if (props.conjuntoCaminho.has(celula.chave)) {
    classes['is-path'] = true
    return classes
  }

  if (props.mostrarAbertoFechado) {
    if (props.conjuntoAberto.has(celula.chave)) {
      classes['is-open'] = true
    }
    if (props.conjuntoFechado.has(celula.chave)) {
      classes['is-closed'] = true
    }
  }

  return classes
}

function aoClicarCelula(celula) {
  if (props.desabilitado) {
    return
  }

  emit('celula-clicada', { x: celula.x, y: celula.y })
}
</script>

<template>
  <section class="maze-wrapper">
    <div class="maze-grid" :style="estiloGrade">
      <button
        v-for="celula in celulasAchatadas"
        :key="celula.chave"
        type="button"
        :class="classesCelula(celula)"
        @click="aoClicarCelula(celula)"
      >
        <span v-if="celula.x === inicio.x && celula.y === inicio.y">A</span>
        <span v-else-if="celula.x === objetivo.x && celula.y === objetivo.y">B</span>
      </button>
    </div>
  </section>
</template>
