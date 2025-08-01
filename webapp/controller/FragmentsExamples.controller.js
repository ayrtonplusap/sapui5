sap.ui.define([
    "./BaseController",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], (BaseController, Fragment, MessageBox) => {
    "use strict";

    return BaseController.extend("zplusap.sapui5.controller.FragmentsExamples", {

        onInit() {

        },


        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        // Abrir Fragment       
        onOpenUserDetailsDialog: function () {
            if (!this._oUserDetailsDialog) {
                Fragment.load({
                    name: "zplusap.sapui5.view.fragments.UserDetailsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oUserDetailsDialog = oDialog;

                    // Definir datos mockup aquí
                    /*
                    var oMockData = new sap.ui.model.json.JSONModel({
                        users: [
                            { name: "John Doe", role: "Administrator", icon: "sap-icon://employee" },
                            { name: "Jane Smith", role: "Manager", icon: "sap-icon://manager" },
                            { name: "Luis García", role: "Developer", icon: "sap-icon://developer-settings" }
                        ],
                        notes: "Sample notes for the user details dialog."
                    });
                    */
                    var oMockData = new sap.ui.model.json.JSONModel({
                        users: [
                            { name: "John Doe", role: "roleAdministrator", icon: "sap-icon://employee" },
                            { name: "Jane Smith", role: "roleManager", icon: "sap-icon://manager" },
                            { name: "Luis García", role: "roleDeveloper", icon: "sap-icon://developer-settings" }
                        ],
                        notes: "notesSample"
                    });
                    

                    this._oUserDetailsDialog.setModel(oMockData, "mockData");
                    this.getView().addDependent(this._oUserDetailsDialog);
                    this._oUserDetailsDialog.open();
                }.bind(this));
            } else {
                this._oUserDetailsDialog.open();
            }
        },

        // Método para cerrar el UserDetailDialog
        onCloseDialog: function () {
            this._oUserDetailsDialog.close();
        },

        // Abrir Fragment Dialog
        onOpenDialog: function () {
            if (!this._oDialog) {
                Fragment.load({
                    name: "zplusap.sapui5.view.fragments.MyDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialog = oDialog;
                    this.getView().addDependent(this._oDialog);
                    this._oDialog.open();
                }.bind(this));
            } else {
                this._oDialog.open();
            }
        },

        onDialogClose: function () {
            this._oDialog.close();
        },

        // Abrir Popover
        onOpenPopover: function (oEvent) {
            var oButton = oEvent.getSource();

            if (!this._oPopover) {
                Fragment.load({
                    name: "zplusap.sapui5.view.fragments.MyPopover",
                    controller: this
                }).then(function (oPopover) {
                    this._oPopover = oPopover;
                    this.getView().addDependent(this._oPopover);
                    this._oPopover.openBy(oButton);
                }.bind(this));
            } else {
                this._oPopover.openBy(oButton);
            }
        },

        
        // Acceso a textos i18n desde controlador
        getI18nText: function (sTextKey) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sTextKey);
        },

        onShowI18nMessage: function() {
            // Obtiene texto desde archivo i18n usando tu función personalizada
            const sMessage = this.getI18nText("helloMessage");
        
            // Muestra el mensaje en un MessageBox
            MessageBox.information(sMessage);
        },

        formatI18n: function(sKey) {
            // Retorna texto traducido usando el valor del modelo como clave i18n
            return this.getI18nText(sKey);
        },       


    });
});