const botonLogin = document.getElementById('redirigirLogin');
const botonRegis = document.getElementById('redirigirRegis');

// Smooth scrolling and interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn, .cta-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });     
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Parallax effect for floating shapes
    document.addEventListener('mousemove', function(e) {
        const shapes = document.querySelectorAll('.shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;       
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 0.02;
            const xPos = (x - 0.5) * 20 * speed;
            const yPos = (y - 0.5) * 20 * speed;        
                shape.style.transform += ` translate(${xPos}px, ${yPos}px)`;
        });
    });
});

// Evento Login
botonLogin.addEventListener('click', () => {
    //const token_app = "5jF4pjqJX63KPEjDzmBR";
    const token_app = "5jF4pjqJX63KPEjDzmBR";
    const session = 1;

    // Construir URL con parámetros
    const url = `https://originalauth.com/login?token_app=${encodeURIComponent(token_app)}&session=${encodeURIComponent(session)}`;

    // Redireccionar
    window.location.href = url;
});

// Evento Registro
botonRegis.addEventListener('click', () => {
    const token_app = "5jF4pjqJX63KPEjDzmBR";
    const session = 1;

    // Contruir URL con los parametros
    const url = `https://originalauth.com/register?token_app=${encodeURIComponent(token_app)}&session=${encodeURIComponent(session)}`;

    // Redireccionar
    window.location.href = url;
})