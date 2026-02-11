/**
 * Confetti Utility - For celebrating moments ✨
 */

export function celebrate() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#FFD1DC', '#E6E6FA', '#FFB7C5', '#F0E68C', '#98FB98'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        container.appendChild(confetti);
    }

    setTimeout(() => {
        document.body.removeChild(container);
    }, 4000);
}

// Add CSS for confetti
const style = document.createElement('style');
style.textContent = `
  .confetti-piece {
    position: absolute;
    top: -20px;
    width: 10px;
    height: 10px;
    background-color: var(--pink-300);
    border-radius: 2px;
    opacity: 0.8;
    animation: confetti-fall 3s ease-out forwards;
  }
  @keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;
document.head.appendChild(style);
