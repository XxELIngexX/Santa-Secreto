// api/index.js
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'ec2-3-229-118-156.compute-1.amazonaws.com',
  database: process.env.DB_NAME || 'santasecreto',
  user: process.env.DB_USER || 'santa',
  password: process.env.DB_PASSWORD || 'secreto',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

app.get('/api/sorteo', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const result = await pool.query('SELECT p.*, asignado.nombre as asignado_a_nombre FROM participantes p LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id ORDER BY p.nombre');
  const participantes = result.rows;
  res.json({
    success: true,
    participantes,
    totalParticipantes: participantes.length,
    totalSorteos: participantes.filter(p => p.asignado_a_id).length,
    yaHicieron: participantes.filter(p => p.asignado_a_id).map(p => p.nombre),
    disponibles: participantes.filter(p => !p.asignado_a_id).map(p => p.nombre),
    personasElegidas: participantes.filter(p => p.asignado_a_id).map(p => p.asignado_a_nombre)
  });
});

app.post('/api/sorteo', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { action, nombre, password } = req.body;
  
  if (action === 'sortear') {
    const p = await pool.query('SELECT * FROM participantes WHERE nombre = $1', [nombre]);
    const user = p.rows[0];
    if (user.asignado_a_id) {
      const asig = await pool.query('SELECT nombre FROM participantes WHERE id = $1', [user.asignado_a_id]);
      return res.json({ success: false, yaSorteado: true, asignadoA: asig.rows[0].nombre });
    }
    const cand = await pool.query('SELECT id, nombre FROM participantes WHERE id != $1 AND id NOT IN (SELECT asignado_a_id FROM participantes WHERE asignado_a_id IS NOT NULL)', [user.id]);
    const elegido = cand.rows[Math.floor(Math.random() * cand.rows.length)];
    await pool.query('UPDATE participantes SET asignado_a_id = $1, sorteado_en = NOW() WHERE id = $2', [elegido.id, user.id]);
    res.json({ success: true, usuario: nombre, elegido: elegido.nombre, totalSorteos: 1, totalParticipantes: 11 });
  }
  
  if (action === 'reiniciar' && password === 'FelizNavidad') {
    await pool.query('UPDATE participantes SET asignado_a_id = NULL, sorteado_en = NULL');
    res.json({ success: true });
  }
});

module.exports = app;