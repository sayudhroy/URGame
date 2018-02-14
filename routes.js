var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var conn = mysql.createConnection({
	host:'localhost',
	user:'admin',
	password:'thegame',
	database:'TheGame'
});
conn.connect(function(err){
	if(err)
		console.log(err);
	console.log("Database Connected");
});
var app = express();
var server = require('http').Server(app);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//routes
//--------------------------------------------------------------------------
exports.logout = function(request,response){
	conn.query("UPDATE users SET sessionID = ? WHERE sessionID = ?", ["loggedout", request.session.id], function(err){
		if(err){
			console.log(err);
			response.sendStatus(500);
		}
		else{
			console.log("User Logged out");
			response.cookie('userName','NULL',{ maxAge: 0});
			response.cookie('color','NULL',{ maxAge: 0});
			response.sendStatus(200);
		}

	})
}

exports.getSalt = function(request, response) {
	console
	conn.query("SELECT salt FROM users WHERE username = ?",[request.body.username], function(err, row){
		if(err){
			console.log("ERROR!!");
		 	return console.log(err);
		}
		if(row.length != 0 ){
			response.send({salt: row[0].salt});
		}
		else{
			console.log("Username does not exist");
			response.sendStatus(404);
		}
	});
}

exports.loginPost = function(request, response) {
	conn.query("SELECT username, hash, color FROM users WHERE username = ?", [request.body.username],function(err, row){
		if(err) {
			return console.log(err);
		}
		if(row[0].hash == request.body.hash) {
			console.log("User authenticated");
			saveLogin(request.session.id, request.body.username);
			response.cookie('userName', request.body.username, { maxAge: 900000, httpOnly: false });
			response.cookie('color', row[0].color, {maxAge: 900000, httpOnly: false, encode: String});
			response.send({ redirect: '/' });
		}
		else {
			response.send(404);
			console.log("User authentication FAILED");
		}

	});
}

exports.signupPost = function(request, response) {
	conn.query("SELECT username FROM users WHERE username = ?", [request.body.username], function(err, row) {
		if(err) {
			return console.log(err);
		}
		if(row.length != 0) {
			// Handle response that username exists
			response.sendStatus(404);
		} else {
			conn.query("INSERT INTO users (username,salt,hash,sessionID,color) VALUES(?,?,?,?,?);", [request.body.username, request.body.salt, request.body.hash, "", request.body.color], function(err) {
					if(err)
						return console.log(err);
					else
						saveLogin(request.session.id, request.body.username);
						response.cookie('userName', request.body.username, { maxAge: 900000, httpOnly: false });
						response.cookie('color', request.body.color, {maxAge: 900000, httpOnly: false, encode: String});
						response.send({ redirect: '/' });
						console.log("USER ADDED");
						// conn.query("SELECT * from users", function(err, row){
						// 	console.log("Username: " + row[0].username +" Salt: " + row[0].salt + " Hash: " + row[0].hash+ " Session ID: " + row[0].sessionID + " Color: " + row[0].color);
						// });
				});
		}
	});
}
// ##################################
// Delete User functions
exports.deleteUserPost = function(request, response) {
	conn.query("DELETE FROM users WHERE username = ?;", [request.body.username], function(err) {
		console.log(request.body);
			if(err) {
				return console.log(err);
			}
			else {
				response.cookie('userName','NULL',{ maxAge: 0});
				response.cookie('color','NULL',{ maxAge: 0});
				response.send({ redirect: '/login.html' });
				}
			})
		}
// ##################################
// Delete User functions
exports.ResetScorePost = function(request, response) {
	conn.query("Call reset_score(?);", [request.body.username], function(err) {
		console.log(request.body);
			if(err) {
				return console.log(err);
			}
			})
		}
// ##################################

function saveLogin (sid, username){
	conn.query("UPDATE users SET sessionID = ? WHERE username = ?",[sid, username], function(err){
		if(err)
			return console.log(err);
	} )
}

//Login page files:
exports.game = function(request, response){
	response.sendFile(__dirname + "/resources/templates/game/game.html");
}

//--------------------------------------------------------------------------
// Menu page routes:
exports.menu = function(request, response){
	response.sendFile(__dirname + "/resources/templates/menu/menu.html");
}

exports.menujs = function(request, response){
	response.sendFile(__dirname + "/resources/templates/menu/menu.js");
}

exports.menustyle = function(request, response){
	response.sendFile(__dirname + "/resources/templates/menu/style.css");
}

//--------------------------------------------------------------------------
// Account page routes:
exports.updateColor = function(request, response){
	conn.query("UPDATE users SET color = ? WHERE sessionID = ?", [request.body.color, request.session.id], function(err){
		if(err){
			console.log(err);
			response.sendStatus(500);
		}
		else{
			response.cookie('color', request.body.color, {maxAge: 900000, httpOnly: false, encode: String});
			response.sendStatus(200);
		}
	})
	conn.query("SELECT * from users", function(err, row){
		//console.log("Username: " + row[0].username + " Account ID: "+row[0].account_id+" Salt: " + row[0].salt + " Hash: " + row[0].hash+ " Session ID: " + row[0].sessionID + " Color: " + row[0].color);
	});

}

exports.account = function(request, response){
	response.sendFile(__dirname + "/resources/templates/account/account.html");
}

exports.accountjs = function(request, response){
	response.sendFile(__dirname + "/resources/templates/account/account.js");
}

exports.accountstyle = function(request, response){
	response.sendFile(__dirname + "/resources/templates/account/style.css");
}


exports.home = function(request, response){
	response.sendFile(__dirname + '/resources/templates/game/game.html');
}

exports.usrimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/user.png');
}

exports.keyimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/key.png');
}

exports.redoimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/redo.png');
}

exports.nameimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/name.png');
}

exports.mailimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/mail.png');
}

exports.lockimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/lock.png');
}

exports.avatarimg = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/avatar.png');
}

//---------------------------

//Login javascript code
exports.loginjs = function(request, response){
	response.sendFile(__dirname + '/resources/templates/login/login.js');
}

//Hashing algorithm
exports.md5 = function(request, response){
	response.sendFile(__dirname + '/resources/templates/login/md5.js');
}

//--------------------------------------------------------------------------
//SignUp page files:

exports.signup = function(request, response){
	response.sendFile(__dirname + '/resources/templates/login/signup.html');
}

exports.login = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/login.html');
}

//---------------------------
//Game routes
exports.gameBackground = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/game/map.jpg');
}

exports.playerIcon = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/game/playerIcon.png');
}

exports.gamejs = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/game/game.js');
}

exports.gameStyle = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/game/style.css');
}
//---------------------------
//TheGame Common style file and background

exports.style = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/style.css');
}

exports.background = function(request, response) {
	response.sendFile(__dirname + '/resources/templates/login/images/background.jpg');
}

exports.mapbk = function (request, response){
	response.sendFile (__dirname + '/resources/templates/menu/mapbk.jpg');
}

/*
 * Sample Image route function
 * send file param should point to file in our directory
 */
