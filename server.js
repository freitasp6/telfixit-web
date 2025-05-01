const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db', 'database.db');
const db = new sqlite3.Database(dbPath);

app.use(express.json());
app.use(express.static('public'));

app.get('/wos', (req, res) => {
  db.all('SELECT * FROM wos', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/wos', (req, res) => {
  const { assunto, descricao, localizacao, link, empresa, tecnico, zona, data_limite, estado } = req.body;
  db.run('INSERT INTO wos (assunto, descricao, localizacao, link, empresa, tecnico, zona, data_limite, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [assunto, descricao, localizacao, link, empresa, tecnico, zona, data_limite, estado],
    (err) => {
      if (err) return res.status(500).send(err.message);
      res.sendStatus(200);
    }
  );
});

app.delete('/wos/:id', (req, res) => {
  db.run('DELETE FROM wos WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.sendStatus(200);
  });
});

app.get('/equipas', (req, res) => {
  db.all('SELECT * FROM equipas', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/equipas', (req, res) => {
  const { empresa, tecnico, zona, telefone, email, cc } = req.body;
  db.run('INSERT INTO equipas (empresa, tecnico, zona, telefone, email, cc) VALUES (?, ?, ?, ?, ?, ?)',
    [empresa, tecnico, zona, telefone, email, cc],
    (err) => {
      if (err) return res.status(500).send(err.message);
      res.sendStatus(200);
    }
  );
});

app.delete('/equipas/:id', (req, res) => {
  db.run('DELETE FROM equipas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.sendStatus(200);
  });
});

app.listen(3000, () => console.log('Servidor a correr em http://localhost:3000'));
