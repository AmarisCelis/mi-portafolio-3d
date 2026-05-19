document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LÓGICA DEL MENÚ LATERAL (NUEVO UI)
    // ==========================================
    const menuToggleBtn = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const infoMenu = document.getElementById('info-menu');

    if (menuToggleBtn && closeMenuBtn && infoMenu) {
        menuToggleBtn.addEventListener('click', () => {
            infoMenu.classList.add('open');
        });

        closeMenuBtn.addEventListener('click', () => {
            infoMenu.classList.remove('open');
        });
    }

    // ==========================================
    // 2. LÓGICA DEL MODELO 3D Y LUCES
    // ==========================================
    const lightSwitch = document.getElementById('light-switch');
    const modelViewer = document.getElementById('setup-model');

    if (modelViewer) {
        // 2.1 Animación de carga suavizada (Fake Loader)
        const progressText = document.querySelector('.progress-text');
        const progressBarContainer = document.querySelector('.progress-bar-container');
        
        let displayedProgress = 0;
        let targetProgress = 0;

        // Bucle que incrementa suavemente el número en pantalla
        const progressInterval = setInterval(() => {
            if (displayedProgress < targetProgress) {
                // Incremento aleatorio para que se sienta orgánico
                displayedProgress += Math.floor(Math.random() * 3) + 1;
                if (displayedProgress > targetProgress) displayedProgress = targetProgress;
                
                if (progressText) {
                    progressText.textContent = `${displayedProgress}%`;
                }
            }
        }, 30);

        modelViewer.addEventListener('progress', (event) => {
            // Actualizamos el "target" al que queremos llegar según la descarga real
            targetProgress = Math.round(event.detail.totalProgress * 100);
        });

        // Evento 'load' garantiza que el modelo ya se cargó completamente
        modelViewer.addEventListener('load', () => {
            targetProgress = 100; // Forzamos a llegar a 100
            
            // Esperamos un segundo para que el usuario vea el "100%"
            setTimeout(() => {
                clearInterval(progressInterval);
                if (progressText) progressText.textContent = '100%';
                
                if (progressBarContainer) {
                    progressBarContainer.style.opacity = '0';
                    setTimeout(() => {
                        progressBarContainer.style.display = 'none';
                    }, 800);
                }
            }, 500);
        });

        // 2.2 Lógica del interruptor de luz con transición visual
        if (lightSwitch) {
            const overlay = document.getElementById('lights-overlay');
            const overlayText = document.getElementById('lights-overlay-text');

            lightSwitch.addEventListener('change', (e) => {
                const isSwitchActivated = e.target.checked;

                // Mostrar la pantalla de carga pastel
                if (overlay && overlayText) {
                    overlay.classList.remove('hidden');
                    overlayText.textContent = isSwitchActivated ? "Apagando las luces..." : "Encendiendo las luces...";
                }

                // Esperar un momento estético antes de aplicar la luz
                setTimeout(() => {
                    if (isSwitchActivated) {
                        modelViewer.exposure = 0.2; // Luz apagada (mantenemos un poco visible)
                    } else {
                        modelViewer.exposure = 1.2; // Luz encendida
                    }
                    
                    // Ocultar la pantalla
                    if (overlay) {
                        overlay.classList.add('hidden');
                    }
                }, 800); // 800ms de retraso para la animación
            });
        }
    }

    // ==========================================
    // 3. INICIALIZACIÓN DE ANIMACIÓN RIVE (OSO LOGIN)
    // ==========================================
    try {
        const riveCanvas = document.getElementById('rive-canvas');

        if (riveCanvas) {
            const r = new rive.Rive({
                src: './assets/animated_login_bear.riv',
                canvas: riveCanvas,
                autoplay: true,
                stateMachines: 'Login Machine',
                onLoad: () => {
                    r.resizeDrawingSurfaceToCanvas();
                },
            });
        }
    } catch (error) {
        console.warn('Rive no se pudo cargar. Esto puede deberse a un problema de red.', error);
    }

    // ==========================================
    // 4. CONTROL DE ANIMACIÓN 3D (SILLA Y PUERTA)
    // ==========================================
    const animToggleBtn = document.getElementById('anim-toggle');
    const animDoorToggleBtn = document.getElementById('anim-door-toggle');
    let isChairPlaying = false;
    let isDoorPlaying = false;
    
    // Asignamos directamente los nombres que vimos en tu archivo para evitar problemas al cargar
    let chairAnimName = 'Silla_EscritorioAction.016';
    let doorAnimName = 'Cube.014Action';

    if (animToggleBtn && modelViewer) {
        animToggleBtn.addEventListener('click', () => {
            const btnText = animToggleBtn.querySelector('span:last-child');
            if (isChairPlaying) {
                modelViewer.pause();
                if(btnText) btnText.textContent = 'Animar Silla de Escritorio';
            } else {
                modelViewer.animationName = chairAnimName;
                modelViewer.currentTime = 0; // Reiniciar desde el inicio
                modelViewer.play();
                if(btnText) btnText.textContent = 'Pausar Silla de Escritorio';
                
                if (isDoorPlaying && animDoorToggleBtn) {
                    isDoorPlaying = false;
                    const doorText = animDoorToggleBtn.querySelector('span:last-child');
                    if(doorText) doorText.textContent = 'Animar Puerta';
                }
            }
            isChairPlaying = !isChairPlaying;
        });
    }

    if (animDoorToggleBtn && modelViewer) {
        animDoorToggleBtn.addEventListener('click', () => {
            const btnText = animDoorToggleBtn.querySelector('span:last-child');
            if (isDoorPlaying) {
                modelViewer.pause();
                if(btnText) btnText.textContent = 'Animar Puerta';
            } else {
                modelViewer.animationName = doorAnimName;
                // Usamos un pequeño retraso para asegurar que el visor haya cargado la animación antes de saltar el tiempo
                setTimeout(() => {
                    modelViewer.currentTime = 4.8; // Saltar los fotogramas vacíos
                    modelViewer.play();
                }, 50);
                if(btnText) btnText.textContent = 'Pausar Puerta';
                
                if (isChairPlaying && animToggleBtn) {
                    isChairPlaying = false;
                    const chairText = animToggleBtn.querySelector('span:last-child');
                    if(chairText) chairText.textContent = 'Animar Silla de Escritorio';
                }
            }
            isDoorPlaying = !isDoorPlaying;
        });
    }
});
