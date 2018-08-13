/**
 * DatasetListController.
 * 23.04.201
 *
 * Update/Change-Log:
 * 27.07.2018: Added handler functions for "AlterDescriptionDialog"
 *
 *             Hide links that must not be used by non-admin users
 *
 * 13.08.2018: Added title for the dataset
 *
 *			   Added HTML tags for file description
 *
 * @author D062271
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
sap.ui.define([
	"com/sap/ml/data/pool/controller/BaseController",
	"com/sap/ml/data/pool/service/DatasetService",
	"com/sap/ml/data/pool/service/AdminService",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, DatasetService, AdminService, JSONModel, Filter, MessageBox, MessageToast) {
	"use strict";
	
	var self;

	return BaseController.extend("com.sap.ml.data.pool.controller.DatasetList", {
		
		/**
		 * onInit function.
		 */
		onInit: function() {
			self = this;
			
			setTimeout(function() {
				new AdminService().isAdmin(function() {}, function() {
					// hide links that must not be used by non-admins
					$(".admin").css("visibility", "hidden");
				});
				
				//MessageBox.information(
				//	self.getTextById("Datasetlist.download.information")
				//);
			}, 500);
			
			this._getDatasets(function(aData) {
				var oView = self.getView();
				
				// set model
				oView.setModel(new JSONModel(aData));
				
				var oLabel = oView.byId("toolbarLabel");
				oLabel.setText(
					self.getTextById("Datasetlist.toolbar.text") + " " + aData.length
				);
			});
		},
		
		/**
		 * Filters the list of datasets
		 * according to the query specified.
		 *
		 * @param oEvent
		 */
		onSearch: function(oEvent) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			
			if(sQuery && sQuery.length > 0) {
				var oFilter = new Filter("file_name", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(oFilter);
			}

			// update list binding
			var oList = self.byId("datasetList");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilters, "Application");
			
			// update toolbar label
			var oView = self.getView();
			var oLabel = oView.byId("toolbarLabel");
			oLabel.setText(
				self.getTextById("Datasetlist.toolbar.text") + " " + oBinding.aIndices.length
			);
		},
		
		/**
		 * Deletes a dataset.
		 *
		 * @param oEvent
		 */
		onDeleteDataset: function(oEvent) {
			var sId = oEvent.getSource().data("file_id");
			
			// check if user has admin permissions
			new AdminService().isAdmin(function() {
				// has permission...
				MessageBox.confirm(
				self.getTextById("Datasetlist.delete.warning"), {
					onClose: function(sButton) {
						if(sButton === MessageBox.Action.OK) {
							self._deleteDataset(sId);
							
							// delete entry from binding
							var oView = self.getView();
							var oModel = oView.getModel();
							var oData = oModel.oData;
							
							for(var i = 0; i < oData.length; i++) {
								var oItem = oData[i];
								
								// item to be deleted found
								if(oItem.file_id == sId) {
									oData.splice(i, 1);
									oModel.setData(oData);
									break;
								}
							}
							
							// update toolbar label
							var oLabel = oView.byId("toolbarLabel");
							oLabel.setText(
								self.getTextById("Datasetlist.toolbar.text") + " " + oData.length
							);
						}
					}
				});
			},
			function() {
				// doesn't have permission...
				MessageBox.error(self.getTextById("Misc.error.no.admin"));
			});
		},
		
		/**
		 * Opens a popup to alter the description of a data set.
		 *
		 * @param oEvent
		 */
		onOpenAlterDescriptionDialog: function(oEvent) {
			var sId = oEvent.getSource().data("file_id");
			
			// check if user has admin permissions
			new AdminService().isAdmin(function() {
				// has permission...
				self._openDialog(
					"AlterDescriptionDialog",
					"com.sap.ml.data.pool.fragment.AlterDescriptionDialog"
				);
				
				self._getDescription(sId, function(aData) {
					var oView = self.getView();
					var oTextDataSetId = oView.byId("datasetId");
					var oInput = oView.byId("titleInput");
					var oTextArea = oView.byId("descriptionTextArea");
					
					oTextDataSetId.setText(sId);
					oInput.setValue(aData[0].file_title);
					oTextArea.setValue(aData[0].file_description);
					
				});
			}, function() {
				// doesn't have permission...
				MessageBox.error(self.getTextById("Misc.error.no.admin"));
			});
		},
		
		/**
		 * Updates the description.
		 *
		 * @param oEvent
		 */
		onUpdateDescriptionPress: function(oEvent) {
			var oView = self.getView();
			
			new DatasetService().updateDescription(
				oView.byId("datasetId").getText(),
				oView.byId("titleInput").getValue(),
				oView.byId("descriptionTextArea").getValue(),
				function(res) {
					self._oAlterDescriptionDialog.close();
					MessageToast.show(
						self.getTextById("Datasetlist.changed.description")
					);
				},
				function(res) {
					MessageToast.show(
						self.getTextById("Misc.error")
					);
				}
			);
		},
		
		/**
		 * Closes the "AlterDescriptionDialog".
		 *
		 * @param oEvent
		 */
		onAlterDescriptionDialogCancel: function(oEvent) {
			self._oAlterDescriptionDialog.close();
		},
		
		/**
         * Gets the list of datasets.
         *
         * @param fCallback
         */
        _getDatasets: function(fCallback) {
            new DatasetService().getDatasets(function(res) {
				var aData = res.data;
				
				// add html tags for the description
				for(var i = 0; i < aData.length; i++) {
					aData[i].file_description = "" +
					"<html>" +
						"<head>" +
							"<style>" +
								"ul {" +
									"font-size: 10pt;" +
								"}" +
								"ol {" +
									"font-size: 10pt;" +
								"}" +
								"p {" +
									"white-space: pre-line;" +
									"font-size: 10pt;" +
									"font-style: italic;" +
									"margin-top: 0px;" +
								"}" +
							"</style>" +
						"</head>" +
						"<body>" +
							"<p>" + aData[i].file_description + "</p>" +
						"</body>" +
					"</html>";
				}
				
                fCallback(res.data);
            }, function(res) {
                MessageBox.error(self.getTextById("Misc.error.data.load"));
            });
        },
		
		/**
		 * Gets the description of the data set.
		 *
		 * @param sId (id of the data set to load description for)
		 * @param fCallback
		 */
		_getDescription: function(sId, fCallback) {
			new DatasetService().getDescription(sId,
			function(res) {
				fCallback(res.data);
			}, function(res) {
				MessageBox.error(self.getTextById("Misc.error.data.load"));
			});
		},
		
		/**
		 * Deletes the dataset.
		 *
		 * @param sId (id of dataset to be deleted)
		 */
		_deleteDataset: function(sId) {
			// Delete dataset
			new DatasetService().deleteDataset(
				sId,
				function() {},
				function() {}
			);	
		},
		
		/**
         * Opens the dialog specified
         *
         * @param sDialogType
         * @param sDialogName
         */
        _openDialog: function(sDialogType, sDialogName) {
            var oView = self.getView();

            var oDialog = (sDialogType === "AlterDescriptionDialog")
                ? self._oAlterDescriptionDialog
                : undefined;

            // create dialog lazily
            if(!oDialog) {
                // create dialog via fragment factory
                oDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    sDialogName,
                    self
                );

                // connect dialog to the root view of this component
                oView.addDependent(oDialog);

                // forward compact/cozy style into dialog
                jQuery.sap.syncStyleClass(
                    oView.getController().getOwnerComponent().getContentDensityClass(), oView, oDialog
                );
            }

            if(sDialogType === "AlterDescriptionDialog") {
				self._oAlterDescriptionDialog = oDialog;	
            } else {undefined;}

            oDialog.open();
        }
	});
});