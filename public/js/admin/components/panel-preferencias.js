class PanelPreferencias extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.listaImagenes = [];
        this.columnasGlobales = [];
        this.columnasVisibles = [];
        this.ordenColumnas = [];
    }

    connectedCallback() {
        this.render();
        this.initListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                #panel-preferencias {
                    background: #ffffff;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                    border: 2px dashed #198754;
                    box-sizing: border-box;
                    width: 100%;
                    flex-shrink: 0;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                #panel-preferencias h3 {
                    margin-top: 0;
                    color: #198754;
                    font-size: 0.9em;
                    border-bottom: 1px solid #e9ecef;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                }
                .gestor-imagenes-container, .panel-columnas-container {
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .campo-grupo {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    margin-bottom: 6px;
                }
                .campo-grupo label {
                    font-size: 0.75em;
                    font-weight: 600;
                    color: #495057;
                }
                .chips-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                .chip-btn {
                    padding: 3px 6px;
                    font-size: 0.72em;
                    border-radius: 12px;
                    border: 1px solid #ced4da;
                    background-color: #ffffff;
                    color: #495057;
                    cursor: pointer;
                    user-select: none;
                }
                .chip-btn.activo {
                    background-color: #0d6efd;
                    color: white;
                    border-color: #0d6efd;
                }
                .chip-btn.orden-tag {
                    background-color: #198754;
                    color: white;
                    border-color: #198754;
                }
                .orden-select-container, .input-group, .opciones-subida-grid {
                    display: flex;
                    gap: 4px;
                    flex-direction: column;
                }
                .select-orden, .input-columnas, .input-numero {
                    padding: 5px 6px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 0.78em;
                    background-color: #ffffff;
                    width: 100%;
                    box-sizing: border-box;
                }
                .input-file-custom {
                    padding: 3px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 0.75em;
                    background-color: #ffffff;
                    width: 100%;
                    box-sizing: border-box;
                }
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 2px;
                }
                .checkbox-container label {
                    cursor: pointer;
                    font-size: 0.78em;
                }
                .btn-accion, .btn-guardar, .btn-limpiar {
                    padding: 5px 8px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.78em;
                    font-weight: bold;
                }
                .btn-accion { background-color: #0d6efd; color: white; }
                .btn-guardar { background-color: #198754; color: white; width: 100%; margin-top: 2px; }
                .btn-limpiar { background-color: #6c757d; color: white; font-size: 0.68em; padding: 2px 5px; align-self: flex-start; }
                .lista-imagenes-previa {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 4px;
                }
                .item-imagen-previa {
                    position: relative;
                    width: 50px;
                    height: 35px;
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid #ced4da;
                }
                .item-imagen-previa img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .btn-eliminar-img {
                    position: absolute;
                    top: 1px;
                    right: 1px;
                    background: rgba(220, 53, 69, 0.85);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 14px;
                    height: 14px;
                    font-size: 7px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>

            <div id="panel-preferencias">
                <h3>⚙️ Panel de Configuración</h3>

                <div class="campo-grupo">
                    <label for="input-res-nombre">Nombre del Resultado:</label>
                    <input type="text" id="input-res-nombre" class="input-columnas" placeholder="Nombre de la sección">
                </div>

                <div class="campo-grupo">
                    <label for="input-res-slug">ID del Resultado (Slug):</label>
                    <input type="text" id="input-res-slug" class="input-columnas" placeholder="identificador-slug">
                </div>

                <div class="campo-grupo">
                    <label for="input-res-fecha">Fecha:</label>
                    <input type="date" id="input-res-fecha" class="input-columnas">
                </div>

                <div class="campo-grupo">
                    <label for="input-res-tipo">Tipo:</label>
                    <select id="select-res-tipo" class="select-orden">
                        <option value="CSV">CSV</option>
                        <option value="JSON">JSON</option>
                    </select>
                </div>

                <div class="campo-grupo">
                    <label for="input-res-enlace">Enlace del Resultado (URL):</label>
                    <input type="url" id="input-res-enlace" class="input-columnas" placeholder="https://...">
                </div>

                <div class="campo-grupo">
                    <label for="input-url-qr">URL QR de Resultados:</label>
                    <input type="url" id="input-url-qr" class="input-columnas" placeholder="https://...">
                </div>

                <div class="gestor-imagenes-container">
                    <div class="opciones-subida-grid">
                        <div class="campo-grupo">
                            <label for="input-url-imagen">Imagen por URL:</label>
                            <div class="input-group">
                                <input type="text" id="input-url-imagen" class="input-columnas" placeholder="https://...">
                                <button class="btn-accion" id="btnAgregarUrl">Añadir</button>
                            </div>
                        </div>
                        <div class="campo-grupo">
                            <label for="input-file-imagen">Desde dispositivo:</label>
                            <input type="file" id="input-file-imagen" class="input-file-custom" accept="image/*">
                        </div>
                    </div>
                    <div class="campo-grupo">
                        <label>Imágenes actuales:</label>
                        <div class="lista-imagenes-previa" id="container-previa-imagenes"></div>
                    </div>
                </div>

                <div class="panel-columnas-container">
                    <div class="campo-grupo">
                        <label for="input-intervalo-refresco">Refresco (segundos):</label>
                        <input type="number" id="input-intervalo-refresco" class="input-numero" min="5" max="600" value="30">
                    </div>

                    <div class="campo-grupo">
                        <label for="input-tiempo-carrusel">Tiempo imagen carrusel (segundos):</label>
                        <input type="number" id="input-tiempo-carrusel" class="input-numero" min="1" max="60" value="2">
                    </div>

                    <div class="campo-grupo">
                        <label>Columnas a mostrar:</label>
                        <div id="container-chips-visibles" class="chips-container"></div>
                        <button class="btn-limpiar" id="btnMostrarTodasCols">Mostrar todas</button>
                    </div>

                    <div class="campo-grupo">
                        <label>Orden horizontal de columnas:</label>
                        <div id="container-chips-orden-elegido" class="chips-container"></div>
                        <div id="container-chips-orden-disponibles" class="chips-container" style="margin-top: 4px;"></div>
                        <button class="btn-limpiar" id="btnRestablecerOrdenCols">Restablecer orden</button>
                    </div>

                    <div class="campo-grupo">
                        <label for="select-columna-orden">Ordenar filas por:</label>
                        <div class="orden-select-container">
                            <select id="select-columna-orden" class="select-orden">
                                <option value="">Cargando...</option>
                            </select>
                            <select id="select-sentido-orden" class="select-orden">
                                <option value="desc" selected>Descendente</option>
                                <option value="asc">Ascendente</option>
                            </select>
                        </div>
                    </div>

                    <div class="checkbox-container">
                        <input type="checkbox" id="checkbox-mostrar-filtros" checked>
                        <label for="checkbox-mostrar-filtros">Mostrar filtros de búsqueda</label>
                    </div>
                </div>

                <div>
                    <button id="btnGuardarPreferencias" class="btn-guardar">💾 Guardar Preferencias</button>
                </div>
            </div>
        `;
    }

    async validarYCargarCsv(url) {
        if (!url) return alert("Introduce una URL de CSV válida.");
        try {
            const apiEndpoint = `/api/csv-to-json?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiEndpoint);
            const resJSON = await response.json();

            if (!response.ok || !resJSON.ok) {
                throw new Error(resJSON.error || "Error al procesar el archivo.");
            }

            if (resJSON.datos && resJSON.datos.length > 0) {
                this.columnasGlobales = Object.keys(resJSON.datos[0]);
                this.columnasVisibles = [...this.columnasGlobales];
                this.ordenColumnas = [];

                this.renderizarChipsVisibles();
                this.renderizarChipsOrden();
                alert(`✅ CSV validado con éxito. Se detectaron ${this.columnasGlobales.length} columnas.`);
            } else {
                alert("El archivo CSV está vacío o no tiene un formato válido.");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Error al validar el CSV: " + err.message);
        }
    }

    initListeners() {
        const shadow = this.shadowRoot;

        shadow.getElementById('btnValidarEnlace')?.addEventListener('click', () => {
            const url = shadow.getElementById('input-res-enlace').value.trim();
            this.validarYCargarCsv(url);
        });

        // Añadir imagen por URL
        shadow.getElementById('btnAgregarUrl').addEventListener('click', () => {
            const input = shadow.getElementById('input-url-imagen');
            if (!input.value.trim()) return;
            this.listaImagenes.push(input.value.trim());
            input.value = '';
            this.renderizarVistasPrevias();
        });

        // Añadir imagen por archivo local
        shadow.getElementById('input-file-imagen').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                this.listaImagenes.push(event.target.result);
                e.target.value = '';
                this.renderizarVistasPrevias();
            };
            reader.readAsDataURL(file);
        });

        // Botón Guardar (Dispara un evento personalizado hacia la página principal)
        shadow.getElementById('btnGuardarPreferencias').addEventListener('click', () => {
            const eventoGuardar = new CustomEvent('guardar-preferencias', {
                detail: this.obtenerDatosConfiguracion(),
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(eventoGuardar);
        });

        // Botón Mostrar todas las columnas
        shadow.getElementById('btnMostrarTodasCols').addEventListener('click', () => {
            this.columnasVisibles = [...this.columnasGlobales];
            this.renderizarChipsVisibles();
        });

        // Botón Restablecer orden
        shadow.getElementById('btnRestablecerOrdenCols').addEventListener('click', () => {
            this.ordenColumnas = [];
            this.renderizarChipsOrden();
        });
    }

    // Métodos públicos para alimentar el componente desde tu script principal
    setDatosIniciales(config, imagenes) {
        const shadow = this.shadowRoot;
        if (!shadow) return;
        
        // Usamos un respaldo con objeto vacío por si 'config' es null o undefined
        const c = config || {}; 

        const setVal = (id, val) => {
            const el = shadow.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('input-res-nombre', c.nombre);
        setVal('input-res-slug', c.slug);
        setVal('input-res-fecha', c.fecha);
        setVal('select-res-tipo', c.tipo || 'CSV');
        setVal('input-res-enlace', c.enlace);
        setVal('input-url-qr', c.url_qr_resultados);
        setVal('input-intervalo-refresco', c.intervaloRefresco || 30);
        setVal('input-tiempo-carrusel', c.tiempoImagenCarrusel || 2);
        
        const chk = shadow.getElementById('checkbox-mostrar-filtros');
        if (chk) chk.checked = c.mostrarFiltros !== false;

        this.listaImagenes = Array.isArray(imagenes) ? [...imagenes] : [];
        this.renderizarVistasPrevias();
    }

    setColumnas(globales, visibles, orden, colOrden, sentidoAsc) {
        this.columnasGlobales = globales;
        this.columnasVisibles = visibles;
        this.ordenColumnas = orden;

        this.renderizarChipsVisibles();
        this.renderizarChipsOrden();

        const selectCol = this.shadowRoot.getElementById('select-columna-orden');
        selectCol.innerHTML = globales.map(c => `<option value="${c}" ${c === colOrden ? 'selected' : ''}>${c}</option>`).join('');
        this.shadowRoot.getElementById('select-sentido-orden').value = sentidoAsc ? 'asc' : 'desc';
    }

    renderizarVistasPrevias() {
        const container = this.shadowRoot.getElementById('container-previa-imagenes');
        container.innerHTML = this.listaImagenes.map((url, idx) => `
            <div class="item-imagen-previa">
                <img src="${url}">
                <button class="btn-eliminar-img" data-idx="${idx}">✕</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-eliminar-img').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'), 10);
                this.listaImagenes.splice(idx, 1);
                this.renderizarVistasPrevias();
            });
        });
    }

    renderizarChipsVisibles() {
        const container = this.shadowRoot.getElementById('container-chips-visibles');
        container.innerHTML = this.columnasGlobales.map(col => {
            const activa = this.columnasVisibles.includes(col);
            return `<div class="chip-btn ${activa ? 'activo' : ''}" data-col="${col}">${activa ? '✓ ' : '+ '}${col}</div>`;
        }).join('');

        container.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.target.getAttribute('data-col');
                if (this.columnasVisibles.includes(col)) {
                    this.columnasVisibles = this.columnasVisibles.filter(c => c !== col);
                } else {
                    this.columnasVisibles.push(col);
                }
                this.renderizarChipsVisibles();
            });
        });
    }

    renderizarChipsOrden() {
        const containerElegidos = this.shadowRoot.getElementById('container-chips-orden-elegido');
        const containerDisponibles = this.shadowRoot.getElementById('container-chips-orden-disponibles');

        containerElegidos.innerHTML = this.ordenColumnas.map((col, idx) => `
            <div class="chip-btn orden-tag" data-col="${col}">${idx + 1}. ${col} ✕</div>
        `).join('') || '<span style="font-size:0.7em; color:#888;">Orden nativo</span>';

        containerDisponibles.innerHTML = this.columnasGlobales
            .filter(col => !this.ordenColumnas.includes(col))
            .map(col => `<div class="chip-btn" data-col="${col}">+ ${col}</div>`).join('');

        // Listeners para quitar/poner orden
        this.shadowRoot.querySelectorAll('#container-chips-orden-elegido .chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.target.getAttribute('data-col');
                this.ordenColumnas = this.ordenColumnas.filter(c => c !== col);
                this.renderizarChipsOrden();
            });
        });

        this.shadowRoot.querySelectorAll('#container-chips-orden-disponibles .chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.target.getAttribute('data-col');
                this.ordenColumnas.push(col);
                this.renderizarChipsOrden();
            });
        });
    }

    obtenerDatosConfiguracion() {
        const shadow = this.shadowRoot;
        return {
            nombre: shadow.getElementById('input-res-nombre').value.trim(),
            slug: shadow.getElementById('input-res-slug').value.trim(),
            fecha: shadow.getElementById('input-res-fecha').value,
            tipo: shadow.getElementById('select-res-tipo').value,
            enlace: shadow.getElementById('input-res-enlace').value.trim(),
            url_qr_resultados: shadow.getElementById('input-url-qr').value.trim(),
            intervaloRefresco: parseInt(shadow.getElementById('input-intervalo-refresco').value, 10) || 30,
            tiempoImagenCarrusel: parseInt(shadow.getElementById('input-tiempo-carrusel').value, 10) || 2,
            columnasMostrar: this.columnasVisibles,
            ordenVisual: this.ordenColumnas,
            columnaOrden: shadow.getElementById('select-columna-orden').value,
            sentidoOrden: shadow.getElementById('select-sentido-orden').value,
            mostrarFiltros: shadow.getElementById('checkbox-mostrar-filtros').checked,
            imagenes: this.listaImagenes
        };
    }
    
}

customElements.define('panel-preferencias-component', PanelPreferencias);