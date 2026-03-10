import { ref } from 'vue'

function criarGrade(tamanho, valorInicial = false) {
  return Array.from({ length: tamanho }, () => Array(tamanho).fill(valorInicial))
}

function estaDentroDaGrade(x, y, tamanho) {
  return x >= 0 && y >= 0 && x < tamanho && y < tamanho
}

function clonarGrade(grade) {
  return grade.map((linha) => linha.slice())
}

function criarPontosIniciais(tamanho) {
  const margemSegura = tamanho > 3 ? 1 : 0
  return {
    inicio: { x: margemSegura, y: margemSegura },
    objetivo: { x: tamanho - 1 - margemSegura, y: tamanho - 1 - margemSegura },
  }
}

export function useMaze(tamanhoInicial = 20) {
  const tamanhoGrade = ref(tamanhoInicial)
  const densidadeObstaculos = ref(0.25)
  const modoEdicao = ref('parede')

  const pontosIniciais = criarPontosIniciais(tamanhoInicial)
  const inicio = ref(pontosIniciais.inicio)
  const objetivo = ref(pontosIniciais.objetivo)
  const grade = ref(criarGrade(tamanhoInicial, false))

  function redimensionarLabirinto(proximoTamanho) {
    const valorConvertido = Number(proximoTamanho)
    if (!Number.isInteger(valorConvertido) || valorConvertido < 5) {
      return
    }

    tamanhoGrade.value = valorConvertido
    grade.value = criarGrade(valorConvertido, false)

    const novosPontos = criarPontosIniciais(valorConvertido)
    inicio.value = novosPontos.inicio
    objetivo.value = novosPontos.objetivo
  }

  function limparParedes() {
    grade.value = criarGrade(tamanhoGrade.value, false)
  }

  function gerarLabirintoAleatorio(densidade = densidadeObstaculos.value) {
    const densidadeNormalizada = Math.max(0, Math.min(Number(densidade), 0.75))
    const proximaGrade = criarGrade(tamanhoGrade.value, false)

    for (let y = 0; y < tamanhoGrade.value; y += 1) {
      for (let x = 0; x < tamanhoGrade.value; x += 1) {
        if ((x === inicio.value.x && y === inicio.value.y) || (x === objetivo.value.x && y === objetivo.value.y)) {
          continue
        }

        if (Math.random() < densidadeNormalizada) {
          proximaGrade[y][x] = true
        }
      }
    }

    grade.value = proximaGrade
  }

  function estaBloqueada(x, y) {
    return Boolean(grade.value[y]?.[x])
  }

  function definirCelulaBloqueada(x, y, bloqueada) {
    if (!estaDentroDaGrade(x, y, tamanhoGrade.value)) {
      return
    }

    if ((x === inicio.value.x && y === inicio.value.y) || (x === objetivo.value.x && y === objetivo.value.y)) {
      return
    }

    if (grade.value[y][x] === bloqueada) {
      return
    }

    const proximaGrade = clonarGrade(grade.value)
    proximaGrade[y][x] = bloqueada
    grade.value = proximaGrade
  }

  function alternarParede(x, y) {
    definirCelulaBloqueada(x, y, !estaBloqueada(x, y))
  }

  function definirInicio(posicao) {
    const { x, y } = posicao
    if (!estaDentroDaGrade(x, y, tamanhoGrade.value)) {
      return false
    }
    if (estaBloqueada(x, y)) {
      return false
    }
    if (x === objetivo.value.x && y === objetivo.value.y) {
      return false
    }

    inicio.value = { x, y }
    return true
  }

  function definirObjetivo(posicao) {
    const { x, y } = posicao
    if (!estaDentroDaGrade(x, y, tamanhoGrade.value)) {
      return false
    }
    if (estaBloqueada(x, y)) {
      return false
    }
    if (x === inicio.value.x && y === inicio.value.y) {
      return false
    }

    objetivo.value = { x, y }
    return true
  }

  return {
    grade,
    tamanhoGrade,
    densidadeObstaculos,
    inicio,
    objetivo,
    modoEdicao,
    redimensionarLabirinto,
    limparParedes,
    gerarLabirintoAleatorio,
    estaBloqueada,
    definirCelulaBloqueada,
    alternarParede,
    definirInicio,
    definirObjetivo,
  }
}
