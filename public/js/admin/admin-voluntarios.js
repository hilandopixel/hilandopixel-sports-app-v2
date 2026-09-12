import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId } from './admin-eventos.js';

let unsubVoluntarios = null;

export function initAdminVoluntarios() {
  document.getElementById("voluntarioForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!eventoActualId) return;

    const editId = document.getElementById("voluntarioIdEdit").value;
    const volData = {
      nombre: document.getElementById("volNombre").value.trim(),
      apellidos: document.getElementById("volApellidos").value.trim(),
      telefono: document.getElementById("volTelefono").value.trim(),
      telEmergencia: document.getElementById("volTelEmergencia").value.trim(),
      responsable: document.getElementById("volResponsable").value.trim(),
      coordDesignada: document.getElementById("volCoordDesignada").value.trim(),
      coordReal: document.getElementById("volCoordReal").value.trim()
    };

    try {
      const volRef = editId 
        ? doc(db, "eventos", eventoActualId, "personal", editId)
        : doc(collection(db, "eventos", eventoActualId, "personal"));

      await setDoc(volRef, volData, { merge: true });
      document.getElementById("voluntarioForm").reset();
      document.getElementById("voluntarioIdEdit").value = "";
      document.getElementById("btnCancelarVoluntario").classList.add("hidden");
    } catch (err) {
      alert("Error al guardar voluntario: " + err.message);
    }
  });

  document.getElementById("btnCancelarVoluntario").addEventListener("click", () => {
    document.getElementById("voluntarioForm").reset();
    document.getElementById("voluntarioIdEdit").value = "";
    document.getElementById("btnCancelarVoluntario").classList.add("hidden");
  });
}

export function cargarVoluntariosEvento(eventoId) {
  if (unsubVoluntarios) unsubVoluntarios();
  const tabla = document.getElementById("tablaVoluntariosAdmin");

  unsubVoluntarios = onSnapshot(collection(db, "eventos", eventoId, "personal"), (snapshot) => {
    tabla.innerHTML = "";
    if (snapshot.empty) {
      tabla.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 text-xs">No hay personal registrado.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100 text-xs";
      tr.innerHTML = `
        <td class="p-3 font-bold text-gray-900">${data.nombre} ${data.apellidos}</td>
        <td class="p-3">Tel: ${data.telefono}<br>Emerg: ${data.telEmergencia}</td>
        <td class="p-3">${data.responsable}</td>
        <td class="p-3 font-mono">Des: ${data.coordDesignada || 'N/A'}<br>Real: ${data.coordReal || 'N/A'}</td>
        <td class="p-3 text-right space-x-1">
          <button class="btn-secondary text-xs py-1 px-2 btn-editar-vol" data-id="${id}">Editar</button>
          <button class="btn-danger text-xs py-1 px-2 btn-del-vol" data-id="${id}">Borrar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });

    tabla.querySelectorAll(".btn-editar-res, .btn-editar-vol").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const docEncontrado = snapshot.docs.find(d => d.id === id);
        if (!docEncontrado) return;
        const data = docEncontrado.data();

        document.getElementById("voluntarioIdEdit").value = id;
        document.getElementById("volNombre").value = data.nombre || "";
        document.getElementById("volApellidos").value = data.apellidos || "";
        document.getElementById("volTelefono").value = data.telefono || "";
        document.getElementById("volTelEmergencia").value = data.telEmergencia || "";
        document.getElementById("volResponsable").value = data.responsable || "";
        document.getElementById("volCoordDesignada").value = data.coordDesignada || "";
        document.getElementById("volCoordReal").value = data.coordReal || "";
        document.getElementById("btnCancelarVoluntario").classList.remove("hidden");
      });
    });

    tabla.querySelectorAll(".btn-del-vol").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("¿Eliminar voluntario?")) {
          await deleteDoc(doc(db, "eventos", eventoId, "personal", id));
        }
      });
    });
  });
}