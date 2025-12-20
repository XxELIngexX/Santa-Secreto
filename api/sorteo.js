const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '34.204.168.184',
  database: process.env.DB_NAME || 'santasecreto',
  user: process.env.DB_USER || 'santa',
  password: process.env.DB_PASSWORD || 'secreto',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FelizNavidad';

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = req.method === 'GET' ? req.query.action : req.body?.action;

    // ESTADO
    if (action === 'estado') {
      const result = await pool.query(`
        SELECT p.id, p.nombre, p.asignado_a_id, p.sorteado_en,
               asignado.nombre as asignado_a_nombre
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        ORDER BY p.nombre
      `);

      const participantes = result.rows;
      const totalParticipantes = participantes.length;
      const totalSorteos = participantes.filter(p => p.asignado_a_id).length;

      return res.status(200).json({
        success: true,
        participantes,
        totalParticipantes,
        totalSorteos,
        yaHicieron: participantes.filter(p => p.asignado_a_id).map(p => p.nombre),
        disponibles: participantes.filter(p => !p.asignado_a_id).map(p => p.nombre),
        personasElegidas: participantes.filter(p => p.asignado_a_id).map(p => p.asignado_a_nombre)
      });
    }

    // SORTEAR
    if (action === 'sortear') {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ success: false, error: 'Nombre requerido' });
      }

      const participante = await pool.query('SELECT * FROM participantes WHERE nombre = $1', [nombre]);
      
      if (participante.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Participante no encontrado' });
      }

      const user = participante.rows[0];

      if (user.asignado_a_id) {
        const asignado = await pool.query('SELECT nombre FROM participantes WHERE id = $1', [user.asignado_a_id]);
        return res.status(200).json({
          success: false,
          yaSorteado: true,
          asignadoA: asignado.rows[0].nombre
        });
      }

      const candidatos = await pool.query(`
        SELECT p.id, p.nombre FROM participantes p
        WHERE p.id != $1 AND p.id NOT IN (
          SELECT asignado_a_id FROM participantes WHERE asignado_a_id IS NOT NULL
        )
      `, [user.id]);

      if (candidatos.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'No hay candidatos disponibles' });
      }

      const elegido = candidatos.rows[Math.floor(Math.random() * candidatos.rows.length)];

      await pool.query(
        'UPDATE participantes SET asignado_a_id = $1, sorteado_en = NOW() WHERE id = $2',
        [elegido.id, user.id]
      );

      const stats = await pool.query('SELECT COUNT(*) as total FROM participantes WHERE asignado_a_id IS NOT NULL');
      
      return res.status(200).json({
        success: true,
        usuario: nombre,
        elegido: elegido.nombre,
        totalSorteos: parseInt(stats.rows[0].total),
        totalParticipantes: 11
      });
    }

    // REINICIAR
    if (action === 'reiniciar') {
      const { password } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }

      await pool.query('UPDATE participantes SET asignado_a_id = NULL, sorteado_en = NULL');
      
      return res.status(200).json({ success: true, message: 'Sorteo reiniciado' });
    }

    // RESULTADOS
    if (action === 'resultados') {
      const { password } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Contraseña incorrecta' });
      }

      const result = await pool.query(`
        SELECT p.nombre as participante, asignado.nombre as asignado_a, p.sorteado_en
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        WHERE p.asignado_a_id IS NOT NULL
        ORDER BY p.sorteado_en
      `);

      return res.status(200).json({ success: true, resultados: result.rows });
    }

    return res.status(400).json({ success: false, error: 'Acción no reconocida' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno',
      details: error.message
    });
  }
};