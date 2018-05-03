/**
 * Users.
 * 03.05.2018
 *
 * @author D062271
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

"use strict";

// definition of users
var aUsers = [
	{id: 1, username: "admin", password: "admin"},
	{id: 2, username: "user", password: "user"}
];

var mod = {};

/**
 * Find a user by username.
 *
 * @param sUsername
 * @return user object if user was found, null otherwise
 */
mod.findByName = function(sUsername) {
	for(var i = 0; i < aUsers.length; i++) {
		if(aUsers[i].username == sUsername) {return aUsers[i];}
	}
	return null;
}

module.exports = mod;