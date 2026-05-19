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

        const sunSwitch = document.getElementById('sun-switch');
        const roomLightSwitch = document.getElementById('room-light-switch');
        const deskLampSwitch = document.getElementById('desk-lamp-switch');
        const keyboardSwitch = document.getElementById('keyboard-switch');
        const patioLightSwitch = document.getElementById('patio-light-switch');
        
        const overlay = document.getElementById('lights-overlay');
        const overlayText = document.getElementById('lights-overlay-text');

        // Función para encender/apagar nodos (luces y focos)
        function toggleLightsAndNodes(keywords, isVisible, hideMesh = false) {
            // Buscamos la escena Three.js interna de model-viewer
            const symbols = Object.getOwnPropertySymbols(modelViewer);
            let scene = null;
            for (let s of symbols) {
                if (modelViewer[s] && modelViewer[s].type === 'Scene') {
                    scene = modelViewer[s];
                    break;
                }
                if (s.description === 'scene' && modelViewer[s]) {
                    scene = modelViewer[s];
                }
            }

            if (scene) {
                scene.traverse((node) => {
                    if (node.name) {
                        const nameLower = node.name.toLowerCase();
                        const match = keywords.some(kw => nameLower.includes(kw.toLowerCase()));
                        
                        // Si el nombre del nodo coincide (ej. Linterna.001, Luz_Linterna, Sol, Foco)
                        if (match) {
                            // Si es una luz física (exportada con Punctual Lights)
                            if (node.isLight) {
                                node.visible = isVisible;
                                if (isVisible) {
                                    node.intensity = node.userData.originalIntensity !== undefined ? node.userData.originalIntensity : 1;
                                } else {
                                    if (node.userData.originalIntensity === undefined) {
                                        node.userData.originalIntensity = node.intensity;
                                    }
                                    node.intensity = 0;
                                }
                            } else if (node.isMesh) {
                                // Si se indica hideMesh explícitamente (ej. para desaparecer la esfera del Sol)
                                if (hideMesh) {
                                    node.visible = isVisible;
                                }
                                
                                // Para los focos de las linternas y teclados, apagamos su brillo (emisión), no los ocultamos
                                if (node.material) {
                                    if (isVisible) {
                                        // Restaurar emisión
                                        if (node.userData.originalEmissive !== undefined && node.material.emissive) {
                                            node.material.emissive.copy(node.userData.originalEmissive);
                                        }
                                        if (node.userData.originalEmissiveIntensity !== undefined) {
                                            node.material.emissiveIntensity = node.userData.originalEmissiveIntensity;
                                        }
                                    } else {
                                        // Guardar y apagar emisión
                                        if (node.userData.originalEmissive === undefined && node.material.emissive) {
                                            node.userData.originalEmissive = node.material.emissive.clone();
                                        }
                                        if (node.userData.originalEmissiveIntensity === undefined) {
                                            node.userData.originalEmissiveIntensity = node.material.emissiveIntensity !== undefined ? node.material.emissiveIntensity : 1;
                                        }
                                        
                                        if (node.material.emissive) node.material.emissive.setHex(0x000000);
                                        node.material.emissiveIntensity = 0;
                                    }
                                    node.material.needsUpdate = true;
                                }
                            } else {
                                // Para nodos tipo Group u otros (Empty), si el flag hideMesh está activo, los ocultamos
                                if (hideMesh) {
                                    node.visible = isVisible;
                                }
                            }
                        }
                    }
                });
            }
        }

        if (sunSwitch) {
            sunSwitch.addEventListener('change', (e) => {
                // Invertimos la lógica: Si está apagado (no checked), es de Día. Si se enciende, es Noche.
                const isNight = e.target.checked;
                const isDay = !isNight;
                
                if (overlay && overlayText) {
                    overlay.classList.remove('hidden');
                    overlayText.textContent = isDay ? "Amaneciendo..." : "Anocheciendo...";
                }
                setTimeout(() => {
                    modelViewer.exposure = isDay ? 1.2 : 0.2; // Simula Día / Noche
                    toggleLightsAndNodes(['sol'], isDay, true); // Oculta el sol por completo en la noche
                    if (overlay) overlay.classList.add('hidden');
                }, 800);
            });
        }

        if (roomLightSwitch) {
            roomLightSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['luz cuarto', 'luz_cuarto'], e.target.checked, false);
            });
        }

        if (deskLampSwitch) {
            deskLampSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['foco'], e.target.checked, false);
            });
        }

        if (keyboardSwitch) {
            keyboardSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['teclado', 'tecla'], e.target.checked, false);
            });
        }

        if (patioLightSwitch) {
            patioLightSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['linterna', 'patio'], e.target.checked, false);
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
