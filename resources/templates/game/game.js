var keys = [];
var buildings = [];
var coins = [];
var opponents = [];
var myPlayer;
var socket;
var myUserName;
var myColor;
var windowWidth = 500;
var windowHeight = 400;
var score = 0;
var highScore = 0;
var inGame;

// /* -------------- SYSTEM FUNCTIONALITY -------------- */
function startGame() {
    
    socket = io.connect('http://localhost:8081');
    socket.on('join', function (data) {
        // retrieve data about buildings
        // retrieve coin information
        socket.emit('getCoins', true);
        // retrieve previous high score
        socket.emit('getHighScore', myUserName);
    });
    socket.on('playerLocUpdate', function(data){
        updatePlayers(JSON.parse(data));
    });
    socket.on('coinData', function(data) {
        updateCoins(data);
    });
    socket.on('highScore', function(data) {
        highScore = parseInt(data);
        document.getElementById("curScore").textContent = "Score: "+ score + " | High Score: "+highScore;
    });
    socket.on('scoreUpdate', function(data) {
        score += data;
        document.getElementById("curScore").textContent = "Score: "+ score + " | High Score: "+highScore;
        //console.log(scconsole.log(score);
    });
    socket.on('removeCoin', function(data) {
        coins[data] = null;
        //console.log("remove: " + data);
    });
    loadUsername();
    inGame=true;
    myUserName = parseCookieData("userName=");
    myColor = parseCookieData("color=");
    myPlayer = new player(20, 20, myColor, 1215, 1455);
    loadBuildings();
    map.start();
}

// adapted from https://www.w3schools.com/js/js_cookies.asp
function parseCookieData(key) {
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(key) == 0) {
            return c.substring(key.length, c.length);
        }
    }
    return "unknown";
}

function loadUsername() {
    username = parseCookieData("userName=");
    document.getElementById("userName").textContent = "Username: " + username;
    //document.getElementById("curScore").textContent = "Score: "+ score + " | High Score: "+highScore;
}

function navigateToMenu() {
    sendScore();
    inGame=false;
    socket.emit('logout', myUserName);
    window.location = "/menu.html";
}

function logout() {
    sendScore();
    inGame=false;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "logout", true);
    xhr.send();
    socket.emit('logout', myUserName);
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4 && xhr.status == 200){
            window.location = "/login.html";
        }
        else{
            //console.log("log out error");
            // alert("you can never leave");
        }
    }
}

/* -------------- GAME OBJECTS -------------- */
// Map object
var map = {
    canvas : document.createElement("canvas"),
    width : windowWidth,
    height : windowHeight,
    background : new Image(),
    icon : new Image(),
    context : undefined,
    start : function() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.setAttribute('style', "padding: 0; margin: auto; display: block; position: absolute; top: 0; bottom: 0; left: 0; right: 0; border-width:5px; border-style:ridge;");
        this.context = this.canvas.getContext("2d");
        var node = document.getElementById("gamecanvas");
        node.appendChild(this.canvas);
        //document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.localInterval = setInterval(updateGameLocal, 20);
        this.remoteInterval = setInterval(updateGameRemote, 100);
        window.addEventListener('keydown', function (e) {
            keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            keys[e.keyCode] = false;
        })
        //load background
        this.background.src = "map.jpg";
        this.icon.src = "playerIcon.png";
    },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    update : function(x, y, color) {
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.drawImage(this.background, x - (this.width / 2), y - (this.height / 2), 1000, 500, 0, 0, 1000, 500);
        this.context.fill();
        this.context.stroke();
        this.context.fillStyle = color;
        this.context.fillRect((this.width / 2), (this.height / 2), 20, 20);
        this.context.drawImage(this.icon, (this.width / 2) + 5, (this.height / 2) + 5, 10, 10);
    }
}

