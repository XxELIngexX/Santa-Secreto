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

// URL de la API
const API_URL = '/api/sorteo';

let amigoAsignado = '';
let nombreUsuario = '';

async function realizarSorteo() {
    const select = document.getElementById('participante');
    const resultado = document.getElementById('resultado');
    const amigoSecreto = document.getElementById('amigoSecreto');
    const boton = document.querySelector('.button');
    
    const nombre = select.value;
    
    if (nombre === '') {
        alert('⚠️ Por favor selecciona tu nombre');
        return;
    }
    
    // Deshabilitar botón mientras procesa
    boton.disabled = true;
    boton.textContent = '⏳ Procesando...';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'sortear',
                nombre: nombre
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert('❌ ' + data.error);
            
            // Si ya sorteó, mostrar su resultado
            if (data.resultado) {
                nombreUsuario = nombre;
                amigoAsignado = data.resultado;
                amigoSecreto.textContent = amigoAsignado;
                resultado.style.display = 'block';
                select.disabled = true;
                boton.disabled = true;
                boton.textContent = '✅ Ya Sorteaste';
            } else {
                boton.disabled = false;
                boton.textContent = '🎲 Realizar Sorteo';
            }
            return;
        }
        
        // Éxito!
        nombreUsuario = data.usuario;
        amigoAsignado = data.elegido;
        
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
        
        console.log(`✅ ${nombreUsuario} le regalará a ${amigoAsignado}`);
        console.log(`Participantes restantes: ${data.participantesRestantes}`);
        console.log(`Disponibles restantes: ${data.disponiblesRestantes}`);
        
        // Deshabilitar select y botón
        select.disabled = true;
        boton.disabled = true;
        boton.textContent = '✅ Sorteo Realizado';
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión. Intenta de nuevo.');
        boton.disabled = false;
        boton.textContent = '🎲 Realizar Sorteo';
    }
}

function enviarWhatsApp() {
    if (!amigoAsignado || !nombreUsuario) {
        alert('⚠️ Primero realiza el sorteo');
        return;
    }
    
    const mensaje = `🎅 ¡Hola! Soy ${nombreUsuario} y en el Santa Secreto me tocó regalar a: ${amigoAsignado} 🎁🎄`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
    
    window.open(urlWhatsApp, '_blank');
}

// ============================================
// FUNCIONES DE ADMINISTRACIÓN (CONSOLA)
// ============================================

async function verEstado() {
    try {
        const response = await fetch(`${API_URL}?action=estado`);
        const data = await response.json();
        
        console.log('=== ESTADO DEL SORTEO ===');
        console.log(`\n📊 Sorteos realizados: ${data.totalSorteos}/${data.totalParticipantes}`);
        console.log(`\n👥 Ya sortearon: ${data.yaHicieron.join(', ') || 'Nadie'}`);
        console.log(`\n🎯 Personas ya elegidas: ${data.personasElegidas.join(', ') || 'Nadie'}`);
        console.log(`\n✅ Aún disponibles: ${data.disponibles.join(', ') || 'Nadie'}`);
        console.log('\n========================');
    } catch (error) {
        console.error('Error al obtener estado:', error);
    }
}

async function reiniciarSorteo() {
    const password = prompt('⚠️ Contraseña de administrador:');
    
    if (!password) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'reiniciar',
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Sorteo reiniciado exitosamente');
            location.reload();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

async function verResultados() {
    const password = prompt('⚠️ Contraseña de administrador (SPOILERS):');
    
    if (!password) return;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'resultados',
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('=== RESULTADOS COMPLETOS (SPOILERS) ===');
            for (let persona in data.resultados) {
                console.log(`${persona} → ${data.resultados[persona]}`);
            }
            console.log('=======================================');
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

console.log('💡 Comandos disponibles en consola:');
console.log('   - verEstado() : Ver el estado del sorteo');
console.log('   - reiniciarSorteo() : Reiniciar sorteo (password: admin123)');
console.log('   - verResultados() : Ver TODOS los resultados [SPOILERS] (password: admin123)');