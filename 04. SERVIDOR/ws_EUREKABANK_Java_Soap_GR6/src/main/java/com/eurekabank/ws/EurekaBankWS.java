package com.eurekabank.ws;

import com.eurekabank.controlador.OperacionesController;
import com.eurekabank.modelo.CuentaClienteDTO;
import com.eurekabank.modelo.Movimiento;
import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebService;
import java.util.List;

/**
 * Web Service SOAP de Eureka Bank (Refactorizado según ERS).
 * Punto de entrada único para clientes Consola, Web, Móvil y Escritorio.
 */
@WebService(serviceName = "EurekaBankWS")
public class EurekaBankWS {

    private final OperacionesController controlador;

    public EurekaBankWS() {
        this.controlador = new OperacionesController();
    }

    @WebMethod(operationName = "autenticarUsuario")
    public String autenticarUsuario(
            @WebParam(name = "usuario") String usuario, 
            @WebParam(name = "clave") String clave) {
        return controlador.loginEmpleado(usuario, clave);
    }

    @WebMethod(operationName = "depositar")
    public String depositar(
            @WebParam(name = "cuentaId") String cuentaId, 
            @WebParam(name = "monto") double monto, 
            @WebParam(name = "empleadoId") int empleadoId) {
        return controlador.procesarDeposito(cuentaId, monto, empleadoId);
    }

    @WebMethod(operationName = "retirar")
    public String retirar(
            @WebParam(name = "cuentaId") String cuentaId, 
            @WebParam(name = "monto") double monto, 
            @WebParam(name = "empleadoId") int empleadoId) {
        return controlador.procesarRetiro(cuentaId, monto, empleadoId);
    }

    /**
     * Nuevo método para transferencias atómicas (RF-04).
     */
    @WebMethod(operationName = "transferir")
    public String transferir(
            @WebParam(name = "cuentaOrigenId") String cuentaOrigenId, 
            @WebParam(name = "cuentaDestinoId") String cuentaDestinoId, 
            @WebParam(name = "monto") double monto, 
            @WebParam(name = "empleadoId") int empleadoId) {
        return controlador.procesarTransferencia(cuentaOrigenId, cuentaDestinoId, monto, empleadoId);
    }

    /**
     * Nuevo método para radiografía de sucursal con INNER JOIN (RQF-002).
     */
    @WebMethod(operationName = "listarCuentasPorSucursal")
    public List<CuentaClienteDTO> listarCuentasPorSucursal(
            @WebParam(name = "sucursalId") int sucursalId) {
        return controlador.obtenerCuentasSucursal(sucursalId);
    }

    @WebMethod(operationName = "consultarExtracto")
    public List<Movimiento> consultarExtracto(
            @WebParam(name = "cuentaId") String cuentaId) {
        return controlador.obtenerHistorial(cuentaId);
    }

    @WebMethod(operationName = "consultarCuentasPorCliente")
    public CuentaClienteDTO consultarCuentasPorCliente(
            @WebParam(name = "dni") String dni) {
        return controlador.obtenerCuentaPorDni(dni);
    }
}
