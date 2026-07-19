document.addEventListener('DOMContentLoaded', () => {
    let currentStartDate = new Date();
    // Adjust to Monday of the current week
    const day = currentStartDate.getDay() || 7; 
    currentStartDate.setDate(currentStartDate.getDate() - day + 1);
    currentStartDate.setHours(0, 0, 0, 0);

    const timeBlocks = ['Morning (8AM - 12PM)', 'Afternoon (12PM - 4PM)', 'Evening (4PM - 8PM)', 'Full Day (8AM - 8PM)'];
    let bookings = [];

    const calendarGrid = document.getElementById('calendar-grid');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const currentWeekLabel = document.getElementById('current-week-label');

    const modal = document.getElementById('booking-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const bookingForm = document.getElementById('booking-form');
    const formMessage = document.getElementById('form-message');

    const statusSearchInput = document.getElementById('status-search-input');
    const statusSearchBtn = document.getElementById('status-search-btn');
    const statusResults = document.getElementById('status-results');

    // Fetch bookings from backend
    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/slots');
            bookings = await res.json();
            renderCalendar();
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const formatDate = (date) => {
        // Adjust timezone offset to avoid previous day edge case
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const renderCalendar = () => {
        calendarGrid.innerHTML = '';
        const endOfWeek = new Date(currentStartDate);
        endOfWeek.setDate(currentStartDate.getDate() + 6);
        
        currentWeekLabel.textContent = `${currentStartDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${endOfWeek.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;

        for (let i = 0; i < 7; i++) {
            const d = new Date(currentStartDate);
            d.setDate(currentStartDate.getDate() + i);
            const dateStr = formatDate(d);

            const card = document.createElement('div');
            card.className = 'date-card';
            
            const title = document.createElement('h3');
            title.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            card.appendChild(title);

            timeBlocks.forEach(block => {
                const btn = document.createElement('button');
                btn.className = 'slot-btn';
                btn.textContent = block;

                // Check status
                let isBooked = false;
                let statusClass = '';
                
                if (block === 'Full Day (8AM - 8PM)') {
                    const anyExisting = bookings.find(b => b.date === dateStr);
                    if (anyExisting) {
                        isBooked = true;
                        statusClass = anyExisting.status.toLowerCase();
                    }
                } else {
                    const existing = bookings.find(b => b.date === dateStr && (b.time_slot === block || b.time_slot === 'Full Day (8AM - 8PM)'));
                    if (existing) {
                        isBooked = true;
                        statusClass = existing.status.toLowerCase();
                    }
                }

                if (isBooked) {
                    btn.classList.add(statusClass);
                    btn.disabled = true;
                } else {
                    btn.addEventListener('click', () => openModal(dateStr, block));
                }

                card.appendChild(btn);
            });

            calendarGrid.appendChild(card);
        }
    };

    prevWeekBtn.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        renderCalendar();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        renderCalendar();
    });

    const openModal = (date, slot) => {
        document.getElementById('form-date').value = date;
        document.getElementById('form-slot').value = slot;
        document.getElementById('planner-name').value = '';
        document.getElementById('event-type').value = '';
        formMessage.textContent = '';
        modal.classList.remove('hidden');
    };

    const hideModal = () => {
        modal.classList.add('hidden');
    };

    closeModal.addEventListener('click', hideModal);
    cancelBtn.addEventListener('click', hideModal);

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            planner_name: document.getElementById('planner-name').value,
            event_type: document.getElementById('event-type').value,
            date: document.getElementById('form-date').value,
            time_slot: document.getElementById('form-slot').value
        };

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Requesting...';

        try {
            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (res.ok) {
                formMessage.style.color = 'var(--approved)';
                formMessage.textContent = 'Booking requested successfully!';
                setTimeout(() => {
                    hideModal();
                    fetchBookings(); // Refresh calendar
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Request Booking';
                }, 1500);
            } else {
                formMessage.style.color = 'var(--booked)';
                formMessage.textContent = result.error || 'An error occurred.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Request Booking';
            }
        } catch (error) {
            formMessage.style.color = 'var(--booked)';
            formMessage.textContent = 'Server error. Please try again.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Request Booking';
        }
    });

    // Check Status
    statusSearchBtn.addEventListener('click', async () => {
        const name = statusSearchInput.value.trim();
        if (!name) return;

        statusSearchBtn.textContent = 'Searching...';

        try {
            const res = await fetch(`/api/status?name=${encodeURIComponent(name)}`);
            const data = await res.json();
            
            statusResults.innerHTML = '';
            statusResults.classList.remove('hidden');

            if (data.length === 0) {
                statusResults.innerHTML = '<p>No bookings found for this name.</p>';
            } else {
                data.forEach(b => {
                    const el = document.createElement('div');
                    el.className = 'status-item';
                    el.innerHTML = `<strong>${b.event_type}</strong> on ${b.date} (${b.time_slot}) <br> Status: <span class="badge ${b.status.toLowerCase()}">${b.status}</span>`;
                    statusResults.appendChild(el);
                });
            }
        } catch (error) {
            statusResults.innerHTML = '<p style="color:red">Error fetching status.</p>';
            statusResults.classList.remove('hidden');
        } finally {
            statusSearchBtn.textContent = 'Check Status';
        }
    });

    fetchBookings();
});
