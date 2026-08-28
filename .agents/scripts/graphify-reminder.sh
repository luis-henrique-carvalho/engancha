#!/usr/bin/env bash
cat << 'JSON'
{
  "injectSteps": [
    {
      "ephemeralMessage": "[GRAPHIFY ENFORCEMENT] Diretrizes obrigatórias: 1. Use 'graphify query' antes de buscar ou navegar no código. 2. Consulte o grafo da referência local de shadcn-admin antes de criar/alterar telas e componentes web. 3. Execute 'graphify update .' após qualquer alteração de código."
    }
  ]
}
JSON
