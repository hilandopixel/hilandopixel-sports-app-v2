import { db } from '../../../firebase.config.js';
import { collection, doc, onSnapshot, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId } from './admin-eventos.js';

let unsubResultadosAdmin = null;

export function initAdminResultados() {
  const panelComp = document.getElementById("miPanelPrefs");

  // Botón para crear nueva sección
  document.getElementById("btnNuevaSeccionResultado").addEventListener("click", async () => {
    const panelComp = document.getElementById("miPanelPrefs");
    if (panelComp) {
      await customElements.whenDefined('panel-preferencias-component');
      panelComp.setDatosIniciales({
        slug: eventoActualId ? `${eventoActualId}-` : '',
        eventoId: eventoActualId
      }, []);
      if (typeof panelComp.setColumnas === 'function') {
          panelComp.setColumnas([], [], [], '', true);
      }
    }
    document.getElementById("contenedorFormularioResultado").classList.remove("hidden");
    document.getElementById("contenedorFormularioResultado").scrollIntoView({ behavior: 'smooth' });
  });

  // Botón cancelar
  document.getElementById("btnCancelarResultado").addEventListener("click", () => {
    document.getElementById("contenedorFormularioResultado").classList.add("hidden");
  });

  // Escuchar cuando el componente termine de guardar por sí mismo en Firebase
  document.addEventListener("resultado-guardado", () => {
    document.getElementById("contenedorFormularioResultado").classList.add("hidden");
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
            <a href="resultados-pantalla?evento=${eventoId}&resultado=${resId}" target="_blank" class="btn-primary text-xs py-1 px-2 inline-block">Ver enlace</a>
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

        // Cargar las imágenes desde la subcolección 'imagenes_cabecera'
        const subColRef = collection(db, "eventos", eventoId, "resultados", id, "imagenes_cabecera");
        const imgsSnap = await getDocs(subColRef);
        let imagenesCargadas = [];
        imgsSnap.forEach(imgDoc => {
            if (imgDoc.data().url) imagenesCargadas.push(imgDoc.data().url);
        });

        if (imagenesCargadas.length === 0 && data.imagenes) {
            imagenesCargadas = Array.isArray(data.imagenes) ? data.imagenes : [];
        }

        const panelComp = document.getElementById("miPanelPrefs");
        if (panelComp) {
          await customElements.whenDefined('panel-preferencias-component');
          panelComp.setDatosIniciales({
            ...data,
            slug: id,
            eventoId: eventoId
          }, imagenesCargadas);
          
          const cols = data.columnasMostrar || [];
          if (typeof panelComp.setColumnas === 'function') {
              panelComp.setColumnas(cols, cols, data.ordenVisual || [], data.columnaOrden || '', data.sentidoOrden === 'asc');
          }
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