Carga el JSON generado
export async function getDocsMock(jsonPath = './califa2026/imagenes_cabecera.json') {
  const response = await fetch(jsonPath);
  const data = await response.json();

  // data.imagenes_cabecera contiene { img_1: {...}, img_2: {...} }
  const rawCollection = data.imagenes_cabecera || {};

  // Convertimos las llaves del objeto en un array de "documentos" estilo Firestore
  const docs = Object.entries(rawCollection).map(([id, docData]) => ({
    id: id,
    data: () => docData,
    exists: () => true
  }));

  // Simula el objeto QuerySnapshot de Firestore
  return {
    docs: docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback) => docs.forEach(callback)
  };
}