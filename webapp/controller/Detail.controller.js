sap.ui.define([
    "./BaseController",
    "../model/Formatter",
    "sap/ui/core/routing/History"
], (BaseController, formatter, History) => {
    "use strict";

    return BaseController.extend("zplusap.sapui5.controller.Detail", {

        formatter: formatter,

        /* =======================================================
         * INICIALIZACIÓN DEL CONTROLADOR
         * ======================================================= */
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sUserID = oEvent.getParameter("arguments").UserID;

            const oModel = this.getView().getModel("localModel"); // o como lo llames
            const aUsers = oModel.getProperty("/aUser");

            // Buscar el usuario por su ID
            const oUser = aUsers.find(user => user.UserID === sUserID);

            if (oUser) {
                // Guardar en una propiedad auxiliar
                oModel.setProperty("/selectedUser", oUser);

                // Vincular la vista al objeto filtrado
                this.getView().bindElement("localModel>/selectedUser");
            } else {
                // Manejar caso no encontrado
                sap.m.MessageToast.show("Usuario no encontrado");
            }
        },

        onNavBack() {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("master", {}, true);
            }
        }

    });
});
