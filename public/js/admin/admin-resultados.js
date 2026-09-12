import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId, generarSlugTexto } from './admin-eventos.js';

let unsubResultadosAdmin = null;

export function initAdminResultados() {
  const panelComp = document.getElementById("miPanelPrefs");

  // Slug automático al escribir el nombre del resultado dentro del componente
  if (panelComp) {
    panelComp.shadowRoot.addEventListener("input", (e) => {
      if (e.target.id === "input-res-nombre" && eventoActualId) {
        const shadow = panelComp.shadowRoot;
        const idOriginal = shadow.getElementById("input-res-slug").value; // Puedes usar un campo oculto o el slug actual
        const slugRes = generarSlugTexto(e.target.value);
        if (!idOriginal.includes("-")) { // Si es un registro nuevo
            shadow.getElementById("input-res-slug").value = slugRes ? `${eventoActualId}-${slugRes}` : eventoActualId;
        }
      }
    });
  }

  // Botón para crear nueva sección
  document.getElementById("btnNuevaSeccionResultado").addEventListener("click", () => {
    if (panelComp) {
      panelComp.setDatosIniciales({
        slug: eventoActualId ? `${eventoActualId}-` : ''
      }, []);
      panelComp.setColumnas([], [], [], '', true);
    }
    document.getElementById("contenedorFormularioResultado").classList.remove("hidden");
  });

  // Botón cancelar
  document.getElementById("btnCancelarResultado").addEventListener("click", () => {
    document.getElementById("contenedorFormularioResultado").classList.add("hidden");
  });

  // Escuchar cuando el componente emita el evento de guardar
  document.addEventListener("guardar-preferencias", async (e) => {
    e.stopPropagation();
    if (!eventoActualId) return;

    const datos = e.detail;
    const nuevoId = generarSlugTexto(datos.slug);
    if (!nuevoId) return alert("El ID del resultado es obligatorio.");

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
      tiempoImagenCarrusel: datos.tiempoImagenCarrusel
    };

    try {
      const nuevoDocRef = doc(db, "eventos", eventoActualId, "resultados", nuevoId);
      await setDoc(nuevoDocRef, resData, { merge: true });
      alert("Sección de resultados guardada correctamente.");
      document.getElementById("contenedorFormularioResultado").classList.add("hidden");
    } catch (err) {
      alert("Error guardando el resultado: " + err.message);
    }
  });
}

export function cargarResultadosEvento(eventoId) {
  if (unsubResultadosAdmin) unsubResultadosAdmin();
  const tabla = document.getElementById("tablaResultadosAdmin");
  if (!tabla) return;

  unsubResultadosAdmin = onSnapshot(collection(db, "eventos", eventoId, "resultados"), (snapshot) => {
    tabla.innerHTML = "";
    if (snapshot.empty) {
      tabla.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-400 text-xs">Sin secciones de resultados.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const resId = docSnap.id;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100";
      tr.innerHTML = `
        <td class="p-3 font-bold text-gray-900">${data.nombre}</td>
        <td class="p-3 font-mono text-xs text-gray-500">${resId}</td>
        <td class="p-3 text-right space-x-1">
            <button class="btn-secondary text-xs py-1 px-2 btn-generar-qr" data-id="${resId}" data-nombre="${data.nombre}" data-urlqr="${data.url_qr_resultados || ''}">Generar QR</button>
            <a href="resultados-pantalla.html?evento=${eventoId}&resultado=${resId}" target="_blank" class="btn-primary text-xs py-1 px-2 inline-block">Ver enlace</a>
            <button class="btn-secondary text-xs py-1 px-2 btn-editar-res" data-id="${resId}">Editar</button>
            <button class="btn-danger text-xs py-1 px-2 btn-del-res" data-id="${resId}">Borrar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });

    // Evento Editar
    document.querySelectorAll(".btn-editar-res").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const resDoc = snapshot.docs.find(d => d.id === id);
        if (!resDoc) return;
        const data = resDoc.data();

        // 1. Cargar las imágenes desde la subcolección 'imagenes_cabecera' (igual que en la vista pública)
        const subColRef = collection(db, "eventos", eventoActualId, "resultados", id, "imagenes_cabecera");
        const imgsSnap = await getDocs(subColRef);
        let imagenesCargadas = [];
        imgsSnap.forEach(imgDoc => {
            if (imgDoc.data().url) imagenesCargadas.push(imgDoc.data().url);
        });

        // 2. Fallback por si estuvieran guardadas directamente en el array del documento
        if (imagenesCargadas.length === 0 && data.imagenes) {
            imagenesCargadas = Array.isArray(data.imagenes) ? data.imagenes : [];
        }

        // 3. Enviar los datos y las imágenes recuperadas al Web Component
        const panelComp = document.getElementById("miPanelPrefs");
        if (panelComp) {
          panelComp.setDatosIniciales({
            ...data,
            slug: id
          }, imagenesCargadas);
          
          const cols = data.columnasMostrar || [];
          panelComp.setColumnas(cols, cols, data.ordenVisual || [], data.columnaOrden || '', data.sentidoOrden === 'asc');
        }

        document.getElementById("contenedorFormularioResultado").classList.remove("hidden");
        document.getElementById("contenedorFormularioResultado").scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Evento Borrar
    document.querySelectorAll(".btn-del-res").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("¿Eliminar resultado?")) {
          await deleteDoc(doc(db, "eventos", eventoId, "resultados", id));
        }
      });
    });
  });
}

// Lógica global del Modal QR
document.addEventListener("click", (e) => {
  if (e.target && e.target.classList.contains("btn-generar-qr")) {
    const resNombre = e.target.getAttribute("data-nombre");
    const urlQr = e.target.getAttribute("data-urlqr");
    const eventoNombreEl = document.getElementById("detalleEventoNombre");
    const eventoNombre = eventoNombreEl ? eventoNombreEl.textContent.replace("Gestión: ", "") : "Evento";

    if (!urlQr) {
      return alert("⚠️ Esta sección de resultados no tiene configurada ninguna 'URL QR Resultados'. Edítala para añadirla.");
    }

    document.getElementById("modalQrEventoNombre").textContent = eventoNombre;
    document.getElementById("modalQrResultadoNombre").textContent = resNombre;
    document.getElementById("modalQrUrlTexto").textContent = urlQr;

    const contenedorQr = document.getElementById("contenedorQrCanvas");
    contenedorQr.innerHTML = "";
    
    new QRCode(contenedorQr, {
      text: urlQr,
      width: 180,
      height: 180,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById("modalQrResultados").classList.remove("hidden");
  }
});

document.getElementById("cerrarModalQr")?.addEventListener("click", () => {
  document.getElementById("modalQrResultados").classList.add("hidden");
});

document.getElementById("btnImprimirQr")?.addEventListener("click", () => {
  window.print();
});

document.getElementById("btnDescargarPdfQr")?.addEventListener("click", () => {
  window.print();
});