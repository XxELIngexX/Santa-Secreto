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

// Base de datos de participantes
const participantes = ['Cesar', 'Ana', 'Santiago', 'Oscar', 'Anyelo', 'Yolima'];

// Asignaciones fijas del sorteo
let asignaciones = {};

// Función para generar el sorteo de manera justa (cadena cerrada)
function generarSorteo() {
    // Crear una copia y mezclar aleatoriamente
    let mezclados = [...participantes];
    
    // Algoritmo Fisher-Yates para mezclar
    for (let i = mezclados.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]];
    }
    
    // Crear cadena: cada persona le regala a la siguiente
    asignaciones = {};
    let esValido = true;
    
    for (let i = 0; i < participantes.length; i++) {
        let persona = participantes[i];
        let siguiente = mezclados[(i + 1) % mezclados.length];
        
        // Verificar que no se regale a sí mismo
        if (persona === siguiente) {
            esValido = false;
            break;
        }
        
        asignaciones[persona] = siguiente;
    }
    
    // Si alguien se regaló a sí mismo, reintentar
    if (!esValido) {
        return generarSorteo();
    }
    
    return asignaciones;
}

// Cargar o generar el sorteo
function inicializarSorteo() {
    // Intentar cargar sorteo guardado
    const sorteoGuardado = localStorage.getItem('santaSecretoSorteo');
    const yaVieron = localStorage.getItem('santaSecretoVistos');
    
    if (sorteoGuardado) {
        asignaciones = JSON.parse(sorteoGuardado);
        console.log('Sorteo cargado desde almacenamiento');
    } else {
        // Generar nuevo sorteo
        generarSorteo();
        // Guardar en localStorage para que persista
        localStorage.setItem('santaSecretoSorteo', JSON.stringify(asignaciones));
        localStorage.setItem('santaSecretoVistos', JSON.stringify({}));
        console.log('Nuevo sorteo generado y guardado');
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
    
    // Verificar si esta persona ya vio su resultado
    const yaVieron = JSON.parse(localStorage.getItem('santaSecretoVistos') || '{}');
    
    if (yaVieron[select.value]) {
        if (!confirm('⚠️ Ya consultaste tu Santa Secreto. ¿Quieres verlo nuevamente?')) {
            return;
        }
    }
    
    // Obtener la asignación del participante
    amigoAsignado = asignaciones[select.value];
    
    // Marcar como visto
    yaVieron[select.value] = true;
    localStorage.setItem('santaSecretoVistos', JSON.stringify(yaVieron));
    
    // Animación del regalo girando
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

// Función para reiniciar el sorteo (útil para testing)
// Escribe en la consola: reiniciarSorteo()
function reiniciarSorteo() {
    if (confirm('⚠️ ¿Estás seguro? Esto borrará el sorteo actual y generará uno nuevo')) {
        localStorage.removeItem('santaSecretoSorteo');
        localStorage.removeItem('santaSecretoVistos');
        location.reload();
    }
}

// Función para ver todas las asignaciones (solo para admin/debug)
// Escribe en la consola: verTodasAsignaciones()
function verTodasAsignaciones() {
    console.log('=== ASIGNACIONES DEL SORTEO ===');
    for (let persona in asignaciones) {
        console.log(`${persona} → ${asignaciones[persona]}`);
    }
    console.log('================================');
}

console.log('💡 Comandos disponibles en consola:');
console.log('   - reiniciarSorteo() : Genera un nuevo sorteo');
console.log('   - verTodasAsignaciones() : Muestra todas las parejas (¡cuidado, spoilers!)');