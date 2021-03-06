/**
 * DatasetService.
 * 27.04.2018
 *
 * Update/Change-Log:
 * 27.07.2018: Added "getDescription" function
 *
 *             Added "updateDescription" function
 *
 * 13.08.2018: Added title for the data set. Changed 'addDescription', 'updateDescription'
 *
 * 27.08.2018: Added data set category and update of category
 *
 * @author D062271
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
sap.ui.define([
    "sap/ui/base/Object",
    "com/sap/ml/data/pool/util/Http"
], function(UI5Object, Http) {
    "use strict";

    return UI5Object.extend("com.sap.ml.data.pool.service.CustomerService", {

        /**
         * Constructor.
         */
        constructor: function() {
            this._http = new Http();
        },

        /**
         * Gets all datasets from the backend.
         *
         * @param fSuccess (callback in case of success)
         * @param fError (callback in case of error)
         */
        getDatasets: function(fSuccess, fError) {
            this._http.performGet("/datasets", fSuccess, fError);
        },
		
		/**
		 * Gets the data set specified.
		 *
		 * @param sFileId (id of the file to load description for)
		 * @param fSuccess (callback in case of success)
		 * @param fError (callback in case of error)
		 */
		getDataset: function(sFileId, fSuccess, fError) {
			this._http.performGet("/datasets/" + sFileId, fSuccess, fError);
		},
		
		/**
		 * Gets a list of all categories.
		 *
		 * @param fSuccess (callback in case of success)
         * @param fError (callback in case of error)
		 */
		getCategories: function(fSuccess, fError) {
			this._http.performGet("/categories", fSuccess, fError);
		},
		
		/**
		 * Posts additional information about the data set
		 * to the server.
		 *
		 * @param sFileName (name of the file)
		 * @param sTitle (title of the data set)
		 * @param sCategory (category of the data set)
		 * @param sDescription (description of the data set)
		 * @param fSuccess (callback in case of success)
         * @param fError (callback in case of error)
		 */
		addDataSetInfo: function(sFileName, sTitle, sCategory, sDescription, fSuccess, fError) {
			this._http.performPost("/addDataSetInfo", {
				"file_name": sFileName,
				"file_title": sTitle,
				"file_category": sCategory,
				"file_description": sDescription
			}, fSuccess, fError);
		},
		
		/**
		 * Updates the file description anf the file title of the data set specified.
		 *
		 * @param sFileId (id of the file to upload the description for)
		 * @param sTitle (new title of the data set)
		 * @param sCategory (new category of the data set)
		 * @param sDescription (new description text)
		 * @param fSuccess (callback in case of success)
		 * @param fError (callback in case of error)
		 */
		updateDataSetInfo: function(sFileId, sTitle, sCategory, sDescription, fSuccess, fError) {
			this._http.performPut("/datasets/" + sFileId + "/info", {
				"file_title": sTitle,
				"file_category": sCategory,
				"file_description": sDescription
			}, fSuccess, fError);
		},
		
		/**
		 * Deletes the dataset specified.
		 *
		 * @param sId (id of dataset to be deleted)
		 * @param fSuccess (callback in case of success)
		 * @param fError (callback in case of error)
		 */
		deleteDataset: function(sId, fSuccess, fError) {
			this._http.performDelete("/datasets/" + sId, fSuccess, fError);
		}
    });
});