import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { loadGoogleMaps } from './loadGoogleMaps.js';

const apiKey = 'NOPEs';
let map, marker, geocoder, currentUserId = null;

async function initMap() {
    await loadGoogleMaps(apiKey);

    const fallbackCenter = { lat: 40.8448, lng: -73.8648 }; 

    map = new google.maps.Map(document.getElementById('map'), {
        center: fallbackCenter,
        zoom: 12
    });

    geocoder = new google.maps.Geocoder();

   
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                placeMarker(userLocation);
                updateFormLocation(userLocation);
            },
            () => {
                
                placeMarker(fallbackCenter);
                updateFormLocation(fallbackCenter);
            }
        );
    } else {

        placeMarker(fallbackCenter);
        updateFormLocation(fallbackCenter);
    }

    map.addListener('click', (e) => {
        placeMarker(e.latLng);
        updateFormLocation(e.latLng);
    });
}

function placeMarker(location) {
    if (marker) marker.setMap(null);

    marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true
    });

    marker.addListener('dragend', (e) => {
        updateFormLocation(e.latLng);
    });
}

function updateFormLocation(latLng) {
    document.getElementById('latitude').value = latLng.lat();
    document.getElementById('longitude').value = latLng.lng();
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        initMap();
    } else {
        window.location.href = 'index.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const spotForm = document.getElementById('spot-form');

    spotForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const severity = document.getElementById('severity').value;
        const latitude = parseFloat(document.getElementById('latitude').value);
        const longitude = parseFloat(document.getElementById('longitude').value);

        if (!title || !description || !severity || isNaN(latitude) || isNaN(longitude)) {
            alert('Please fill all fields and select a map point.');
            return;
        }

        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        try {
            await addDoc(collection(db, "spots"), {
                title,
                description,
                severity,
                location: { lat: latitude, lng: longitude },
                createdBy: currentUserId,
                createdAt: serverTimestamp(),
                volunteers: []
            });

            alert('Spot added successfully!');
            spotForm.reset();
            submitBtn.textContent = 'Submit Spot';
            submitBtn.disabled = false;

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            console.error('Error adding spot:', error);
            alert('Failed to add spot. Please try again.');
            submitBtn.textContent = 'Submit Spot';
            submitBtn.disabled = false;
        }
    });
});
