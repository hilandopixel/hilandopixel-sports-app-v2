const timeOffset = 60;
const photosFilename = './fotos.json';
const resultsFilename = './resultados.json';
const batchSize = 10;

let allImages = [];
let filteredImages = [];
let currentIndex = 0;
let loading = false;


        /**
         * Fetches and stores the results data from the JSON file.
         */
        async function loadResultsData() {
            if (window.resultsData) return;

            try {
                const res = await fetch(resultsFilename);
                const data = await res.json();
                // Assumes the data array is under the key 'data'
                window.resultsData = Array.isArray(data.data) ? data.data : [];
                console.log('Results data loaded successfully.');
            } catch (error) {
                console.error('Error loading results data:', error);
                alert('Error al cargar los datos de resultados. La búsqueda por dorsal y el listado de resultados no funcionarán.');
            }
        }

        /**
         * Fetches the photo gallery data and initiates results data loading.
         */
        async function loadImages() {
            // Load results data in the background
            await loadResultsData();

            try {
                const res = await fetch(photosFilename);
                const data = await res.json();
                let arrayData = Array.isArray(data) ? data : (data.photos || data.items || []);
                allImages = arrayData.sort((a, b) => a.date - b.date);
                filteredImages = allImages;
                currentIndex = 0;
                document.getElementById('gallery').innerHTML = '';
                updateProgress();
                loadNextBatch();
                window.addEventListener('scroll', handleScroll);
            } catch (error) {
                console.error('Error loading photo data:', error);
            }
        }

        // --- UPDATED: Results Table Rendering Function ---

        /**
         * Renders the results data into a card-view HTML structure, filtered by the input field.
         */
        function renderResultsTable() {
            const container = document.getElementById('resultsTableContainer');
            const input = document.getElementById('timeInput').value.trim();
            // Regex for time format (e.g., 01:15:30)
            const timeFormatRegex = /^\d{1,2}:\d{2}:\d{2}$/;

            if (!window.resultsData) {
                container.innerHTML = '<p class="text-center text-secondary">Cargando resultados...</p>';
                loadResultsData().then(() => renderResultsTable()); // Try again once loaded
                return;
            }

            let dataToRender = window.resultsData;

            if (input) {
                // If input looks like HH:mm:ss, filter by tiempo
                if (timeFormatRegex.test(input)) {
                    // Filter by TIEMPO (simple containment for partial match, but exact match is recommended for time)
                    dataToRender = window.resultsData.filter(item =>
                        String(item.tiempo).includes(input)
                    );
                } else {
                    // Otherwise, filter by DORSAL (simple containment)
                    dataToRender = window.resultsData.filter(item =>
                        String(item.dorsal).includes(input)
                    );
                }
            }

            if (dataToRender.length === 0) {
                container.innerHTML = '<p class="text-center text-danger">No se encontraron resultados para el filtro aplicado.</p>';
                return;
            }

            let htmlContent = '';

            dataToRender.forEach(item => {
                // Logic to separate nombre and apellidos (Assumes first word is name, rest are surnames)
                const nameParts = item.nombre.split(' ');
                let firstName = nameParts.length > 0 ? nameParts[0] : '';
                let lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

                htmlContent += `
                                <div class="result-item-card custom-hilandopixel">
                                    <span class="posicion">${item.posicion}</span>
                                    <strong class="custom-hilandopixel">${firstName} ${lastName}</strong>
                                    <span  class="custom-hilandopixel">Dorsal: ${item.dorsal}</span>
                                    <span  class="custom-hilandopixel">Tiempo: ${item.tiempo}</span>
                                    <span  class="custom-hilandopixel">Posicion: ${item.posicion}</span>
                                </div>
                            `;
            });

            container.innerHTML = htmlContent;
        }


        // --- Utility and Existing Functions (Minor Updates) ---

        function timeToSeconds(timeStr) {
            const parts = timeStr.split(':').map(Number);
            if (parts.length === 3 && parts.every(p => !isNaN(p))) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
            return NaN;
        }

        function createCard(item) {
            const card = document.createElement('div');
            card.className = 'card';

            const img = document.createElement('img');
            img.loading = 'lazy';
            img.dataset.src = item.imageurlresized;
            img.alt = 'Foto';
            observer.observe(img);

            const dateDiv = document.createElement('div');
            dateDiv.className = 'date';

            const link = document.createElement('a');
            link.className = 'custom-hilandopixel'
            link.href = item.imageurl;
            link.target = '_blank';
            link.textContent = 'Descargar Foto click aqui';
            link.style.display = 'block';
            link.style.padding = '0 10px 10px';
            link.style.fontSize = '12px';
            link.style.color = '#0066cc';
            link.style.textDecoration = 'none';
            link.onmouseover = () => link.style.textDecoration = 'underline';
            link.onmouseout = () => link.style.textDecoration = 'none';
            link.download = 'foto.jpg'
            card.appendChild(img);
            card.appendChild(dateDiv);
            card.appendChild(link);
            return card;
        }

        function loadNextBatch() {
            if (loading) return;
            loading = true;

            const gallery = document.getElementById('gallery');
            const nextItems = filteredImages.slice(currentIndex, currentIndex + batchSize);

            nextItems.forEach(item => {
                const card = createCard(item);
                gallery.appendChild(card);
            });

            currentIndex += nextItems.length;
            updateProgress();
            loading = false;
        }

        function handleScroll() {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
                if (currentIndex < filteredImages.length) {
                    loadNextBatch();
                }
            }
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    obs.unobserve(img);
                }
            });
        }, {
            rootMargin: '200px'
        });

        function filterByTime() {
            const input = document.getElementById('timeInput').value.trim();
            const timeFormatRegex = /^\d{1,2}:\d{2}:\d{2}$/;
            let timeToFilter = null;

            if (!input) {
                resetAllFilters();
                return;
            }

            if (timeFormatRegex.test(input)) {
                timeToFilter = input;

            } else {
                if (!window.resultsData || !Array.isArray(window.resultsData)) {
                    alert('Error: Datos de resultados no cargados. Intente recargar la página.');
                    return;
                }

                const runner = window.resultsData.find(item => String(item.dorsal).trim() === input);

                if (runner && runner.tiempo) {
                    timeToFilter = runner.tiempo;
                    document.getElementById('timeInput').value = timeToFilter;
                } else {
                    alert('Dorsal no encontrado o no tiene un tiempo válido asociado.');
                    resetAllFilters();
                    return;
                }
            }

            const inputSeconds = timeToSeconds(timeToFilter);

            if (isNaN(inputSeconds)) {
                alert('El tiempo asociado (' + timeToFilter + ') no es válido para filtrar.');
                resetAllFilters();
                return;
            }

            const lower = inputSeconds - timeOffset;
            const upper = inputSeconds + timeOffset;

            filteredImages = allImages.filter(img => {
                const itemSeconds = timeToSeconds(img.resulttime);
                return itemSeconds >= lower && itemSeconds <= upper;
            });


            currentIndex = 0;
            document.getElementById('gallery').innerHTML = '';
            updateProgress();
            loadNextBatch();
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });

            // OPTIONAL: Update results display immediately if it's open
            if (document.getElementById('resultsCollapse').classList.contains('show')) {
                renderResultsTable();
            }
        }

        function resetFilter(type) {
            if (type === 'time') {
                document.getElementById('timeInput').value = '';
            }
            resetAllFilters();
        }

        function resetAllFilters() {
            document.getElementById('timeInput').value = '';
            filteredImages = allImages;
            currentIndex = 0;
            document.getElementById('gallery').innerHTML = '';
            updateProgress();
            loadNextBatch();

            // NEW: Clear the results container when the filter is reset
            document.getElementById('resultsTableContainer').innerHTML = '';
        }

        function updateProgress() {
            const progress = document.getElementById('progress');
            const total = filteredImages.length;
            const shown = Math.min(currentIndex, total);
            if (total === 0) {
                progress.textContent = 'No hay imágenes para mostrar.';
            } else {
                progress.textContent = `Mostrando ${shown} / ${total} fotos`;
            }
        }
