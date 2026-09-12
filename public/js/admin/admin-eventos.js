import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { cargarResultadosEvento } from './admin-resultados.js';
import { cargarStockYRequestsEvento } from './admin-stock.js';
import { cargarVoluntariosEvento } from './admin-voluntarios.js';

export let eventoActualId = null;
let snapshotEventosGlobal = null;

export function generarSlugTexto(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

export function activarPestana(targetId) {
  document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(b => {
    b.classList.remove("bg-primary", "text-white", "shadow-sm");
    b.classList.add("bg-gray-100", "text-gray-600", "hover:bg-gray-200");
  });
  const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
  if (btn) btn.classList.add("bg-primary", "text-white", "shadow-sm");
  document.getElementById(targetId).classList.remove("hidden");
}

export function initAdminEventos() {
  const tablaEventos = document.getElementById("tablaEventos");

  onSnapshot(collection(db, "eventos"), (snapshot) => {
    snapshotEventosGlobal = snapshot;
    tablaEventos.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const badgesHtml = `
        ${data.finalizado ? '<span class="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 font-bold rounded">🏁 FINALIZADO</span>' : ''}
        ${data.oculto ? '<span class="px-2 py-0.5 text-[10px] bg-gray-200 text-gray-700 font-bold rounded">👁️ OCULTO</span>' : ''}
        ${!data.finalizado && !data.oculto ? '<span class="px-2 py-0.5 text-[10px] bg-green-100 text-green-700 font-bold rounded">✅ ACTIVO</span>' : ''}
      `;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100";
      tr.innerHTML = `
        <td class="p-3 font-mono text-xs font-bold text-gray-600">${id}</td>
        <td class="p-3 font-semibold text-gray-900">${data.nombre}</td>
        <td class="p-3"><div class="flex flex-wrap gap-1">${badgesHtml}</div></td>
        <td class="p-3 text-gray-500">${data.fecha || 'N/A'}</td>
        <td class="p-3 text-right space-x-1">
          <button class="btn-secondary text-xs py-1 px-2 btn-editar-ev" data-id="${id}">Editar</button>
          <button class="btn-danger text-xs py-1 px-2 btn-borrar-ev" data-id="${id}">Borrar</button>
        </td>
      `;
      tablaEventos.appendChild(tr);
    });

    document.querySelectorAll(".btn-editar-ev").forEach(btn => {
      btn.addEventListener("click", (e) => seleccionarEvento(e.target.getAttribute("data-id")));
    });

    document.querySelectorAll(".btn-borrar-ev").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("⚠️ ¿Estás seguro de ELIMINAR todo el evento?")) {
          await deleteDoc(doc(db, "eventos", id));
          document.getElementById("seccionDetalleEvento").classList.add("hidden");
        }
      });
    });
  });

  document.getElementById("btnNuevoEventoGlobal").addEventListener("click", () => {
    document.getElementById("eventoForm").reset();
    document.getElementById("eventoIdEdit").value = "";
    eventoActualId = null;
    document.getElementById("detalleEventoNombre").textContent = "Creando Nuevo Evento";
    document.getElementById("seccionDetalleEvento").classList.remove("hidden");
    activarPestana("tabDetalles");
  });

  document.getElementById("eventoForm").addEventListener("submit", guardarEvento);
}

function seleccionarEvento(id) {
  eventoActualId = id;
  const evDoc = snapshotEventosGlobal.docs.find(d => d.id === id);
  if (!evDoc) return;
  const data = evDoc.data();

  document.getElementById("detalleEventoNombre").textContent = "Gestión: " + data.nombre;
  document.getElementById("seccionDetalleEvento").classList.remove("hidden");

  document.getElementById("eventoIdEdit").value = id;
  document.getElementById("evSlug").value = id;
  document.getElementById("evNombre").value = data.nombre || "";
  document.getElementById("evFecha").value = data.fecha || "";
  document.getElementById("evHora").value = data.hora || "";
  document.getElementById("evColor").value = data.color || "#5da999";
  document.getElementById("evDesc").value = data.descripcion || "";
  document.getElementById("evImagenUrl").value = data.imagen || "";
  document.getElementById("evLat").value = data.latitud || "";
  document.getElementById("evLng").value = data.longitud || "";
  document.getElementById("evFinalizado").checked = Boolean(data.finalizado);
  document.getElementById("evOculto").checked = Boolean(data.oculto);

  activarPestana("tabDetalles");
  
  cargarResultadosEvento(id);
  cargarStockYRequestsEvento(id);
  cargarVoluntariosEvento(id);

  document.getElementById("seccionDetalleEvento").scrollIntoView({ behavior: 'smooth' });
}

async function guardarEvento(e) {
  e.preventDefault();
  const oldId = document.getElementById("eventoIdEdit").value;
  const newId = generarSlugTexto(document.getElementById("evSlug").value);

  const eventoData = {
    nombre: document.getElementById("evNombre").value.trim(),
    slug: newId,
    fecha: document.getElementById("evFecha").value,
    hora: document.getElementById("evHora").value,
    color: document.getElementById("evColor").value,
    descripcion: document.getElementById("evDesc").value.trim(),
    imagen: document.getElementById("evImagenUrl").value.trim(),
    latitud: document.getElementById("evLat").value.trim(),
    longitud: document.getElementById("evLng").value.trim(),
    finalizado: document.getElementById("evFinalizado").checked,
    oculto: document.getElementById("evOculto").checked
  };

  try {
    if (oldId && oldId !== newId) {
      await setDoc(doc(db, "eventos", newId), eventoData);
      await deleteDoc(doc(db, "eventos", oldId));
      eventoActualId = newId;
    } else {
      await setDoc(doc(db, "eventos", newId), eventoData, { merge: true });
      eventoActualId = newId;
    }
    alert("Evento guardado correctamente.");
    seleccionarEvento(newId);
  } catch (err) {
    alert("Error: " + err.message);
  }
}