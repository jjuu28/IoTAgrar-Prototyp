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
        console.log(authToken);
        console.log(localStorage.getItem('authToken'));
        console.log(sessionStorage.getItem('authToken'));
        //window.location.href = "/Login";
        //return;
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
            throw new Error("Fehler beim Abrufen der Sensordaten");
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data for sensor ${sensorId}:`, error);
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
        <canvas></canvas>
    `;
    document.getElementById('main-dashboard').appendChild(container);
}

function enableLiveData(ident, buttonClick) {
    if (charts[ident]) {
        charts[ident].isLive = true;
    }
}

function disableLiveData(ident) {
    if (charts[ident]) {
        charts[ident].isLive = false;
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
    });
}

function promptCustomRange(sensorId, valueName, ident) {
    const startOffset = prompt('Enter start offset in hours:', '-1');
    const endOffset = prompt('Enter end offset in hours:', '0');
    if (startOffset !== null && endOffset !== null) {
        updateSensorData(sensorId, valueName, ident, parseFloat(startOffset), parseFloat(endOffset));
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userId");
    window.location.href = "/login.html";
}

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        const ident = data.ident;
        if (charts[ident] && charts[ident].isLive) {
            const chart = charts[ident];
            const timeLabel = new Date().toLocaleTimeString();
            chart.data.labels.push(timeLabel);
            chart.data.datasets[0].data.push(data.value);
            chart.update();
        }
    } catch (error) {
        console.error("Error processing live data:", error);
    }
};

loadDashboard();