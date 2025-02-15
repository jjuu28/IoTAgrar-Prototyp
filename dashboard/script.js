const socket = new WebSocket('wss://node-red.studybuddy.top/liveDataAgrar');
const apiUrl = 'https://node-red.studybuddy.top/agrar';
const charts = {};
const liveTimeouts = {};
const defaultStartOffset = -1;
const defaultEndOffset = 0;

async function loadDashboard() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!authToken) {
        console.warn("Kein Token gefunden. Weiterleitung zur Login-Seite...");
        window.location.href = "/Login";
        return;
    }
    const sensors = await fetchSensors();
    sensors.forEach(sensor => {
        createSensorCard(sensor);
        disableLiveData(sensor.ident);
        updateSensorData(sensor.sensorId, sensor.valueName, sensor.ident, defaultStartOffset, defaultEndOffset);
    });
}

async function fetchSensors() {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    try {
        const response = await fetch(`${apiUrl}/sensors`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw new Error("Fehler beim Abrufen der Sensoren");
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching sensors:', error);
        logout();
    }
}

async function fetchSensorData(sensorId, valueName, startOffset, endOffset) {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    try {
        const response = await fetch(`${apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Abrufen der Sensordaten (${response.status} ${response.statusText})`);
        }

        const data = await response.json();
        console.log(`Empfangene Daten für ${sensorId} (${valueName}):`, data);

        return data;

    } catch (error) {
        console.error(`Error fetching data for sensor ${sensorId}:`, error);
        return null;
    }
}

function createSensorCard(sensor) {
    const container = document.createElement('div');
    container.className = 'grid-item';
    container.id = `sensor-${sensor.ident}`;

    container.innerHTML = `
        <h3>${sensor.valueName} (${sensor.sensorId})</h3>
        <div style="display: flex; align-items: center;">
            <div id="status-indicator-${sensor.ident}" style="width: 10px; height: 10px; border-radius: 50%; background-color: gray; margin-right: 10px;"></div>
            <button onclick="updateSensorData('${sensor.sensorId}', '${sensor.valueName}', '${sensor.ident}', -1, 0)">Last Hour</button>
            <button onclick="enableLiveData('${sensor.ident}', true)">Live</button>
            <button onclick="promptCustomRange('${sensor.sensorId}', '${sensor.valueName}', '${sensor.ident}')">Custom Range</button>
        </div>
        <canvas id="chart-${sensor.ident}"></canvas>
    `;

    document.getElementById('main-dashboard').appendChild(container);

    const ctx = document.getElementById(`chart-${sensor.ident}`).getContext("2d");
    charts[sensor.ident] = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: `${sensor.valueName} (${sensor.unit})`,
                data: [],
                borderColor: "blue",
                backgroundColor: "rgba(0,0,255,0.1)",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: true },
                y: { display: true }
            }
        }
    });
}

function enableLiveData(ident, buttonClick) {
    if (charts[ident]) {
        charts[ident].isLive = true;

        const statusIndicator = document.getElementById(`status-indicator-${ident}`);
        if (statusIndicator) {
            statusIndicator.style.backgroundColor = 'gray';
        }

        if (liveTimeouts[ident]) {
            clearTimeout(liveTimeouts[ident]);
        }

        liveTimeouts[ident] = setTimeout(() => {
            const statusIndicator = document.getElementById(`status-indicator-${ident}`);
            if (statusIndicator) {
                statusIndicator.style.backgroundColor = 'red';
            }
        }, 30000);

        if (buttonClick) {
            charts[ident].data.datasets[0].pointStyle = 'circle';
            charts[ident].data.datasets[0].pointRadius = 3;
            charts[ident].data.labels = [];
            charts[ident].data.datasets[0].data = [];
            charts[ident].update();
        }
    }
}

function promptCustomRange(sensorId, valueName, ident) {
    const startOffset = prompt('Gib den Start-Offset in Stunden ein (z.B. -24 für die letzten 24 Stunden):', '-1');
    const endOffset = prompt('Gib den End-Offset in Stunden ein (z.B. 0 für jetzt):', '0');

    if (startOffset !== null && endOffset !== null) {
        updateSensorData(sensorId, valueName, ident, parseFloat(startOffset), parseFloat(endOffset));
    }
}


function disableLiveData(ident) {
    if (charts[ident]) {
        charts[ident].isLive = false;

        const statusIndicator = document.getElementById(`status-indicator-${ident}`);
        if (statusIndicator) {
            statusIndicator.style.backgroundColor = 'red';
        }

        if (liveTimeouts[ident]) {
            clearTimeout(liveTimeouts[ident]);
            delete liveTimeouts[ident];
        }
    }
}

function updateSensorData(sensorId, valueName, ident, startOffset, endOffset) {
    fetchSensorData(sensorId, valueName, startOffset, endOffset).then(data => {
        if (data) {
            const chart = charts[ident];
            chart.data.labels = data.timestamps.map(t => new Date(t).toLocaleTimeString());
            chart.data.datasets[0].data = data.values;
            chart.update();
        }

        if (endOffset === 0) {
            enableLiveData(ident, false);
        } else {
            disableLiveData(ident);
        }
    });
}

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        const ident = data.ident;

        if (!charts[ident]) {
            console.warn(`⚠️ Kein Chart für Ident '${ident}' gefunden!`);
            return;
        }

        if (!charts[ident].isLive) {
            console.warn(`⏸ Chart '${ident}' ist nicht im Live-Modus!`);
            return;
        }

        const chart = charts[ident];
        const timeLabel = new Date().toLocaleTimeString();

        console.log(`✅ Daten für ${ident} hinzugefügt: ${data.value}`);

        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(data.value);

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update();

        const statusIndicator = document.getElementById(`status-indicator-${ident}`);
        if (statusIndicator) {
            statusIndicator.style.backgroundColor = 'green';
        }

        if (liveTimeouts[ident]) {
            clearTimeout(liveTimeouts[ident]);
        }

        liveTimeouts[ident] = setTimeout(() => {
            const statusIndicator = document.getElementById(`status-indicator-${ident}`);
            if (statusIndicator) {
                statusIndicator.style.backgroundColor = 'red';
            }
        }, 30000);

    } catch (error) {
        console.error("❌ Fehler beim Verarbeiten der WebSocket-Daten:", error);
    }
};

function logout() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    window.location.href = "../Login.html";
}

loadDashboard();
