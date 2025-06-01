import { db, auth } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { loadGoogleMaps } from './loadGoogleMaps.js';

const apiKey = 'Nope';
let map, markers = [], infoWindow, currentUserId = null;

async function initMap() {
    await loadGoogleMaps(apiKey);

    const bronxCenter = { lat: 40.8448, lng: -73.8648 };

    map = new google.maps.Map(document.getElementById('map'), {
        center: bronxCenter,
        zoom: 10 
    });

    infoWindow = new google.maps.InfoWindow();
    loadSpots();
}

async function loadSpots() {
    const spotsList = document.getElementById('spots-list');
    spotsList.innerHTML = '<div class="loading-spots">Loading cleanup spots...</div>';

    try {
        const snapshot = await getDocs(collection(db, "spots"));
        spotsList.innerHTML = '';

        markers.forEach(m => m.setMap(null));
        markers = [];

        snapshot.forEach(docSnap => {
            const spot = docSnap.data();
            spot.id = docSnap.id;
            addSpotToMap(spot);
            addSpotToList(spot);
        });

        if (snapshot.empty) {
            spotsList.innerHTML = '<div class="no-spots">No cleanup spots found.</div>';
        }
    } catch (error) {
        console.error('Error loading spots:', error);
        spotsList.innerHTML = '<div class="no-spots">Failed to load spots.</div>';
    }
}

function addSpotToMap(spot) {
    let markerColor = '#2ecc71';
    if (spot.severity === 'medium') markerColor = '#f39c12';
    if (spot.severity === 'high') markerColor = '#e74c3c';

    const marker = new google.maps.Marker({
        position: spot.location,
        map: map,
        title: spot.title,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 2
        }
    });

    marker.addListener('click', () => {
        infoWindow.setContent(`
            <div>
                <h3>${spot.title}</h3>
                <p>${spot.description}</p>
                <p><strong>Severity:</strong> ${spot.severity}</p>
                <p><strong>Volunteers:</strong> ${spot.volunteers.length}</p>
                <button onclick="joinSpot('${spot.id}')">Join Cleanup</button>
            </div>
        `);
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

function addSpotToList(spot) {
    const spotsList = document.getElementById('spots-list');

    const spotCard = document.createElement('div');
    spotCard.className = 'spot-card';
    spotCard.innerHTML = `
        <h3>${spot.title}</h3>
        <p>${spot.description}</p>
        <div>Severity: ${spot.severity}</div>
        <div>Volunteers: ${spot.volunteers.length}</div>
        <button class="join-btn" onclick="joinSpot('${spot.id}')">Join Cleanup</button>
    `;

    spotsList.appendChild(spotCard);
}

window.joinSpot = async function (spotId) {
    if (!currentUserId) return alert('Please log in first.');

    try {
        const spotRef = doc(db, 'spots', spotId);
        await updateDoc(spotRef, {
            volunteers: arrayUnion(currentUserId)
        });

        alert("You've joined this cleanup!");
        loadSpots();
    } catch (error) {
        console.error('Error joining spot:', error);
        alert('Failed to join cleanup.');
    }
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        initMap();
    } else {
        window.location.href = 'index.html';
    }
});
