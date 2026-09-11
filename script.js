// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Navbar color change on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 14, 23, 0.98)';
    } else {
        navbar.style.background = 'rgba(15, 14, 23, 0.95)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards for animation
document.querySelectorAll('.exp-card, .achievement-card, .interest-card, .stat-box').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Skill tag hover effect
document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    tag.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Terminal typing effect simulation
const terminalText = document.querySelector('.typing');
if (terminalText) {
    const originalText = terminalText.textContent;
    let index = 0;
    
    setInterval(() => {
        if (index < originalText.length) {
            terminalText.textContent = originalText.substring(0, index + 1) + '|';
            index++;
        } else {
            index = 0;
        }
    }, 100);
}

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Add active class styling
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        color: var(--primary);
    }
`;
document.head.appendChild(style);

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const floatingElements = document.querySelectorAll('.float-item');
    
    floatingElements.forEach((element, index) => {
        element.style.transform = `translateY(${scrollPosition * 0.5 * (index + 1)}px)`;
    });
});

// Add ripple effect to buttons
document.querySelectorAll('.btn, .contact-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Ripple animation styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn, .contact-btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Experience card stagger animation
const expCards = document.querySelectorAll('.exp-card');
expCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
});

// Console message for fun
console.log('%c🚀 Welcome to Kamaya Gogna\'s Portfolio!', 'color: #00d4ff; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with passion for engineering and innovation', 'color: #8338ec; font-size: 14px;');
console.log('%cInterested in collaborating? Drop me an email!', 'color: #ff006e; font-size: 14px;');

// Lazy load images if any
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// Random emoji animation on page load
const emojis = ['⚡', '🤖', '💡', '🚀', '⚙️', '🔧', '💻'];
function randomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// Animate terminal on load
window.addEventListener('load', () => {
    const terminalResponses = document.querySelectorAll('.terminal-response');
    terminalResponses.forEach((response, index) => {
        response.style.opacity = '0';
        response.style.animation = `slideInLeft 0.5s ease forwards`;
        response.style.animationDelay = `${index * 0.2}s`;
    });
});

// Add keyboard shortcut for easter egg
let secretCode = '';
document.addEventListener('keydown', (e) => {
    secretCode += e.key.toLowerCase();
    
    if (secretCode.includes('hello')) {
        alert('👋 Hello! Thanks for visiting my portfolio!');
        secretCode = '';
    }
    
    if (secretCode.length > 20) {
        secretCode = secretCode.slice(-20);
    }
});
