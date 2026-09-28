import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function tornarPdfRellenable() {
    // 1. Cargar el PDF original
    const pdfBytes = fs.readFileSync('acuerdo_voluntarios.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 2. Obtener el formulario interactivo (AcroForm) del documento
    const form = pdfDoc.getForm();

    // 3. Obtener la página donde quieres añadir el campo (ej. la primera página -> índice 0)
    const pages = pdfDoc.getPages();

    // 4. Crear un campo de texto interactivo
    const campoNombre = form.createTextField('nombre_1');
    campoNombre.setText('');
    campoNombre.addToPage(pages[0], {
        x: 210,           // Coordenada X desde la esquina inferior izquierda
        y: 535,           // Coordenada Y desde la esquina inferior izquierda
        width: 300,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    const campoDni = form.createTextField('dni_1');
    campoDni.setText('');
    campoDni.addToPage(pages[0], {
        x: 280,           // Coordenada X desde la esquina inferior izquierda
        y: 495,           // Coordenada Y desde la esquina inferior izquierda
        width: 200,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    const campoLicencia = form.createTextField('licencia_1');
    campoLicencia.setText('Solo si estas federado FADMES');
    campoLicencia.addToPage(pages[0], {
        x: 280,           // Coordenada X desde la esquina inferior izquierda
        y: 460,           // Coordenada Y desde la esquina inferior izquierda
        width: 200,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    const campoDomicilio = form.createTextField('domicilio_1');
    campoDomicilio.setText('');
    campoDomicilio.addToPage(pages[0], {
        x: 220,           // Coordenada X desde la esquina inferior izquierda
        y: 420,           // Coordenada Y desde la esquina inferior izquierda
        width: 400,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    const campoDomicilio2 = form.createTextField('domicilio_2');
    campoDomicilio2.setText('');
    campoDomicilio2.addToPage(pages[0], {
        x: 120,           // Coordenada X desde la esquina inferior izquierda
        y: 380,           // Coordenada Y desde la esquina inferior izquierda
        width: 600,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    const campoFirma = form.createTextField('firma_1');
    campoFirma.setText(campoNombre.getText());
    campoFirma.addToPage(pages[5], {
        x: 400,           // Coordenada X desde la esquina inferior izquierda
        y: 490,           // Coordenada Y desde la esquina inferior izquierda
        width: 200,       // Ancho del campo
        height: 16,       // Alto del campo
    });

    

    // 5. Guardar el nuevo PDF con los campos rellenables
    const pdfModificadoBytes = await pdfDoc.save();
    fs.writeFileSync('documento_rellenable.pdf', pdfModificadoBytes);
    
    console.log('¡PDF rellenable generado con éxito como "documento_rellenable.pdf"!');
}

tornarPdfRellenable().catch(err => console.error(err));