// Vercel Serverless Function para manejar el sorteo
// Ahora sin códigos - solo por nombre

const TODOS_PARTICIPANTES = ['Cesar', 'Oscar','Miryam', 'Sammuel', 'Ana', 'Anyelo', 'Yolima', 'Ginna', 'Santiago', 'Margi','Brayan'];
// Simulación de persistencia en memoria
// En producción real, usar una DB
let sorteoData = {
    yaHicieronSorteo: [],   // Nombres de quienes ya sortearon
    personasElegidas: [],   // Nombres de quienes ya fueron elegidos
    resultados: {}          // { nombre: persona_elegida }
};

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action, nombre } = req.method === 'POST' ? req.body : req.query;

    // Acción: Ver estado del sorteo
    if (action === 'estado') {
        return res.status(200).json({
            success: true,
            yaHicieron: sorteoData.yaHicieronSorteo,
            personasElegidas: sorteoData.personasElegidas,
            disponibles: TODOS_PARTICIPANTES.filter(p => !sorteoData.personasElegidas.includes(p)),
            totalSorteos: sorteoData.yaHicieronSorteo.length,
            totalParticipantes: TODOS_PARTICIPANTES.length
        });
    }

    // Acción: Realizar sorteo
    if (action === 'sortear') {
        const nombreLimpio = nombre?.trim();

        // Validar nombre
        if (!nombreLimpio) {
            return res.status(400).json({
                success: false,
                error: 'Nombre vacío'
            });
        }

        if (!TODOS_PARTICIPANTES.includes(nombreLimpio)) {
            return res.status(400).json({
                success: false,
                error: 'Nombre no válido'
            });
        }

        // Verificar si ya sorteó
        if (sorteoData.yaHicieronSorteo.includes(nombreLimpio)) {
            return res.status(400).json({
                success: false,
                error: 'Ya realizaste tu sorteo. Si olvidaste quién te salió, revisa tu mensaje de WhatsApp.'
            });
        }

        // Obtener disponibles (excluir al usuario mismo y a los ya elegidos)
        let disponibles = TODOS_PARTICIPANTES.filter(p => 
            !sorteoData.personasElegidas.includes(p) && p !== nombreLimpio
        );

        if (disponibles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay personas disponibles para sortear'
            });
        }

        // Seleccionar aleatoriamente
        const indice = Math.floor(Math.random() * disponibles.length);
        const elegido = disponibles[indice];

        // Guardar datos
        sorteoData.yaHicieronSorteo.push(nombreLimpio);
        sorteoData.personasElegidas.push(elegido);
        sorteoData.resultados[nombreLimpio] = elegido;

        return res.status(200).json({
            success: true,
            usuario: nombreLimpio,
            elegido: elegido,
            disponiblesRestantes: TODOS_PARTICIPANTES.filter(p => !sorteoData.personasElegidas.includes(p)).length,
            participantesRestantes: TODOS_PARTICIPANTES.filter(p => !sorteoData.yaHicieronSorteo.includes(p)).length
        });
    }

    // Acción: Reiniciar sorteo (solo admin)
    if (action === 'reiniciar') {
        const password = req.body?.password || req.query?.password;
        
        // Contraseña de admin
        if (password !== 'FelizNavidad') {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        sorteoData = {
            yaHicieronSorteo: [],
            personasElegidas: [],
            resultados: {}
        };

        return res.status(200).json({
            success: true,
            message: 'Sorteo reiniciado correctamente'
        });
    }

    // Acción: Ver resultados (solo admin)
    if (action === 'resultados') {
        const password = req.body?.password || req.query?.password;
        
        if (password !== 'FelizNavidad') {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        return res.status(200).json({
            success: true,
            resultados: sorteoData.resultados,
            yaHicieron: sorteoData.yaHicieronSorteo,
            personasElegidas: sorteoData.personasElegidas
        });
    }

    return res.status(400).json({
        success: false,
        error: 'Acción no válida'
    });
}