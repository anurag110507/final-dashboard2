// ================================================
// OWNER DASHBOARD LOGIC (SAFE VERSION)
// ================================================

let ownerChargers = [];
let editChargerModal;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Owner dashboard loading...');

    if (!Auth.requireAuth()) return;

    try {
        const user = Auth.getCurrentUser();

        if (user.role !== 'owner') {
            alert('❌ Access denied - Owner role required');
            Auth.logout();
            return;
        }

        document.getElementById('businessName').textContent = user.name || 'Business';

        editChargerModal = new bootstrap.Modal(document.getElementById('editChargerModal'));

        document.getElementById('addChargerForm')
            .addEventListener('submit', handleAddCharger);
        document.getElementById('saveEditBtn')
            .addEventListener('click', handleSaveEdit);

        await loadOwnerChargers();
        await loadStatistics();
        await loadPendingRequests();

        setInterval(() => {
            loadOwnerChargers();
            loadStatistics();
            loadPendingRequests();
        }, 30000);

    } catch (err) {
        console.error('❌ Owner dashboard init error:', err);
    }
});


// ================================================
// LOAD OWNER CHARGERS
// ================================================
async function loadOwnerChargers() {
    try {
        const data = await API.getOwnerChargers();
        ownerChargers = Array.isArray(data) ? data : [];

        let html = '';

        if (ownerChargers.length === 0) {
            html = '<p class="text-muted">No stations yet.</p>';
        } else {
            html = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Station</th>
                                <th>Type</th>
                                <th>Slots</th>
                                <th>Bookings</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (const charger of ownerChargers) {
                const chargerName = charger.name || "Unknown";
                const chargerAddress = charger.address || "-";
                const chargerType = charger.chargerType || "-";
                const available = charger.availableSlots ?? 0;
                const total = charger.totalSlots ?? 0;

                let bookingCount = 0;

                try {
                    const bookings = await API.getChargerBookings(charger._id);
                    if (Array.isArray(bookings)) {
                        bookingCount = bookings.filter(b => b.status !== 'cancelled').length;
                    }
                } catch (err) {
                    console.warn('⚠️ Could not load bookings');
                }

                html += `
                    <tr>
                        <td>
                            <strong>${chargerName}</strong><br>
                            <small class="text-muted">${chargerAddress}</small>
                        </td>
                        <td><span class="badge bg-secondary">${chargerType}</span></td>
                        <td>${available}/${total}</td>
                        <td>${bookingCount}</td>
                        <td>
                            <button class="btn btn-sm btn-warning"
                                onclick="openEditModal('${charger._id}', '${chargerName}', '', ${total})">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-danger"
                                onclick="deleteCharger('${charger._id}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            }

            html += `</tbody></table></div>`;
        }

        document.getElementById('myChargersList').innerHTML = html;

    } catch (err) {
        console.error('❌ Failed to load chargers:', err);
        document.getElementById('myChargersList').innerHTML =
            '<p class="text-warning">Could not load chargers</p>';
    }
}


// ================================================
// LOAD STATISTICS
// ================================================
async function loadStatistics() {
    try {
        let totalBookings = 0;
        let totalSlotsInUse = 0;

        for (const charger of ownerChargers) {
            totalSlotsInUse += (charger.totalSlots ?? 0) - (charger.availableSlots ?? 0);

            try {
                const bookings = await API.getChargerBookings(charger._id);
                if (Array.isArray(bookings)) {
                    totalBookings += bookings.filter(b => b.status !== 'cancelled').length;
                }
            } catch {}
        }

        document.getElementById('totalStations').textContent = ownerChargers.length;
        document.getElementById('totalBookings').textContent = totalBookings;
        document.getElementById('totalSlots').textContent = totalSlotsInUse;

        await loadRecentBookings();

    } catch (err) {
        console.error('❌ Stats error:', err);
    }
}


// ================================================
// LOAD RECENT BOOKINGS (SAFE)
// ================================================
async function loadRecentBookings() {
    try {
        let allBookings = [];

        for (const charger of ownerChargers) {
            try {
                const bookings = await API.getChargerBookings(charger._id);
                if (Array.isArray(bookings)) {
                    allBookings = allBookings.concat(
                        bookings.map(b => ({
                            ...b,
                            chargerName: charger.name || "Unknown"
                        }))
                    );
                }
            } catch {}
        }

        allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        let html = '';

        if (allBookings.length === 0) {
            html = '<p class="text-muted">No bookings yet</p>';
        } else {
            allBookings.slice(0, 5).forEach(booking => {

                const userName = booking.userId?.name || "Unknown User";
                const startTime = booking.startTime
                    ? new Date(booking.startTime).toLocaleString()
                    : "-";

                const statusClass = {
                    active: 'bg-info',
                    completed: 'bg-success',
                    cancelled: 'bg-danger'
                }[booking.status] || 'bg-secondary';

                html += `
                    <div class="mb-3 pb-3 border-bottom">
                        <strong>${userName}</strong><br>
                        <small class="text-muted">${booking.chargerName}</small><br>
                        <span class="badge ${statusClass}">${booking.status}</span><br>
                        <small>${startTime}</small><br>
                        <small>${booking.durationHours || 0}h charging</small>
                    </div>
                `;
            });
        }

        document.getElementById('recentBookings').innerHTML = html;

    } catch (err) {
        console.error('❌ Failed to load recent bookings:', err);
        document.getElementById('recentBookings').innerHTML =
            '<p class="text-muted">No bookings yet</p>';
    }
}


// ================================================
// LOAD PENDING REQUESTS
// ================================================
async function loadPendingRequests() {
    try {
        const requests = await OwnerBookingManagement.loadPendingRequests();

        const html = OwnerBookingManagement.renderRequests(requests);
        document.getElementById('pendingRequests').innerHTML = html;

        const pendingCount = requests.filter(r => r.status === 'pending').length;
        document.getElementById('pendingRequestCount').textContent = pendingCount;

    } catch (err) {
        console.error('❌ Failed to load pending requests:', err);
        document.getElementById('pendingRequests').innerHTML =
            '<p class="text-danger">Failed to load requests</p>';
    }
}
