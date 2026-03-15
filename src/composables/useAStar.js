/*
  Este arquivo implementa a busca A* em uma grade quadrada.
  A ideia do A* é parecida com usar um mapa e escolher, a cada passo,
  o caminho que parece mais promissor somando:
  - o custo já percorrido até agora
  - uma estimativa do que falta até o destino
  Além de encontrar o caminho, o código também registra rastros e métricas
  para comparação com o comportamento do algoritmo de Dijkstra.
*/
export const DISTANCIA_CELULA_METROS = 500
export const VELOCIDADE_PADRAO_AGENTE_MPS = 5

/*
  Lista os movimentos permitidos a partir de uma célula.
  Aqui só existem movimentos ortogonais: direita, esquerda, baixo e cima.
  O campo "fator" multiplica o custo do passo.
*/
const DIRECOES_ORTOGONAIS = [
  { dx: 1, dy: 0, fator: 1 },
  { dx: -1, dy: 0, fator: 1 },
  { dx: 0, dy: 1, fator: 1 },
  { dx: 0, dy: -1, fator: 1 },
]

/*
  Recebe as coordenadas x e y de um nó e devolve uma chave em texto.
  Essa chave funciona como uma "etiqueta única" para guardar o nó em Set e Map.
  Retorna uma string no formato "x,y".
*/
function chaveNo(x, y) {
  return `${x},${y}`
}

/*
  Recebe uma chave no formato "x,y", separa os valores e converte para número.
  Isso é o caminho de volta: sai do texto e retorna um objeto com { x, y }.
*/
function parsearChaveNo(chave) {
  const [x, y] = chave.split(',').map(Number)
  return { x, y }
}

/*
  Recebe uma posição e o tamanho da grade.
  Verifica se a posição ainda está dentro dos limites do tabuleiro.
  Retorna true quando a célula existe e false quando está fora da grade.
*/
function estaDentroDaGrade(x, y, tamanho) {
  return x >= 0 && y >= 0 && x < tamanho && y < tamanho
}

/*
  Recebe a grade e uma posição.
  Verifica se a célula está ocupada por um obstáculo.
  Retorna true para bloqueada e false para livre.
*/
function estaBloqueada(grade, x, y) {
  return Boolean(grade[y]?.[x])
}

/*
  Recebe dois nós candidatos e define a ordem de prioridade entre eles.
  Essa comparação é usada para decidir qual nó será explorado primeiro.
  Retorna um número:
  - negativo se "a" deve vir antes de "b"
  - positivo se "b" deve vir antes de "a"
  - zero se forem equivalentes no critério atual

  Ordem dos critérios:
  1. menor f = melhor custo total estimado
  2. menor h = parece mais perto do objetivo
  3. menor g = custou menos até aqui
  4. coordenadas = desempate fixo para manter previsibilidade
*/
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

/*
  Recebe a posição atual, o objetivo e o modo de heurística.
  Calcula uma estimativa do custo restante até o destino.
  Heurística é uma "boa pista" do caminho, não o custo real final.
  Aqui é usada a distância Manhattan: soma dos deslocamentos horizontal e vertical.
  Retorna o valor estimado em metros.
*/
function custoHeuristico(origem, objetivo, modoHeuristica) {
  const dx = Math.abs(objetivo.x - origem.x)
  const dy = Math.abs(objetivo.y - origem.y)

  // ⚠️ Atenção: o parâmetro "modoHeuristica" é recebido, mas nesta implementação
  // a conta usada é sempre Manhattan.
  return (dx + dy) * DISTANCIA_CELULA_METROS
}

/*
  Recebe o nó atual e a grade.
  Procura os vizinhos válidos que podem ser visitados no próximo passo.
  É como olhar para os quatro lados e descartar:
  - posições fora do mapa
  - posições com obstáculo
  Retorna uma lista de vizinhos com coordenadas e custo de movimento.
*/
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

/*
  Recebe:
  - o mapa "veioDe", que guarda de qual nó cada posição foi alcançada
  - a chave do início
  - a chave do objetivo

  Reconstrói o caminho andando de trás para frente:
  objetivo -> pai -> pai -> ... -> início
  Depois inverte a ordem para entregar do início ao fim.
  Retorna uma lista de chaves; se não houver caminho completo, retorna [].
*/
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

