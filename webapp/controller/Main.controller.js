sap.ui.define([
    "./BaseController",
    "../model/Formatter",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], (BaseController, formatter, MessageBox, Filter, FilterOperator, MessageToast) => {
    "use strict";

    return BaseController.extend("zplusap.sapui5.controller.Main", {

        formatter: formatter,

        /* =======================================================
         * INICIALIZACIÓN DEL CONTROLADOR
         * ======================================================= */
        onInit() {
            // Accedemos al modelo local definido en el componente (modelo JSON con datos de pantalla)
            this.localModel = this.getOwnerComponent().getModel("localModel");

            // Configurar modelo desde el controlador
            this.setModelinController();
        },

        setModelinController() {
            // Define the data structure for roles
            const oData = {
                aRole: [
                    {
                        RolId: "ADM",
                        Name: "Admin"
                    },
                    {
                        RolId: "EDI",
                        Name: "Editor"
                    },
                    {
                        RolId: "VIE",
                        Name: "Viewer"
                    }
                ]
            };

            // Create a new JSON model with the role data
            var oModel = new sap.ui.model.json.JSONModel(oData);

            // Set the created model to the view with the name 'roleModel'
            this.getOwnerComponent().setModel(oModel, "roleModel");
        },

        onIdPress(oEvent) {
            let oItem = oEvent.getSource();

            this.getOwnerComponent().getRouter().navTo("RouteDetail", {UserID: oItem.getTitle()});
        },

        /* =======================================================
         * CREACIÓN DE NUEVO USUARIO
         * ======================================================= */
        onPressCreateUser() {
            const oUser = this.localModel.getProperty("/oCreateUser"); // Datos del formulario
            const oCreateUser = JSON.parse(JSON.stringify(oUser)); // Copia para evitar referencias

            // Validación básica de campos requeridos
            if (!this._validateUser(oCreateUser)) return;

            const aUsers = this.localModel.getProperty("/aUser");
            oCreateUser.UserID = this.setUserID(aUsers); // Asigna nuevo ID incremental
            oCreateUser.Status = true; // Por defecto, usuario activo

            aUsers.push(oCreateUser); // Agrega nuevo usuario al arreglo
            this.localModel.refresh(); // Actualiza binding en vista

            this.setDefaultDataForm(); // Limpia formulario
            MessageToast.show("Usuario creado exitosamente.");
        },

        _validateUser(oUser) {
            if (!oUser.Name) return MessageBox.warning("Por favor, ingrese el nombre del usuario.");
            if (!oUser.Email) return MessageBox.warning("Por favor, proporcione un correo electrónico válido.");
            if (!oUser.Phone) return MessageBox.warning("Por favor, ingrese el número de teléfono del usuario.");
            if (!oUser.Role) return MessageBox.warning("Seleccione un rol para el nuevo usuario.");
            return true;
        },

        setDefaultDataForm() {
            // Limpia los campos del formulario
            const oUser = this.localModel.getProperty("/oCreateUser");
            if (oUser) {
                Object.assign(oUser, {
                    ID: "", Name: "", Email: "", Phone: "",
                    Role: "", Status: false
                });
                this.localModel.refresh();
            }
        },

        /* =======================================================
         * EDICIÓN Y GUARDADO DE CAMBIOS
         * ======================================================= */
        onPressEdit() {
            // Habilita edición de la tabla
            this.localModel.setProperty("/isView", false);
            this.localModel.setProperty("/tableMode", "None");

            const aUser = this.localModel.getProperty("/aUser");
            const aUserBackup = JSON.parse(JSON.stringify(aUser));
            this.localModel.setProperty("/aUserBackup", aUserBackup); // Guarda backup para restaurar si cancelan
        },

        onPressSave() {
            // Mensaje de confirmación antes de guardar
            MessageBox.show("¿Desea guardar los cambios realizados?", {
                icon: MessageBox.Icon.INFORMATION,
                title: "Confirmar guardado",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.YES) {
                        this.localModel.setProperty("/isView", true);
                        this.localModel.setProperty("/tableMode", "MultiSelect");
                        MessageToast.show("Los cambios se han guardado con éxito.");
                    }
                }
            });
        },

        onPressCancel() {
            // Confirmación antes de descartar cambios
            MessageBox.show("¿Desea cancelar la edición? Se descartarán los cambios no guardados.", {
                icon: MessageBox.Icon.INFORMATION,
                title: "Cancelar edición",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.YES) {
                        this.restoreUserBackup();
                        this.localModel.setProperty("/isView", true);
                        this.localModel.setProperty("/tableMode", "MultiSelect");
                        MessageToast.show("La información original ha sido restaurada.");
                    }
                }
            });
        },

        restoreUserBackup() {
            // Restaura la copia de seguridad del arreglo original
            const aUserBackup = this.localModel.getProperty("/aUserBackup");
            this.localModel.setProperty("/aUser", aUserBackup);
        },

        /* =======================================================
         * ELIMINACIÓN DE USUARIOS
         * ======================================================= */
        onPressDelete() {
            const oTable = this.byId("idUsersTable");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                return MessageBox.warning("Seleccione al menos un usuario para eliminar.");
            }

            MessageBox.show("¿Desea eliminar los usuarios seleccionados? Esta acción no se puede deshacer.", {
                icon: MessageBox.Icon.INFORMATION,
                title: "Confirmar eliminación",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.NO,
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.YES) {
                        const aUsers = this.localModel.getProperty("/aUser");

                        const aSelectedIDs = aSelectedItems.map(item => {
                            const oContext = item.getBindingContext("localModel");
                            return oContext.getObject().UserID;
                        });

                        const aFilteredUsers = aUsers.filter(user => !aSelectedIDs.includes(user.UserID));
                        this.localModel.setProperty("/aUser", aFilteredUsers);

                        this.clearSelectedItems();
                        MessageToast.show("Los usuarios seleccionados se eliminaron correctamente.");
                    }
                }
            });
        },

        clearSelectedItems() {
            // Limpia la selección de filas de la tabla
            this.byId("idUsersTable").removeSelections();
        },

        /* =======================================================
         * FILTRO DE BÚSQUEDA EN LA TABLA
         * ======================================================= */
        onSearch(oEvent) {
            const sQuery = oEvent.getParameter("query") || "";
            const oTable = this.byId("idUsersTable");
            const oBinding = oTable.getBinding("items");

            // Aplica filtro por nombre (FirstName)
            const aFilters = [new Filter("Name", FilterOperator.Contains, sQuery)];
            oBinding.filter(aFilters);
        },

        /* =======================================================
         * Navegar a la vista de Ejemplos OData y REST
         * ======================================================= */
        onPressNavigateToODataExamples() {
            this.getOwnerComponent().getRouter().navTo("RouteODataExamples");
        },

        /* =======================================================
         * Navegar a la vista de Ejemplos de Smart Controls
         * ======================================================= */
        onPressNavigateToSmartControls() {
            this.getOwnerComponent().getRouter().navTo("RouteSmartControls");
        },

    });
});
