// --- COSMIC DODGE GAME LOGIC ---

// We wrap the game in an Immediately Invoked Function Expression (IIFE)
// to keep variables isolated from your main script.js
const GameSystem = (() => {
    // DOM Elements
    const modal = document.getElementById('game-modal');
    const startBtn = document.getElementById('start-game-btn');
    const closeBtn = document.getElementById('close-game-btn');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const scoreEl = document.getElementById('game-score');
    const finalScoreEl = document.getElementById('final-score');
    const startScreen = document.getElementById('game-start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const playBtn = document.getElementById('play-btn');
    const restartBtn = document.getElementById('restart-btn');

    if (!canvas || !modal) return; // Stop if game elements aren't found

    // Game State
    let animationId;
    let score = 0;
    let gameActive = false;
    let frameCount = 0;
    
    // Canvas Dimensions
    let width = 800;
    let height = 600;

    // Player Object
    const player = {
        x: width / 2,
        y: height - 100,
        size: 20, // Radius
        color: '#4D4FFF', // Cosmic Blue
        trail: []
    };

    // Obstacles Array
    let asteroids = [];
    const asteroidColors = ['#F080F0', '#FFD700', '#aaaaaa', '#ff5555']; // Pink, Yellow, Gray, Red

    // Mouse Tracking
    let mouseX = width / 2;
    let mouseY = height - 100;

    // --- HELPER FUNCTIONS ---

    function resizeGame() {
        // Scale canvas to fit screen, maxing at 800x600
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.8;
        
        width = Math.min(800, maxWidth);
        height = Math.min(600, maxHeight);
        
        canvas.width = width;
        canvas.height = height;
        
        // Reset player position if resize happens while inactive
        if(!gameActive) {
            player.x = width / 2;
            player.y = height - 100;
        }
    }

    // --- GAME LOOP FUNCTIONS ---

    function spawnAsteroid() {
        const size = Math.random() * 25 + 10;
        const x = Math.random() * (width - size);
        // Speed increases slightly as score goes up
        const speed = Math.random() * 3 + 2 + (score * 0.005); 
        
        asteroids.push({
            x: x,
            y: -size, // Start above the canvas
            size: size,
            speed: speed,
            color: asteroidColors[Math.floor(Math.random() * asteroidColors.length)],
            rotation: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    function update() {
        if (!gameActive) return;

        // Increase score
        score++;
        scoreEl.innerText = Math.floor(score / 10); 

        // Move Player towards mouse (Lerp for smooth movement)
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        player.x += dx * 0.15;
        player.y += dy * 0.15;

        // Boundary checks for player
        if (player.x < player.size) player.x = player.size;
        if (player.x > width - player.size) player.x = width - player.size;
        if (player.y < player.size) player.y = player.size;
        if (player.y > height - player.size) player.y = height - player.size;

        // Create Player Trail (Engine exhaust)
        if (frameCount % 3 === 0) {
            player.trail.push({ x: player.x, y: player.y + 15, radius: player.size/2, alpha: 1 });
        }
        
        // Update trail particles
        for (let i = player.trail.length - 1; i >= 0; i--) {
            const p = player.trail[i];
            p.y += 2; // Move down
            p.alpha -= 0.05; // Fade out
            if (p.alpha <= 0) player.trail.splice(i, 1);
        }

        // Spawn Asteroids logic (spawn faster as score increases)
        let spawnRate = 45; 
        if(score > 500) spawnRate = 35;
        if(score > 1000) spawnRate = 25;
        if(score > 2000) spawnRate = 15;

        if (frameCount % spawnRate === 0) {
            spawnAsteroid();
        }

        // Update Asteroids & Collision Detection
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const ast = asteroids[i];
            ast.y += ast.speed;
            ast.rotation += ast.rotSpeed;

            // Remove off-screen asteroids
            if (ast.y > height + ast.size) {
                asteroids.splice(i, 1);
                continue;
            }

            // CIRCLE COLLISION DETECTION
            const dist = Math.hypot(player.x - ast.x, player.y - ast.y);
            
            // If distance < sum of radii, we crashed
            if (dist < player.size + ast.size - 5) { 
                endGame();
                return; 
            }
        }

        frameCount++;
    }

    function draw() {
        if (!gameActive) return;

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

        // Draw Trail
        player.trail.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(77, 79, 255, ${p.alpha})`;
            ctx.fill();
        });

        // Draw Player (Spaceship)
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.beginPath();
        ctx.moveTo(0, -player.size); // Tip
        ctx.lineTo(player.size, player.size); // Bottom Right
        ctx.lineTo(0, player.size * 0.5); // Bottom Center (Engine)
        ctx.lineTo(-player.size, player.size); // Bottom Left
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
        ctx.fill();
        ctx.restore();

        // Draw Asteroids
        asteroids.forEach(ast => {
            ctx.save();
            ctx.translate(ast.x, ast.y);
            ctx.rotate(ast.rotation);
            ctx.beginPath();
            const sides = 6;
            ctx.moveTo(ast.size * Math.cos(0), ast.size * Math.sin(0));
            for (let j = 1; j <= sides; j++) {
                ctx.lineTo(ast.size * Math.cos(j * 2 * Math.PI / sides), ast.size * Math.sin(j * 2 * Math.PI / sides));
            }
            ctx.closePath();
            ctx.fillStyle = ast.color;
            ctx.fill();
            
            // Add a crater detail
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(ast.size/3, -ast.size/4, ast.size/4, 0, Math.PI*2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    function gameLoop() {
        if (!gameActive) return;
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        // Reset Variables
        score = 0;
        frameCount = 0;
        asteroids = [];
        player.trail = [];
        resizeGame(); // Recalculate size and initial position
        player.x = width / 2;
        player.y = height - 100;
        mouseX = width / 2;
        mouseY = height - 100;
        
        // UI Updates
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        scoreEl.innerText = '0';
        
        gameActive = true;
        gameLoop();
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(animationId);
        finalScoreEl.innerText = Math.floor(score / 10);
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('flex'); 
    }

    // --- EVENT LISTENERS ---

    // Open Modal
    if(startBtn) {
        startBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('modal-visible');
                resizeGame();
            }, 10);
        });
    }

    // Close Modal
    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            gameActive = false;
            modal.classList.remove('modal-visible');
            setTimeout(() => {
                modal.classList.add('hidden');
                startScreen.classList.remove('hidden');
                gameOverScreen.classList.add('hidden');
                gameOverScreen.classList.remove('flex');
            }, 500);
        });
    }

    // Controls (Mouse)
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    // Controls (Touch)
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
    }, { passive: false });

    playBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    window.addEventListener('resize', resizeGame);

})();
