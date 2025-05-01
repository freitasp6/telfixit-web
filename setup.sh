#!/usr/bin/env bash
set -e

echo "📁 Criando pastas..."
mkdir -p data public

echo "📝 Criando data/wos.json, equipas.json, users.json..."
cat > data/wos.json << 'EOF'
[
  /* As WOs serão guardadas aqui */
]
EOF

cat > data/equipas.json << 'EOF'
[
  /* As equipas serão guardadas aqui */
]
EOF

cat > data/users.json << 'EOF'
[
  /* Os utilizadores serão guardados aqui */
]
EOF

echo "🛠 Criando index.js (servidor)..."
cat > index.js << 'EOF'
/*
  index.js
  → Configura Express, middleware de auth, rotas de WOs/Equipas/Users
  TODO: Preencher com o código do servidor
*/
EOF

echo "🚀 Criando frontend PC..."
cat > public/login.html << 'EOF'
<!-- public/login.html -->
<!DOCTYPE html><html lang="pt-PT"><head><meta charset="UTF-8"/><title>Login</title></head><body>
<!-- TODO: copiar o conteúdo de login.html aqui -->
</body></html>
EOF

cat > public/index.html << 'EOF'
<!-- public/index.html -->
<!DOCTYPE html><html lang="pt-PT"><head><meta charset="UTF-8"/><title>App PC</title></head><body>
<!-- TODO: copiar o conteúdo de index.html aqui -->
</body></html>
EOF

cat > public/auth.js << 'EOF'
/* public/auth.js */
// TODO: copiar o conteúdo de auth.js aqui
EOF

cat > public/app.js << 'EOF'
/* public/app.js */
// TODO: copiar o conteúdo de app.js aqui
EOF

cat > public/users.html << 'EOF'
<!-- public/users.html -->
<!DOCTYPE html><html lang="pt-PT"><head><meta charset="UTF-8"/><title>Gestão de Utilizadores</title></head><body>
<!-- TODO: copiar o conteúdo de users.html aqui -->
</body></html>
EOF

echo "📱 Criando frontend Mobile..."
cat > public/mobile.html << 'EOF'
<!-- public/mobile.html -->
<!DOCTYPE html><html lang="pt-PT"><head><meta charset="UTF-8"/><title>App Mobile</title></head><body>
<!-- TODO: copiar o conteúdo de mobile.html aqui -->
</body></html>
EOF

echo "✅ Estrutura inicial criada!"
