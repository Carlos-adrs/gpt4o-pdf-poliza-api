import fetch from 'node-fetch';
import { Buffer } from 'node:buffer'; // <-- AGREGA ESTA LÍNEA

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { pdfUrl } = req.body;
  if (!pdfUrl) {
    return res.status(400).json({ error: 'Falta la URL del PDF' });
  }

  try {
    // Descargar el PDF desde la URL
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error('Error al descargar el PDF');

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    // Llamada a OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extrae del siguiente PDF los siguientes datos clave:
- Nombre del asegurado
- Prima
- Empresa
- Tipo de seguro
- Inicio de vigencia
- Fin de vigencia

Responde solo en formato JSON plano con estos campos exactos: nombre, prima, empresa, tipoSeguro, inicioVigencia, finVigencia.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(`Error de OpenAI: ${errText}`);
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    // Convertir respuesta a JSON
    let dataExtraida;
    try {
      dataExtraida = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: "La respuesta de OpenAI no fue JSON válido", raw: content });
    }

    return res.status(200).json(dataExtraida);

  } catch (error) {
    console.error("❌ Error en analizar-pdf:", error);
    return res.status(500).json({ error: error.message });
  }
}
