/**
 * AdminService.
 * 27.04.2018
 *
 * Update/Change-Log:
 * 
 *
 * @author D062271
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
sap.ui.define([
    "sap/ui/base/Object",
    "com/sap/ml/data/pool/util/Http"
], function(UI5Object, Http) {
    "use strict";

    return UI5Object.extend("com.sap.ml.data.pool.service.AdminService", {

        /**
         * Constructor.
         */
        constructor: function() {
            this._http = new Http();
        },

        /**
         * Checks if a user is admin.
         *
         * @param fSuccess (callback in case of success)
         * @param fError (callback in case of error)
         */
        isAdmin: function(fSuccess, fError) {
            this._http.performGet("/isAdmin", fSuccess, fError);
        }
    });
});