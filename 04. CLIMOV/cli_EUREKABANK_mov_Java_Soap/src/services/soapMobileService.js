import { API_CONFIG } from '../constants/Config';

/**
 * Función auxiliar para realizar peticiones SOAP en React Native
 */
async function soapRequest(operation, params = {}) {
    let paramsXml = "";
    for (const [key, value] of Object.entries(params)) {
        paramsXml += `<${key}>${value}</${key}>`;
    }

    const envelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="${API_CONFIG.NAMESPACE}">
           <soapenv:Header/>
           <soapenv:Body>
              <ws:${operation}>
                 ${paramsXml}
              </ws:${operation}>
           </soapenv:Body>
        </soapenv:Envelope>
    `.trim();

    try {
        const response = await fetch(API_CONFIG.BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": ""
            },
            body: envelope
        });

        const xmlText = await response.text();
        
        if (!response.ok) {
            console.error("HTTP Error:", response.status, xmlText);
            throw new Error(`Error de servidor (${response.status})`);
        }

        return xmlText;
    } catch (error) {
        console.error("SOAP Fetch Error:", error);
        throw error;
    }
}

/**
 * Extrae el contenido de una etiqueta XML simple usando Regex
 */
function getTagValue(xml, tagName) {
    // Acepta opcionalmente prefijos como <ns2:tipo> o <ax21:tipo>
    const regex = new RegExp(`<(\\w+:)?${tagName}[^>]*>([^<]*)</(\\w+:)?${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[2] : null; // El valor capturado estará en el segundo grupo
}

/**
 * Extrae múltiples ocurrencias de un bloque (para el extracto)
 */
function getBlocks(xml, blockName) {
    // Acepta opcionalmente prefijos como <ns2:return> o <ax21:return>
    const regex = new RegExp(`<(\\w+:)?${blockName}[^>]*>([\\s\\S]*?)</(\\w+:)?${blockName}>`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        matches.push(match[2]); // El contenido del bloque estará en el segundo grupo de captura
    }
    return matches;
}

export const soapMobileService = {
    /**
     * Login: autenticarUsuario
     */
    async login(dni) {
        // Enviamos el DNI tanto como usuario como contraseña para cumplir con el WSDL
        const xml = await soapRequest("autenticarUsuario", { usuario: dni, clave: dni });
        const returnText = getTagValue(xml, "return") || "";

        if (returnText.startsWith("SUCCESS:")) {
            const match = returnText.match(/Bienvenido\s+(.+)\s+\((.+)\)/i);
            if (match) {
                const role = match[2].trim();
                if (role.toLowerCase() !== 'cliente') {
                    throw new Error("Acceso solo permitido para clientes.");
                }
                return {
                    success: true,
                    nombre: match[1].trim(),
                    rol: role,
                    usuario: dni // Guardamos el DNI para futuras consultas
                };
            }
        }
        
        throw new Error(returnText.replace("ERROR: ", "") || "DNI no registrado o error de acceso");
    },

    /**
     * Obtener información de cuenta y saldo
     * Nota: Basado en el requerimiento de MashUp de saldo y estado
     */
    async getAccountStatus(usuario) {
        // Asumimos que existe un método que devuelve los datos de la cuenta por DNI/Usuario
        // Si el método se llama diferente, ajustarlo aquí.
        const xml = await soapRequest("consultarCuentasPorCliente", { dni: usuario });
        
        // En Eureka Bank, un cliente puede tener varias cuentas, pero el requerimiento implica una principal
        const accountsBlock = getBlocks(xml, "return")[0]; 
        if (!accountsBlock) return null;

        return {
            numero: getTagValue(accountsBlock, "numeroCuenta"),
            saldo: getTagValue(accountsBlock, "saldo"),
            disponibilidad: getTagValue(accountsBlock, "disponibilidad") // VERDE o ROJO
        };
    },

    async getExtracto(numeroCuenta) {
        try {
            console.log("[SOAP] Consultando extracto para cuenta:", numeroCuenta);
            const xml = await soapRequest("consultarExtracto", { cuentaId: numeroCuenta });
            console.log("[SOAP] XML recibido de consultarExtracto:", xml);
            
            const blocks = getBlocks(xml, "return");
            console.log("[SOAP] Bloques <return> encontrados:", blocks.length);
            
            const result = blocks.map((block, index) => {
                const tipo = getTagValue(block, "tipo");
                const monto = getTagValue(block, "monto");
                const fecha = getTagValue(block, "fechaHora");
                console.log(`[SOAP] Bloque #${index} -> Tipo: ${tipo}, Monto: ${monto}, Fecha: ${fecha}`);
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    tipo: tipo || "Desconocido",
                    monto: monto || "0.0",
                    fecha: fecha || "Sin fecha"
                };
            });
            
            return result;
        } catch (error) {
            console.error("[SOAP] Error en getExtracto:", error);
            return [];
        }
    }
};
