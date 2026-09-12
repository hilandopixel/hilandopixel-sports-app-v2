import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId, generarSlugTexto } from './admin-eventos.js';

let unsubResultadosAdmin = null;
let listaImagenesMemoria = [];

let adminColumnasGlobales = [];
let adminColumnasVisibles = [];
let adminOrdenColumnas = [];

export function initAdminResultados() {
  document.getElementById("resNombre").addEventListener("input", (e) => {
    if (!eventoActualId) return;
    const idOriginal = document.getElementById("resIdOriginal").value;
    if (!idOriginal) {
      const slugRes = generarSlugTexto(e.target.value);
      document.getElementById("resIdCustom").value = slugRes ? `${eventoActualId}-${slugRes}` : eventoActualId;
    }
  });

  document.getElementById("btnValidarEnlace").addEventListener("click", async () => {
    const url = document.getElementById("resEnlace").value.trim();
    if (!url) return alert("Introduce una URL de CSV válida.");

    const popup = document.getElementById("loadingPopup");
    if (popup) popup.classList.remove("hidden");

    try {
      const apiEndpoint = `/api/csv-to-json?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiEndpoint);
      const resJSON = await response.json();

      if (!response.ok || !resJSON.ok) {
        throw new Error(resJSON.error || "Error al procesar el archivo.");
      }

      if (resJSON.datos && resJSON.datos.length > 0) {
        adminColumnasGlobales = Object.keys(resJSON.datos[0]);
        adminColumnasVisibles = [...adminColumnasGlobales];
        adminOrdenColumnas = [];

        renderizarChipsAdmin();
        alert(`✅ CSV validado con éxito. Se detectaron ${adminColumnasGlobales.length} columnas.`);
      } else {
        alert("El archivo CSV está vacío o no tiene un formato válido.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error al validar el CSV: " + err.message);
    } finally {
      if (popup) popup.classList.add("hidden");
    }
  });

  window.toggleAdminVisCol = function(col) {
    if (adminColumnasVisibles.includes(col)) {
      adminColumnasVisibles = adminColumnasVisibles.filter(c => c !== col);
    } else {
      adminColumnasVisibles.push(col);
    }
    renderizarChipsAdmin();
  };

  window.agregarAdminOrdenCol = function(col) {
    adminOrdenColumnas.push(col);
    renderizarChipsAdmin();
  };

  window.removerAdminOrdenCol = function(col) {
    adminOrdenColumnas = adminOrdenColumnas.filter(c => c !== col);
    renderizarChipsAdmin();
  };

  document.getElementById("btnNuevaSeccionResultado").addEventListener("click", () => {
    resetFormResultado();
    document.getElementById("resultadoForm").classList.remove("hidden");
  });

  document.getElementById("btnCancelarResultado").addEventListener("click", resetFormResultado);
  document.getElementById("resultadoForm").addEventListener("submit", guardarResultado);
}

function renderizarChipsAdmin() {
  const containerVisibles = document.getElementById("admin-container-chips-visibles");
  const containerElegidos = document.getElementById("admin-container-chips-orden-elegido");
  const containerDisponibles = document.getElementById("admin-container-chips-orden-disponibles");
  if (!containerVisibles) return;

  let htmlVis = "";
  adminColumnasGlobales.forEach(col => {
    const activa = adminColumnasVisibles.includes(col);
    htmlVis += `<button type="button" class="px-3 py-1 text-xs rounded-full border ${activa ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-300'}" data-col="${col}" onclick="window.toggleAdminVisCol('${col}')">${activa ? '✓ ' : '+ '}${col}</button>`;
  });
  containerVisibles.innerHTML = htmlVis;

  let htmlElegidos = "";
  adminOrdenColumnas.forEach((col, idx) => {
    htmlElegidos += `<button type="button" class="px-3 py-1 text-xs rounded-full bg-green-600 text-white" onclick="window.removerAdminOrdenCol('${col}')">${idx + 1}. ${col} ✕</button>`;
  });
  containerElegidos.innerHTML = htmlElegidos || '<span class="text-xs text-gray-400 italic">Ningún orden personalizado...</span>';

  let htmlDisp = "";
  adminColumnasGlobales.forEach(col => {
    if (!adminOrdenColumnas.includes(col)) {
      htmlDisp += `<button type="button" class="px-3 py-1 text-xs rounded-full bg-gray-100 border border-gray-300 text-gray-700" onclick="window.agregarAdminOrdenCol('${col}')">+ ${col}</button>`;
    }
  });
  if (containerDisponibles) containerDisponibles.innerHTML = htmlDisp;
}

function resetFormResultado() {
  document.getElementById("resultadoForm").reset();
  document.getElementById("resIdOriginal").value = "";
  adminColumnasGlobales = [];
  adminColumnasVisibles = [];
  adminOrdenColumnas = [];
  const cv = document.getElementById("admin-container-chips-visibles");
  const coe = document.getElementById("admin-container-chips-orden-elegido");
  const cod = document.getElementById("admin-container-chips-orden-disponibles");
  if (cv) cv.innerHTML = `<span class="text-xs text-gray-400 italic">Valida una URL de CSV arriba para cargar las columnas...</span>`;
  if (coe) coe.innerHTML = `<span class="text-xs text-gray-400 italic">Ningún orden personalizado...</span>`;
  if (cod) cod.innerHTML = "";
  document.getElementById("resultadoForm").classList.add("hidden");
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
          <a href="resultados.html?evento=${eventoId}&resultado=${resId}" target="_blank" class="btn-primary text-xs py-1 px-2 inline-block">Ver enlace</a>
          <button class="btn-secondary text-xs py-1 px-2 btn-editar-res" data-id="${resId}">Editar</button>
          <button class="btn-danger text-xs py-1 px-2 btn-del-res" data-id="${resId}">Borrar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });

    document.querySelectorAll(".btn-editar-res").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        const resDoc = snapshot.docs.find(d => d.id === id);
        if (!resDoc) return;
        const data = resDoc.data();

        document.getElementById("resIdOriginal").value = id;
        document.getElementById("resNombre").value = data.nombre || "";
        document.getElementById("resIdCustom").value = id;
        document.getElementById("resFecha").value = data.fecha || "";
        document.getElementById("resTipo").value = data.tipo || "CSV";
        document.getElementById("resEnlace").value = data.enlace || "";

        adminColumnasGlobales = Array.isArray(data.columnasMostrar) ? [...data.columnasMostrar] : [];
        adminColumnasVisibles = Array.isArray(data.columnasMostrar) ? [...data.columnasMostrar] : [];
        adminOrdenColumnas = Array.isArray(data.ordenVisual) ? [...data.ordenVisual] : [];

        renderizarChipsAdmin();

        document.getElementById("resultadoForm").classList.remove("hidden");
        document.getElementById("resultadoForm").scrollIntoView({ behavior: 'smooth' });
      });
    });

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

async function guardarResultado(e) {
  e.preventDefault();
  if (!eventoActualId) return;

  const idOriginal = document.getElementById("resIdOriginal").value;
  const nuevoId = generarSlugTexto(document.getElementById("resIdCustom").value);
  if (!nuevoId) return alert("El ID del resultado es obligatorio.");

  const resData = {
    nombre: document.getElementById("resNombre").value.trim(),
    fecha: document.getElementById("resFecha").value,
    tipo: document.getElementById("resTipo").value,
    enlace: document.getElementById("resEnlace").value.trim(),
    columnasMostrar: adminColumnasVisibles,
    ordenVisual: adminOrdenColumnas,
    directo: true,
    intervaloRefresco: 30
  };

  try {
    const nuevoDocRef = doc(db, "eventos", eventoActualId, "resultados", nuevoId);
    if (idOriginal && idOriginal !== nuevoId) {
      await deleteDoc(doc(db, "eventos", eventoActualId, "resultados", idOriginal));
    }
    await setDoc(nuevoDocRef, resData, { merge: true });
    alert("Sección de resultados guardada correctamente.");
    resetFormResultado();
  } catch (err) {
    alert("Error guardando el resultado: " + err.message);
  }
}