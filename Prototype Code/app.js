let regions = {};

// Simplified tectonic plate boundaries (latitude, longitude pairs)
const tectonicBoundaries = [
    {lat: 0, lon: -30},  // Mid-Atlantic Ridge
    {lat: 0, lon: 100},  // Indo-Australian Plate boundary
    {lat: 40, lon: -125},  // San Andreas Fault
    {lat: 35, lon: 135},  // Japan Trench
    {lat: -30, lon: -75},  // Peru-Chile Trench
];

// Historical disaster-prone areas (latitude, longitude pairs)
const disasterProneAreas = [
    {lat: 28, lon: -85, name: "Gulf of Mexico (Hurricanes)"},
    {lat: 35, lon: 135, name: "Japan (Earthquakes and Tsunamis)"},
    {lat: 0, lon: 100, name: "Indonesia (Volcanoes and Tsunamis)"},
    {lat: 27, lon: 88, name: "Nepal (Earthquakes)"},
    {lat: -33, lon: 151, name: "Eastern Australia (Bushfires)"},
];

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function isCoastal(lat, lon) {
    // Simplified check: consider locations within 200km of certain longitudes as coastal
    return Math.abs(lon) > 160 || Math.abs(lon - 20) < 2 || Math.abs(lon - 100) < 2 || Math.abs(lon + 60) < 2;
}

function predictDisaster(latitude, longitude) {
    let risk = 0;
    let factors = [];

    // Check proximity to tectonic boundaries
    const closestBoundary = tectonicBoundaries.reduce((closest, boundary) => {
        const distance = calculateDistance(latitude, longitude, boundary.lat, boundary.lon);
        return distance < closest.distance ? {distance, boundary} : closest;
    }, {distance: Infinity, boundary: null});

    if (closestBoundary.distance < 1000) {
        risk += (1000 - closestBoundary.distance) / 1000;
        factors.push(`Proximity to tectonic boundary: ${closestBoundary.distance.toFixed(0)}km`);
    }

    // Check if coastal
    if (isCoastal(latitude, longitude)) {
        risk += 0.3;
        factors.push("Coastal area");
    }

    // Check proximity to disaster-prone areas
    const closestDisasterArea = disasterProneAreas.reduce((closest, area) => {
        const distance = calculateDistance(latitude, longitude, area.lat, area.lon);
        return distance < closest.distance ? {distance, area} : closest;
    }, {distance: Infinity, area: null});

    if (closestDisasterArea.distance < 500) {
        risk += (500 - closestDisasterArea.distance) / 500 * 0.5;
        factors.push(`Proximity to ${closestDisasterArea.area.name}: ${closestDisasterArea.distance.toFixed(0)}km`);
    }

    // Normalize risk to be between 0 and 1
    risk = Math.min(risk, 1);

    return {
        risk,
        factors,
        severity: risk * 10, // Scale severity from 0 to 10
        prediction: risk > 0.5 ? "High Risk of Disaster" : "Low Risk of Disaster"
    };
}

document.getElementById('prediction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const latitude = parseFloat(document.getElementById('user-latitude').value);
    const longitude = parseFloat(document.getElementById('user-longitude').value);
    
    const result = predictDisaster(latitude, longitude);
    
    const predictionDiv = document.getElementById('prediction-result');
    predictionDiv.innerHTML = `
        <p>Prediction for Your Region (${latitude.toFixed(2)}, ${longitude.toFixed(2)}):</p>
        <p>Prediction: ${result.prediction}</p>
        <p>Risk: ${(result.risk * 100).toFixed(2)}%</p>
        <p>Severity: ${result.severity.toFixed(2)} / 10</p>
        <p>Factors considered:</p>
        <ul>
            ${result.factors.map(factor => `<li>${factor}</li>`).join('')}
        </ul>
    `;
    
    // Apply the appropriate class based on risk level
    predictionDiv.classList.remove('high-risk', 'low-risk');
    if (result.risk > 0.5) {
        predictionDiv.classList.add('high-risk');
        document.getElementById('region-input-section').style.display = 'block';
    } else {
        predictionDiv.classList.add('low-risk');
        document.getElementById('region-input-section').style.display = 'none';
        document.getElementById('resource-allocation-section').style.display = 'none';
        document.getElementById('delegation-section').style.display = 'none';
    }
});
// ... (rest of the code remains the same)

