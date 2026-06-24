#!/bin/bash
# Suite de validacao antes do deploy.
# Tenta usar node (testes E2E completos com jsdom se instalado).
# Se nao tem node, usa python (testes basicos de sintaxe + HTML + versoes).

cd "$(dirname "$0")"

echo "Validando OpenInvTI antes do deploy..."
echo ""

if command -v node >/dev/null 2>&1; then
  node test/e2e.js
  RC=$?
elif command -v python3 >/dev/null 2>&1; then
  python3 test/e2e.py
  RC=$?
elif command -v python >/dev/null 2>&1; then
  python test/e2e.py
  RC=$?
elif command -v py >/dev/null 2>&1; then
  py test/e2e.py
  RC=$?
else
  echo "Nem node nem python disponiveis no PATH."
  echo "Instale Node.js de https://nodejs.org ou Python de https://python.org"
  exit 1
fi

if [ "$RC" = "0" ]; then
  echo ""
  echo "Pronto pra git push."
else
  echo ""
  echo "FALHAS detectadas. Corrige antes de fazer push."
fi
exit $RC
