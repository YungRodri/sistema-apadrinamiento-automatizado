function realizarEmparejamiento() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaPadrinos = ss.getSheetByName("Padrinos"); // Nombre exacto de la pestaña
  const hojaMechones = ss.getSheetByName("Mechones"); // Nombre exacto de la pestaña

  // --- CONFIGURACIÓN DE COLUMNAS (AJUSTA ESTOS NÚMEROS SEGÚN TU FORMULARIO) ---
  // Recuerda: En programación contamos desde 0, pero en Sheets la columna A es 1.
  
  // Índices para PADRINOS
  const colPadNombre = 1; // Columna B (Nombre)
  const colPadEmail = 3;  // Columna D (Email)
  const colPadCarrera = 4; // Columna E (Carrera)
  const colPadTelefono = 2; // Columna C (Teléfono)
  const colPadEstado = 6; // Columna G (Donde escribiremos "Asignado")

  // Índices para MECHONES
  const colMechNombre = 1; 
  const colMechEmail = 3;
  const colMechTelefono = 2;
  const colMechEstado = 6; 

  // 1. OBTENER DATOS
  const datosPadrinos = hojaPadrinos.getDataRange().getValues();
  const datosMechones = hojaMechones.getDataRange().getValues();

  // 2. FILTRAR DISPONIBLES (Saltamos la fila 0 que es el encabezado)
  let padrinosLibres = [];
  for (let i = 1; i < datosPadrinos.length; i++) {
    if (datosPadrinos[i][colPadEstado-1] !== "ASIGNADO") { // -1 porque array es base 0
      // Guardamos el índice original para poder actualizar la hoja después
      let p = datosPadrinos[i];
      p.push(i + 1); // Guardamos el número de fila real
      padrinosLibres.push(p);
    }
  }

  // 3. ORDENAR PADRINOS (ALGORITMO DE PRIORIDAD)
  // Si carrera incluye "Informática", va primero.
  padrinosLibres.sort(function(a, b) {
    const esInfoA = a[colPadCarrera-1].toString().toLowerCase().includes("informática");
    const esInfoB = b[colPadCarrera-1].toString().toLowerCase().includes("informática");
    
    if (esInfoA && !esInfoB) return -1; // A va antes
    if (!esInfoA && esInfoB) return 1;  // B va antes
    return 0; // Son iguales (mima prioridad)
  });

  // 4. BUCLE DE MATCH
  // Recorremos los mechones y asignamos el primer padrino libre
  for (let i = 1; i < datosMechones.length; i++) {
    // Si el mechón no tiene padrino todavía y quedan padrinos libres...
    if (datosMechones[i][colMechEstado-1] !== "ASIGNADO" && padrinosLibres.length > 0) {
      
      let mechFila = i + 1;
      let padrinoElegido = padrinosLibres.shift(); // Saca al primero de la lista (el mejor candidato)
      let padFila = padrinoElegido[padrinoElegido.length - 1]; // Recuperamos el número de fila

      // Datos para el correo
      let pNombre = padrinoElegido[colPadNombre-1];
      let pEmail = padrinoElegido[colPadEmail-1];
      let pFono = padrinoElegido[colPadTelefono-1];
      
      let mNombre = datosMechones[i][colMechNombre-1];
      let mEmail = datosMechones[i][colMechEmail-1];
      let mFono = datosMechones[i][colMechTelefono-1];

      // 5. ENVIAR CORREOS
      enviarCorreo(pEmail, "¡Tienes un nuevo ahijado!", 
        `Hola ${pNombre}, te hemos asignado un mechón.\n\nNombre: ${mNombre}\nTeléfono: ${mFono}\nEmail: ${mEmail}\n\n¡Escríbele pronto!`);
      
      enviarCorreo(mEmail, "¡Ya tienes Padrino!", 
        `Hola ${mNombre}, tu padrino asignado es:\n\nNombre: ${pNombre}\nTeléfono: ${pFono}\nEmail: ${pEmail}\n\nNo dudes en contactarlo.`);

      // 6. ACTUALIZAR SHEET (Marcar como ASIGNADO)
      hojaPadrinos.getRange(padFila, colPadEstado).setValue("ASIGNADO");
      hojaMechones.getRange(mechFila, colMechEstado).setValue("ASIGNADO");
      
      Logger.log(`Match realizado: ${pNombre} con ${mNombre}`);
    }
  }
}

function enviarCorreo(email, asunto, mensaje) {
  try {
    GmailApp.sendEmail(email, asunto, mensaje);
  } catch (e) {
    Logger.log("Error enviando correo a " + email + ": " + e.toString());
  }
}
