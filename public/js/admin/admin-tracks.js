import { db } from '../../firebase.config.js';
import { collection, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let unsubTracks = null;

export function cargarTracksEvento(eventoId) {
  const btnNuevo = document.getElementById('btnAbrirEditorTrack') || document.getElementById('btnNuevoTrack');
  
  if (btnNuevo) {
    btnNuevo.onclick = () => {
      if (!eventoId) {
        alert("Por favor, selecciona un evento primero.");
        return;
      }
      // Guardar evento activo en sesión antes de abrir el editor
      sessionStorage.setItem('eventoActivoTrack', eventoId);
      window.open(`gpxutils?evento=${eventoId}`, '_blank');
    };
  }
  
  if (unsubTracks) unsubTracks();
  const tbody = document.getElementById("tablaTracksAdmin");
  if (!tbody || !eventoId) return;

  tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-xs">Cargando tracks...</td></tr>`;

  unsubTracks = onSnapshot(collection(db, "eventos", eventoId, "tracks"), (snapshot) => {
    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-xs">No hay tracks registrados en este evento.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const trackId = docSnap.id;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100 text-xs";
      tr.innerHTML = `
        <td class="p-3 font-bold text-gray-900">${data.title || trackId}</td>
        <td class="p-3 font-mono text-gray-600">${trackId}</td>
        <td class="p-3 text-gray-500">${data.waypoints ? data.waypoints.length : 0} puntos</td>
        <td class="p-3 text-right space-x-1">
          <!-- Al hacer clic en Ver Pública, guardamos ambos valores en sessionStorage -->
          <a href="tracks?track=${trackId}&evento=${eventoId}" target="_blank" 
             onclick="sessionStorage.setItem('eventoActivoVista', '${eventoId}'); sessionStorage.setItem('trackActivoVista', '${trackId}');" 
             class="btn-secondary text-xs py-1 px-2">Ver Pública</a>
          <button data-id="${trackId}" class="btn-danger text-xs py-1 px-2 btn-del-track">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-del-track").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm(`¿Estás seguro de eliminar el track "${id}"?`)) {
          await deleteDoc(doc(db, "eventos", eventoId, "tracks", id));
        }
      });
    });
  });
}