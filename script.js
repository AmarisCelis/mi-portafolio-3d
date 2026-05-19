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
            
            // Imprimir todos los nodos para depuración en la consola del navegador
            try {
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
                    console.log("=== LISTA DE NODOS DETECTADOS EN EL MODELO 3D ===");
                    scene.traverse((node) => {
                        let info = `- "${node.name}" [Tipo: ${node.type}]`;
                        if (node.isLight) info += ` [LUZ - Intensidad: ${node.intensity}]`;
                        if (node.isMesh) info += ` [MALLA - Material: ${node.material ? node.material.name : 'ninguno'}]`;
                        console.log(info);
                    });
                    console.log("=================================================");
                }
            } catch (err) {
                console.warn("No se pudieron listar los nodos en la consola:", err);
            }

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
                        
                        // Si el nombre del nodo coincide (ej. Linterna.001, Luz_Linterna, Sol, Lamparita)
                        if (match) {
                            // Función auxiliar para aplicar estado a una luz física
                            const applyLightState = (lightNode) => {
                                lightNode.visible = isVisible;
                                if (isVisible) {
                                    lightNode.intensity = lightNode.userData.originalIntensity !== undefined ? lightNode.userData.originalIntensity : 1;
                                } else {
                                    if (lightNode.userData.originalIntensity === undefined) {
                                        lightNode.userData.originalIntensity = lightNode.intensity;
                                    }
                                    lightNode.intensity = 0;
                                }
                            };

                            // Función auxiliar para aplicar estado a una malla (emisión de material)
                            const applyMeshState = (meshNode) => {
                                if (hideMesh) {
                                    meshNode.visible = isVisible;
                                }
                                if (meshNode.material) {
                                    // CLONAMOS EL MATERIAL para que cada malla controle su brillo de manera independiente.
                                    // Esto soluciona que las lamparitas y el teclado compartan emisión en el mismo material de Blender.
                                    if (!meshNode.userData.materialCloned) {
                                        meshNode.material = meshNode.material.clone();
                                        meshNode.userData.materialCloned = true;
                                    }
                                    
                                    const mat = meshNode.material;
                                    if (isVisible) {
                                        // Restaurar emisión
                                        if (meshNode.userData.originalEmissive !== undefined && mat.emissive) {
                                            mat.emissive.copy(meshNode.userData.originalEmissive);
                                        }
                                        if (meshNode.userData.originalEmissiveIntensity !== undefined) {
                                            mat.emissiveIntensity = meshNode.userData.originalEmissiveIntensity;
                                        }
                                    } else {
                                        // Guardar y apagar emisión (usamos meshNode.userData para evitar problemas con materiales compartidos)
                                        if (meshNode.userData.originalEmissive === undefined && mat.emissive) {
                                            meshNode.userData.originalEmissive = mat.emissive.clone();
                                        }
                                        if (meshNode.userData.originalEmissiveIntensity === undefined) {
                                            meshNode.userData.originalEmissiveIntensity = mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 1;
                                        }
                                        
                                        if (mat.emissive) mat.emissive.setHex(0x000000);
                                        mat.emissiveIntensity = 0;
                                    }
                                    mat.needsUpdate = true;
                                }
                            };

                            if (node.isLight) {
                                applyLightState(node);
                            } else if (node.isMesh) {
                                applyMeshState(node);
                            } else {
                                // Para nodos tipo Group, Object3D u otros que coincidan con la búsqueda (ej. Luz_Cuarto o Lamparita si son grupos)
                                if (hideMesh) {
                                    node.visible = isVisible;
                                }
                                // Recorremos sus hijos para apagar cualquier luz o malla emisiva que contenga
                                node.traverse((child) => {
                                    if (child !== node) {
                                        if (child.isLight) {
                                            applyLightState(child);
                                        } else if (child.isMesh) {
                                            applyMeshState(child);
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }

        // Función para sincronizar la iluminación global basada en el sol y la luz del cuarto
        function updateRoomIllumination(showTransitionOverlay = false, overlayMsg = "") {
            const isNight = sunSwitch ? sunSwitch.checked : false;
            const isRoomLightOn = roomLightSwitch ? roomLightSwitch.checked : true;
            
            let targetExposure = 1.2;
            if (isNight) {
                if (isRoomLightOn) {
                    targetExposure = 0.95; // Habitación acogedora iluminada de noche
                } else {
                    targetExposure = 0.15; // Noche oscura sin luces principales
                }
            } else {
                if (isRoomLightOn) {
                    targetExposure = 1.2; // Día completo con luz encendida
                } else {
                    targetExposure = 0.9; // Día con luz apagada (interior más suave)
                }
            }

            if (showTransitionOverlay && overlay && overlayText) {
                overlay.classList.remove('hidden');
                overlayText.textContent = overlayMsg;
                setTimeout(() => {
                    modelViewer.exposure = targetExposure;
                    if (overlay) overlay.classList.add('hidden');
                }, 800);
            } else {
                modelViewer.exposure = targetExposure;
            }
        }

        if (sunSwitch) {
            sunSwitch.addEventListener('change', (e) => {
                const isNight = e.target.checked;
                const isDay = !isNight;
                const msg = isDay ? "Amaneciendo..." : "Anocheciendo...";
                
                updateRoomIllumination(true, msg);
                toggleLightsAndNodes(['sol'], isDay, true); // Oculta el sol en la noche
            });
        }

        if (roomLightSwitch) {
            roomLightSwitch.addEventListener('change', (e) => {
                // Controla cualquier nodo de luz real si existiese en el modelo
                toggleLightsAndNodes(['luz cuarto', 'luz_cuarto', 'cuarto'], e.target.checked, false);
                // Simula el encendido/apagado dinámico mediante exposición
                updateRoomIllumination(false);
            });
        }

        if (deskLampSwitch) {
            deskLampSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['lamparita'], e.target.checked, false);
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

        // Sincronizar el estado de la iluminación global al cargar la página
        updateRoomIllumination(false);
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
