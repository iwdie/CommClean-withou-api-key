import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
            
            try {
                const stats = await getUserStats(user.uid);
                updateDashboardStats(stats);
            } catch (error) {
                console.error("Error loading user stats:", error);
            }
        } else {
            window.location.href = 'index.html';
        }
    });
});

async function getUserStats(userId) {
    try {
        const createdQuery = query(collection(db, "spots"), where("createdBy", "==", userId));
        const createdSnapshot = await getDocs(createdQuery);
        const createdCount = createdSnapshot.size;
        
        const volunteeredQuery = query(collection(db, "spots"), where("volunteers", "array-contains", userId));
        const volunteeredSnapshot = await getDocs(volunteeredQuery);
        const volunteeredCount = volunteeredSnapshot.size;
        
        return {
            created: createdCount,
            volunteered: volunteeredCount
        };
    } catch (error) {
        console.error("Error getting user stats:", error);
        return {
            created: 0,
            volunteered: 0
        };
    }
}

function updateDashboardStats(stats) {
    const statsContainer = document.querySelector('.stats');
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${stats.created}</div>
            <div class="stat-label">Spots Added</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${stats.volunteered}</div>
            <div class="stat-label">Cleanups Joined</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${stats.created + stats.volunteered}</div>
            <div class="stat-label">Total Contributions</div>
        </div>
    `;
}

window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch(error => {
            console.error("Logout error:", error);
            alert('Logout failed: ' + error.message);
        });
    }
};

window.goToAddSpot = function() {
    window.location.href = 'add-spot.html';
};

window.goToJoinSpot = function() {
    window.location.href = 'join-spot.html';
};