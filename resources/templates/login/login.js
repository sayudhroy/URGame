

function signin() {
    username = document.getElementById("username").value;
    password = document.getElementById("password").value;

    //XHR FOR GETTING THE SALT FROM THE SERVER
    var xhr = new XMLHttpRequest();
    var url = "getSalt";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");

    //SENDING THE USERNAME FOR GETTING THE SALT FROM THE SERVER
    var data = JSON.stringify({ "username": username });
    xhr.send(data);

    //CALLBACK FUNCTION ONCE THE "GETSALT" REQUEST HAS BEEN SERVICED
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var responseData = JSON.parse(xhr.responseText);
            console.log("Salt Received: " + responseData.salt);
            hash = String(CryptoJS.MD5(password + responseData.salt));
            console.log("Hashed Password: " + hash);

            //NEW REQUEST FOR SENDING THE USERNAME AND THE HASH
            var xhr1 = new XMLHttpRequest();
            var url1 = "login";
            var data1 = JSON.stringify({ "username": username, "hash": hash });
            xhr1.open("POST", url1, true);
            xhr1.setRequestHeader("Content-type", "application/json");
            xhr1.send(data1);

			//CALLBACK FUNCTION ONCE THE "GETSALT" REQUEST HAS BEEN SERVICED
			xhr1.onreadystatechange = function () {
				if (xhr1.readyState === 4 && xhr1.status === 200) {
					console.log("User Aunthenticated.");
					//RETURN WITH HTML PAGE
					window.location = JSON.parse(xhr1.response).redirect
				}
				else if (xhr1.readyState === 4 && xhr1.status === 404)
					alert("Incorrect Password!");
			};

		}
        else if (xhr.readyState === 4 && xhr.status === 404)
            alert("Username does not exist!");



    }
};

function goback() {
    window.history.back();
}

function gohome() {
    window.location = "/login.html";
}

function signup() {
    timeStamp = Date.now();
    password = document.getElementById("password").value;
    passWordCheck = document.getElementById("re-password").value;
    user = document.getElementById("username").value;
    var color = document.getElementById("colorPicker").value;
    if (user.length < 3) {
        alert("Username must be atleast 3 characters.");
        return;
    }
    if (password.length == 0) {
        alert("Password field cannot be empty.");
        return;
    }
    if (password == passWordCheck) {
        
        hash = String(CryptoJS.MD5(password + timeStamp));
        salt = String(timeStamp);

        var xhr = new XMLHttpRequest();
        var url = "signUp";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");

        var data = JSON.stringify({ "username": user, "hash": hash, "salt": salt, "color": color });
        xhr.send(data);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log("New User Created.");
				alert("Account created successfully.");
				window.location = JSON.parse(xhr.response).redirect
            }
            else if (xhr.readyState === 4 && xhr.status === 404) {
                alert("User already exists.");
              }
        };
    }
    else {
        alert("Passwords do not match!");
        // window.location.reload();
    }
}