// Player Object
function player(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = 1; /* change back to 1 after testing */
    this.move = function() {
        // console.log(this.x + ", " + this.y);
        if(keys[83] && !this.collisionCheck(this.x, this.y + this.speed)) this.y += this.speed;
        if(keys[87] && !this.collisionCheck(this.x, this.y - this.speed)) this.y -= this.speed;
        if(keys[68] && !this.collisionCheck(this.x + this.speed, this.y)) this.x += this.speed;
        if(keys[65] && !this.collisionCheck(this.x - this.speed, this.y)) this.x -= this.speed;
        // Check for collected coins
        this.coinCheck();
    }
    this.collisionCheck = function(x, y) {
        // TODO: ADJUST UPPER BOUNDS FOR SIZE OF MAP
        if(x < 0 || x > 2180)
            return true;
        if(y < 0 || y > 2180)
            return true;
        for (var i = 0, len = buildings.length; i < len; i++) {
            if(buildings[i].collision(x, y, this.width, this.height)) {
                return true;
            }
        }
        return false;
    }

    this.coinCheck = function () {
        for (var i = 0, len = coins.length; i < len; i++) {
            if(coins[i] != null && coins[i].collision(this.x, this.y, this.width, this.height)) {
                coins[i] = null;
                socket.emit('collectCoin', i);
            }
        }
    }

    this.sendLocation = function() {
        if(inGame) {
            socket.emit('updatePlayerLoc', {username: myUserName, loc: {x: this.x, y: this.y}, color: myColor });
        }
    }
}

// Building Object
function building(width, height, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.collision = function (x, y, width, height) {
        if (x < this.x + this.width &&
            x + width > this.x &&
            y < this.y + this.height &&
            y + height > this.y) {
                return true;
        } else {
            return false;
        }
    }
    // ----- USED TO PHYSICALLY DRAW BUILDINGS (FOR TESTING) --------
    /*
    this.update = function(x, y) {
        ctx = map.context;
        ctx.fillStyle = "black";
        ctx.fillRect(this.x - x, this.y - y, this.width, this.height);
    }
    */
}

