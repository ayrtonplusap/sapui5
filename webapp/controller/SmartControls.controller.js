sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
], (BaseController, MessageBox, MessageToast, Filter, FilterOperator, Sorter, JSONModel) => {
    "use strict";

    return BaseController.extend("zplusap.sapui5.controller.SmartControls", {

        onInit() {
            // Obtener el modelo OData V2 configurado en el manifest
            //this.oDataModel = this.getOwnerComponent().getModel("odatav2");
            /*
            // Event listener para cuando se carga la metadata
            this.oDataModel.attachMetadataLoaded(() => {
                MessageBox.log("Metadata del servicio OData cargada exitosamente");
            });

            // Event listener para errores de metadata
            this.oDataModel.attachMetadataFailed(() => {
                MessageBox.error("Error al cargar metadata del servicio OData");
            });
            */

            this.getView().bindElement("/ProductSet('HT-1000')");

            
        },


        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

      


    });
});