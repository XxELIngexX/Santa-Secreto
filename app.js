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

// Base de datos de participantes (los que pueden consultar)
const participantes = ['Cesar', 'Ana', 'Santiago', 'Oscar', 'Anyelo', 'Yolima'];

// Función para obtener disponibles (los que aún pueden ser elegidos)
function obtenerDisponibles() {
    const yaAsignados = JSON.parse(localStorage.getItem('santaSecretoAsignados') || '[]');
    return participantes.filter(p => !yaAsignados.includes(p));
}

// Función para inicializar el sistema
function inicializarSorteo() {
    // Verificar si ya existe un sorteo en progreso
    const asignados = localStorage.getItem('santaSecretoAsignados');
    
    if (!asignados) {
        // Inicializar lista vacía de asignados
        localStorage.setItem('santaSecretoAsignados', JSON.stringify([]));
        localStorage.setItem('santaSecretoResultados', JSON.stringify({}));
        console.log('Sistema inicializado - Listo para sorteo');
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
    const resultados = JSON.parse(localStorage.getItem('santaSecretoResultados') || '{}');
    
    if (resultados[tuNombre]) {
        // Ya hizo el sorteo, mostrar su resultado guardado
        amigoAsignado = resultados[tuNombre];
        
        // Mostrar resultado
        amigoSecreto.textContent = amigoAsignado;
        resultado.style.display = 'block';
        
        alert('ℹ️ Ya habías realizado tu sorteo. Este es tu resultado guardado.');
        return;
    }
    
    // Obtener lista de disponibles
    let disponibles = obtenerDisponibles();
    
    // Filtrar para que no te toque a ti mismo
    disponibles = disponibles.filter(p => p !== tuNombre);
    
    if (disponibles.length === 0) {
        alert('⚠️ Ya no hay personas disponibles para el sorteo');
        return;
    }
    
    // Seleccionar aleatoriamente
    const indiceAleatorio = Math.floor(Math.random() * disponibles.length);
    amigoAsignado = disponibles[indiceAleatorio];
    
    // Guardar resultado
    resultados[tuNombre] = amigoAsignado;
    localStorage.setItem('santaSecretoResultados', JSON.stringify(resultados));
    
    // Marcar como asignado
    const yaAsignados = JSON.parse(localStorage.getItem('santaSecretoAsignados') || '[]');
    yaAsignados.push(amigoAsignado);
    localStorage.setItem('santaSecretoAsignados', JSON.stringify(yaAsignados));
    
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
    
    console.log(`Quedan ${obtenerDisponibles().length} personas disponibles`);
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

// Función para reiniciar el sorteo (útil para testing o nuevo año)
// Escribe en la consola: reiniciarSorteo()
function reiniciarSorteo() {
    if (confirm('⚠️ ¿Estás seguro? Esto borrará TODOS los sorteos y empezará desde cero')) {
        localStorage.removeItem('santaSecretoAsignados');
        localStorage.removeItem('santaSecretoResultados');
        location.reload();
    }
}

// Función para ver el estado actual
// Escribe en la consola: verEstado()
function verEstado() {
    const resultados = JSON.parse(localStorage.getItem('santaSecretoResultados') || '{}');
    const disponibles = obtenerDisponibles();
    
    console.log('=== ESTADO DEL SORTEO ===');
    console.log('\n📋 Sorteos realizados:');
    for (let persona in resultados) {
        console.log(`   ${persona} → ${resultados[persona]}`);
    }
    console.log(`\n✅ Total de sorteos: ${Object.keys(resultados).length}/${participantes.length}`);
    console.log(`\n🎯 Aún disponibles para ser elegidos: ${disponibles.join(', ')}`);
    console.log('\n========================');
}

console.log('💡 Comandos disponibles en consola:');
console.log('   - verEstado() : Ver quién ha hecho sorteo y quiénes están disponibles');
console.log('   - reiniciarSorteo() : Empezar sorteo desde cero');