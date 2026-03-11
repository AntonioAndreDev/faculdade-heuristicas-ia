export const DISTANCIA_CELULA_METROS = 500
export const VELOCIDADE_PADRAO_AGENTE_MPS = 5

const DIRECOES_ORTOGONAIS = [
  { dx: 1, dy: 0, fator: 1 },
  { dx: -1, dy: 0, fator: 1 },
  { dx: 0, dy: 1, fator: 1 },
  { dx: 0, dy: -1, fator: 1 },
]

function chaveNo(x, y) {
  return `${x},${y}`
}

function parsearChaveNo(chave) {
  const [x, y] = chave.split(',').map(Number)
  return { x, y }
}

function estaDentroDaGrade(x, y, tamanho) {
  return x >= 0 && y >= 0 && x < tamanho && y < tamanho
}

function estaBloqueada(grade, x, y) {
  return Boolean(grade[y]?.[x])
}

function compararNos(a, b) {
  if (a.f !== b.f) {
    return a.f - b.f
  }
  if (a.h !== b.h) {
    return a.h - b.h
  }
  if (a.g !== b.g) {
    return a.g - b.g
  }
  if (a.y !== b.y) {
    return a.y - b.y
  }
  return a.x - b.x
}

function custoHeuristico(origem, objetivo, modoHeuristica) {
  const dx = Math.abs(objetivo.x - origem.x)
  const dy = Math.abs(objetivo.y - origem.y)

  return (dx + dy) * DISTANCIA_CELULA_METROS
}

function obterVizinhos(noAtual, grade) {
  const tamanho = grade.length
  const vizinhos = []

  for (const direcao of DIRECOES_ORTOGONAIS) {
    const proximoX = noAtual.x + direcao.dx
    const proximoY = noAtual.y + direcao.dy

    if (!estaDentroDaGrade(proximoX, proximoY, tamanho)) {
      continue
    }

    if (estaBloqueada(grade, proximoX, proximoY)) {
      continue
    }

    vizinhos.push({
      x: proximoX,
      y: proximoY,
      custoMovimento: direcao.fator * DISTANCIA_CELULA_METROS,
    })
  }

  return vizinhos
}

function reconstruirCaminho(veioDe, chaveInicio, chaveObjetivo) {
  const chavesCaminho = []
  let cursor = chaveObjetivo

  while (cursor) {
    chavesCaminho.push(cursor)
    if (cursor === chaveInicio) {
      break
    }
    cursor = veioDe.get(cursor)
  }

  if (chavesCaminho[chavesCaminho.length - 1] !== chaveInicio) {
    return []
  }

  chavesCaminho.reverse()
  return chavesCaminho
}

function explicarDecisao(conjuntoAbertoOrdenado) {
  if (conjuntoAbertoOrdenado.length === 1) {
    return 'Único nó candidato no conjunto aberto.'
  }

  const melhor = conjuntoAbertoOrdenado[0]
  const segundoMelhor = conjuntoAbertoOrdenado[1]

  if (melhor.f < segundoMelhor.f) {
    return 'Escolhido por menor f(n).'
  }

  if (melhor.f === segundoMelhor.f && melhor.h < segundoMelhor.h) {
    return 'Desempate por menor h(n) entre nós com mesmo f(n).'
  }

  if (melhor.f === segundoMelhor.f && melhor.h === segundoMelhor.h && melhor.g < segundoMelhor.g) {
    return 'Desempate por menor g(n) após empate em f(n) e h(n).'
  }

  return 'Empate completo: seleção determinística por ordem de coordenadas (y, x).'
}

function criarEstadoNo(posicao, g, h) {
  return {
    x: posicao.x,
    y: posicao.y,
    g,
    h,
    f: g + h,
  }
}

