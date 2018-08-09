/**
 * Routes dataset.
 * 27.04.2018
 *
 * Update/Change-Log:
 * 26.07.2018: Altered "/datasets" route such that it also returns file sizes
 *
 *             Also fixed naming of downloaded file (was dataset.zip per default)
 *
 * 27.07.2018: Added renaming of file in "/dataset" (now "/dataset/:file_name?") route
 *
 *             Modified response of "/datasets" route. Route also returns the date
 *             when the content was uploaded and the short file name (without prefix)
 *
 *             Added routes to update the description of a data set
 *
 *             Begin implementation of logging
 *
 * 28.08.2018: Implementation of logging
 *
 * 09.08.2018: Escaping of "'" in data set description
 *
 *			   Changed logging (due to foreign key constraint removal). In download route '/datasets/:file_name'
 *             it is no longer necessary to select the id of the file which was downloaded for logging purposes.
 *             Instead the file name is logged directly (no foreign key)
 *
 * @author D062271
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

"use strict";

// import necessary modules
var fs 					 = require("fs");
var path				 = require("path");
var rl 					 = require("readline");
var esc		  	 		 = require("pg-escape");
var busboy 				 = require("connect-busboy");

// own modules
var config 				 = require("../config.js");
var postgres 			 = require("../postgres/postgres.js");
var isAuthenticated 	 = require("../passport/isAuthenticated.js");
var isAuthenticatedAdmin = require("../passport/isAuthenticatedAdmin.js");

// ==============================================================

module.exports = function(oApp) {

    /**
     * Returns a list of all datasets.
     *
     * @name /datasets
     */
    oApp.get("/datasets", isAuthenticated, function(oReq, oRes) {
		fs.readdir(config.app.dataset_root_path, function(oErr, aFiles) {
			
			var sSql = "SELECT * FROM datasets ORDER BY file_id DESC;";

			postgres.query(sSql, function(oErr, oResult) {
				if(oErr) {return oRes.status(500).json({"err": oErr});}
				var regex = /^AOA_(.*?)_(.*)$/;
				
				// read file size from file system
				for(var i = 0; i < oResult.rows.length; i++) {
					var sFileName = path.join(config.app.dataset_root_path, oResult.rows[i].file_name);
					
					var oStats = fs.statSync(sFileName);
					var dFileSizeInBytes = oStats.size
					// convert file size to megabytes
					oResult.rows[i].file_size_mb = dFileSizeInBytes / 1000000.0
					
					// extract date and short file name from long file name
					var aMatch = regex.exec(oResult.rows[i].file_name);
					
					oResult.rows[i].file_date = formatTimestamp(new Date(parseInt(aMatch[1])));
					oResult.rows[i].file_name_short = aMatch[2];
				}

				return oRes.status(200).json({
					"data": oResult.rows
				});
			});
		});
	}),
	
	/**
     * Downloads the file specified.
     *
     * @name /datasets/:file_name
	 * @param file_name (obligatory)
     */
	oApp.get("/datasets/:file_name", isAuthenticated, function(oReq, oRes) {
		var sFileName = oReq.params.file_name;
		var sPath = path.join(config.app.dataset_root_path, sFileName);
		// statistics about file
		var oStat = fs.statSync(sPath);
		
		// log download
		logDownload(sFileName, oReq.user.username,
		function(oErr, oResult) {
			if(oErr) {return oRes.status(500).json({"err": oErr});}
				
			oRes.writeHead(200, {
				"Content-Type": "application/zip", // it is a *.zip file
				"Content-Length": oStat.size,
				"Content-disposition": "attachment; filename=" + sFileName
			});
		
			// pipe result into response
			fs.createReadStream(sPath).pipe(oRes);
		});
	}),
	
	/**
	 * Posts a new dataset to the server.
	 *
	 * @name /dataset
	 * @param file_name (optional, used for renaming the file on the server)
	 */
	oApp.post("/dataset/:file_name?", isAuthenticatedAdmin, function(oReq, oRes) {
		oReq.pipe(oReq.busboy);
	
		oReq.busboy.on("file", function(sFieldname, oFile, sFileName) {
			sFileName = oReq.params.file_name ? oReq.params.file_name : sFileName;
			// if a new file arrives => create write stream
			var oWriteStream = fs.createWriteStream(
				path.join(config.app.dataset_root_path, sFileName)
			);
			
			oFile.pipe(oWriteStream);
			oWriteStream.on("close", function() {
				oRes.redirect("back");
			});
		});
	});
	
	/**
	 * Posts a new dataset description to the server.
	 *
	 * @name /addDescription
	 */
	oApp.post("/addDescription", isAuthenticatedAdmin, function(oReq, oRes) {
		var sFileName = oReq.body.file_name;
		var sDescription = oReq.body.file_description;
		
		// insert new dataset into database
		var sSql = esc("INSERT INTO datasets (file_name, file_description) VALUES (%Q, %Q);",
		sFileName, sDescription);
		
		postgres.query(sSql, function(oErr, oResult) {
			if(oErr) {return oRes.status(500).json({"err": oErr});}

			return oRes.status(200).json({
				"status": "ok"
			});
		});
	});
	
	/**
	 * Gets the description for the dataset specified.
	 *
	 * @name /datasets/:file_id/description
	 * @param file_id (obligatory)
	 */
	oApp.get("/datasets/:file_id/description", isAuthenticated, function(oReq, oRes) {
		var sId = oReq.params.file_id;
		
		var sSql = esc("SELECT file_description FROM datasets WHERE file_id = %Q;", sId);
		
		postgres.query(sSql, function(oErr, oResult) {
			if(oErr) {return oRes.status(500).json({"err": oErr});}
			return oRes.status(200).json({
				"data": oResult.rows
			});
		});
	});
	
	/**
	 * Updates the description of a data set.
	 *
	 * @name /datasets/:file_id/description
	 * @param file_id (obligatory)
	 */
	oApp.put("/datasets/:file_id/description", isAuthenticatedAdmin, function(oReq, oRes) {
		var sId = oReq.params.file_id;
		var sDescription = oReq.body.file_description;
		
		var sSql = esc("UPDATE datasets SET file_description = %Q WHERE file_id = %Q;",
		sDescription, sId);
		
		postgres.query(sSql, function(oErr, oResult) {
			if(oErr) {return oRes.status(500).json({"err": oErr});}
			return oRes.status(200).json({
				"status": "ok"
			});
		});
	});
	
	/**
	 * Deletes a dataset from the server.
	 *
	 * @name /dataset/:file_id
	 * @param file_id (obligatory)
	 */
	oApp.delete("/datasets/:file_id", isAuthenticatedAdmin, function(oReq, oRes) {
		var sId = oReq.params.file_id;
		
		// get file name of file with id specified
		var sSql = esc("SELECT file_name FROM datasets WHERE file_id = %Q;", sId);
		
		postgres.query(sSql, function(oErr, oResult) {
			if(oErr) {return oRes.status(500).json({"err": oErr});}
			
			var sFileName = oResult.rows[0].file_name;
			var sSql = esc("DELETE FROM datasets WHERE file_id = %Q;", sId);
			
			// delete dataset entry from database
			postgres.query(sSql, function(oErr, oResult) {
				if(oErr) {return oRes.status(500).json({"err": oErr});}
				
				// delete *.zip file from file system
				fs.unlink(path.join(
					config.app.dataset_root_path, sFileName
				), function(err) {
					if(err) {
						return oRes.status(500).json({
							"err": oErr
						});
						
						// TODO: actually we would have to restore
						// the database entry here...
					}
					return oRes.status(200).json({
						"status": "ok"
					});
				}); 
			});
		});
	});
};

/**
 * Converts a time stamp into a readable format.
 *
 * @param oDate (timestamp)
 * @return Readable date
 */
function formatTimestamp(oDate) {
	// extract date components
	var sDay = ("0" + oDate.getDate()).substr(-2);
	var sMonth = ("0" + (oDate.getMonth() + 1)).substr(-2);
	var sYear = oDate.getFullYear();
	var sHours = ("0" + oDate.getHours()).substr(-2);
	var sMinutes = ("0" + oDate.getMinutes()).substr(-2);
	var sSeconds = ("0" + oDate.getSeconds()).substr(-2);
	
	return sDay + "/" + sMonth + "/" + sYear +
	" " + sHours + ":" + sMinutes + ":" + sSeconds;
}

/**
 * Logs the downloads of data sets.
 *
 * @param sFileName (name of the file which was downloaded)
 * @param sUser (user who downloaded the data set)
 * @param fCallback (callback function)
 */
function logDownload(sFileName, sUser, fCallback) {
	var sSql = esc("INSERT INTO logs (log_file, log_user, log_time) " +
	"VALUES (%Q, %Q, localtimestamp);", sFileName, sUser);
	
	postgres.query(sSql, function(oErr, oResult) {
		fCallback(oErr, oResult);
	});
}