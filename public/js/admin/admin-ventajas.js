import { db } from '../../firebase.config.js';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { eventoActualId } from './admin-eventos.js';
import { comprimirImagen } from '/js/utils.js';

let unsubVentajas = null;
let fotoVentajaActual = null; 

export function initAdminVentajas() {
  const form = document.getElementById("ventajaForm");
  const inputArchivoFoto = document.getElementById("vFotoFile");

  // Escuchar subida de archivo local desde el dispositivo
  if (inputArchivoFoto && !inputArchivoFoto.dataset.bound) {
    inputArchivoFoto.dataset.bound = "true";
    inputArchivoFoto.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Comprimir imagen usando la función de tu proyecto
        const imagenComprimidaBase64 = await comprimirImagen(file, 1200, 0.7);
        fotoVentajaActual = imagenComprimidaBase64;
        
        // Rellenar opcionalmente el input de URL visualmente para que el usuario sepa que hay una foto cargada
        document.getElementById("vFoto").value = "[Imagen cargada desde dispositivo]";
      } catch (err) {
        alert("Error al procesar la imagen: " + err.message);
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!eventoActualId) return;

      const editId = document.getElementById("ventajaIdEdit").value;

      // Si el usuario escribió una URL manual en lugar de subir archivo, la respetamos
      const urlManual = document.getElementById("vFoto").value.trim();
      if (urlManual && !urlManual.startsWith("[Imagen cargada")) {
        fotoVentajaActual = urlManual;
      }
      
      // Procesar códigos separados por comas a un Array limpio
      const codigosRaw = document.getElementById("vCodigos").value;
      const codigosArray = codigosRaw ? codigosRaw.split(',').map(c => c.trim()).filter(Boolean) : [];
    
    const ventajaData = {
        nombre: document.getElementById("vNombre").value.trim(),
        fechaCaducidad: document.getElementById("vFecha").value || null,
        foto: fotoVentajaActual || null,
        htmlEmbedded: document.getElementById("vHtml").value.trim() || null,
        descripcion: document.getElementById("vDesc").value.trim() || null,
        actionButton: document.getElementById("vAction").value.trim() || null,
        textButton: document.getElementById("vTextBtn").value.trim() || null,
        codigos: codigosArray
      };

      try {
        const ventajaRef = editId 
          ? doc(db, "eventos", eventoActualId, "ventajas", editId)
          : doc(collection(db, "eventos", eventoActualId, "ventajas"));

        await setDoc(ventajaRef, ventajaData, { merge: true });
        form.reset();
        document.getElementById("ventajaIdEdit").value = "";
        document.getElementById("btnCancelarVentaja").classList.add("hidden");
      } catch (err) {
        alert("Error al guardar ventaja: " + err.message);
      }
    });
  }

  const btnCancelar = document.getElementById("btnCancelarVentaja");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      document.getElementById("ventajaForm").reset();
      document.getElementById("ventajaIdEdit").value = "";
      btnCancelar.classList.add("hidden");
    });
  }
}

export function cargarVentajasEvento(eventoId) {
    console.log('evento', eventoId)
  if (unsubVentajas) unsubVentajas();
  const tabla = document.getElementById("tablaVentajasAdmin");
  if (!tabla) return;

  unsubVentajas = onSnapshot(collection(db, "eventos", eventoId, "ventajas"), (snapshot) => {
    tabla.innerHTML = "";
    if (snapshot.empty) {
      tabla.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400 text-xs">No hay ventajas registradas.</td></tr>`;
      return;
    }
    console.log('hola')
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
console.log('ccc ')
console.log(data)
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b border-gray-100 text-xs";
      tr.innerHTML = `
        <td class="p-3 font-bold text-gray-900">${data.nombre}</td>
        <td class="p-3 text-gray-500">${data.fechaCaducidad || 'Sin caducidad'}</td>
        <td class="p-3 font-mono">${data.codigos ? data.codigos.length + ' códigos' : '0 códigos'}</td>
        <td class="p-3 text-right space-x-1">
          <button class="btn-secondary text-xs py-1 px-2 btn-editar-ven" data-id="${id}">Editar</button>
          <button class="btn-danger text-xs py-1 px-2 btn-del-ven" data-id="${id}">Borrar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });

    tabla.querySelectorAll(".btn-editar-ven").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        const docEncontrado = snapshot.docs.find(d => d.id === id);
        if (!docEncontrado) return;
        const data = docEncontrado.data();

        document.getElementById("ventajaIdEdit").value = id;
        document.getElementById("vNombre").value = data.nombre || "";
        document.getElementById("vFecha").value = data.fechaCaducidad || "";
        fotoVentajaActual = data.foto || null;
        document.getElementById("vFoto").value = data.foto ? (data.foto.startsWith("data:") ? "[Imagen cargada desde dispositivo]" : data.foto) : "";
        document.getElementById("vHtml").value = data.htmlEmbedded || "";
        document.getElementById("vDesc").value = data.descripcion || "";
        document.getElementById("vAction").value = data.actionButton || "";
        document.getElementById("vTextBtn").value = data.textButton || "";
        document.getElementById("vCodigos").value = data.codigos ? data.codigos.join(', ') : "";

        document.getElementById("btnCancelarVentaja").classList.remove("hidden");
        document.getElementById("ventajaForm").scrollIntoView({ behavior: 'smooth' });
      });
    });

    tabla.querySelectorAll(".btn-del-ven").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("¿Estás seguro de eliminar esta ventaja?")) {
          await deleteDoc(doc(db, "eventos", eventoId, "ventajas", id));
        }
      });
    });
  });
}