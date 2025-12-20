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

// URL de la API - DEBE APUNTAR A TU API EN VERCELL
// En producción: '/api/sorteo'
// En desarrollo local: 'http://localhost:3000/api/sorteo'
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/sorteo'
    : '/api/sorteo';

let amigoAsignado = '';
let nombreUsuario = '';

// ============================================
// FUNCIONES PRINCIPALES (ACTUALIZADAS PARA BD)
// ============================================

// Cargar participantes desde la base de datos
async function cargarParticipantes() {
    try {
        const select = document.getElementById('participante');
        if (!select) return;
        
        const response = await fetch(`${API_URL}?action=estado`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error cargando participantes:', data.error);
            return;
        }
        
        select.innerHTML = '<option value="">-- Elige tu nombre --</option>';
        
        data.participantes.forEach(participante => {
            const option = document.createElement('option');
            option.value = participante.nombre;
            option.textContent = participante.nombre;
            
            // Deshabilitar si ya sorteó
            if (participante.asignado_a_id) {
                option.disabled = true;
                option.textContent += ' (✅ Ya sorteó)';
            }
            
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando participantes:', error);
        alert('Error al cargar la lista de participantes. Recarga la página.');
    }
}

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
            if (data.yaSorteado) {
                // Si ya sorteó, mostrar resultado pero no permitir nuevo sorteo
                alert(`Ya sorteaste. Te tocó regalar a: ${data.asignadoA}`);
                nombreUsuario = nombre;
                amigoAsignado = data.asignadoA;
                
                // Mostrar resultado
                amigoSecreto.textContent = amigoAsignado;
                resultado.style.display = 'block';
                
                // Deshabilitar controles
                select.disabled = true;
                boton.disabled = true;
                boton.textContent = '✅ Ya sorteador';
            } else {
                alert('❌ ' + data.error);
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
        if (giftIcon) {
            giftIcon.style.animation = 'none';
            setTimeout(() => {
                giftIcon.style.animation = 'bounce 2s ease-in-out infinite';
            }, 10);
        }
        
        // Mostrar resultado con efecto
        setTimeout(() => {
            amigoSecreto.textContent = amigoAsignado;
            resultado.style.display = 'block';
        }, 500);
        
        console.log(`✅ ${nombreUsuario} le regalará a ${amigoAsignado}`);
        console.log(`Total sorteos: ${data.totalSorteos}/${data.totalParticipantes}`);
        
        // Deshabilitar select y botón
        select.disabled = true;
        boton.disabled = true;
        boton.textContent = '✅ Sorteo Realizado';
        
        // Recargar lista de participantes
        cargarParticipantes();
        actualizarEstado();
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión. Intenta de nuevo.');
        boton.disabled = false;
        boton.textContent = '🎲 Realizar Sorteo';
    }
}

// ============================================
// FUNCIONES DE WISHLIST (NUEVAS)
// ============================================

async function añadirWishlist() {
    const nombre = document.getElementById('wishlist-nombre')?.value;
    const descripcion = document.getElementById('wishlist-descripcion')?.value;
    const categoria = document.getElementById('wishlist-categoria')?.value;
    const precio = document.getElementById('wishlist-precio')?.value;
    
    if (!nombre || !descripcion) {
        alert('⚠️ Nombre y descripción son obligatorios');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'añadir-wishlist',
                nombre: nombre,
                descripcion: descripcion,
                categoria: categoria || null,
                precio: precio || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Regalo añadido a tu wishlist');
            // Limpiar formulario
            document.getElementById('wishlist-descripcion').value = '';
            document.getElementById('wishlist-categoria').value = '';
            document.getElementById('wishlist-precio').value = '';
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al añadir wishlist');
    }
}

async function verWishlist() {
    if (!nombreUsuario) {
        alert('⚠️ Primero realiza el sorteo');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?action=ver-wishlist&nombre=${encodeURIComponent(nombreUsuario)}`);
        const data = await response.json();
        
        if (data.success) {
            const wishlistDiv = document.getElementById('lista-wishlist');
            if (!wishlistDiv) return;
            
            wishlistDiv.innerHTML = '';
            
            if (data.wishlist.length === 0) {
                wishlistDiv.innerHTML = '<p>😢 Esta persona no ha añadido wishlist aún</p>';
            } else {
                data.wishlist.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'wishlist-item';
                    itemDiv.innerHTML = `
                        <strong>${item.descripcion}</strong>
                        ${item.categoria ? `<br><small>Categoría: ${item.categoria}</small>` : ''}
                        ${item.precio_estimado ? `<br><small>Precio estimado: $${item.precio_estimado}</small>` : ''}
                        <br><small>Prioridad: ${'★'.repeat(4 - item.prioridad)}</small>
                    `;
                    wishlistDiv.appendChild(itemDiv);
                });
            }
            
            // Cambiar a pestaña de wishlist
            openTab('wishlist');
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cargar wishlist');
    }
}

// ============================================
// FUNCIONES DE ESTADO (ACTUALIZADAS PARA BD)
// ============================================

async function actualizarEstado() {
    try {
        const response = await fetch(`${API_URL}?action=estado`);
        const data = await response.json();
        
        if (!data.success) return;
        
        // Actualizar estadísticas
        const totalParticipantes = document.getElementById('total-participantes');
        const yaSortearon = document.getElementById('ya-sortearon');
        const restantes = document.getElementById('restantes');
        
        if (totalParticipantes) totalParticipantes.textContent = data.totalParticipantes;
        if (yaSortearon) yaSortearon.textContent = data.totalSorteos;
        if (restantes) restantes.textContent = data.totalParticipantes - data.totalSorteos;
        
        // Actualizar listas
        const disponiblesList = document.getElementById('lista-disponibles');
        const yaSortearonList = document.getElementById('lista-ya-sortearon');
        
        if (disponiblesList) {
            disponiblesList.innerHTML = '';
            data.disponibles.forEach(nombre => {
                const li = document.createElement('li');
                li.textContent = nombre;
                disponiblesList.appendChild(li);
            });
        }
        
        if (yaSortearonList) {
            yaSortearonList.innerHTML = '';
            data.yaHicieron.forEach(nombre => {
                const li = document.createElement('li');
                li.textContent = nombre;
                yaSortearonList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error actualizando estado:', error);
    }
}

// ============================================
// FUNCIONES DE PESTAÑAS
// ============================================

function openTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const tabElement = document.getElementById(`${tabName}-tab`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Actualizar botones activos
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Si es la pestaña de estado, actualizar datos
    if (tabName === 'estado') {
        actualizarEstado();
    }
}

// ============================================
// FUNCIONES EXISTENTES (MANTENER)
// ============================================

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
// FUNCIONES DE ADMINISTRACIÓN (ACTUALIZADAS)
// ============================================

async function verEstadoAdmin() {
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
            data.resultados.forEach(resultado => {
                console.log(`${resultado.participante} → ${resultado.asignado_a} (${resultado.sorteado_en})`);
            });
            console.log('=======================================');
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar participantes al iniciar
    cargarParticipantes();
    actualizarEstado();
    
    // Configurar console helpers
    console.log('💡 Comandos disponibles en consola:');
    console.log('   - verEstadoAdmin() : Ver el estado del sorteo');
    console.log('   - reiniciarSorteo() : Reiniciar sorteo (password: FelizNavidad)');
    console.log('   - verResultados() : Ver TODOS los resultados [SPOILERS] (password: FelizNavidad)');
    
    // Si hay parámetros en la URL, abrir la pestaña correspondiente
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['sorteo', 'wishlist', 'estado'].includes(tabParam)) {
        openTab(tabParam);
        // También actualizar el botón activo
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            if (button.textContent.includes(tabParam.charAt(0).toUpperCase() + tabParam.slice(1))) {
                button.classList.add('active');
            }
        });
    }
});

// Exportar funciones para consola (solo desarrollo)
if (typeof window !== 'undefined') {
    window.verEstadoAdmin = verEstadoAdmin;
    window.reiniciarSorteo = reiniciarSorteo;
    window.verResultados = verResultados;
    window.cargarParticipantes = cargarParticipantes;
    window.actualizarEstado = actualizarEstado;
}