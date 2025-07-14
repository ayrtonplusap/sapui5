sap.ui.define([
], function () {
    "use strict";

    return {
        formatRole(sValue) {
            if (!sValue || sValue === "") {
                return;
            }

            if (sValue === "ADM") {
                return "Admin";
            } else if (sValue === "EDI") {
                return "Editor";
            } else if (sValue === "VIE") {
                return "Viewer";
            }
        },
        formatTextStatus(bValue) {
            if (bValue) {
                return "Activo";
            } else {
                return "Inactivo";
            }
        },
        formatStateStatus(bValue) {
            if (bValue) {
                return "Success";
            } else {
                return "Error";
            }
        },
    };
});