document.getElementById('region-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const numRegions = parseInt(document.getElementById('num-regions').value);
    const regionInputsDiv = document.getElementById('region-inputs');
    regionInputsDiv.innerHTML = '';
    
    for (let i = 1; i <= numRegions; i++) {
        const regionDiv = document.createElement('div');
        regionDiv.innerHTML = `
            <label for="region-${i}">Region ${i} Population:</label>
            <input type="number" id="region-${i}" required>
        `;
        regionInputsDiv.appendChild(regionDiv);
    }
    
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Regions';
    submitButton.classList.add('btn');
    submitButton.addEventListener('click', submitRegions);
    regionInputsDiv.appendChild(submitButton);
});

function submitRegions(e) {
    e.preventDefault();
    regions = {};
    const regionInputs = document.querySelectorAll('#region-inputs input[type="number"]');
    regionInputs.forEach((input, index) => {
        regions[`Region ${index + 1}`] = {
            population: parseInt(input.value)
        };
    });
    document.getElementById('resource-allocation-section').style.display = 'block';
    document.getElementById('delegation-section').style.display = 'block';
}

document.getElementById('resource-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const resources = {
        medical_supplies: parseInt(document.getElementById('medical_supplies').value),
        food: parseInt(document.getElementById('food').value),
        rescue_teams: parseInt(document.getElementById('rescue_teams').value)
    };
    allocateResources(resources);
});

function allocateResources(resources) {
    const totalPopulation = Object.values(regions).reduce((sum, region) => sum + region.population, 0);

    const allocations = {};
    for (const [regionName, regionInfo] of Object.entries(regions)) {
        const populationRatio = regionInfo.population / totalPopulation;
        allocations[regionName] = {};
        for (const [resource, quantity] of Object.entries(resources)) {
            allocations[regionName][resource] = Math.round(quantity * populationRatio);
        }
    }

    displayAllocation(allocations);
    createDelegationTips();
}

function displayAllocation(allocations) {
    const allocationDiv = document.getElementById('resource-allocation');
    allocationDiv.innerHTML = '';
    for (const [regionName, allocation] of Object.entries(allocations)) {
        const regionDiv = document.createElement('div');
        regionDiv.innerHTML = `<h3>Allocation for ${regionName} (Population: ${regions[regionName].population}):</h3>`;
        for (const [resource, quantity] of Object.entries(allocation)) {
            const resourceDiv = document.createElement('div');
            const unit = getResourceUnit(resource);
            resourceDiv.innerText = `${resource}: ${quantity} ${unit}`;
            regionDiv.appendChild(resourceDiv);
        }
        allocationDiv.appendChild(regionDiv);
    }
}

function createDelegationTips() {
    const delegationDiv = document.getElementById('delegation-plan');
    delegationDiv.innerHTML = '<h3>Delegation Tips</h3>';
    
    const tips = [
        "Establish a clear chain of command and communication channels.",
        "Regularly update and share situation reports with all team members.",
        "Prioritize the needs of vulnerable populations such as elderly, children, and those with disabilities.",
        "Coordinate with local authorities and community leaders for effective resource distribution.",
        "Implement a system for tracking and managing inventory of supplies.",
        "Set up a centralized information center to manage and disseminate critical information.",
        "Ensure all team members are briefed on their roles and responsibilities.",
        "Establish shift rotations to prevent burnout among rescue and medical personnel.",
        "Create a feedback mechanism to quickly identify and address issues in the field.",
        "Implement a clear decision-making process for resource allocation adjustments.",
        "Ensure proper safety protocols are in place for all rescue and relief operations.",
        "Set up a system for coordinating with NGOs and volunteer organizations.",
        "Establish clear guidelines for media communication and public information dissemination.",
        "Implement a system for monitoring and evaluating the effectiveness of relief efforts.",
        "Ensure cultural sensitivity in all aspects of disaster response and resource distribution."
    ];

    const tipsList = document.createElement('ul');
    tips.forEach(tip => {
        const tipItem = document.createElement('li');
        tipItem.textContent = tip;
        tipsList.appendChild(tipItem);
    });
    
    delegationDiv.appendChild(tipsList);
}

function getResourceUnit(resource) {
    switch (resource) {
        case 'medical_supplies':
            return 'units';
        case 'food':
            return 'kg';
        case 'rescue_teams':
            return 'personnel';
        default:
            return '';
    }
}

// Add event listener for the "Ask our AI" button
document.getElementById('ask-ai').addEventListener('click', () => {
    // Open the Botpress webchat
    window.botpressWebChat.sendEvent({ type: 'show' });
});