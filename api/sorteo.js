const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FelizNavidad';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.method === 'GET' ? req.query.action : req.body?.action;

  try {
    if (action === 'estado') {
      const result = await pool.query(`
        SELECT p.id, p.nombre, p.asignado_a_id, p.sorteado_en,
               asignado.nombre as asignado_a_nombre
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        ORDER BY p.nombre
      `);

      const participantes = result.rows;
      return res.json({
        success: true,
        participantes,
        totalParticipantes: participantes.length,
        totalSorteos: participantes.filter(p => p.asignado_a_id).length,
        yaHicieron: participantes.filter(p => p.asignado_a_id).map(p => p.nombre),
        disponibles: participantes.filter(p => !p.asignado_a_id).map(p => p.nombre),
        personasElegidas: participantes.filter(p => p.asignado_a_id).map(p => p.asignado_a_nombre)
      });
    }

    if (action === 'sortear') {
      const { nombre } = req.body;
      if (!nombre) return res.status(400).json({ success: false, error: 'Nombre requerido' });

      const p = await pool.query('SELECT * FROM participantes WHERE nombre = $1', [nombre]);
      if (p.rows.length === 0) return res.status(404).json({ success: false, error: 'No encontrado' });

      const user = p.rows[0];
      if (user.asignado_a_id) {
        const asig = await pool.query('SELECT nombre FROM participantes WHERE id = $1', [user.asignado_a_id]);
        return res.json({ success: false, yaSorteado: true, asignadoA: asig.rows[0].nombre });
      }

      const cand = await pool.query(`
        SELECT id, nombre FROM participantes 
        WHERE id != $1 AND id NOT IN (SELECT asignado_a_id FROM participantes WHERE asignado_a_id IS NOT NULL)
      `, [user.id]);

      if (cand.rows.length === 0) return res.status(400).json({ success: false, error: 'Sin candidatos' });

      const elegido = cand.rows[Math.floor(Math.random() * cand.rows.length)];
      await pool.query('UPDATE participantes SET asignado_a_id = $1, sorteado_en = NOW() WHERE id = $2', [elegido.id, user.id]);

      return res.json({ success: true, usuario: nombre, elegido: elegido.nombre, totalSorteos: 1, totalParticipantes: 11 });
    }

    if (action === 'reiniciar') {
      if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, error: 'Password' });
      await pool.query('UPDATE participantes SET asignado_a_id = NULL, sorteado_en = NULL');
      return res.json({ success: true });
    }

    if (action === 'resultados') {
      if (req.body.password !== ADMIN_PASSWORD) return res.status(401).json({ success: false, error: 'Password' });
      const r = await pool.query(`
        SELECT p.nombre as participante, asignado.nombre as asignado_a, p.sorteado_en
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        WHERE p.asignado_a_id IS NOT NULL ORDER BY p.sorteado_en
      `);
      return res.json({ success: true, resultados: r.rows });
    }

    return res.status(400).json({ success: false, error: 'Acción desconocida' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};