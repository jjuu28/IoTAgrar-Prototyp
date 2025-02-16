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

// API-Anfragen mit Authentifizierung
async function fetchWithAuth(endpoint) {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!authToken) {
        console.warn("Kein Token gefunden. Abbruch der Anfrage.");
        return null;
    }

    try {
        const response = await fetch(`${apiUrl}/${endpoint}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Abrufen der Daten (${response.status})`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Fehler bei der Anfrage an ${endpoint}:`, error);
        return null;
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
