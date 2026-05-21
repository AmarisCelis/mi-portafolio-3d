const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// 1. Rename Controles and add Credits button
html = html.replace(
    `<span>Controles Habitación</span>`,
    `<span>Interactivo</span>`
);

html = html.replace(
    `<div id="controls-drawer" class="controls-drawer">`,
    `<button id="credits-toggle" class="coquette-btn credits-toggle-btn">
            <span class="btn-icon">🎨</span>
            <span>Recursos 3D</span>
        </button>

        <div id="controls-drawer" class="controls-drawer">`
);

// 2. Add tabs to main
html = html.replace(
    `<main>\n                <!-- Sección: Sobre mí -->`,
    `<main>
                <!-- Navegación de pestañas -->
                <nav class="tabs-nav">
                    <button class="tab-btn active" data-tab="tab-sobre-mi">Sobre mí</button>
                    <button class="tab-btn" data-tab="tab-habilidades">Habilidades</button>
                    <button class="tab-btn" data-tab="tab-proyectos">Proyectos</button>
                    <button class="tab-btn" data-tab="tab-contacto">Contacto</button>
                </nav>

                <div class="tab-content">
                <!-- Sección: Sobre mí -->`
);

// 3. Update sections to tab-panes
html = html.replace(`id="sobre-mi" class="section"`, `id="tab-sobre-mi" class="tab-pane section active"`);
html = html.replace(`id="habilidades" class="section"`, `id="tab-habilidades" class="tab-pane section"`);
html = html.replace(`id="proyectos" class="section"`, `id="tab-proyectos" class="tab-pane section"`);

// 4. Extract footer and place it as tab-contacto
const footerMatch = html.match(/<!-- Footer: Contacto y Redes -->\s*<footer>([\s\S]*?)<\/footer>/);
if (footerMatch) {
    const footerContent = footerMatch[1];
    html = html.replace(footerMatch[0], ''); // Remove from original place

    // Insert after proyectos section
    html = html.replace(
        `<!-- Sección: Galería de Recursos Visuales -->`,
        `<!-- Sección: Contacto -->
                <section id="tab-contacto" class="tab-pane section">
                    ${footerContent}
                </section>
                </div> <!-- /tab-content -->

                <!-- Sección: Galería de Recursos Visuales -->`
    );
}

// 5. Extract galeria-recursos and modelos-terceros to a new aside
const startIdx = html.indexOf(`<!-- Sección: Galería de Recursos Visuales -->`);
const endIdx = html.indexOf(`</main>`);

const creditsContent = html.substring(startIdx, endIdx);
html = html.slice(0, startIdx) + html.slice(endIdx);

// Insert new aside after info-menu
html = html.replace(
    `</aside>`,
    `</aside>

    <!-- MENÚ LATERAL DE CRÉDITOS Y RECURSOS -->
    <aside id="credits-menu" class="info-menu">
        <button id="close-credits-menu" class="close-btn">✖</button>
        <div class="menu-content">
            <header>
                <div class="profile-photo-area">
                    <div class="photo-frame" style="font-size: 3rem; background: rgba(255, 255, 255, 0.4); display: flex; align-items: center; justify-content: center;">
                        🎨
                    </div>
                </div>
                <h1>Recursos 3D</h1>
                <p>Créditos y Modelos de Terceros</p>
            </header>
            <main>
                ${creditsContent}
            </main>
        </div>
    </aside>`
);

fs.writeFileSync('index.html', html);
console.log("index.html restructured successfully.");
