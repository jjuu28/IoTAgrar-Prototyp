const apiUrl = 'https://node-red.studybuddy.top/agrar';

// Funktion zur Generierung einer zufälligen userId (String)
function generateUserId() {
    return 'user-' + Math.random().toString(36).substr(2, 9);
}

async function registerUser(event) {
    event.preventDefault();

    const userId = generateUserId(); // Generiere eine eindeutige userId
    const firstname = document.getElementById("firstname").value.trim();
    const lastname = document.getElementById("lastname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    let valid = true;

    // Fehlertexte zurücksetzen
    document.getElementById("firstnameError").innerText = "";
    document.getElementById("lastnameError").innerText = "";
    document.getElementById("emailError").innerText = "";
    document.getElementById("passwordError").innerText = "";

    // Validierung der Eingaben
    if (firstname.length < 3) {
        document.getElementById("firstnameError").innerText = "Vorname muss mindestens 3 Zeichen lang sein.";
        valid = false;
    }
    if (lastname.length < 3) {
        document.getElementById("lastnameError").innerText = "Nachname muss mindestens 3 Zeichen lang sein.";
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

    // Debugging: In der Konsole prüfen, ob die Daten korrekt sind
    console.log("Validierung abgeschlossen:", valid);
    console.log("Generierte userId:", userId);
    console.log("Gesendete Daten:", { userId, firstname, lastname, email, password });

    // Falls alle Eingaben gültig sind, Daten an Node-RED senden
    if (valid) {
        const requestData = {
            userId: userId,
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password
        };

        try {
            console.log("Sende Daten an Node-RED:", requestData);

            const response = await fetch(`${apiUrl}/register`, {
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
                alert("Registrierung erfolgreich!");
                window.location.href = "../Login"; // Weiterleitung zur Login-Seite
            } else {
                alert("Fehler: " + data.message);
            }
        } catch (error) {
            console.error("Fehler beim Senden der Daten:", error);
            alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        }
    }
}

document.getElementById("registerForm").addEventListener("submit", registerUser);
