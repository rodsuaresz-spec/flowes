document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');

    // 1. Escena y Cámara
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.003);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Posición inicial de la cámara
    camera.position.set(0, 40, 250);

    // 2. Renderizador WebGL (Gráficos)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Renderizador CSS2D (Para que el HTML flote perfectamente en 3D)
    const labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; // Deja pasar el mouse al canvas
    container.appendChild(labelRenderer.domElement);

    // 4. Controles Orbitales (Interacción con el mouse)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5; // Gira suavemente solo
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limita para no mirar desde muy abajo
    controls.target.set(0, 20, 0); // Apunta al centro del corazón

    // 5. Post-Procesado: Efecto BLOOM (El resplandor suave de Sol)
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.strength = 1.8; // Intensidad del brillo
    bloomPass.radius = 1.2;   // Suavidad y dispersión
    bloomPass.threshold = 0.1;

    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    // Textura ultra suave para las partículas
    const canvasTex = document.createElement('canvas');
    canvasTex.width = 64; canvasTex.height = 64;
    const ctxTex = canvasTex.getContext('2d');
    const gradient = ctxTex.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,230,150,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,180,50,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctxTex.fillStyle = gradient;
    ctxTex.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvasTex);

    // --- Galaxia Espiral Suave ---
    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyCount = 3000;
    const galaxyPositions = new Float32Array(galaxyCount * 3);
    const galaxyColors = new Float32Array(galaxyCount * 3);

    const colorCore = new THREE.Color(0xffffff);
    const colorMid = new THREE.Color(0xffe680); // Amarillo dorado más claro
    const colorEdge = new THREE.Color(0xffd54f); // Amarillo cálido suave

    for (let i = 0; i < galaxyCount; i++) {
        const radius = Math.random() * 55;
        const branchAngle = (i % 6) * ((Math.PI * 2) / 6);
        const spinAngle = radius * 0.25;

        const scatter = (Math.random() - 0.5) * (55 - radius) * 0.25;

        const x = Math.cos(branchAngle + spinAngle) * radius + scatter;
        const y = (Math.random() - 0.5) * (55 - radius) * 0.1; // Ligero grosor vertical
        const z = Math.sin(branchAngle + spinAngle) * radius + scatter;

        galaxyPositions[i * 3] = x;
        galaxyPositions[i * 3 + 1] = y;
        galaxyPositions[i * 3 + 2] = z;

        const mixedColor = new THREE.Color();
        if (radius < 15) {
            mixedColor.lerpColors(colorCore, colorMid, radius / 15);
        } else {
            mixedColor.lerpColors(colorMid, colorEdge, (radius - 15) / 40);
        }

        galaxyColors[i * 3] = mixedColor.r;
        galaxyColors[i * 3 + 1] = mixedColor.g;
        galaxyColors[i * 3 + 2] = mixedColor.b;
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(galaxyPositions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(galaxyColors, 3));

    const galaxyMaterial = new THREE.PointsMaterial({
        size: 3.5, // Partículas más grandes y suaves
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        map: particleTexture,
        transparent: true,
        opacity: 0.7
    });

    const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    particlesGroup.add(galaxy);

    // 2. Partículas que forman el aura del corazón
    const heartGeometry = new THREE.BufferGeometry();
    const heartCount = 1000;
    const heartPositions = new Float32Array(heartCount * 3);

    for (let i = 0; i < heartCount; i++) {
        const t = Math.random() * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const z = (Math.random() - 0.5) * 6; // Mayor grosor en el aura

        const scale = 2.1;

        heartPositions[i * 3] = x * scale;
        heartPositions[i * 3 + 1] = (y + 17) * scale;
        heartPositions[i * 3 + 2] = z * scale;
    }

    heartGeometry.setAttribute('position', new THREE.BufferAttribute(heartPositions, 3));

    const heartMaterial = new THREE.PointsMaterial({
        size: 5,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xfff4c2, // Amarillo más claro y suave
        map: particleTexture,
        transparent: true,
        opacity: 0.9
    });

    const heart = new THREE.Points(heartGeometry, heartMaterial);
    particlesGroup.add(heart);

    // --- Estrellas de fondo ---
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starsPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
        starsPositions[i * 3] = (Math.random() - 0.5) * 800;
        starsPositions[i * 3 + 1] = (Math.random() - 0.5) * 800;
        starsPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
        size: 2.5,
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        map: particleTexture,
        blending: THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // ==========================================
    // 6. Objetos HTML renderizados en 3D (Textos y Flores)
    // ==========================================
    function createSunflowerSVG(size) {
        let petals = '';
        const numPetals = 16;
        for (let i = 0; i < numPetals; i++) {
            const rot = (360 / numPetals) * i;
            petals += `<path d="M50 50 C45 25, 40 5, 50 0 C60 5, 55 25, 50 50 Z" fill="#ffcc00" transform="rotate(${rot} 50 50)" />`;
            petals += `<path d="M50 50 C45 25, 40 5, 50 0 C60 5, 55 25, 50 50 Z" fill="#ffaa00" transform="rotate(${rot + (360 / numPetals) / 2} 50 50) scale(0.9) translate(5, 5)" />`;
        }
        return `
        <svg viewBox="0 0 100 100" class="sunflower-svg" width="${size}" height="${size}">
            ${petals}
            <circle cx="50" cy="50" r="18" fill="#3b2b18" />
            <circle cx="50" cy="50" r="15" fill="#52391b" stroke-dasharray="2 3" stroke="#261b0f" stroke-width="3"/>
        </svg>
        `;
    }

    function createBouquetHTML(scale) {
        const s1 = createSunflowerSVG(45 * scale);
        const s2 = createSunflowerSVG(35 * scale);
        const s3 = createSunflowerSVG(35 * scale);

        return `
            <div class="bouquet" style="width: ${60 * scale}px; height: ${60 * scale}px;">
                <div style="position:absolute; top:0; left:10%; z-index: 3;">${s1}</div>
                <div style="position:absolute; top:30%; left:-20%; z-index: 2;">${s2}</div>
                <div style="position:absolute; top:30%; left:40%; z-index: 2;">${s3}</div>
                <svg style="position:absolute; top:55%; left:20%; z-index:1" width="${30 * scale}" height="${40 * scale}" viewBox="0 0 30 40">
                    <path d="M15 0 C30 10, 30 30, 15 40 C0 30, 0 10, 15 0 Z" fill="#4a5e2c" />
                </svg>
                <svg style="position:absolute; top:75%; left:15%; z-index:4" width="${40 * scale}" height="${30 * scale}" viewBox="0 0 40 30">
                    <path d="M20 15 C10 5, 0 10, 10 25 C20 15, 30 5, 40 10 C30 25, 20 15, 20 15 Z" fill="#ffb3cc" />
                    <path d="M20 15 L10 30 M20 15 L30 30" stroke="#ffb3cc" stroke-width="4" stroke-linecap="round"/>
                </svg>
            </div>
        `;
    }

    // Coordenadas [X, Y, Z] en el espacio 3D
    const items = [
        { text: "Eres mi sol", type: 'bouquet', pos: [-45, 30, 20], scale: 1.2 },
        { text: "Te adoro", type: 'single', pos: [-25, 50, 10], scale: 0.7 },
        { text: "My Love", type: 'none', pos: [-35, 15, -15], scale: 0.9 },
        { text: "Te Amo", type: 'single', pos: [-30, 5, 35], scale: 1.1 },
        { text: "Chikii", type: 'none', pos: [-15, -5, 45], scale: 1 },
        { text: "Amorcito", type: 'none', pos: [0, 56, 0], scale: 0.8 },
        { text: "", type: 'bouquet', pos: [5, -10, 48], scale: 1.1 },
        { text: "Me encantas", type: 'none', pos: [45, 40, -10], scale: 0.9 },
        { text: "Mi Amor", type: 'bouquet', pos: [50, 25, 25], scale: 1.3 },
        { text: "Me encantas", type: 'bouquet', pos: [45, 0, 40], scale: 1.0 }
    ];

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'floating-item';

        let content = '';
        if (item.type === 'bouquet') content += createBouquetHTML(item.scale);
        else if (item.type === 'single') content += createSunflowerSVG(45 * item.scale);

        if (item.text) content += `<div class="floating-text" style="transform: scale(${item.scale})">${item.text}</div>`;
        el.innerHTML = content;

        // Convertir elemento HTML a objeto 3D
        const cssObj = new THREE.CSS2DObject(el);
        cssObj.position.set(item.pos[0], item.pos[1], item.pos[2]);
        scene.add(cssObj);

        // Animar en el eje Y suavemente con GSAP
        gsap.to(cssObj.position, {
            y: cssObj.position.y - 4,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random() * -3
        });
    });

    // ==========================================
    // 6.5 Área clickeable en el centro y Modal
    // ==========================================
    const clickArea = document.createElement('div');
    clickArea.id = 'heart-click-area';
    // Se añade un tooltip opcional
    clickArea.title = "Haz clic aquí";
    
    const clickObj = new THREE.CSS2DObject(clickArea);
    clickObj.position.set(0, 26, 0); // Exactamente en el centro del corazón
    scene.add(clickObj);

    // Lógica del Modal
    const modal = document.getElementById('dedication-modal');
    const closeBtn = document.getElementById('close-modal');

    // Manejar el clic (y toque en móviles)
    const openModal = () => modal.classList.add('active');
    clickArea.addEventListener('click', openModal);
    clickArea.addEventListener('touchstart', openModal);

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    // Cerrar si se hace clic fuera del contenido
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
    });

    // ==========================================
    // 7. Bucle de Animación
    // ==========================================
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        controls.update(); // Actualiza los controles del mouse

        // Latido del corazón
        const throb = 1 + Math.sin(elapsedTime * 3) * 0.04;
        heart.scale.set(throb, throb, throb);

        // Renderizar escena con efecto de brillo (Bloom)
        composer.render();
        // Renderizar los textos HTML en 3D
        labelRenderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ==========================================
    // 8. Girasoles Fugaces (Estrellas fugaces)
    // ==========================================
    function createShootingSunflower() {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '0';

        const sunflower = document.createElement('div');
        sunflower.innerHTML = createSunflowerSVG(30);
        sunflower.style.position = 'relative';
        sunflower.style.zIndex = '2';

        const tail = document.createElement('div');
        tail.style.position = 'absolute';
        tail.style.top = '13px'; // Centrado con el SVG de 30px
        tail.style.left = '-150px';
        tail.style.width = '150px';
        tail.style.height = '3px';
        tail.style.background = 'linear-gradient(to right, rgba(255,200,0,0), rgba(255,215,0,0.8))';
        tail.style.borderRadius = '2px';
        tail.style.boxShadow = '0 0 10px #ffcc00, 0 0 20px #ff9900';
        tail.style.zIndex = '1';

        el.appendChild(tail);
        el.appendChild(sunflower);

        // Empiezan fuera de la pantalla
        const startX = Math.random() > 0.5 ? window.innerWidth + 100 : -100;
        const startY = -50 + Math.random() * (window.innerHeight / 2);

        // Caen hacia abajo y cruzan la pantalla
        const endX = startX > 0 ? -200 : window.innerWidth + 200;
        const endY = startY + 400 + Math.random() * 300;

        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        el.style.left = startX + 'px';
        el.style.top = startY + 'px';
        el.style.transform = `rotate(${angle}deg)`;

        // Girasol girando locamente
        gsap.to(sunflower, {
            rotation: 360 * 3,
            duration: 1.5,
            ease: "linear"
        });

        document.body.appendChild(el);

        // Animación de caída (Estrella fugaz)
        gsap.to(el, {
            x: endX - startX,
            y: endY - startY,
            duration: 1.5 + Math.random() * 0.5,
            ease: "power1.in",
            onComplete: () => {
                el.remove();
            }
        });

        setTimeout(createShootingSunflower, 2000 + Math.random() * 4000);
    }

    setTimeout(createShootingSunflower, 2000);
});