function executarBusca({
  grade,
  inicio,
  objetivo,
  modoHeuristica,
  desabilitarHeuristica,
  coletarRastro,
  logger,
}) {
  const heuristica = desabilitarHeuristica
    ? () => 0
    : (posicao) => custoHeuristico(posicao, objetivo, modoHeuristica)

  const chaveInicio = chaveNo(inicio.x, inicio.y)
  const chaveObjetivo = chaveNo(objetivo.x, objetivo.y)

  const conjuntoAberto = new Set([chaveInicio])
  const conjuntoFechado = new Set()
  const veioDe = new Map()
  const pontuacaoG = new Map([[chaveInicio, 0]])

  const noInicial = criarEstadoNo(inicio, 0, heuristica(inicio))
  const estadosNos = new Map([[chaveInicio, noInicial]])

  const rastro = []

  let iteracoes = 0
  let nosExpandidos = 0
  let encontrou = false
  let noObjetivo = null
  let chaveAtualFinal = chaveInicio

  while (conjuntoAberto.size > 0) {
    const abertoOrdenadoAntes = Array.from(conjuntoAberto)
      .map((chave) => estadosNos.get(chave))
      .sort(compararNos)

    const atual = abertoOrdenadoAntes[0]
    const chaveAtual = chaveNo(atual.x, atual.y)
    const motivoDecisao = explicarDecisao(abertoOrdenadoAntes)

    conjuntoAberto.delete(chaveAtual)
    conjuntoFechado.add(chaveAtual)
    nosExpandidos += 1
    iteracoes += 1
    chaveAtualFinal = chaveAtual

    const adicionadosNoAberto = []

    if (chaveAtual === chaveObjetivo) {
      encontrou = true
      noObjetivo = atual
    } else {
      const vizinhos = obterVizinhos(atual, grade)
      for (const vizinho of vizinhos) {
        const chaveVizinho = chaveNo(vizinho.x, vizinho.y)

        if (conjuntoFechado.has(chaveVizinho)) {
          continue
        }

        const gTentativo = atual.g + vizinho.custoMovimento
        const gConhecido = pontuacaoG.get(chaveVizinho)

        if (gConhecido !== undefined && gTentativo >= gConhecido) {
          continue
        }

        veioDe.set(chaveVizinho, chaveAtual)
        pontuacaoG.set(chaveVizinho, gTentativo)

        const hValor = heuristica(vizinho)
        const novoEstadoNo = criarEstadoNo(vizinho, gTentativo, hValor)
        estadosNos.set(chaveVizinho, novoEstadoNo)

        if (!conjuntoAberto.has(chaveVizinho)) {
          adicionadosNoAberto.push(novoEstadoNo)
        }

        conjuntoAberto.add(chaveVizinho)
      }
    }

    const abertoOrdenadoDepois = Array.from(conjuntoAberto)
      .map((chave) => estadosNos.get(chave))
      .sort(compararNos)

    if (logger?.registrarIteracao && !desabilitarHeuristica) {
      logger.registrarIteracao({
        iteracao: iteracoes,
        atual,
        tamanhoAberto: conjuntoAberto.size,
        tamanhoFechado: conjuntoFechado.size,
        adicionadosNoAberto,
        motivoDecisao,
        topoAberto: abertoOrdenadoDepois.slice(0, 10),
      })
    }

    if (coletarRastro) {
      rastro.push({
        iteracao: iteracoes,
        chaveAtual,
        atual,
        chavesConjuntoAberto: abertoOrdenadoDepois.map((no) => chaveNo(no.x, no.y)),
        chavesConjuntoFechado: Array.from(conjuntoFechado),
        adicionadosNoAberto: adicionadosNoAberto.map((no) => ({
          x: no.x,
          y: no.y,
          g: no.g,
          h: no.h,
          f: no.f,
        })),
        motivoDecisao,
      })
    }

    if (encontrou) {
      break
    }
  }

  const chavesCaminho = encontrou ? reconstruirCaminho(veioDe, chaveInicio, chaveObjetivo) : []
  const caminho = chavesCaminho.map((chave) => parsearChaveNo(chave))

  return {
    encontrou,
    iteracoes,
    nosExpandidos,
    caminho,
    chavesCaminho,
    distanciaTotalMetros: noObjetivo ? noObjetivo.g : 0,
    chavesAbertasFinais: Array.from(conjuntoAberto),
    chavesFechadasFinais: Array.from(conjuntoFechado),
    chaveAtualFinal,
    rastro,
  }
}

export function executarAEstrela({
  grade,
  inicio,
  objetivo,
  modoHeuristica = 'manhattan',
  logger,
}) {
  const heuristicaSegura = 'manhattan'

  logger?.iniciarExecucao?.({
    algoritmo: 'A*',
    tamanhoGrade: `${grade.length}x${grade.length}`,
    heuristica: heuristicaSegura,
    custoPassoMetros: DISTANCIA_CELULA_METROS,
  })

  const inicioExecucao = performance.now()
  const resultadoAEstrela = executarBusca({
    grade,
    inicio,
    objetivo,
    modoHeuristica: heuristicaSegura,
    desabilitarHeuristica: false,
    coletarRastro: true,
    logger,
  })
  const tempoProcessamentoMs = performance.now() - inicioExecucao

  const resultadoDijkstra = executarBusca({
    grade,
    inicio,
    objetivo,
    modoHeuristica: heuristicaSegura,
    desabilitarHeuristica: true,
    coletarRastro: false,
    logger: null,
  })

  const tempoTotalSegundos = resultadoAEstrela.distanciaTotalMetros / Math.max(VELOCIDADE_PADRAO_AGENTE_MPS, 0.001)

  const resultado = {
    ...resultadoAEstrela,
    heuristicaUsada: heuristicaSegura,
    tempoTotalSegundos,
    passosCaminho: Math.max(resultadoAEstrela.caminho.length - 1, 0),
    nosExpandidosDijkstra: resultadoDijkstra.nosExpandidos,
    dijkstraEncontrou: resultadoDijkstra.encontrou,
    tempoProcessamentoMs,
  }

  logger?.registrarResultado?.(resultado)
  logger?.finalizarExecucao?.()

  return resultado
}
