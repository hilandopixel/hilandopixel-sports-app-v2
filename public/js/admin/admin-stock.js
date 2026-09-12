import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId } from './admin-eventos.js';

let unsubStock = null;
let unsubSolicitudes = null;

export function initAdminStock() {
  const stockForm = document.getElementById("stockForm");
  if (stockForm) {
    stockForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!eventoActualId) return;

      const talla = document.getElementById("stockTallaInput").value.trim();
      const cantidad = parseInt(document.getElementById("stockCantidadInput").value, 10);

      try {
        const stockRef = doc(db, "eventos", eventoActualId, "stock", talla);
        await setDoc(stockRef, { cantidad }, { merge: true });
        stockForm.reset();
      } catch (err) {
        alert("Error al guardar stock: " + err.message);
      }
    });
  }

  const btnExport = document.getElementById("btnExportarCSV");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const filas = document.querySelectorAll("#tablaSolicitudesAdmin tr");
      if(length === 0) return alert("No hay solicitudes para exportar.");

      let csv = "ID,Fecha,Nombre,Telefono,Email,Talla,Confirmado\n";
      filas.forEach(tr => {
        const cols = tr.querySelectorAll("td");
        if (cols.length > 0) {
          const dataRow = Array.from(cols).slice(0, 7).map(td => `"${td.innerText}"`);
          csv += dataRow.join(",") + "\n";
        }
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `solicitudes_${eventoActualId}.csv`;
      a.click();
    });
  }
}

export function cargarStockYRequestsEvento(eventoId) {
  if (unsubStock) unsubStock();
  if (unsubSolicitudes) unsubSolicitudes();

  const tablaStock = document.getElementById("tablaStockAdmin");
  const tablaSolicitudes = document.getElementById("tablaSolicitudesAdmin");

  // Escuchar Stock
  unsubStock = onSnapshot(collection(db, "eventos", eventoId, "stock"), (snapshot) => {
    if (!tablaStock) return;
    tablaStock.innerHTML = "";
    if (snapshot.empty) {
      tablaStock.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-400 text-xs">No hay tallas configuradas.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const tallaId = docSnap.id;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100";
      tr.innerHTML = `
        <td class="p-3 font-bold text-gray-900">${tallaId}</td>
        <td class="p-3 font-semibold text-primary">${data.cantidad}</td>
        <td class="p-3 text-right">
          <button class="btn-danger text-xs py-1 px-2 btn-del-stock" data-talla="${tallaId}">Borrar</button>
        </td>
      `;
      tablaStock.appendChild(tr);
    });

    tablaStock.querySelectorAll(".btn-del-stock").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const talla = e.target.getAttribute("data-talla");
        if (confirm(`¿Eliminar la talla ${talla}?`)) {
          await deleteDoc(doc(db, "eventos", eventoId, "stock", talla));
        }
      });
    });
  });

  // Escuchar Solicitudes
  unsubSolicitudes = onSnapshot(collection(db, "eventos", eventoId, "solicitudes"), (snapshot) => {
    if (!tablaSolicitudes) return;
    tablaSolicitudes.innerHTML = "";
    if (snapshot.empty) {
      tablaSolicitudes.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-gray-400 text-xs">No hay inscripciones registradas.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const solId = docSnap.id;
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString() : 'Pendiente';

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100 text-xs";
      tr.innerHTML = `
        <td class="p-3 font-mono">${solId.substring(0, 6)}...</td>
        <td class="p-3">${fecha}</td>
        <td class="p-3 font-semibold">${data.nombre} ${data.apellidos}</td>
        <td class="p-3">${data.telefono}</td>
        <td class="p-3">${data.email}</td>
        <td class="p-3 font-bold">${data.talla}</td>
        <td class="p-3 text-center">${data.confirmado ? '✅' : '❌'}</td>
        <td class="p-3 text-right">
          <button class="btn-danger text-xs py-1 px-2 btn-del-sol" data-id="${solId}">Borrar</button>
        </td>
      `;
      tablaSolicitudes.appendChild(tr);
    });

    tablaSolicitudes.querySelectorAll(".btn-del-sol").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("¿Eliminar solicitud?")) {
          await deleteDoc(doc(db, "eventos", eventoId, "solicitudes", id));
        }
      });
    });
  });
}