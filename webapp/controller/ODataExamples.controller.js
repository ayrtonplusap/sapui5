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

    return BaseController.extend("zplusap.sapui5.controller.ODataExamples", {

        onInit() {
            // Obtener el modelo OData V2 configurado en el manifest
            this.oDataModel = this.getOwnerComponent().getModel("odatav2");
            
            // Event listener para cuando se carga la metadata
            this.oDataModel.attachMetadataLoaded(() => {
                MessageBox.log("Metadata del servicio OData cargada exitosamente");
            });

            // Event listener para errores de metadata
            this.oDataModel.attachMetadataFailed(() => {
                MessageBox.error("Error al cargar metadata del servicio OData");
            });

            this._currentMode = "CREATE"; // CREATE, UPDATE
            this._currentBPPath = null;

            /* =======================================================
            * Configuración para el ejemplo con API REST de Pokemon
            * ======================================================= */
            // CREAR MODELO JSON PARA POKEMON
            this.oPokemonModel = new JSONModel({
                // Datos de los Pokemon
                aPokemon: [],
                
                // Estados de la UI
                pokemonSearch: "",
                pokemonLoading: false,
                isView: true,
                tableMode: "None",
                
                // Configuración
                baseUrl: "/pokeapi/api/v2/pokemon/"
            });
            
            // ASIGNAR MODELO A LA VISTA
            this.getView().setModel(this.oPokemonModel, "pokemonModel");
        },

        onAfterRendering() {            
            this._setupTableCounter();
        },

        onNavBack() {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        },

        _setupTableCounter() {
            const oTable = this.byId("bpTable");
            const oBinding = oTable.getBinding("items");
            
            // 🎯 ESTE LISTENER SE EJECUTA AUTOMÁTICAMENTE EN CADA CAMBIO
            oBinding.attachDataReceived(() => {
                const iCount = oBinding.getLength();
                console.log(`🔄 LISTENER DISPARADO - Nuevo count: ${iCount}`);
                this.byId("tbTitle").setText(`Business Partners (${iCount})`);
            });
        },

        /* =======================================================
         * FORMULARIO - Obtener datos del form
         * ======================================================= */
        _getFormData() {
            return {
                BusinessPartnerID: this.byId("bpIdInput").getValue(),
                CompanyName: this.byId("companyNameInput").getValue(),
                EmailAddress: this.byId("emailInput").getValue(),
                PhoneNumber: this.byId("phoneInput").getValue(),
                CurrencyCode: this.byId("currencySelect").getSelectedKey(),
                BusinessPartnerRole: this.byId("roleSelect").getSelectedKey(),
                Address: {
                    Street: this.byId("streetInput").getValue(),
                    City: this.byId("cityInput").getValue(),
                    PostalCode: this.byId("postalCodeInput").getValue(),
                    Country: this.byId("countrySelect").getSelectedKey(),
                    Building: this.byId("buildingInput").getValue(),
                    AddressType: this.byId("addressTypeInput").getValue()
                }
            };
        },

        _setFormData(oData) {
            this.byId("bpIdInput").setValue(oData.BusinessPartnerID || "");
            this.byId("companyNameInput").setValue(oData.CompanyName || "");
            this.byId("emailInput").setValue(oData.EmailAddress || "");
            this.byId("phoneInput").setValue(oData.PhoneNumber || "");
            this.byId("currencySelect").setSelectedKey(oData.CurrencyCode || "EUR");
            this.byId("roleSelect").setSelectedKey(oData.BusinessPartnerRole || "01");
            
            // Address
            if (oData.Address) {
                this.byId("streetInput").setValue(oData.Address.Street || "");
                this.byId("cityInput").setValue(oData.Address.City || "");
                this.byId("postalCodeInput").setValue(oData.Address.PostalCode || "");
                this.byId("countrySelect").setSelectedKey(oData.Address.Country || "PE");
                this.byId("buildingInput").setValue(oData.Address.Building || "");
                this.byId("addressTypeInput").setValue(oData.Address.AddressType || "");
            }
        },

        _setFormMode(sMode) {
            this._currentMode = sMode;
            this.byId("modeText").setText(sMode);
            
            const bIsUpdate = sMode === "UPDATE";
            this.byId("createButton").setVisible(!bIsUpdate);
            this.byId("updateButton").setVisible(bIsUpdate);
            this.byId("deleteButton").setVisible(bIsUpdate);
        },

        /* =======================================================
         * FORMULARIO - Limpiar y preparar para CREATE
         * ======================================================= */
        onClearForm() {
            this._setFormData({
                CompanyName: "Demo Company SAP Training",
                EmailAddress: "", // Único campo en blanco
                PhoneNumber: "+51-1-234-5678",
                CurrencyCode: "EUR",
                BusinessPartnerRole: "01",
                Address: {
                    Street: "Av. Ejemplo 123",
                    City: "Lima",
                    PostalCode: "15001",
                    Country: "PE",
                    Building: "16",
                    AddressType: "02"
                }
            });
            
            this._setFormMode("CREATE");
            this._currentBPPath = null;
            MessageToast.show("📝 Formulario listo para crear nuevo Business Partner");
        },

        /* =======================================================
         * CRUD - CREATE desde formulario
         * ======================================================= */
        onCreateFromForm() {
            const oFormData = this._getFormData();
            
            // Validar email (único campo requerido vacío)
            if (!oFormData.EmailAddress.trim()) {
                MessageBox.error("El Email Address es requerido y debe ser único");
                this.byId("emailInput").focus();
                return;
            }
            
            // Limpiar BusinessPartnerID para CREATE
            delete oFormData.BusinessPartnerID;
            
            MessageToast.show("🚀 Creando Business Partner...");
            
            this.oDataModel.create("/BusinessPartnerSet", oFormData, {
                success: (oData, oResponse) => {
                    MessageToast.show(`✅ Business Partner creado: ${oData.BusinessPartnerID}`);
                    console.log("BP creado desde formulario:", oData);
                    
                    // Actualizar formulario con datos del servidor
                    this._setFormData(oData);
                    this._setFormMode("UPDATE");
                    this._currentBPPath = `/BusinessPartnerSet('${oData.BusinessPartnerID}')`;
                    
                    // Refrescar tabla
                    this.oDataModel.refresh(true);
                },
                error: (oError) => {
                    MessageBox.error("❌ Error al crear Business Partner: " + oError.message);
                    console.error("Error CREATE desde formulario:", oError);
                }
            });
        },

        /* =======================================================
         * CRUD - UPDATE desde formulario
         * ======================================================= */
        onUpdateFromForm() {
            if (!this._currentBPPath) {
                MessageBox.error("No hay Business Partner seleccionado para actualizar");
                return;
            }
            
            const oFormData = this._getFormData();
            
            MessageToast.show("🔄 Actualizando Business Partner...");
            
            this.oDataModel.update(this._currentBPPath, oFormData, {
                merge: false,
                success: (oData, oResponse) => {
                    MessageToast.show(`✅ Business Partner ${oFormData.BusinessPartnerID} actualizado exitosamente`);
                    console.log("BP actualizado:", oData || oFormData);
                    
                    // Refrescar tabla
                    this.oDataModel.refresh(true);
                },
                error: (oError) => {
                    MessageBox.error("❌ Error al actualizar: " + oError.message);
                    console.error("Error UPDATE:", oError);
                }
            });
        },

        /* =======================================================
         * CRUD - DELETE desde formulario
         * ======================================================= */
        onDeleteFromForm() {
            if (!this._currentBPPath) {
                MessageBox.error("No hay Business Partner seleccionado para eliminar");
                return;
            }
            
            const sBPID = this.byId("bpIdInput").getValue();
            const sCompanyName = this.byId("companyNameInput").getValue();
            
            MessageBox.confirm(
                `¿Está seguro de eliminar el Business Partner?\n\nID: ${sBPID}\nEmpresa: ${sCompanyName}`,
                {
                    title: "🗑️ Confirmar Eliminación",
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.OK) {
                            this._executeDelete(sBPID);
                        }
                    }
                }
            );
        },

        _executeDelete(sBPID) {
            MessageToast.show("🗑️ Eliminando Business Partner...");
            
            this.oDataModel.remove(this._currentBPPath, {
                success: () => {
                    MessageToast.show(`✅ Business Partner ${sBPID} eliminado exitosamente`);
                    
                    // Limpiar formulario y volver a modo CREATE
                    this.onClearForm();
                    
                    // Refrescar tabla
                    this.oDataModel.refresh(true);
                },
                error: (oError) => {
                    MessageBox.error("❌ Error al eliminar: " + oError.message);
                    console.error("Error DELETE:", oError);
                }
            });
        },

        /* =======================================================
         * TABLA - Evento al hacer clic en una fila (para UPDATE/DELETE)
         * ======================================================= */
        onRowPress(oEvent) {
            const oItem = oEvent.getSource();
            const oContext = oItem.getBindingContext("odatav2");
            
            if (!oContext) {
                MessageBox.warning("No se pudo obtener los datos de la fila seleccionada");
                return;
            }
            
            const oData = oContext.getObject();
            const sBPID = oData.BusinessPartnerID;
            
            // Cargar datos en el formulario
            this._setFormData(oData);
            this._setFormMode("UPDATE");
            this._currentBPPath = oContext.getPath();
            
            MessageToast.show(`📝 Business Partner ${sBPID} cargado en formulario para edición`);
        },

        onReadWithFilters() {
            const sSearchTerm = this.byId("searchCompanyInput").getValue().trim();
    
            if (!sSearchTerm) {
                MessageBox.warning("Por favor ingrese un término de búsqueda para filtrar por nombre de empresa");
                this.byId("searchCompanyInput").focus();
                return;
            }
            
            MessageToast.show(`🔍 Buscando empresas que contengan: "${sSearchTerm}"`);
            
            // Crear filtros para la consulta
            const aFilters = [
                new Filter("CompanyName", FilterOperator.Contains, sSearchTerm)
            ];
            
            this.oDataModel.read("/BusinessPartnerSet", {
                filters: aFilters,
                urlParameters: {
                    "$top": 50
                },
                success: (oData) => {
                    const iCount = oData.results.length;
                    MessageToast.show(`✅ ${iCount} Business Partners encontrados con filtro`);
                    console.log(`🔍 READ con Filtros - Término: "${sSearchTerm}", Resultados:`, oData.results);
                    
                    if (iCount === 0) {
                        MessageBox.information(`No se encontraron empresas que contengan "${sSearchTerm}"`);
                    }
                },
                error: (oError) => {
                    MessageBox.error("Error en consulta con filtros: " + oError.message);
                }
            });
        },

        /* =======================================================
         * FILTROS Y ORDENAMIENTO EN LA TABLA
         * ======================================================= */
        onApplyTableFilter(oEvent) {
            const oTable = this.byId("bpTable");
            const oBinding = oTable.getBinding("items");

            // Obtener el valor del SearchField desde el evento
            const sSearchTerm = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            const sSearchTermTrimmed = sSearchTerm.trim();
            
            if (!oBinding) {
                MessageBox.error("No se pudo aplicar el filtro. La tabla no tiene datos.");
                return;
            }

            // Aplicar filtro a la tabla
            const oFilter = new Filter("CompanyName", FilterOperator.Contains, sSearchTermTrimmed);            

            // Filtro 
            oBinding.filter([oFilter]);
            
            MessageToast.show("Filtro aplicado a la tabla");
        },

        onClearTableFilter() {
            const oTable = this.byId("bpTable");
            const oBinding = oTable.getBinding("items");
            
            oBinding.filter([]);
            MessageToast.show("Filtros limpiados");
        },

        onSortTable() {
            const oTable = this.byId("bpTable");
            const oBinding = oTable.getBinding("items");
            
            // Ordenar por CompanyName descendente
            const oSorter = new Sorter("CreatedAt", true);
            oBinding.sort([oSorter]);
            
            MessageToast.show("Tabla ordenada por Created At (descendente)");
        },

        onRefreshModel() {
            MessageToast.show("Refrescando modelo completo...");
            this.oDataModel.refresh(true);
        },

        /* ===================================================================================
         * Funciones del ejemplo del uso de una API REST externa
         * =================================================================================== */

        /* =======================================================
        *  MÉTODO 1: AJAX TRADICIONAL (jQuery)
        * ======================================================= */
        onLoadPokemonDataAjax() {
            MessageToast.show("🔄 Cargando Pokemon con AJAX...");
            
            // ✅ MOSTRAR LOADING
            this.oPokemonModel.setProperty("/pokemonLoading", true);
            
            // ✅ LIMPIAR DATOS ANTERIORES
            this.oPokemonModel.setProperty("/aPokemon", []);
            
            // 🎯 POKEMON POPULARES PARA DEMO
            const aPopularPokemon = ["pikachu", "charizard", "blastoise", "venusaur", "mewtwo"];
            let iLoadedCount = 0;
            const aPokemonData = [];
            
            // ✅ CARGAR CADA POKEMON CON AJAX
            aPopularPokemon.forEach((sPokemonName) => {
                
                // 🌟 AJAX TRADICIONAL CON jQuery
                $.ajax({
                    url: `https://pokeapi.co/api/v2/pokemon/${sPokemonName}`,
                    method: "GET",
                    dataType: "json",
                    
                    // ✅ SUCCESS CALLBACK
                    success: (oData) => {
                        console.log(`✅ AJAX Success - Pokemon: ${oData.name}`, oData);
                        
                        // 🎯 TRANSFORMAR DATOS DE LA API
                        const oPokemon = {
                            id: oData.id,
                            name: oData.name.charAt(0).toUpperCase() + oData.name.slice(1),
                            height: oData.height,
                            weight: oData.weight,
                            base_experience: oData.base_experience,
                            sprite: oData.sprites.front_default,
                            // Datos adicionales
                            types: oData.types.map(type => type.type.name),
                            abilities: oData.abilities.map(ability => ability.ability.name)
                        };
                        
                        aPokemonData.push(oPokemon);
                        iLoadedCount++;
                        
                        // ✅ CUANDO TODOS ESTÉN CARGADOS
                        if (iLoadedCount === aPopularPokemon.length) {
                            // Ordenar por ID
                            aPokemonData.sort((a, b) => a.id - b.id);
                            
                            // Actualizar modelo
                            this.oPokemonModel.setProperty("/aPokemon", aPokemonData);
                            this.oPokemonModel.setProperty("/pokemonLoading", false);
                            
                            MessageToast.show(`✅ ${aPokemonData.length} Pokemon cargados con AJAX`);
                        }
                    },
                    
                    // ❌ ERROR CALLBACK
                    error: (jqXHR, sTextStatus, sErrorThrown) => {
                        console.error(`❌ AJAX Error - Pokemon: ${sPokemonName}`, {
                            status: jqXHR.status,
                            statusText: sTextStatus,
                            error: sErrorThrown,
                            response: jqXHR.responseText
                        });
                        
                        iLoadedCount++;
                        
                        // Verificar si todos terminaron (con o sin error)
                        if (iLoadedCount === aPopularPokemon.length) {
                            this.oPokemonModel.setProperty("/pokemonLoading", false);
                            
                            if (aPokemonData.length > 0) {
                                aPokemonData.sort((a, b) => a.id - b.id);
                                this.oPokemonModel.setProperty("/aPokemon", aPokemonData);
                                MessageToast.show(`⚠️ ${aPokemonData.length} Pokemon cargados (algunos fallaron)`);
                            } else {
                                MessageBox.error(`❌ Error cargando Pokemon con AJAX: ${sErrorThrown}`);
                            }
                        }
                    }
                });
            });
        },

        /* =======================================================
         * MÉTODO 2: FETCH API MODERNA (ES6+)
         * ======================================================= */
        async onLoadPokemonDataFetch() {
            MessageToast.show("🚀 Cargando Pokemon con FETCH API...");
            
            // ✅ MOSTRAR LOADING
            this.oPokemonModel.setProperty("/pokemonLoading", true);
            this.oPokemonModel.setProperty("/aPokemon", []);
            
            try {
                // 🎯 POKEMON POPULARES PARA DEMO
                const aPopularPokemon = ["pikachu", "charizard", "blastoise", "venusaur", "mewtwo"];
                
                // 🌟 FETCH PARALELO CON Promise.all
                const aPromises = aPopularPokemon.map(async (sPokemonName) => {
                    
                    console.log(`🔄 FETCH Request - Pokemon: ${sPokemonName}`);
                    
                    // 🌟 FETCH API MODERNA
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${sPokemonName}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    // ✅ VERIFICAR SI LA RESPUESTA ES OK
                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
                    }
                    
                    // 📦 CONVERTIR A JSON
                    const oData = await response.json();
                    
                    console.log(`✅ FETCH Success - Pokemon: ${oData.name}`, oData);
                    
                    // 🎯 TRANSFORMAR DATOS DE LA API
                    return {
                        id: oData.id,
                        name: oData.name.charAt(0).toUpperCase() + oData.name.slice(1),
                        height: oData.height,
                        weight: oData.weight,
                        base_experience: oData.base_experience,
                        sprite: oData.sprites.front_default,
                        // Datos adicionales
                        types: oData.types.map(type => type.type.name),
                        abilities: oData.abilities.map(ability => ability.ability.name)
                    };
                });
                
                // ✅ ESPERAR TODAS LAS PROMESAS
                const aPokemonData = await Promise.all(aPromises);
                
                // ✅ ORDENAR Y ACTUALIZAR MODELO
                aPokemonData.sort((a, b) => a.id - b.id);
                this.oPokemonModel.setProperty("/aPokemon", aPokemonData);
                
                MessageToast.show(`🎉 ${aPokemonData.length} Pokemon cargados con FETCH API`);
                
            } catch (error) {
                console.error("❌ FETCH Error:", error);
                MessageBox.error(`❌ Error cargando Pokemon con FETCH: ${error.message}`);
            } finally {
                // ✅ OCULTAR LOADING SIEMPRE
                this.oPokemonModel.setProperty("/pokemonLoading", false);
            }
        },

        /* =======================================================
         * 🔍 BÚSQUEDA INDIVIDUAL DE POKEMON (FETCH)
         * ======================================================= */
        async onSearchPokemon() {
            const sSearchTerm = this.oPokemonModel.getProperty("/pokemonSearch");
            
            if (!sSearchTerm || !sSearchTerm.trim()) {
                MessageBox.warning("Por favor ingrese el nombre o ID del Pokemon a buscar");
                return;
            }
            
            const sSearchTermTrimmed = sSearchTerm.trim().toLowerCase();
            
            MessageToast.show(`🔍 Buscando Pokemon: ${sSearchTermTrimmed}`);
            
            // ✅ MOSTRAR LOADING
            this.oPokemonModel.setProperty("/pokemonLoading", true);
            
            try {
                // 🌟 FETCH INDIVIDUAL
                // const response = await fetch(`/pokeapi/pokemon/${sSearchTermTrimmed}`, { // Cuando se hace deploy se utiliza de esta forma con el xs-app.json como Destino
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${sSearchTermTrimmed}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Pokemon "${sSearchTermTrimmed}" no encontrado`);
                    }
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const oData = await response.json();
                
                // 🎯 TRANSFORMAR DATOS
                const oPokemon = {
                    id: oData.id,
                    name: oData.name.charAt(0).toUpperCase() + oData.name.slice(1),
                    height: oData.height,
                    weight: oData.weight,
                    base_experience: oData.base_experience,
                    sprite: oData.sprites.front_default,
                    types: oData.types.map(type => type.type.name),
                    abilities: oData.abilities.map(ability => ability.ability.name)
                };
                
                // ✅ AGREGAR A LA TABLA (evitar duplicados)
                const aPokemon = this.oPokemonModel.getProperty("/aPokemon");
                const iExistingIndex = aPokemon.findIndex(p => p.id === oPokemon.id);
                
                if (iExistingIndex >= 0) {
                    // Actualizar existente
                    aPokemon[iExistingIndex] = oPokemon;
                    MessageToast.show(`🔄 Pokemon ${oPokemon.name} actualizado`);
                } else {
                    // Agregar nuevo
                    aPokemon.push(oPokemon);
                    MessageToast.show(`✅ Pokemon ${oPokemon.name} agregado`);
                }
                
                // Ordenar y actualizar
                aPokemon.sort((a, b) => a.id - b.id);
                this.oPokemonModel.setProperty("/aPokemon", aPokemon);
                
                // Limpiar búsqueda
                this.oPokemonModel.setProperty("/pokemonSearch", "");
                
            } catch (error) {
                console.error("❌ Error buscando Pokemon:", error);
                MessageBox.error(`❌ ${error.message}`);
            } finally {
                this.oPokemonModel.setProperty("/pokemonLoading", false);
            }
        },

        /* =======================================================
         * 📊 FUNCIONES DE LA TABLA
         * ======================================================= */
        onSearchPokemonTable(oEvent) {
            const sQuery = oEvent.getParameter("query");
            const oTable = this.byId("pokemonTable");
            const oBinding = oTable.getBinding("items");
            
            if (!sQuery) {
                oBinding.filter([]);
                return;
            }
            
            // 🔍 FILTROS MÚLTIPLES
            const aFilters = [
                new Filter("name", FilterOperator.Contains, sQuery),
                new Filter("id", FilterOperator.EQ, sQuery)
            ];
            
            const oCombinedFilter = new Filter({
                filters: aFilters,
                and: false // OR logic
            });
            
            oBinding.filter([oCombinedFilter]);
            
            MessageToast.show(`🔍 Filtro aplicado: "${sQuery}"`);
        },

        /* =======================================================
         * ✏️ FUNCIONES DE EDICIÓN
         * ======================================================= */
        onPressEditPokemon() {
            this.oPokemonModel.setProperty("/isView", false);
            this.oPokemonModel.setProperty("/tableMode", "MultiSelect");
            MessageToast.show("📝 Modo edición activado");
        },

        onPressSavePokemon() {
            this.oPokemonModel.setProperty("/isView", true);
            this.oPokemonModel.setProperty("/tableMode", "None");
            MessageToast.show("💾 Cambios guardados");
        },

        onPressCancelPokemon() {
            this.oPokemonModel.setProperty("/isView", true);
            this.oPokemonModel.setProperty("/tableMode", "None");
            MessageToast.show("❌ Cambios cancelados");
        },

        onPressDeletePokemon() {
            const oTable = this.byId("pokemonTable");
            const aSelectedItems = oTable.getSelectedItems();
            
            if (aSelectedItems.length === 0) {
                MessageBox.warning("Seleccione al menos un Pokemon para eliminar");
                return;
            }
            
            MessageBox.confirm(
                `¿Eliminar ${aSelectedItems.length} Pokemon seleccionados?`,
                {
                    title: "🗑️ Confirmar Eliminación",
                    onClose: (oAction) => {
                        if (oAction === MessageBox.Action.OK) {
                            this._executeDeletePokemon(aSelectedItems);
                        }
                    }
                }
            );
        },

        /* =======================================================
        * 🧹 VERSIÓN SIMPLE - DIRECTO AL GRANO
        * ======================================================= */
        onClearPokemonData() {
            // LIMPIAR DATOS INMEDIATAMENTE
            this.oPokemonModel.setProperty("/aPokemon", []);
            this.oPokemonModel.setProperty("/pokemonSearch", "");
            
            // RESETEAR UI
            this.oPokemonModel.setProperty("/pokemonLoading", false);
            this.oPokemonModel.setProperty("/isView", true);
            this.oPokemonModel.setProperty("/tableMode", "None");
            
            // MENSAJE SIMPLE
            MessageToast.show("🧹 Datos limpiados");
        },

        _executeDeletePokemon(aSelectedItems) {
            const aPokemon = this.oPokemonModel.getProperty("/aPokemon");
            
            // 🗑️ ELIMINAR POKEMON SELECCIONADOS
            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext("pokemonModel");
                const iPokemonId = oContext.getProperty("id");
                const iIndex = aPokemon.findIndex(p => p.id === iPokemonId);
                
                if (iIndex >= 0) {
                    aPokemon.splice(iIndex, 1);
                }
            });
            
            // ✅ ACTUALIZAR MODELO
            this.oPokemonModel.setProperty("/aPokemon", aPokemon);
            
            // Limpiar selección
            const oTable = this.byId("pokemonTable");
            oTable.removeSelections();
            
            MessageToast.show(`🗑️ ${aSelectedItems.length} Pokemon eliminados`);
        },

        /* =======================================================
         * 🎯 MÉTODO HÍBRIDO PARA DEMO
         * ======================================================= */
        onLoadPokemonData() {
            // Por defecto usar FETCH (más moderno)
            this.onLoadPokemonDataFetch();
        }
    });
});