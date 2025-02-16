// API URL für Backend-Daten
const apiUrl = 'https://node-red.studybuddy.top/agrar';

// Holt die neuesten Meldungen aus dem Backend
async function fetchNotifications() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    try {
        const response = await fetch(`${apiUrl}/notifications`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Fehler beim Abrufen der Meldungen");
        }

        const notifications = await response.json();
        displayNotifications(notifications);
    } catch (error) {
        console.error("Fehler beim Laden der Meldungen:", error);
        document.getElementById("notifications-container").innerHTML = "<p>⚠ Fehler beim Laden der Meldungen.</p>";
    }
}

// Zeigt die geladenen Meldungen auf der Seite an
function displayNotifications(notifications) {
    const container = document.getElementById("notifications-container");
    container.innerHTML = "";

    if (notifications.length === 0) {
        container.innerHTML = "<p>Keine neuen Meldungen.</p>";
        return;
    }

    notifications.forEach(notification => {
        const div = document.createElement("div");
        div.className = "notification";
        div.innerHTML = `
            <strong>⚠ ${notification.title}</strong>
            <p>${notification.message}</p>
        `;
        container.appendChild(div);
    });
}

// Holt die letzten Sensoränderungen aus dem Backend
async function fetchSensorChanges() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    try {
        const response = await fetch(`${apiUrl}/sensor-changes`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Fehler beim Abrufen der Sensoränderungen");
        }

        const changes = await response.json();
        displaySensorChanges(changes);
    } catch (error) {
        console.error("Fehler beim Laden der Sensoränderungen:", error);
        document.getElementById("sensor-changes-container").innerHTML = "<p>⚠ Fehler beim Laden der Sensoränderungen.</p>";
    }
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
    if (page === "home") {
        window.location.href = "/home";
    } else if (page === "dashboard") {
        window.location.href = "/dashboard";
    } else if (page === "settings") {
        window.location.href = "/settings";
    }
}

// Lade alle Daten beim Start
fetchNotifications();
fetchSensorChanges();
