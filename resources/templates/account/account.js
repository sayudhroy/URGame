function loadAccountInfo() {
    username = parseCookieData("userName=");
    color = parseCookieData("color=");
    document.getElementById("userName").textContent = "Welcome " + username + "!";
    document.getElementById("accountName").textContent = "Username: " + username;
    //document.getElementById("accountColor").textContent = "Color: " + color;
    document.getElementById("colorPicker").value = color;
}

function navigateToMenu() {
    window.location = "/";
}

//Sends new color code to server
function updateColor() {
    var xhr = new XMLHttpRequest();
    var url = "updateColor";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");

    var color = document.getElementById("colorPicker").value;
    var data = JSON.stringify({ "color": color});
    xhr.send(data);

    xhr.onreadystatechange = function() {
        if(xhr.readyState === 4 && xhr.status === 200){
            console.log("color update succesful");
            alert("Color Updated");
            loadAccountInfo();
        }
    }
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

function deleteUser(){
  username = parseCookieData("userName=");
  if (window.confirm("By pressing OK all your game data will be lost forever. Are you sure you want to proceed?") == true) {
    var xhr = new XMLHttpRequest();
    var url = "deleteUser";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    var data = JSON.stringify({ "username": username });
    xhr.send(data);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        console.log("User Deleted.");
        alert("User deleted successfully!");
        window.location = JSON.parse(xhr.response).redirect
      }
      else if (xhr.readyState === 4 && xhr.status === 404)
        alert("Error Happened please try again");
    }
  }
}

function ResetScore(){
  username = parseCookieData("userName=");
  if (window.confirm("By pressing OK your high score will be set to 0. Are you sure you want to proceed?") == true) {
    var xhr = new XMLHttpRequest();
    var url = "ResetScore";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    var data = JSON.stringify({ "username": username });
    xhr.send(data);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        alert("Score reset successfully!");
      }
      else if (xhr.readyState === 4 && xhr.status === 404)
        alert("Error Happened please try again");
    }
  }
}
