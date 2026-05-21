document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. LÓGICA DEL MENÚ LATERAL (NUEVO UI)
    // ==========================================
    const menuToggleBtn = document.getElementById('menu-toggle');
    const closeMenuBtn = document.getElementById('close-menu');
    const infoMenu = document.getElementById('info-menu');

    // Lógica para pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    if (menuToggleBtn && closeMenuBtn && infoMenu) {
        menuToggleBtn.addEventListener('click', () => {
            infoMenu.classList.add('open');
        });

        closeMenuBtn.addEventListener('click', () => {
            infoMenu.classList.remove('open');
        });
    }

    // ==========================================
    // 1.1 LÓGICA DEL MENÚ DE CRÉDITOS Y RECURSOS
    // ==========================================
    const creditsToggleBtn = document.getElementById('credits-toggle');
    const closeCreditsMenuBtn = document.getElementById('close-credits-menu');
    const creditsMenu = document.getElementById('credits-menu');

    if (creditsToggleBtn && closeCreditsMenuBtn && creditsMenu) {
        creditsToggleBtn.addEventListener('click', () => {
            creditsMenu.classList.add('open');
            if (infoMenu && infoMenu.classList.contains('open')) infoMenu.classList.remove('open');
            // Nota: El cajón de controles se cerrará gracias a un listener genérico más abajo
        });

        closeCreditsMenuBtn.addEventListener('click', () => {
            creditsMenu.classList.remove('open');
        });
    }

    // ==========================================
    // 1.2 LÓGICA DE CONTROLES COLAPSABLES (MÓVIL)
    // ==========================================
    const controlsToggleBtn = document.getElementById('controls-toggle');
    const controlsDrawer = document.getElementById('controls-drawer');

    const closeControlsDrawer = (delay = 0) => {
        if (controlsDrawer && controlsDrawer.classList.contains('open')) {
            setTimeout(() => {
                controlsDrawer.classList.remove('open');
                if (controlsToggleBtn) {
                    controlsToggleBtn.classList.remove('active');
                }
            }, delay);
        }
    };

    if (controlsToggleBtn && controlsDrawer) {
        controlsToggleBtn.addEventListener('click', () => {
            controlsDrawer.classList.toggle('open');
            controlsToggleBtn.classList.toggle('active');
        });

        // Cerrar panel de controles si se abre el menú lateral de información o de créditos
        if (menuToggleBtn) {
            menuToggleBtn.addEventListener('click', () => {
                closeControlsDrawer(0);
                if (creditsMenu) creditsMenu.classList.remove('open');
            });
        }
        if (creditsToggleBtn) {
            creditsToggleBtn.addEventListener('click', () => {
                closeControlsDrawer(0);
            });
        }
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

                    // Ajustar el rango (distance) y decaimiento (decay) de los reflectores del patio (Luz_Linterna)
                    // Esto evita que atraviesen las paredes e iluminen el interior de la casa
                    scene.traverse((node) => {
                        if (node.isLight && node.name && node.name.toLowerCase().includes('linterna')) {
                            node.distance = 2.2; // Limitamos el rango de iluminación a 2.2 metros
                            node.decay = 2.0;    // Decaimiento físico estándar cuadrático
                        }
                    });

                    // Instanciar dinámicamente la luz física local del cuarto dentro del nodo "Luz_Cuarto"
                    try {
                        const luzCuartoNode = scene.getObjectByName("Luz_Cuarto");
                        if (luzCuartoNode && window.THREE) {
                            const isRoomLightOn = document.getElementById('room-light-switch') ? document.getElementById('room-light-switch').checked : false;
                            // Luz puntual cálida y acogedora (0xffebd6), rango limitado a 1.8 metros
                            // Esto ilumina el interior del cuarto pero decae completamente antes de atravesar las paredes hacia el exterior
                            const physicalRoomLight = new THREE.PointLight(0xffebd6, isRoomLightOn ? 8 : 0, 1.8);
                            physicalRoomLight.name = "Luz_Cuarto_Fisica";
                            physicalRoomLight.decay = 2.0;
                            physicalRoomLight.userData.originalIntensity = 8;
                            luzCuartoNode.add(physicalRoomLight);
                            console.log("=== Luz física local Luz_Cuarto_Fisica añadida al cuarto ===");
                        }
                    } catch (lightErr) {
                        console.warn("No se pudo agregar la luz física del cuarto:", lightErr);
                    }
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
            const isRoomLightOn = roomLightSwitch ? roomLightSwitch.checked : false;
            
            let targetExposure = 1.2;
            if (isNight) {
                if (isRoomLightOn) {
                    targetExposure = 0.28; // Cozy night with room light on (not too saturated!)
                } else {
                    targetExposure = 0.12; // Actually dark night when the room light is off!
                }
            } else {
                if (isRoomLightOn) {
                    targetExposure = 1.1; // Day with light on
                } else {
                    targetExposure = 0.85; // Day with light off (natural day shadows)
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
                closeControlsDrawer(300);
            });
        }

        if (roomLightSwitch) {
            roomLightSwitch.addEventListener('change', (e) => {
                // Controla cualquier nodo de luz real si existiese en el modelo
                toggleLightsAndNodes(['luz cuarto', 'luz_cuarto', 'cuarto'], e.target.checked, false);
                // Simula el encendido/apagado dinámico mediante exposición
                updateRoomIllumination(false);
                closeControlsDrawer(300);
            });
        }

        if (deskLampSwitch) {
            deskLampSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['lamparita'], e.target.checked, false);
                closeControlsDrawer(300);
            });
        }

        if (keyboardSwitch) {
            keyboardSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['teclado', 'tecla'], e.target.checked, false);
                closeControlsDrawer(300);
            });
        }

        if (patioLightSwitch) {
            patioLightSwitch.addEventListener('change', (e) => {
                toggleLightsAndNodes(['linterna', 'patio'], e.target.checked, false);
                closeControlsDrawer(300);
            });
        }

        // Sincronizar el estado de la iluminación global al cargar la página
        updateRoomIllumination(false);
        if (sunSwitch) {
            const isNightOnLoad = sunSwitch.checked;
            toggleLightsAndNodes(['sol'], !isNightOnLoad, true);
        }
        if (roomLightSwitch) {
            const isRoomLightOnLoad = roomLightSwitch.checked;
            toggleLightsAndNodes(['luz cuarto', 'luz_cuarto', 'cuarto'], isRoomLightOnLoad, false);
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
            closeControlsDrawer(0);
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
            closeControlsDrawer(0);
        });
    }

    // ==========================================
    // 5. LÓGICA DE LA GALERÍA LIGHTBOX (GLASSMORPHISM)
    // ==========================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');
    const lightboxClose = document.getElementById('lightbox-close');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (lightbox && lightboxImg && lightboxTitle && lightboxDescription && lightboxClose) {
        galleryCards.forEach(card => {
            card.addEventListener('click', () => {
                const img = card.querySelector('.gallery-img');
                const title = card.querySelector('.gallery-caption h4');
                const desc = card.querySelector('.gallery-caption p');

                if (img && title && desc) {
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt || 'Vista ampliada';
                    lightboxTitle.textContent = title.textContent;
                    lightboxDescription.textContent = desc.textContent;
                    
                    // Mostrar lightbox quitando la clase hidden
                    lightbox.classList.remove('hidden');
                    
                    // Añadir accesibilidad
                    lightbox.setAttribute('aria-hidden', 'false');
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.add('hidden');
            lightbox.setAttribute('aria-hidden', 'true');
            // Limpiar fuente de imagen con un pequeño retraso tras la animación de salida
            setTimeout(() => {
                lightboxImg.src = '';
            }, 400);
        };

        lightboxClose.addEventListener('click', closeLightbox);

        // Cerrar al hacer clic fuera del contenido (en el overlay)
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Cerrar presionando la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
                closeLightbox();
            }
        });
    }

    // ==========================================
    // 6. LÓGICA DEL REPRODUCTOR DE MÚSICA LOFI
    // ==========================================
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const bgAudio = document.getElementById('bg-audio');

    if (musicToggleBtn && bgAudio) {
        let fadeInterval = null;
        let isAudioPlaying = false;
        const targetVolume = 0.45;

        // Inicializar volumen a 0
        bgAudio.volume = 0;

        // Log para depurar si el archivo carga correctamente
        bgAudio.addEventListener('error', (e) => {
            console.error('Error al cargar el archivo de audio:', e);
            console.error('Código de error:', bgAudio.error ? bgAudio.error.code : 'desconocido');
        });

        bgAudio.addEventListener('canplaythrough', () => {
            console.log('Audio listo para reproducir sin interrupciones.');
        });

        function fadeAudioVolume(target, duration, onComplete) {
            if (fadeInterval) clearInterval(fadeInterval);
            
            const steps = 20;
            const stepTime = duration / steps;
            const volumeStep = (target - bgAudio.volume) / steps;
            let currentStep = 0;

            fadeInterval = setInterval(() => {
                currentStep++;
                bgAudio.volume = Math.max(0, Math.min(1, bgAudio.volume + volumeStep));
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    bgAudio.volume = target;
                    if (onComplete) onComplete();
                }
            }, stepTime);
        }

        musicToggleBtn.addEventListener('click', () => {
            if (!isAudioPlaying) {
                bgAudio.volume = 0;
                bgAudio.play().then(() => {
                    isAudioPlaying = true;
                    musicToggleBtn.classList.add('playing');
                    fadeAudioVolume(targetVolume, 800);
                    console.log('Música iniciada correctamente.');
                }).catch(err => {
                    console.error('Error al intentar reproducir el audio:', err.name, err.message);
                    // Si falla, mostrar mensaje al usuario
                    alert('No se pudo reproducir la música. Asegúrate de interactuar con la página primero.');
                });
            } else {
                isAudioPlaying = false;
                fadeAudioVolume(0, 600, () => {
                    bgAudio.pause();
                    bgAudio.currentTime = 0;
                    musicToggleBtn.classList.remove('playing');
                });
            }
        });
    }
});