// Coin Object
function coin(index, x, y) {
    this.index = index;
    this.x = x;
    this.y = y;
    this.size = 6;
    // draw coin on map
    this.update = function(x, y) {
        ctx = map.context;
        ctx.beginPath();
        ctx.arc(this.x - x, this.y - y, this.size / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
    
    this.collision = function(x, y, width, height) {
        if (x < this.x + this.size &&
            x + width > this.x &&
            y < this.y + this.size &&
            y + height > this.y) {
                return true;
        } else {
            return false;
        }
    }
}

// Opponent Object
function opponent(username, color, x, y, width, height) {
    this.userName = username;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = color;
    this.update = function(x, y) {
        ctx = map.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x - x, this.y - y, this.width, this.height);
    }
}

/* -------------- GAME FUNCTIONS -------------- */
// add players from server data to local array
function updatePlayers(data){
    newOpponents = [];
    for(var key in data){
        // console.log("adding " + key);
        // console.log(data);
        // console.log(data[key]);
        newOpponents.push(new opponent(key, data[key].color, data[key].x, data[key].y, 20, 20));
    }
    opponents = newOpponents;
}

function updateCoins(data) {
    newCoins = [];
    for(var i = 0, len = data.length; i < len; i++) {
        if(data[i] != null)
            newCoins.push(new coin(i, data[i].x, data[i].y));
    }
    coins = newCoins;
}


// redraw game locally
function updateGameLocal() {
    map.clear();
    myPlayer.move();
    map.update(myPlayer.x, myPlayer.y, myPlayer.color);

    // Draw other players
    for (var i = 0, len = opponents.length; i < len; i++) {
        if (opponents[i].userName != myUserName)
            opponents[i].update(scaleX(myPlayer.x), scaleY(myPlayer.y));
    }
    // Draw coins
    for (var i = 0, len = coins.length; i < len; i++) {
        if (coins[i] != null)
            coins[i].update(scaleX(myPlayer.x), scaleY(myPlayer.y));
    }
    // ----- USED TO PHYSICALLY DRAW BUILDINGS (FOR TESTING) --------
    // for (var i = 0, len = buildings.length; i < len; i++) {
    //    buildings[i].update(scaleX(myPlayer.x), scaleY(myPlayer.y));
    // }
}

// update server with location
function updateGameRemote() {
    myPlayer.sendLocation();
}

// send server score
function sendScore() {
    socket.emit('saveScore', { 'username' : myUserName, 'score' : score });
}

function scaleX(x) {
    return x - (windowWidth / 2);
}

function scaleY(y) {
    return y - (windowHeight / 2);
}

function loadBuildings() {
    buildings[0] = new building(60, 95, 700, 180);      //Anderson
    buildings[1] = new building(75, 80, 785, 55);       //Wilder
    buildings[2] = new building(105, 105, 810, 180);    //Sage Art
    buildings[3] = new building(100, 157, 787, 452);    //Spurrier
    buildings[4] = new building(267, 275, 922, 452);    //D.G.G.H.M.
    buildings[5] = new building(250, 72, 483, 870);     //Fauver Stadium
    buildings[6] = new building(477, 243, 407, 992);    //R.B.G Athletic
    buildings[7] = new building(190, 165, 300, 1265);   //Gilbert
    buildings[8] = new building(137, 130, 525, 1300);   //Hoeing
    buildings[9] = new building(65, 120, 705, 1310);    //Crosby
    buildings[10] = new building(115, 153, 368, 1457);  //Tiernan
    buildings[11] = new building(135, 128, 527, 1481);  //Lovejoy
    buildings[12] = new building(65, 120, 705, 1484);   //Burton
    buildings[13] = new building(77, 43, 431, 1645);    //Frat-1
    buildings[14] = new building(52, 55, 798, 1659);    //Frat-2
    buildings[15] = new building(55, 37, 704, 1672);    //Frat-3
    buildings[16] = new building(60, 60, 625, 1650);    //Frat-4
    buildings[17] = new building(65, 47, 536, 1658);    //Frat-5
    buildings[18] = new building(58, 62, 544, 1727);    //Frat-6
    buildings[19] = new building(42, 45, 625, 1808);    //Frat-7
    buildings[20] = new building(53, 45, 705, 1817);    //Frat-8
    buildings[21] = new building(60, 45, 790, 1817);    //Frat-9
    buildings[22] = new building(88, 120, 927, 1704);   //Todd
    buildings[23] = new building(125, 68, 1041, 1732);  //Strong Aud.
    buildings[24] = new building(215, 105, 1264, 1726); //Gleason/Schlegel
    buildings[25] = new building(168, 85, 1409, 1846);  //Wallis
    buildings[26] = new building(80, 123, 1545, 1603);  //Hopeman
    buildings[27] = new building(165, 45, 1549, 1377);  //Gavett-1
    buildings[28] = new building(110, 142, 1549, 1421); //Gavett-2
    buildings[29] = new building(70, 122, 1696, 1450);  //Taylor
    buildings[30] = new building(102, 182, 1808, 1570); //Wilmot/Georgen
    buildings[31] = new building(41, 80, 1808, 1477);   //Random-Wil/Geor
    buildings[32] = new building(287, 254, 1718, 1774); //Computer Quad
    buildings[33] = new building(67, 135, 1550, 1209);  //Harkness
    buildings[34] = new building(93, 188, 1403, 1049);  //Meliora
    buildings[35] = new building(205, 385, 1307, 1267); //B&L/H/CGS/D
    buildings[36] = new building(41, 172, 1100, 1488);  //Lattimore
    buildings[37] = new building(41, 165, 1100, 1266);  //Morey
    buildings[38] = new building(82, 43, 1018, 1549);   //Rettner
    buildings[39] = new building(15, 60, 1126, 1429);   //Morey-Lattimore
    buildings[40] = new building(115, 145, 940, 1224);  //WilCo
    buildings[41] = new building(144, 125, 983, 1044);  //Douglass
    buildings[42] = new building(14, 57, 1026, 1168);   //WilCo-Douglass
    buildings[43] = new building(155, 250, 1152, 987);  //RushRhees

    //buildings[n] = new building(width, height, x, y);
}