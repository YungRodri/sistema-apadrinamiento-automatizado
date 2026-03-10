/**
 * SISTEMA UNIFICADO "ADOPTA A UN INFORMÁTICO"
 * Lee un solo formulario, separa por rol, ordena por carrera y hace el match.
 */

function ejecutarMatchUnificado() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Toma la primera pestaña por defecto (Respuestas de formulario 1)
  const sheet = ss.getSheets()[0]; 
  const data = sheet.getDataRange().getValues();

  // --- MAPA DE COLUMNAS (Base 0: A=0, B=1, C=2...) ---
  const COL_NOMBRE = 1;       // B: Nombre Completo
  const COL_CORREO = 2;       // C: Correo
  const COL_FONO = 3;         // D: Teléfono
  const COL_ROL = 4;          // E: ¿Cuál es tu rol?
  const COL_INTERES_M = 6;    // G: Intereses Mechón
  const COL_CARRERA = 7;      // H: Carrera (Padrino)
  const COL_INTERES_P = 9;    // J: Intereses Padrino
  
  // OJO: Cambia este número si tu columna "Estado" no es la L (11)
  const COL_ESTADO = 11;      // L: Estado 

  let padrinosLibres = [];
  let mechonesPendientes = [];

  // 1. SEPARAR Y FILTRAR DISPONIBLES
  for (let i = 1; i < data.length; i++) {
    let fila = data[i];
    let rol = String(fila[COL_ROL]);
    let estado = fila[COL_ESTADO];

    // Si la celda Estado está vacía (no ha sido asignado)
    if (!estado || estado === "") {
      fila.push(i + 1); // Guardamos la fila real al final del arreglo
      
      if (rol.includes("curso superior")) {
        padrinosLibres.push(fila);
      } else if (rol.includes("primer año")) {
        mechonesPendientes.push(fila);
      }
    }
  }

  // 2. ORDENAR PADRINOS (Informática primero)
  padrinosLibres.sort((a, b) => {
    const carreraA = String(a[COL_CARRERA]).toLowerCase();
    const carreraB = String(b[COL_CARRERA]).toLowerCase();
    const esInfoA = carreraA.includes("informática") || carreraA.includes("informatica");
    const esInfoB = carreraB.includes("informática") || carreraB.includes("informatica");

    if (esInfoA && !esInfoB) return -1;
    if (!esInfoA && esInfoB) return 1;
    return 0;
  });

  // 3. HACER EL MATCH Y ENVIAR CORREOS
  for (let i = 0; i < mechonesPendientes.length; i++) {
    if (padrinosLibres.length > 0) {
      let mechon = mechonesPendientes[i];
      let padrino = padrinosLibres.shift(); // Saca al primer padrino disponible

      let filaM = mechon[mechon.length - 1];
      let filaP = padrino[padrino.length - 1];

      // Extraer datos para el correo
      let pNombre = padrino[COL_NOMBRE];
      let pMail = padrino[COL_CORREO];
      let pFono = padrino[COL_FONO];
      let pGustos = padrino[COL_INTERES_P];

      let mNombre = mechon[COL_NOMBRE];
      let mMail = mechon[COL_CORREO];
      let mFono = mechon[COL_FONO];
      let mGustos = mechon[COL_INTERES_M];

      // Correos
      enviarCorreo(pMail, 
        "🚀 [Adopta a un Informático] ¡Tienes un nuevo ahijado!",
        `Hola ${pNombre},\n\nTe hemos asignado un estudiante de primer año:\n\n🔹 Nombre: ${mNombre}\n📱 WhatsApp: ${mFono}\n✉️ Correo: ${mMail}\n🎮 Intereses: ${mGustos}\n\n👉 Misión: Escríbele un WhatsApp hoy mismo. ¡Haz que se sienta bienvenido!`
      );

      enviarCorreo(mMail,
        "🎉 [Adopta a un Informático] ¡Ya tienes Padrino!",
        `Hola ${mNombre},\n\nHemos encontrado a un estudiante de cursos superiores para guiarte:\n\n🔸 Nombre: ${pNombre}\n📱 WhatsApp: ${pFono}\n✉️ Correo: ${pMail}\n🎯 Sus intereses: ${pGustos}\n\nTu padrino te contactará pronto.`
      );

      // Marcar en Excel
      sheet.getRange(filaP, COL_ESTADO + 1).setValue("ASIGNADO");
      sheet.getRange(filaM, COL_ESTADO + 1).setValue("ASIGNADO");
      
      Logger.log(`✅ MATCH: ${pNombre} apadrina a ${mNombre}`);
    }
  }
}

function enviarCorreo(destino, asunto, cuerpo) {
  try {
    GmailApp.sendEmail(destino, asunto, cuerpo);
  } catch (e) {
    Logger.log("❌ Error enviando correo: " + e.toString());
  }
}
