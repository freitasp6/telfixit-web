const https = require('https');
const fs = require('fs');
const path = require('path');

// URL real do ficheiro index.html completo e funcional
const fileUrl = 'https://duo-apps.github.io/entregas/index-duo-webapp-pc-integrado.html';

// Caminho onde o ficheiro será guardado
const outputPath = path.join(__dirname, 'public', 'index.html');

// Iniciar o download
https.get(fileUrl, (res) => {
    if (res.statusCode !== 200) {
        console.error('Falha no download, código HTTP:', res.statusCode);
        return;
    }

    const fileStream = fs.createWriteStream(outputPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
        fileStream.close();
        console.log('✅ Web App copiada para /public/index.html com sucesso!');
        console.log('👉 Agora corre: node index.js');
        console.log('E abre no browser: http://localhost:3000');
    });
}).on('error', (err) => {
    console.error('Erro ao fazer o download:', err.message);
});
