const URL_API_OPENAI = 'https://api.openai.com/v1/responses'
const MODELO_PADRAO = 'gpt-4.1-mini'

function extrairTextoResposta(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim().length > 0) {
    return payload.output_text.trim()
  }

  const fragmentos = []
  for (const item of payload.output ?? []) {
    for (const conteudo of item.content ?? []) {
      if (typeof conteudo.text === 'string') {
        fragmentos.push(conteudo.text)
      }
    }
  }

  return fragmentos.join('\n').trim()
}

export async function explicarExecucao({ metricas, configuracao, amostraIteracoes, caminho }) {
  const chaveApi = import.meta.env.VITE_OPENAI_API_KEY
  if (!chaveApi) {
    throw new Error('Defina VITE_OPENAI_API_KEY no arquivo .env para habilitar o relatório da IA.')
  }

  const modelo = import.meta.env.VITE_OPENAI_MODEL || MODELO_PADRAO

  const cargaPrompt = {
    objetivo: 'Explicar didaticamente por que o A* escolheu o caminho final.',
    configuracao,
    metricas,
    amostraIteracoes,
    caminhoFinal: caminho,
  }

  const resposta = await fetch(URL_API_OPENAI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${chaveApi}`,
    },
    body: JSON.stringify({
      model: modelo,
      temperature: 0.2,
      max_output_tokens: 700,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'Você é um professor de IA. Produza uma explicação objetiva, clara e pronta para apresentação, em português.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Use os dados abaixo e gere um relatório com:\n1) Resumo da execução\n2) Por que a heurística ajudou\n3) Interpretação das métricas\n4) Conclusão em 3 bullets\n\nDados:\n${JSON.stringify(cargaPrompt, null, 2)}`,
            },
          ],
        },
      ],
    }),
  })

  if (!resposta.ok) {
    const corpoErro = await resposta.text()
    throw new Error(`Falha ao chamar OpenAI (${resposta.status}): ${corpoErro}`)
  }

  const json = await resposta.json()
  const texto = extrairTextoResposta(json)

  if (!texto) {
    throw new Error('A OpenAI respondeu sem texto útil para o relatório.')
  }

  return texto
}
