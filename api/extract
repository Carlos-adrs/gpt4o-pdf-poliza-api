export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: 'Falta la URL del archivo PDF' });
    }

    // Descargar PDF como arrayBuffer
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Importar librería pdf-parse
    const pdfjsLib = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfjsLib.default(uint8Array);

    const texto = data.text;

    // Extraer datos usando expresiones regulares simples
    const resultado = {
      nombre: extraerCampo(texto, /(?:Nombre|Asegurado|Contratante)(?:\:|\s)(.*)/i),
      poliza: extraerCampo(texto, /P[oó]liza(?:\:|\s)([A-Z0-9\-]+)/i),
      aseguradora: extraerCampo(texto, /(?:Compañ[ií]a|Aseguradora)(?:\:|\s)(.*)/i),
      tipoSeguro: extraerCampo(texto, /Tipo de seguro(?:\:|\s)(.*)/i),
      fechaInicio: extraerCampo(texto, /(?:Inicio de vigencia|Vigencia desde)(?:\:|\s)(\d{1,2}\/\d{1,2}\/\d{4})/i),
      fechaTermino: extraerCampo(texto, /(?:Fin de vigencia|Vigencia hasta)(?:\:|\s)(\d{1,2}\/\d{1,2}\/\d{4})/i)
    };

    res.status(200).json(resultado);
  } catch (err) {
    console.error('Error al procesar el PDF:', err);
    res.status(500).json({ error: 'Error al procesar el PDF' });
  }
}

// Función para extraer con regex
function extraerCampo(texto, regex) {
  const match = texto.match(regex);
  return match ? match[1].trim() : '';
}
