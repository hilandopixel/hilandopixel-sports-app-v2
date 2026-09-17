import { db } from '/firebase.config.js';
import { comprimirImagen } from '/js/utils.js';
import { collection, doc, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

class PanelPreferencias extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.listaImagenes = [];
        this.columnasGlobales = [];
        this.columnasVisibles = [];
        this.ordenColumnas = [];
        this.prefijoEventoActual = '';
        this.eventoId = '';
        this.resultadoId = '';
    }

    connectedCallback() {
        if (!this.shadowRoot.hasChildNodes()) {
            this.render();
            this.initListeners();
        }
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
                    <label for="input-res-enlace">Enlace del Resultado (URL del CSV):</label>
                    <div class="input-group" style="display:flex; gap:4px;">
                        <input type="url" id="input-res-enlace" class="input-columnas" placeholder="https://..." style="flex:1;">
                        <button type="button" id="btnValidarEnlace" class="btn-accion">🔍 Validar</button>
                    </div>
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
                        <div id="container-chips-visibles" class="chips-container">
                            <span style="font-size:0.7em; color:#888;">Valida una URL de CSV arriba para cargar columnas...</span>
                        </div>
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

                    <div class="campo-grupo">
                        <label for="input-mostrar-x-resultados">Mostrar solo X resultados (opcional):</label>
                        <input type="number" id="input-mostrar-x-resultados" class="input-numero" min="1" placeholder="Ej: 10">
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

    initListeners() {
        const shadow = this.shadowRoot;

        // Validar CSV
        shadow.getElementById('btnValidarEnlace')?.addEventListener('click', () => {
            const url = shadow.getElementById('input-res-enlace').value.trim();
            this.validarYCargarCsv(url);
        });

        // Slug automático basado en nombre del evento y nombre de resultado
        shadow.getElementById('input-res-nombre')?.addEventListener('input', (e) => {
            const inputSlug = shadow.getElementById('input-res-slug');
            if (!inputSlug) return;

            const nombreResultadoLimpio = this.generarSlug(e.target.value);
            const prefijoEvento = this.getPrefijoEventoAutomatico();

            if (prefijoEvento) {
                inputSlug.value = nombreResultadoLimpio ? `${prefijoEvento}-${nombreResultadoLimpio}` : prefijoEvento;
            } else {
                inputSlug.value = nombreResultadoLimpio;
            }
        });

        // Añadir imagen por URL
        shadow.getElementById('btnAgregarUrl').addEventListener('click', () => {
            const input = shadow.getElementById('input-url-imagen');
            if (!input.value.trim()) return;
            this.listaImagenes.push(input.value.trim());
            input.value = '';
            this.renderizarVistasPrevias();
        });

        // Añadir imagen por archivo local de forma segura
        const inputFile = shadow.getElementById('input-file-imagen');
        if (inputFile && !inputFile.dataset.bound) {
            inputFile.dataset.bound = "true";
            inputFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const imagenComprimidaBase64 = await comprimirImagen(file, 1200, 0.7);
                
                this.listaImagenes.push(imagenComprimidaBase64);
                this.renderizarVistasPrevias();
                
                if (inputFile) {
                    inputFile.value = '';
                }
            });
        }

        // Guardar Preferencias autónomo en Firebase
        shadow.getElementById('btnGuardarPreferencias').addEventListener('click', async () => {
            const datos = this.obtenerDatosConfiguracion();
            const nuevoId = this.generarSlug(datos.slug);

            if (!this.eventoId) {
                const inputSlug = shadow.getElementById('input-res-slug');
                const partesSlug = inputSlug ? inputSlug.value.split('-') : [];
                this.eventoId = window.eventoActualId || partesSlug.slice(0, -1).join('-') || new URLSearchParams(window.location.search).get('evento');
            }
            if (!this.eventoId) {
                return alert("⚠️ Error: No se ha detectado el ID del evento.");
            }
            if (!nuevoId) {
                return alert("⚠️ El ID del resultado (Slug) es obligatorio.");
            }

            const btn = shadow.getElementById('btnGuardarPreferencias');
            btn.disabled = true;
            btn.textContent = "⏳ Guardando...";

            try {
                const resData = {
                    nombre: datos.nombre,
                    fecha: datos.fecha,
                    tipo: datos.tipo,
                    enlace: datos.enlace,
                    url_qr_resultados: datos.url_qr_resultados,
                    columnasMostrar: datos.columnasMostrar,
                    ordenVisual: datos.ordenVisual,
                    columnaOrden: datos.columnaOrden,
                    sentidoOrden: datos.sentidoOrden,
                    mostrarFiltros: datos.mostrarFiltros,
                    directo: true,
                    intervaloRefresco: datos.intervaloRefresco,
                    tiempoImagenCarrusel: datos.tiempoImagenCarrusel,
                    imagenes: [] 
                };

                const nuevoDocRef = doc(db, "eventos", this.eventoId, "resultados", nuevoId);
                
                if (this.resultadoId && this.resultadoId !== nuevoId) {
                    await deleteDoc(doc(db, "eventos", this.eventoId, "resultados", this.resultadoId));
                }

                // 1. RESTAURADO: Guardar los datos del formulario en el documento principal de Firebase
                await setDoc(nuevoDocRef, resData, { merge: true });

                // 2. Guardar las imágenes en su subcolección independiente
                const subColRef = collection(db, "eventos", this.eventoId, "resultados", nuevoId, "imagenes_cabecera");
                const prevImgs = await getDocs(subColRef);
                for (const docItem of prevImgs.docs) {
                    await deleteDoc(docItem.ref);
                }

                for (let i = 0; i < this.listaImagenes.length; i++) {
                    const imgDocRef = doc(subColRef, `img_${i + 1}`);
                    await setDoc(imgDocRef, { url: this.listaImagenes[i], orden: i + 1 });
                }

                this.resultadoId = nuevoId;
                alert("✅ ¡Sección de resultados guardada correctamente en Firebase!");

                this.dispatchEvent(new CustomEvent('resultado-guardado', { 
                    detail: { id: nuevoId, datos: resData },
                    bubbles: true, 
                    composed: true 
                }));

            } catch (err) {
                console.error("Error al guardar:", err);
                alert("❌ Error al guardar: " + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "💾 Guardar Preferencias";
            }
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

    generarSlug(texto) {
        if (!texto) return '';
        return texto
            .toString()
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-+/g, "-");
    }

    getPrefijoEventoAutomatico() {
        const elEvento = document.getElementById("detalleEventoNombre");
        if (elEvento) {
            let texto = elEvento.textContent.replace("Gestión: ", "").trim();
            return this.generarSlug(texto);
        }
        return this.prefijoEventoActual || '';
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
                
                const selectCol = this.shadowRoot.getElementById('select-columna-orden');
                if (selectCol) {
                    selectCol.innerHTML = this.columnasGlobales.map(c => `<option value="${c}">${c}</option>`).join('');
                }

                alert(`✅ CSV validado con éxito. Se detectaron ${this.columnasGlobales.length} columnas.`);
            } else {
                alert("El archivo CSV está vacío o no tiene un formato válido.");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Error al validar el CSV: " + err.message);
        }
    }

    setDatosIniciales(config, imagenes) {
        const shadow = this.shadowRoot;
        if (!shadow) return;
        
        const c = config || {}; 
        this.eventoId = c.eventoId || '';
        this.resultadoId = c.slug || '';
        this.prefijoEventoActual = c.prefijoEvento || '';

        const setVal = (id, val) => {
            const el = shadow.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('input-mostrar-x-resultados', c.mostrarXResultados);
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
        this.columnasGlobales = globales || [];
        this.columnasVisibles = visibles || [];
        this.ordenColumnas = orden || [];

        this.renderizarChipsVisibles();
        this.renderizarChipsOrden();

        const shadow = this.shadowRoot;
        const selectCol = shadow.getElementById('select-columna-orden');
        if (selectCol && this.columnasGlobales.length > 0) {
            selectCol.innerHTML = this.columnasGlobales.map(c => `<option value="${c}" ${c === colOrden ? 'selected' : ''}>${c}</option>`).join('');
        }
        const selectSentido = shadow.getElementById('select-sentido-orden');
        if (selectSentido) {
            selectSentido.value = sentidoAsc ? 'asc' : 'desc';
        }
    }

    renderizarVistasPrevias() {
        const container = this.shadowRoot.getElementById('container-previa-imagenes');
        if (!container) return;

        container.innerHTML = this.listaImagenes.map((url, idx) => `
            <div class="item-imagen-previa">
                <img src="${url}">
                <button type="button" class="btn-eliminar-img" data-idx="${idx}">✕</button>
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
        if (!container) return;

        if (this.columnasGlobales.length === 0) {
            container.innerHTML = `<span style="font-size:0.7em; color:#888;">Valida una URL de CSV arriba para cargar columnas...</span>`;
            return;
        }

        container.innerHTML = this.columnasGlobales.map(col => {
            const activa = this.columnasVisibles.includes(col);
            return `<div class="chip-btn ${activa ? 'activo' : ''}" data-col="${col}">${activa ? '✓ ' : '+ '}${col}</div>`;
        }).join('');

        container.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.currentTarget.getAttribute('data-col');
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
        if (!containerElegidos || !containerDisponibles) return;

        containerElegidos.innerHTML = this.ordenColumnas.map((col, idx) => `
            <div class="chip-btn orden-tag" data-col="${col}">${idx + 1}. ${col} ✕</div>
        `).join('') || '<span style="font-size:0.7em; color:#888;">Ningún orden personalizado</span>';

        containerDisponibles.innerHTML = this.columnasGlobales
            .filter(col => !this.ordenColumnas.includes(col))
            .map(col => `<div class="chip-btn" data-col="${col}">+ ${col}</div>`).join('');

        containerElegidos.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.currentTarget.getAttribute('data-col');
                this.ordenColumnas = this.ordenColumnas.filter(c => c !== col);
                this.renderizarChipsOrden();
            });
        });

        containerDisponibles.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const col = e.currentTarget.getAttribute('data-col');
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
            imagenes: this.listaImagenes,
            mostrarXResultados: parseInt(shadow.getElementById('input-mostrar-x-resultados').value.trim(), 10) || 1000
        };
    }
}

customElements.define('panel-preferencias-component', PanelPreferencias);