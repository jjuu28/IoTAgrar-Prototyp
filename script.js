// API URL für Backend-Daten
const apiUrl = 'https://node-red.studybuddy.top/agrar';

// Startet die Homepage-Datenabfrage & überprüft Authentifizierung
async function loadhomepage() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
        console.warn("Kein Token gefunden. Weiterleitung zur Login-Seite...");
        window.location.href = "/login";
        return;
    }

    try {

        // Lade Benutzerdaten und speichere den Vornamen
        const userData = await loaduserdata();
        if (userData && userData.firstname) {
            updateUserName(userData.firstname);
        }

        // Lade Warnungen & Sensoränderungen parallel
        const [warnings, sensorChanges] = await Promise.all([
            fetchWarnings(),
            fetchSensorChanges()
        ]);

        displayWarnings(warnings);
        displaySensorChanges(sensorChanges);
    } catch (error) {
        console.error("Fehler beim Laden der Homepage-Daten:", error);
    }
}

async function loaduserdata() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!authToken) {
        console.warn("Kein Token gefunden. Abbruch der Anfrage.");
        return null;
    }

    try {
        // Anfrage an das Backend senden
        const response = await fetch(`${apiUrl}/User`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Abrufen der Benutzerdaten (${response.status})`);
        }

        // JSON-Antwort parsen
        const userData = await response.json();

        return userData; // Rückgabe der Benutzerdaten

    } catch (error) {
        console.error("Fehler beim Laden der Benutzerdaten:", error);
        return null;
    }
}

// Aktualisiert den Benutzernamen in der UI
function updateUserName(firstname) {
    const userNameElement = document.getElementById("user-name");
    if (userNameElement) {
        userNameElement.textContent = firstname;
        console.log("Vorname: " + firstname);
    }
}

// Holt die Warnungen aus dem Backend
async function fetchWarnings() {
    return await fetchWithAuth("warnings") || [];
}

// Zeigt die geladenen Warnungen auf der Seite an
function displayWarnings(warnings) {
    const container = document.getElementById("warnings-container");
    container.innerHTML = "";

    if (warnings.length === 0) {
        container.innerHTML = "<p>Keine neuen Warnungen.</p>";
        return;
    }

    warnings.forEach(warning => {
        const div = document.createElement("div");
        div.className = "warning";
        div.innerHTML = `
            <strong>⚠ ${warning.title}</strong>
            <p>${warning.message}</p>
        `;
        container.appendChild(div);
    });
}

// Holt die letzten Sensoränderungen aus dem Backend
async function fetchSensorChanges() {
    return await fetchWithAuth("sensor-changes") || [];
}

// Zeigt die letzten Sensoränderungen auf der Seite an
function displaySensorChanges(changes) {
    const container = document.getElementById("sensor-changes-container");
    container.innerHTML = "";

    if (changes.length === 0) {
        container.innerHTML = "<p>Keine Änderungen vorhanden.</p>";
        return;
    }

    changes.forEach(change => {
        const div = document.createElement("div");
        div.className = "sensor-update";
        div.innerHTML = `
            <p>🔄 <strong>${change.sensorName}</strong>: ${change.oldValue} → <strong>${change.newValue}</strong></p>
        `;
        container.appendChild(div);
    });
}

// Navigation Buttons
function navigateTo(page) {
    const routes = {
        home: "/home",
        dashboard: "/dashboard",
        settings: "/settings"
    };

    if (routes[page]) {
        window.location.href = routes[page];
    } else {
        console.error(`Ungültige Navigation: ${page}`);
    }
}

// Lade die Homepage-Daten
loadhomepage();
