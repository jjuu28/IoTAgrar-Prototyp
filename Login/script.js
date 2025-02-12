const apiUrl = 'https://node-red.studybuddy.top/agrar';

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rememberMe = document.getElementById("rememberMe").checked; // Prüft, ob "Angemeldet bleiben" aktiviert ist

    let valid = true;

    // Fehlertexte zurücksetzen
    document.getElementById("emailError").innerText = "";
    document.getElementById("passwordError").innerText = "";

    // Validierung der Eingaben
    if (!email.includes("@")) {
        document.getElementById("emailError").innerText = "Gültige E-Mail-Adresse eingeben.";
        valid = false;
    }
    if (password.length < 6) {
        document.getElementById("passwordError").innerText = "Passwort muss mindestens 6 Zeichen lang sein.";
        valid = false;
    }

    // Debugging: In der Konsole prüfen, ob die Daten korrekt sind
    console.log("Validierung abgeschlossen:", valid);
    console.log("Gesendete Login-Daten:", { email, password, rememberMe });

    // Falls alle Eingaben gültig sind, Daten an Node-RED senden
    if (valid) {
        const requestData = {
            email: email,
            password: password
        };

        try {
            console.log("Sende Login-Daten an Node-RED:", requestData);

            const response = await fetch(`${apiUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            console.log("Antwort vom Server erhalten:", response);

            const data = await response.json();

            console.log("Serverantwort (JSON):", data);

            if (data.success) {
                alert("Login erfolgreich!");

                // Benutzer-ID speichern (falls der Server sie zurückgibt)
                if (data.userId) {
                    console.log("Eingeloggte userId:", data.userId);

                    if (rememberMe) {
                        // Speichern im LocalStorage (bleibt nach Browser-Neustart erhalten)
                        localStorage.setItem("userId", data.userId);
                    } else {
                        // Speichern in der SessionStorage (nur für die aktuelle Sitzung)
                        sessionStorage.setItem("userId", data.userId);
                    }
                }

                // Weiterleitung zur Dashboard-Seite
                window.location.href = "dashboard.html";
            } else {
                alert("Fehler: " + data.message);
            }
        } catch (error) {
            console.error("Fehler beim Senden der Login-Daten:", error);
            alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        }
    }
}

// Prüft, ob der Benutzer schon eingeloggt ist
function checkLoggedInUser() {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

    if (userId) {
        console.log("Benutzer bereits eingeloggt:", userId);
        window.location.href = "dashboard.html"; // Direkt weiterleiten
    }
}

document.getElementById("loginForm").addEventListener("submit", loginUser);

// Direkt nach dem Laden prüfen, ob ein Benutzer eingeloggt ist
window.onload = checkLoggedInUser;
