function formatarNo(no) {
  return `(${no.x}, ${no.y})`
}

function arredondar(valor) {
  return Number(valor.toFixed(2))
}

export function criarLoggerAEstrela({ ativo = true, nomeAlgoritmo = 'A*' } = {}) {
  function iniciarExecucao(contexto) {
    if (!ativo) {
      return
    }

    console.group(`%c[${nomeAlgoritmo}] Iniciando execução`, 'color:#0f766e;font-weight:700;')
    console.log('Contexto:', contexto)
  }

  function registrarIteracao(dados) {
    if (!ativo) {
      return
    }

    const {
      iteracao,
      atual,
      tamanhoAberto,
      tamanhoFechado,
      adicionadosNoAberto,
      motivoDecisao,
      topoAberto,
    } = dados

    console.groupCollapsed(`Iteração ${iteracao} | atual=${formatarNo(atual)} | f=${arredondar(atual.f)}`)
    console.log('Nó atual:', {
      x: atual.x,
      y: atual.y,
      g: arredondar(atual.g),
      h: arredondar(atual.h),
      f: arredondar(atual.f),
    })
    console.log('Conjunto aberto (tamanho):', tamanhoAberto)
    console.log('Conjunto fechado (tamanho):', tamanhoFechado)
    console.log(
      'Nós adicionados no conjunto aberto:',
      adicionadosNoAberto.length
        ? adicionadosNoAberto.map((no) => ({
            x: no.x,
            y: no.y,
            g: arredondar(no.g),
            h: arredondar(no.h),
            f: arredondar(no.f),
          }))
        : 'Nenhum',
    )
    console.log('Decisão:', motivoDecisao)

    console.table(
      topoAberto.map((no) => ({
        posicao: formatarNo(no),
        g: arredondar(no.g),
        h: arredondar(no.h),
        f: arredondar(no.f),
      })),
    )
    console.groupEnd()
  }

  function registrarResultado(dados) {
    if (!ativo) {
      return
    }

    console.group('%cResultado final', 'color:#155e75;font-weight:700;')
    console.log('Caminho encontrado:', dados.encontrou)
    console.log('Caminho (coordenadas):', dados.caminho)
    console.log('Custo total (metros):', arredondar(dados.distanciaTotalMetros))
    console.log('Tempo total (segundos):', arredondar(dados.tempoTotalSegundos))
    console.log('Nós expandidos:', dados.nosExpandidos)
    if (typeof dados.nosExpandidosDijkstra === 'number') {
      const diferenca = dados.nosExpandidosDijkstra - dados.nosExpandidos
      const sinal = diferenca >= 0 ? '+' : ''
      console.log(
        'Comparação com Dijkstra:',
        `Dijkstra expandiria ${dados.nosExpandidosDijkstra} nós (${sinal}${diferenca} em relação ao A*)`,
      )
    }
    console.groupEnd()
  }

  function finalizarExecucao() {
    if (!ativo) {
      return
    }

    console.groupEnd()
  }

  return {
    iniciarExecucao,
    registrarIteracao,
    registrarResultado,
    finalizarExecucao,
  }
}
