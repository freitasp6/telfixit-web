#!/usr/bin/env bash
set -e

#
#  CONFIGURAÇÃO — edita estes valores de acordo com o teu setup
#
GIT_USERNAME="Pedro Freitas"
GIT_EMAIL="teu.email@exemplo.com"
GITLAB_REMOTE="https://gitlab.com/freitasp6/duo-wo.git"
HEROKU_APP="duo-wo"                           # muda se quiseres outro nome
JWT_SECRET="MeuSegredoSuperSecreto123!"       # o teu segredo JWT
BRANCH="main"                                 # ou "master" se for o teu caso

#
# 1) Configurar Git local (só se ainda não tiveres feito)
#
echo "→ Configurando Git globalmente..."
git config --global user.name  "$GIT_USERNAME"
git config --global user.email "$GIT_EMAIL"

#
# 2) Criar .gitignore se não existir
#
if [ ! -f .gitignore ]; then
  echo "→ Criando .gitignore"
  cat <<EOF > .gitignore
# Node
node_modules/
npm-debug.log*
.env

# Dados e uploads
data/
uploads/

# IDE
.vscode/
EOF
fi

#
# 3) Iniciar Git no diretório do projeto
#
if [ ! -d .git ]; then
  echo "→ Inicializando repositório Git..."
  git init
fi

#
# 4) Ligar ao remoto do GitLab
#
if ! git remote | grep -q origin; then
  echo "→ Adicionando remote origin -> $GITLAB_REMOTE"
  git remote add origin "$GITLAB_REMOTE"
fi

#
# 5) Commitar tudo e enviar ao GitLab
#
echo "→ Adicionando e commitando alterações..."
git add .
git commit -m "Primeiro commit DUO-WO" || true
echo "→ Fazendo push para GitLab ($BRANCH)..."
git push -u origin "$BRANCH"

#
# 6) Login e criação no Heroku
#
echo "→ Autentica-te no Heroku (vai abrir uma página no browser)..."
heroku login
if ! heroku apps | grep -q "^$HEROKU_APP\$"; then
  echo "→ Criando app no Heroku com nome: $HEROKU_APP"
  heroku create "$HEROKU_APP"
else
  echo "→ App $HEROKU_APP já existe no Heroku"
fi

#
# 7) Definir variável JWT_SECRET no Heroku
#
echo "→ Definindo JWT_SECRET no Heroku"
heroku config:set JWT_SECRET="$JWT_SECRET" --app "$HEROKU_APP"

#
# 8) Fazer deploy no Heroku
#
echo "→ Enviando código ao Heroku ($HEROKU_APP)..."
git push heroku "$BRANCH":main -f

echo "✅ Tudo enviado! A tua app estará disponível em https://$HEROKU_APP.herokuapp.com"
