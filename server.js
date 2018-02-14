var express = require('express');
var routes = require('./routes.js');
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
var session = require('express-session');
var mysqlStore = require('express-mysql-session')(session);
var options = {
    host: 'localhost',
    port: 3306,
    user: 'admin',
    password: 'thegame',
    database: 'TheGame'
};

var sessionStore = new mysqlStore(options);
var app = express();
app.use(bodyParser.json());

app.use(session({
	secret: "Random",
	resave: true,
	saveUninitialized: true,
	store: sessionStore,
	cookie: { maxAge: 20*60*1000 }
}));

//Middleware for persistent login
app.use("/", function(request, response, next){
	conn.query("SELECT username FROM users WHERE sessionID = ?",[request.session.id], function(err,row){
		restrictedRoutes = /\/menu*|\/game*|\/account*/;
		if(row.length == 0){
			if(request.url == '/' || request.url.match(restrictedRoutes) != null){
				response.redirect('/login.html');
				console.log(row);
				console.log("Cookie not found in Middleware");
				console.log(request.cookie);
			}
			else{
				next();
			}
		} else {
			if(request.url == '/login.html' || request.url == '/signup.html' || request.url == '/') {
				response.redirect('/menu.html');
			} else {
				next();
			}
		}
	});


});

//creating server
var server = app.listen(8081, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("Server running at http://%s:%s",host,port);
})

//initial coin locations
coinReset();
//basic routes
app.get('/', routes.home)
app.get('/images/user.png', routes.usrimg)
app.get('/images/key.png', routes.keyimg)
app.get('/images/redo.png', routes.redoimg)
app.get('/images/name.png', routes.nameimg)
app.get('/images/mail.png', routes.mailimg)
app.get('/images/lock.png', routes.lockimg)
app.get('/images/avatar.png', routes.avatarimg)
app.get('/images/background.jpg', routes.background)
app.get('/login.js', routes.loginjs)
app.get('/md5.js', routes.md5)
app.get('/login.html', routes.login)
app.get('/signup.html', routes.signup)
app.get('/entry_style.css', routes.style)
app.get('/menu.html', routes.menu)
app.get('/menu.js', routes.menujs)
app.get('/menu_style.css', routes.menustyle)
app.get('/account.html', routes.account)
app.get('/account.js', routes.accountjs)
app.get('/account_style.css', routes.accountstyle)
app.get('/game.html', routes.game)
app.get('/game.js', routes.gamejs)
app.get('/game_style.css', routes.gameStyle)
app.get('/style.css', routes.style)
app.get('/map.jpg', routes.gameBackground)
app.get('/playerIcon.png', routes.playerIcon);
app.get('/mapbk.jpg', routes.mapbk)
app.post('/logout', routes.logout)
app.post('/getSalt',routes.getSalt)
app.post('/login', routes.loginPost)
app.post('/signUp', routes.signupPost)
app.post('/updateColor', routes.updateColor)
app.post('/deleteUser', routes.deleteUserPost)
app.post('/ResetScore', routes.ResetScorePost)


// GAME SOCKET STUFF BELOW HERE

//object to store locations of players and coins
var userLoc = {};
var coinLoc = [];

var io = require('socket.io')(server);
io.on('connection', function (socket) {
	var client = socket.id;
	console.log("----SOCKET CREATED----");
	socket.emit('join', "You have successfully joined");
	console.log("ID :" + client);
	socket.on('updatePlayerLoc', function(data) {
		//update userLoc with location for that particular player
		userLoc[data.username] = {};
		userLoc[data.username]["x"] = data.loc.x;
		userLoc[data.username]["y"] = data.loc.y;
		userLoc[data.username]["color"] = data.color;
		socket.emit('playerLocUpdate', JSON.stringify(userLoc));
		//console.log(userLoc);
	})

	//remove player form userLoc when he logs out
	socket.on('logout', function(data){
		delete userLoc[data];
		console.log("Player " + data + " has been removed from game");
		// console.log("new List: ");
		// console.log(userLoc);
	})

	//removes coin from coin array
	socket.on('collectCoin', function(data){
		if (coinLoc[data] == null) {
			io.to(client).emit('scoreUpdate', 0);
		} else {
			coinLoc[data] = null;
			io.to(client).emit('scoreUpdate', 1);
		}
		console.log("Index collected: "+data);
		socket.broadcast.emit('removeCoin', data);
		console.log("Active Coins: "+activeCoins());
		if(activeCoins() <= 20){
			coinReset();
			socket.emit('coinData', coinLoc);
		}
	})

	//sends coin array to user
	socket.on('getCoins', function(data){
		socket.emit('coinData', coinLoc);
	})

	//score check before logout
	socket.on('saveScore', function(data){
		conn.query("SELECT global_score FROM users WHERE username = ? ;", [data.username], function(err, row){
			if(err)
				console.log(err);
			else{
				if(row[0].global_score < data.score){
					conn.query("UPDATE users SET global_score = ? WHERE username = ? ;", [data.score, data.username], function(err){
						if(err){
							console.log(err);
						}
						else
							console.log("Score updated");
					});
				}
			}
		});
	})

	socket.on('getHighScore', function(data){
		if(data != "unknown"){
			conn.query("SELECT global_score FROM users WHERE username = ?", [data], function(err, row){
				if(err)
					console.log(err);
				else{
					var score = row[0].global_score;
					if(score == null)
						score = 0;
					io.to(client).emit('highScore', score);
				}
			});
		}
	})

})
//
//Helper functions
function coinReset(){
	conn.query("SELECT location FROM summons WHERE state_id = 1 ORDER BY RAND() LIMIT 50 ", function(err, row){
		if(err)
			console.log(err);
		else{
			coinLoc= [];
			row.forEach(element => {
				var x = parseInt(element["location"].substring(0,4));
				var y = parseInt(element["location"].substring(5,9));
				var obj = { "x": x, "y": y };
				coinLoc.push(obj);
			});
			console.log("RESETTING");
		}
	});

}

function activeCoins(){
	var count = 0;
	coinLoc.forEach(element => {
		if(element == null)
			count++;
	});
	return coinLoc.length - count;
}
