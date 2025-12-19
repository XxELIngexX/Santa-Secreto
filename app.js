// Generar nieve
for (let i = 0; i < 50; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.innerHTML = '❄';
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
    snowflake.style.animationDelay = Math.random() * 5 + 's';
    snowflake.style.fontSize = Math.random() * 1 + 0.5 + 'em';
    document.body.appendChild(snowflake);
}

// Base de datos inicial
const todosLosParticipantes = ['Cesar', 'Ana', 'Santiago', 'Oscar', 'Anyelo', 'Yolima'];

// Función para obtener participantes que aún NO han sorteado
function obtenerParticipantesRestantes() {
    const yaHicieronSorteo = JSON.parse(localStorage.getItem('santaSecretoYaHicieron') || '[]');
    return todosLosParticipantes.filter(p => !yaHicieronSorteo.includes(p));
}

// Función para obtener disponibles (los que pueden ser elegidos)
function obtenerDisponibles() {
    const yaFueronElegidos = JSON.parse(localStorage.getItem('santaSecretoYaElegidos') || '[]');
    return todosLosParticipantes.filter(p => !yaFueronElegidos.includes(p));
}

// Función para inicializar el sistema
function inicializarSorteo() {
    // Verificar si ya existe un sorteo en progreso
    const yaHicieron = localStorage.getItem('santaSecretoYaHicieron');
    
    if (!yaHicieron) {
        // Inicializar listas vacías
        localStorage.setItem('santaSecretoYaHicieron', JSON.stringify([]));
        localStorage.setItem('santaSecretoYaElegidos', JSON.stringify([]));
        localStorage.setItem('santaSecretoResultados', JSON.stringify({}));
        console.log('Sistema inicializado');
    } else {
        console.log('Sorteo en progreso cargado');
    }
}

// Inicializar al cargar la página
inicializarSorteo();

let amigoAsignado = '';

function realizarSorteo() {
    const select = document.getElementById('participante');
    const resultado = document.getElementById('resultado');
    const amigoSecreto = document.getElementById('amigoSecreto');
    
    if (select.value === '') {
        alert('⚠️ Por favor selecciona tu nombre primero');
        return;
    }
    
    const tuNombre = select.value;
    
    // Verificar si esta persona ya hizo el sorteo
    const yaHicieron = JSON.parse(localStorage.getItem('santaSecretoYaHicieron') || '[]');
    
    if (yaHicieron.includes(tuNombre)) {
        // Ya hizo el sorteo, mostrar su resultado guardado
        const resultados = JSON.parse(localStorage.getItem('santaSecretoResultados') || '{}');
        amigoAsignado = resultados[tuNombre];
        
        amigoSecreto.textContent = amigoAsignado;
        resultado.style.display = 'block';
        
        alert('ℹ️ Ya habías realizado tu sorteo. Este es tu resultado guardado.');
        return;
    }
    
    // Obtener lista de disponibles para ser elegidos
    let disponibles = obtenerDisponibles();
    
    // Filtrar para que no te toque a ti mismo
    disponibles = disponibles.filter(p => p !== tuNombre);
    
    if (disponibles.length === 0) {
        alert('⚠️ Ya no hay personas disponibles para el sorteo. Solo quedas tú.');
        return;
    }
    
    // Seleccionar aleatoriamente
    const indiceAleatorio = Math.floor(Math.random() * disponibles.length);
    amigoAsignado = disponibles[indiceAleatorio];
    
    // Guardar resultado
    const resultados = JSON.parse(localStorage.getItem('santaSecretoResultados') || '{}');
    resultados[tuNombre] = amigoAsignado;
    localStorage.setItem('santaSecretoResultados', JSON.stringify(resultados));
    
    // Eliminar a la persona elegida de disponibles
    const yaElegidos = JSON.parse(localStorage.getItem('santaSecretoYaElegidos') || '[]');
    yaElegidos.push(amigoAsignado);
    localStorage.setItem('santaSecretoYaElegidos', JSON.stringify(yaElegidos));
    
    // Eliminar a quien hizo el sorteo de participantes
    yaHicieron.push(tuNombre);
    localStorage.setItem('santaSecretoYaHicieron', JSON.stringify(yaHicieron));
    
    // Animación del regalo
    const giftIcon = document.querySelector('.gift-icon');
    giftIcon.style.animation = 'none';
    setTimeout(() => {
        giftIcon.style.animation = 'bounce 2s ease-in-out infinite';
    }, 10);
    
    // Mostrar resultado con efecto
    setTimeout(() => {
        amigoSecreto.textContent = amigoAsignado;
        resultado.style.display = 'block';
    }, 500);
    
    console.log(`Participantes restantes: ${obtenerParticipantesRestantes().join(', ')}`);
    console.log(`Disponibles para elegir: ${obtenerDisponibles().join(', ')}`);
}

function enviarWhatsApp() {
    const select = document.getElementById('participante');
    const tuNombre = select.value;
    
    if (!amigoAsignado) {
        alert('⚠️ Primero realiza el sorteo');
        return;
    }
    
    const mensaje = `🎅 ¡Hola! Soy ${tuNombre} y en el Santa Secreto me tocó regalar a: ${amigoAsignado} 🎁🎄`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
    
    window.open(urlWhatsApp, '_blank');
}

// Función para reiniciar el sorteo
function reiniciarSorteo() {
    if (confirm('⚠️ ¿Estás seguro? Esto borrará TODOS los sorteos y empezará desde cero')) {
        localStorage.removeItem('santaSecretoYaHicieron');
        localStorage.removeItem('santaSecretoYaElegidos');
        localStorage.removeItem('santaSecretoResultados');
        location.reload();
    }
}

// Función para ver el estado actual
function verEstado() {
    const resultados = JSON.parse(localStorage.getItem('santaSecretoResultados') || '{}');
    const participantesRestantes = obtenerParticipantesRestantes();
    const disponibles = obtenerDisponibles();
    
    console.log('=== ESTADO DEL SORTEO ===');
    console.log('\n📋 Sorteos realizados:');
    for (let persona in resultados) {
        console.log(`   ${persona} → regala a → ${resultados[persona]}`);
    }
    console.log(`\n👥 Participantes que AÚN NO han sorteado (${participantesRestantes.length}): ${participantesRestantes.join(', ') || 'Ninguno'}`);
    console.log(`\n🎯 Disponibles para ser elegidos (${disponibles.length}): ${disponibles.join(', ') || 'Ninguno'}`);
    console.log('\n========================');
}

console.log('💡 Comandos disponibles en consola:');
console.log('   - verEstado() : Ver quién ha hecho sorteo y quiénes quedan disponibles');
console.log('   - reiniciarSorteo() : Empezar sorteo desde cero');