/*
  Recebe a lista do conjunto aberto já ordenada por prioridade.
  Gera uma explicação textual do motivo de um nó ter sido escolhido.
  Isso é útil para ensino e depuração.
  Retorna uma frase curta em português.
*/
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

/*
  Recebe uma posição e os valores g e h.
  Monta o objeto que representa o estado de um nó durante a busca.
  Retorna um objeto com:
  - x e y: posição
  - g: custo acumulado até aqui
  - h: estimativa restante
  - f: soma de g + h
*/
function criarEstadoNo(posicao, g, h) {
  return {
    x: posicao.x,
    y: posicao.y,
    g,
    h,
    f: g + h,
  }
}

/*
  Esta é a rotina principal de busca.
  Recebe a grade, ponto inicial, objetivo e opções de execução.
  Ela pode funcionar de dois modos:
  - A*: usa heurística para acelerar a busca
  - Dijkstra: desliga a heurística, explorando de forma mais "cega"

  Retorna um objeto com o resultado da busca, incluindo:
  - se encontrou caminho
  - quantidade de iterações
  - nós expandidos
  - caminho final
  - rastros para visualização
*/
function executarBusca({
  grade,
  inicio,
  objetivo,
  modoHeuristica,
  desabilitarHeuristica,
  coletarRastro,
}) {
  /*
    Quando a heurística está desabilitada, a função retorna sempre 0.
    Isso faz o A* se comportar como Dijkstra.
  */
  const heuristica = desabilitarHeuristica
    ? () => 0
    : (posicao) => custoHeuristico(posicao, objetivo, modoHeuristica)

  const chaveInicio = chaveNo(inicio.x, inicio.y)
  const chaveObjetivo = chaveNo(objetivo.x, objetivo.y)

  /*
    Estruturas principais do algoritmo:
    - conjuntoAberto: nós descobertos, mas ainda não explorados
    - conjuntoFechado: nós já explorados
    - veioDe: aponta o "pai" de cada nó para reconstruir o caminho
    - pontuacaoG: guarda o melhor custo conhecido até cada nó
  */
  const conjuntoAberto = new Set([chaveInicio])
  const conjuntoFechado = new Set()
  const veioDe = new Map()
  const pontuacaoG = new Map([[chaveInicio, 0]])

  // O nó inicial começa com custo g = 0 e heurística calculada a partir dele.
  const noInicial = criarEstadoNo(inicio, 0, heuristica(inicio))
  const estadosNos = new Map([[chaveInicio, noInicial]])

  // "rastro" registra o passo a passo para visualização da execução.
  const rastro = []

  let iteracoes = 0
  let nosExpandidos = 0
  let encontrou = false
  let noObjetivo = null
  let chaveAtualFinal = chaveInicio

  /*
    O laço continua enquanto ainda existir algum nó promissor para testar.
    Em cada volta, o melhor candidato do conjunto aberto é escolhido.
  */
  while (conjuntoAberto.size > 0) {
    const abertoOrdenadoAntes = Array.from(conjuntoAberto)
      .map((chave) => estadosNos.get(chave))
      .sort(compararNos)

    // O primeiro da lista ordenada é o melhor candidato segundo os critérios do A*.
    const atual = abertoOrdenadoAntes[0]
    const chaveAtual = chaveNo(atual.x, atual.y)
    const motivoDecisao = explicarDecisao(abertoOrdenadoAntes)

    // Sai do aberto e entra no fechado: agora este nó está oficialmente em análise.
    conjuntoAberto.delete(chaveAtual)
    conjuntoFechado.add(chaveAtual)
    nosExpandidos += 1
    iteracoes += 1
    chaveAtualFinal = chaveAtual

    const adicionadosNoAberto = []

    // Se chegamos ao destino, não faz sentido continuar expandindo vizinhos.
    if (chaveAtual === chaveObjetivo) {
      encontrou = true
      noObjetivo = atual
    } else {
      const vizinhos = obterVizinhos(atual, grade)
      for (const vizinho of vizinhos) {
        const chaveVizinho = chaveNo(vizinho.x, vizinho.y)

        // ⚠️ Atenção: um nó no conjunto fechado já foi considerado resolvido.
        // Por isso, ele é ignorado aqui.
        if (conjuntoFechado.has(chaveVizinho)) {
          continue
        }

        // gTentativo é o custo para chegar ao vizinho passando pelo nó atual.
        const gTentativo = atual.g + vizinho.custoMovimento
        const gConhecido = pontuacaoG.get(chaveVizinho)

        // ⚠️ Atenção: se já existe um caminho melhor ou igual para esse vizinho,
        // o novo caminho é descartado para evitar trabalho inútil.
        if (gConhecido !== undefined && gTentativo >= gConhecido) {
          continue
        }

        // Este passou a ser o melhor caminho conhecido até o vizinho.
        veioDe.set(chaveVizinho, chaveAtual)
        pontuacaoG.set(chaveVizinho, gTentativo)

        const hValor = heuristica(vizinho)
        const novoEstadoNo = criarEstadoNo(vizinho, gTentativo, hValor)
        estadosNos.set(chaveVizinho, novoEstadoNo)

        // Guardamos quem entrou agora no aberto para fins de relatório e interface.
        if (!conjuntoAberto.has(chaveVizinho)) {
          adicionadosNoAberto.push(novoEstadoNo)
        }

        conjuntoAberto.add(chaveVizinho)
      }
    }

    const abertoOrdenadoDepois = Array.from(conjuntoAberto)
      .map((chave) => estadosNos.get(chave))
      .sort(compararNos)

    // O rastro guarda um "snapshot", ou seja, uma fotografia do estado desta iteração.
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

    // Encerramento imediato quando o objetivo já foi encontrado.
    if (encontrou) {
      break
    }
  }

  /*
    Se encontrou o objetivo, reconstrói o caminho final.
    Caso contrário, devolve caminho vazio.
  */
  const chavesCaminho = encontrou ? reconstruirCaminho(veioDe, chaveInicio, chaveObjetivo) : []
  const caminho = chavesCaminho.map((chave) => parsearChaveNo(chave))

  // O retorno concentra tanto o resultado final quanto dados úteis para análise.
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

/*
  Esta é a função pública usada pelo restante da aplicação.
  Recebe:
  - a grade com obstáculos
  - o ponto de início
  - o ponto de objetivo
  - a configuração de heurística

  Ela executa:
  1. A* com rastro completo
  2. Dijkstra sem heurística, apenas para comparação de desempenho

  Retorna um objeto com o resultado enriquecido:
  caminho, distância, tempo estimado, métricas e comparação com Dijkstra.
*/
export function executarAEstrela({
  grade,
  inicio,
  objetivo,
}) {
  // A implementação atual fixa a heurística em Manhattan por segurança e consistência.
  const heuristicaSegura = 'manhattan'

  // Mede quanto tempo o algoritmo A* leva para rodar.
  const inicioExecucao = performance.now()
  const resultadoAEstrela = executarBusca({
    grade,
    inicio,
    objetivo,
    modoHeuristica: heuristicaSegura,
    desabilitarHeuristica: false,
    coletarRastro: true,
  })
  const tempoProcessamentoMs = performance.now() - inicioExecucao

  /*
    Executa Dijkstra com a mesma grade para comparação.
    Como a heurística é zerada, ele explora mais nós em muitos cenários.
  */
  const resultadoDijkstra = executarBusca({
    grade,
    inicio,
    objetivo,
    modoHeuristica: heuristicaSegura,
    desabilitarHeuristica: true,
    coletarRastro: false,
  })

  // Converte a distância total em uma estimativa de tempo com base na velocidade padrão.
  const tempoTotalSegundos = resultadoAEstrela.distanciaTotalMetros / Math.max(VELOCIDADE_PADRAO_AGENTE_MPS, 0.001)

  // Junta o resultado principal com métricas extras úteis para exibição na interface.
  const resultado = {
    ...resultadoAEstrela,
    heuristicaUsada: heuristicaSegura,
    tempoTotalSegundos,
    passosCaminho: Math.max(resultadoAEstrela.caminho.length - 1, 0),
    nosExpandidosDijkstra: resultadoDijkstra.nosExpandidos,
    dijkstraEncontrou: resultadoDijkstra.encontrou,
    tempoProcessamentoMs,
  }
  return resultado
}
