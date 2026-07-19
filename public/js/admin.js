document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('bookings-table-body');
    const adminMessage = document.getElementById('admin-message');

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/admin/bookings');
            const bookings = await res.json();
            renderTable(bookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            adminMessage.style.color = 'var(--booked)';
            adminMessage.textContent = 'Error fetching bookings.';
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await fetch(`/api/admin/${action}/${id}`, {
                method: 'POST'
            });
            const result = await res.json();

            if (res.ok) {
                adminMessage.style.color = 'var(--approved)';
                adminMessage.textContent = `Booking ${action}d successfully.`;
                fetchBookings(); // Refresh list
            } else {
                adminMessage.style.color = 'var(--booked)';
                adminMessage.textContent = result.error || 'An error occurred.';
            }
        } catch (error) {
            adminMessage.style.color = 'var(--booked)';
            adminMessage.textContent = 'Server error. Please try again.';
        }
        
        setTimeout(() => {
            adminMessage.textContent = '';
        }, 3000);
    };

    const renderTable = (bookings) => {
        tableBody.innerHTML = '';
        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bookings found.</td></tr>';
            return;
        }

        bookings.forEach(b => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${b.date} <br> <small>${b.time_slot}</small></td>
                <td>${b.planner_name}</td>
                <td>${b.event_type}</td>
                <td><span class="badge ${b.status.toLowerCase()}">${b.status}</span></td>
                <td>
                    ${b.status === 'Pending' ? `
                        <button class="action-btn btn-approve" data-id="${b.id}">Approve</button>
                        <button class="action-btn btn-cancel" data-id="${b.id}">Cancel</button>
                    ` : b.status === 'Approved' ? `
                        <button class="action-btn btn-cancel" data-id="${b.id}">Cancel</button>
                    ` : `<span style="color:var(--text-muted); font-size:0.9rem;">Cancelled</span>`}
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners for buttons
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', (e) => handleAction(e.target.dataset.id, 'approve'));
        });
        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Are you sure you want to cancel this booking?')) {
                    handleAction(e.target.dataset.id, 'cancel');
                }
            });
        });
    };

    fetchBookings();
});
