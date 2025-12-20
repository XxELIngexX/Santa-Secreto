// api/sorteo.js - BACKEND COMPLETO
const { Pool } = require('pg');

// Configuración de PostgreSQL CON TU IP DE AWS
const pool = new Pool({
  host: process.env.DB_HOST || '34.204.168.184',
  database: process.env.DB_NAME || 'santasecreto',
  user: process.env.DB_USER || 'santa',
  password: process.env.DB_PASSWORD || 'secreto',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

// PASSWORD DE ADMIN
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FelizNavidad';

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extraer action de GET o POST
    const action = req.method === 'GET' ? req.query.action : req.body?.action;

    // ========================================
    // ACCIÓN: ESTADO
    // ========================================
    if (action === 'estado') {
      const participantesResult = await pool.query(`
        SELECT 
          p.id,
          p.nombre,
          p.asignado_a_id,
          p.sorteado_en,
          asignado.nombre as asignado_a_nombre
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        ORDER BY p.nombre
      `);

      const participantes = participantesResult.rows;
      const totalParticipantes = participantes.length;
      const totalSorteos = participantes.filter(p => p.asignado_a_id).length;

      const yaHicieron = participantes
        .filter(p => p.asignado_a_id)
        .map(p => p.nombre);

      const disponibles = participantes
        .filter(p => !p.asignado_a_id)
        .map(p => p.nombre);

      const personasElegidas = participantes
        .filter(p => p.asignado_a_id)
        .map(p => p.asignado_a_nombre);

      return res.status(200).json({
        success: true,
        participantes: participantes,
        totalParticipantes,
        totalSorteos,
        yaHicieron,
        disponibles,
        personasElegidas
      });
    }

    // ========================================
    // ACCIÓN: SORTEAR
    // ========================================
    if (action === 'sortear') {
      const { nombre } = req.body;

      if (!nombre) {
        return res.status(400).json({ success: false, error: 'Nombre requerido' });
      }

      // Verificar si el participante existe
      const participanteResult = await pool.query(
        'SELECT * FROM participantes WHERE nombre = $1',
        [nombre]
      );

      if (participanteResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Participante no encontrado' });
      }

      const participante = participanteResult.rows[0];

      // Verificar si ya sorteó
      if (participante.asignado_a_id) {
        const asignadoResult = await pool.query(
          'SELECT nombre FROM participantes WHERE id = $1',
          [participante.asignado_a_id]
        );
        
        return res.status(200).json({
          success: false,
          yaSorteado: true,
          asignadoA: asignadoResult.rows[0].nombre
        });
      }

      // Obtener candidatos disponibles (que no sean él mismo ni ya elegidos)
      const candidatosResult = await pool.query(`
        SELECT p.id, p.nombre
        FROM participantes p
        WHERE p.id != $1
        AND p.id NOT IN (
          SELECT asignado_a_id 
          FROM participantes 
          WHERE asignado_a_id IS NOT NULL
        )
      `, [participante.id]);

      const candidatos = candidatosResult.rows;

      if (candidatos.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay candidatos disponibles. Posiblemente todos ya fueron elegidos.'
        });
      }

      // Elegir aleatoriamente
      const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

      // Actualizar en la base de datos
      await pool.query(
        'UPDATE participantes SET asignado_a_id = $1, sorteado_en = NOW() WHERE id = $2',
        [elegido.id, participante.id]
      );

      // Obtener totales actualizados
      const totalResult = await pool.query(
        'SELECT COUNT(*) as total FROM participantes WHERE asignado_a_id IS NOT NULL'
      );
      const totalSorteos = parseInt(totalResult.rows[0].total);

      const totalParticipantesResult = await pool.query(
        'SELECT COUNT(*) as total FROM participantes'
      );
      const totalParticipantes = parseInt(totalParticipantesResult.rows[0].total);

      return res.status(200).json({
        success: true,
        usuario: nombre,
        elegido: elegido.nombre,
        totalSorteos,
        totalParticipantes
      });
    }

    // ========================================
    // ACCIÓN: AÑADIR WISHLIST
    // ========================================
    if (action === 'añadir-wishlist') {
      const { nombre, descripcion, categoria, precio } = req.body;

      if (!nombre || !descripcion) {
        return res.status(400).json({
          success: false,
          error: 'Nombre y descripción son requeridos'
        });
      }

      // Verificar que el participante existe
      const participanteResult = await pool.query(
        'SELECT id FROM participantes WHERE nombre = $1',
        [nombre]
      );

      if (participanteResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Participante no encontrado'
        });
      }

      const participanteId = participanteResult.rows[0].id;

      // Insertar wishlist
      await pool.query(`
        INSERT INTO wishlist (participante_id, descripcion, categoria, precio_estimado)
        VALUES ($1, $2, $3, $4)
      `, [participanteId, descripcion, categoria, precio]);

      return res.status(200).json({ success: true });
    }

    // ========================================
    // ACCIÓN: VER WISHLIST
    // ========================================
    if (action === 'ver-wishlist') {
      const { nombre } = req.query;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          error: 'Nombre requerido'
        });
      }

      // Obtener wishlist del participante
      const wishlistResult = await pool.query(`
        SELECT w.*
        FROM wishlist w
        JOIN participantes p ON w.participante_id = p.id
        WHERE p.nombre = $1
        ORDER BY w.prioridad, w.created_at
      `, [nombre]);

      return res.status(200).json({
        success: true,
        wishlist: wishlistResult.rows
      });
    }

    // ========================================
    // ACCIÓN: REINICIAR (ADMIN)
    // ========================================
    if (action === 'reiniciar') {
      const { password } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña incorrecta'
        });
      }

      // Reiniciar sorteos
      await pool.query('UPDATE participantes SET asignado_a_id = NULL, sorteado_en = NULL');
      await pool.query('DELETE FROM wishlist');

      return res.status(200).json({
        success: true,
        message: 'Sorteo reiniciado exitosamente'
      });
    }

    // ========================================
    // ACCIÓN: RESULTADOS (ADMIN)
    // ========================================
    if (action === 'resultados') {
      const { password } = req.body;

      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña incorrecta'
        });
      }

      const resultadosResult = await pool.query(`
        SELECT 
          p.nombre as participante,
          asignado.nombre as asignado_a,
          p.sorteado_en
        FROM participantes p
        LEFT JOIN participantes asignado ON p.asignado_a_id = asignado.id
        WHERE p.asignado_a_id IS NOT NULL
        ORDER BY p.sorteado_en
      `);

      return res.status(200).json({
        success: true,
        resultados: resultadosResult.rows
      });
    }

    // Acción no reconocida
    return res.status(400).json({
      success: false,
      error: 'Acción no reconocida'
    });

  } catch (error) {
    console.error('Error en API:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};