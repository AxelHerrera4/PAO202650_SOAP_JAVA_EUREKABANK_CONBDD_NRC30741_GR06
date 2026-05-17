const SOAP_URL = "/eureka-api/EurekaBankWS";
const NAMESPACE = "http://ws.eurekabank.com/";

/**
 * Función auxiliar para realizar peticiones SOAP
 */
async function soapRequest(operation, params = {}) {
    let paramsXml = "";
    for (const [key, value] of Object.entries(params)) {
        paramsXml += `<${key}>${value}</${key}>`;
    }

    const envelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="${NAMESPACE}">
           <soapenv:Header/>
           <soapenv:Body>
              <ws:${operation}>
                 ${paramsXml}
              </ws:${operation}>
           </soapenv:Body>
        </soapenv:Envelope>
    `.trim();

    try {
        const response = await fetch(SOAP_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "SOAPAction": ""
            },
            body: envelope
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const xmlText = await response.text();
        return new DOMParser().parseFromString(xmlText, "text/xml");
    } catch (error) {
        console.error("SOAP Error:", error);
        throw error;
    }
}

/**
 * Autentica al usuario y devuelve sus datos si tiene éxito
 * Formato backend: "SUCCESS: Bienvenido Nombre (Rol)"
 */
export async function autenticarUsuario(usuario, clave) {
    const xmlDoc = await soapRequest("autenticarUsuario", { usuario, clave });
    const returnText = xmlDoc.getElementsByTagName("return")[0]?.textContent || "";

    console.log("DEBUG: Respuesta login recibida ->", returnText);

    if (returnText.startsWith("SUCCESS:")) {
        // Extraemos nombre y rol del formato "SUCCESS: Bienvenido Nombre (Rol)"
        const match = returnText.match(/Bienvenido\s+(.+)\s+\((.+)\)/i);
        
        if (match) {
            const nombre = match[1].trim();
            const rol = match[2].trim();
            
            return {
                success: true,
                nombre: nombre,
                rol: rol,
                idSucursal: 1, // Valor por defecto ya que el backend no lo entrega en el login
                nombreSucursal: "Sede Principal - Eureka Bank"
            };
        }
    }
    
    return { 
        success: false, 
        message: returnText.replace("ERROR: ", "") || "Error de autenticación" 
    };
}

/**
 * Lista las cuentas de una sucursal específica
 * Consume el DTO retornado por el backend
 */
export async function listarCuentasPorSucursal(idSucursal) {
    // Nota: El parámetro en el WSDL se llama 'sucursalId'
    const xmlDoc = await soapRequest("listarCuentasPorSucursal", { sucursalId: idSucursal });
    const returnElements = xmlDoc.getElementsByTagName("return");
    const accounts = [];

    for (let i = 0; i < returnElements.length; i++) {
        const el = returnElements[i];
        
        const numero = el.getElementsByTagName("numeroCuenta")[0]?.textContent || "N/A";
        const saldo = el.getElementsByTagName("saldo")[0]?.textContent || "0";
        const disponibilidad = el.getElementsByTagName("disponibilidad")[0]?.textContent || "VERDE";
        const nombre = el.getElementsByTagName("nombreCliente")[0]?.textContent || "";
        const apellido = el.getElementsByTagName("apellidoCliente")[0]?.textContent || "";

        accounts.push({
            numero: numero,
            titular: `${nombre} ${apellido}`.trim() || "Consumidor Final",
            saldo: saldo,
            estado: disponibilidad.toUpperCase() === "VERDE" ? "LIBRE" : "OCUPADA"
        });
    }

    return accounts;
}
