
const socket = new WebSocket('wss://node-red.studybuddy.top/liveDataAgrar');
const apiUrl = 'https://node-red.studybuddy.top/agrar';
const charts = {};
const liveTimeouts = {};
const defaultStartOffset = -1;
const defaultEndOffset = 0;

async function loadDashboard() {
    const sensors = await fetchSensors();
    sensors.forEach(sensor => {
        createSensorCard(sensor);
        disableLiveData(sensor.ident);
        updateSensorData(sensor.sensorId, sensor.valueName, sensor.ident, defaultStartOffset, defaultEndOffset);
    });
}

async function fetchSensors() {
    try {
        const response = await fetch(`${apiUrl}/sensors`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching sensors:', error);
    }
}

async function fetchSensorData(sensorId, valueName, startOffset, endOffset) {
    try {
        const response = await fetch(`${apiUrl}/data?sensorId=${sensorId}&valueName=${valueName}&startOffset=${startOffset}&endOffset=${endOffset}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data for ident ${sensorId} and ${valueName}:`, error);
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

    const ctx = container.querySelector('canvas').getContext('2d');
    const lineColor = document.body.classList.contains('dark-mode') ? '#9c27b0' : '#03a9f4';

    charts[sensor.ident] = new Chart(ctx, {
        type: sensor.chartType.toLowerCase(),
        data: {
            labels: [],
            datasets: [{
                label: `${sensor.valueName} (${sensor.unit})`,
                data: [],
                borderColor: lineColor,
                backgroundColor: 'rgba(156, 39, 176, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: {display: true, text: sensor.xLabel}},
                y: {title: {display: true, text: sensor.yLabel}}
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
            if (chart.data.labels.length > 20) {
                chart.data.datasets[0].pointRadius = 0;
            } else {
                chart.data.datasets[0].pointStyle = 'circle';
                chart.data.datasets[0].pointRadius = 3;
            }
            chart.update();
        }

        if (endOffset === 0) {
            enableLiveData(ident, false);
        } else {
            disableLiveData(ident);
        }
    });
}

function promptCustomRange(sensorId, valueName, ident) {
    const startOffset = prompt('Enter start offset in hours (e.g., -24 for last 24 hours):', '-1');
    const endOffset = prompt('Enter end offset in hours (e.g., 0 for now):', '0');
    if (startOffset !== null && endOffset !== null) {
        updateSensorData(sensorId, valueName, ident, parseFloat(startOffset), parseFloat(endOffset));
    }
}

function toggleDarkMode() {
    const body = document.body;
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    const gridItems = document.querySelectorAll('.grid-item');
    const toggleButton = document.getElementById('dark-mode-toggle');

    body.classList.toggle('dark-mode');
    header.classList.toggle('dark-mode');
    footer.classList.toggle('dark-mode');
    gridItems.forEach(item => item.classList.toggle('dark-mode'));

    if (body.classList.contains('dark-mode')) {
        toggleButton.innerHTML = '🌞';
    } else {
        toggleButton.innerHTML = '🌙';
    }

    Object.values(charts).forEach(chart => {
        chart.data.datasets[0].borderColor = body.classList.contains('dark-mode') ? '#9c27b0' : '#03a9f4';
        chart.data.datasets[0].backgroundColor = body.classList.contains('dark-mode') ? 'rgba(156, 39, 176, 0.2)' : 'rgba(3, 169, 244, 0.2)';
        chart.update();
    });
}

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        const ident = data.ident;

        if (charts[ident] && charts[ident].isLive) {
            const chart = charts[ident];
            const timestamp = new Date();
            const timeLabel = timestamp.toLocaleTimeString();
            const statusIndicator = document.getElementById(`status-indicator-${ident}`);
            if (statusIndicator) {
                statusIndicator.style.backgroundColor = 'green';
            }

            chart.data.labels.push(timeLabel);
            chart.data.datasets[0].data.push(data.value);

            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            chart.update();
            if (liveTimeouts[ident]) {
                clearTimeout(liveTimeouts[ident]);
            }
            liveTimeouts[ident] = setTimeout(() => {
                const statusIndicator = document.getElementById(`status-indicator-${ident}`);
                if (statusIndicator) {
                    statusIndicator.style.backgroundColor = 'red';
                }
            }, 30000);
        }
    } catch (error) {
        console.error("Error processing live data:", error);
    }
};

loadDashboard();
