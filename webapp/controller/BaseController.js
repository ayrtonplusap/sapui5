sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {

    "use strict";

    return Controller.extend("zplusap.sapui5.controller.BaseController", {
        // Genera un nuevo ID de usuario con formato USR###, donde ### es un número incremental.
        setUserID(aUser) {

            // Obtener los IDs existentes y extraer el número
            const numeros = aUser
                .map(u => u.UserID)
                .filter(id => /^USR\d+$/.test(id)) // solo IDs válidos
                .map(id => parseInt(id.replace("USR", ""), 10));

            // Encontrar el máximo
            const max = numeros.length > 0 ? Math.max(...numeros) : 0;

            // Crear el nuevo ID incrementado y con ceros iniciales
            const nuevoNumero = (max + 1).toString().padStart(3, "0");

            return `USR${nuevoNumero}`;
        },

        // Convierte un objeto Date a formato YYYY-MM-DD.
        setDate(oDate) {
            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, '0'); // getMonth() es base 0
            const day = String(oDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        }
    });

});