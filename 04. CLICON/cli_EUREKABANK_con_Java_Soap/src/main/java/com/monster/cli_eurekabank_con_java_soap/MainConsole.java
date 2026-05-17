package com.monster.cli_eurekabank_con_java_soap;

import com.monster.cli_eurekabank_con_java_soap.controlador.ConsoleController;
import com.monster.cli_eurekabank_con_java_soap.modelo.ClienteSOAPModel;
import com.monster.cli_eurekabank_con_java_soap.vista.ConsoleView;

/**
 * Punto de entrada principal (Bootstrap) para el Cliente de Consola de Eureka Bank.
 * Instancia e inicia la arquitectura MVC de la aplicacion de diagnostico.
 */
public class MainConsole {

    public static void main(String[] args) {
        ClienteSOAPModel model = new ClienteSOAPModel();
        ConsoleView view = new ConsoleView();
        ConsoleController controller = new ConsoleController(model, view);

        controller.iniciar();
    }
}
