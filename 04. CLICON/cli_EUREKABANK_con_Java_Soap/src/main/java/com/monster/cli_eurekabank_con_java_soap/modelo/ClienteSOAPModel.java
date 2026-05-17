package com.monster.cli_eurekabank_con_java_soap.modelo;

import com.eurekabank.ws.cliente.CuentaClienteDTO;
import com.eurekabank.ws.cliente.EurekaBankWS;
import com.eurekabank.ws.cliente.EurekaBankWS_Service;
import com.eurekabank.ws.cliente.Movimiento;
import jakarta.xml.ws.WebServiceException;

import java.util.List;

/**
 * Modelo que encapsula toda la logica de acceso a datos y llamadas al
 * Web Service SOAP de Eureka Bank.
 */
public class ClienteSOAPModel {

    private EurekaBankWS port = null;

    /**
     * Establece la conexion inicial con el Web Service.
     * @throws WebServiceException Si no se puede contactar al servidor.
     */
    public void conectar() throws WebServiceException {
        EurekaBankWS_Service service = new EurekaBankWS_Service();
        port = service.getEurekaBankWSPort();
    }

    /**
     * Verifica si el modelo esta actualmente conectado.
     */
    public boolean estaConectado() {
        return port != null;
    }

    /**
     * Invoca el metodo SOAP para autenticar un usuario en el backend.
     */
    public String autenticar(String usuario, String clave) throws WebServiceException {
        if (port == null) {
            conectar();
        }
        return port.autenticarUsuario(usuario, clave);
    }

    /**
     * Lista todas las cuentas asociadas a una sucursal especifica.
     */
    public List<CuentaClienteDTO> listarCuentasPorSucursal(int sucursalId) throws WebServiceException {
        if (port == null) {
            conectar();
        }
        return port.listarCuentasPorSucursal(sucursalId);
    }

    /**
     * Realiza un deposito en una cuenta.
     */
    public String depositar(String numCuenta, double monto, int empleadoId) throws WebServiceException {
        if (port == null) {
            conectar();
        }
        return port.depositar(numCuenta, monto, empleadoId);
    }

    /**
     * Realiza un retiro de una cuenta.
     */
    public String retirar(String numCuenta, double monto, int empleadoId) throws WebServiceException {
        if (port == null) {
            conectar();
        }
        return port.retirar(numCuenta, monto, empleadoId);
    }

    /**
     * Consulta el historial de movimientos de una cuenta.
     */
    public List<Movimiento> consultarExtracto(String numCuenta) throws WebServiceException {
        if (port == null) {
            conectar();
        }
        return port.consultarExtracto(numCuenta);
    }

    /**
     * Busca una cuenta iterando por las distintas sucursales de la red (IDs 1-5).
     * Retorna el DTO de la cuenta o null si no se encuentra en ninguna sucursal.
     */
    public CuentaClienteDTO buscarCuentaEnRed(String numCuenta) {
        if (port == null) {
            try {
                conectar();
            } catch (WebServiceException e) {
                return null;
            }
        }

        // Buscamos en sucursales con IDs del 1 al 5
        for (int i = 1; i <= 5; i++) {
            try {
                List<CuentaClienteDTO> cuentas = port.listarCuentasPorSucursal(i);
                if (cuentas != null) {
                    CuentaClienteDTO c = cuentas.stream()
                            .filter(x -> x.getNumeroCuenta().equalsIgnoreCase(numCuenta))
                            .findFirst()
                            .orElse(null);
                    if (c != null) {
                        return c;
                    }
                }
            } catch (WebServiceException e) {
                // Silenciamos excepciones durante el escaneo para continuar buscando en otras sucursales
            }
        }
        return null;
    }
}
