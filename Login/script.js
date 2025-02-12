document.addEventListener("DOMContentLoaded", function() {
    // Registrierung
    let registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", function(event) {
            event.preventDefault();

            let name = document.getElementById("name").value.trim();
            let email = document.getElementById("email").value.trim();
            let password = document.getElementById("password").value.trim();

            let valid = true;

            document.getElementById("nameError").innerText = "";
            document.getElementById("emailError").innerText = "";
            document.getElementById("passwordError").innerText = "";

            if (name.length < 3) {
                document.getElementById("nameError").innerText = "Name muss mindestens 3 Zeichen lang sein.";
                valid = false;
            }
            if (!email.includes("@")) {
                document.getElementById("emailError").innerText = "Gültige E-Mail-Adresse eingeben.";
                valid = false;
            }
            if (password.length < 6) {
                document.getElementById("passwordError").innerText = "Passwort muss mindestens 6 Zeichen lang sein.";
                valid = false;
            }

            if (valid) {
                console.log("Registrierung erfolgreich!");
                alert("Registrierung erfolgreich!");
            }
        });
    }

    // Login
    let loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();

            let email = document.getElementById("login-email").value.trim();
            let password = document.getElementById("login-password").value.trim();

            let valid = true;

            document.getElementById("loginEmailError").innerText = "";
            document.getElementById("loginPasswordError").innerText = "";

            if (!email.includes("@")) {
                document.getElementById("loginEmailError").innerText = "Gültige E-Mail-Adresse eingeben.";
                valid = false;
            }
            if (password.length < 6) {
                document.getElementById("loginPasswordError").innerText = "Passwort muss mindestens 6 Zeichen lang sein.";
                valid = false;
            }

            if (valid) {
                console.log("Login erfolgreich!");
                alert("Login erfolgreich!");
            }
        });
    }
});
