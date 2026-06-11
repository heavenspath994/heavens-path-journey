document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const token = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (!token || !userData || userData.role !== 'customer') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('user-name-display').textContent = userData.name || 'User';

    // 2. Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });

    // 3. Navigation
    const navLinks = document.querySelectorAll('.dash-nav-link');
    const sections = document.querySelectorAll('.dash-section');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            if (!targetId) return; // Let links like Home navigate normally

            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            pageTitle.textContent = link.textContent.trim();
            
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            if (window.innerWidth < 992) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // Mobile Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        if (window.innerWidth < 992) {
            mobileToggle.style.display = 'block';
        }
    }

    // 3. API Logic
    const API_BASE = CONFIG.API_BASE + '/user';
    const loader = document.getElementById('loader');
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    async function fetchApi(endpoint) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('userToken');
                window.location.href = 'index.html';
            }
            return await res.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    async function loadDashboardData() {
        document.getElementById('section-account').classList.add('active');
        
        try {
            // Account
            const acc = await fetchApi('account');
            if (acc) {
                document.getElementById('acc-created').textContent = formatDate(acc.accountCreationDate);
                document.getElementById('acc-last-login').textContent = formatDate(acc.lastLogin);
                document.getElementById('acc-completion').textContent = `${acc.profileCompletionPercentage}%`;
            }

            // Bookings
            const book = await fetchApi('bookings');
            if (book) {
                document.getElementById('book-total').textContent = book.totalBookings;
                document.getElementById('book-upcoming').textContent = book.upcomingTrips;
                document.getElementById('book-completed').textContent = book.completedTrips;
                document.getElementById('book-pending').textContent = book.pendingTrips;
                document.getElementById('book-cancelled').textContent = book.cancelledTrips;
                document.getElementById('book-last-date').textContent = formatDate(book.lastBookingDate);
                
                if (book.list && book.list.length > 0) {
                    document.querySelector('#table-bookings tbody').innerHTML = book.list.map(b => `
                        <tr>
                            <td>${formatDate(b.createdAt)}</td>
                            <td>${b.package ? b.package.title : 'Custom Package'}</td>
                            <td>${formatCurrency(b.totalAmount)}</td>
                            <td><span class="status-badge ${b.bookingStatus === 'completed' ? 'success' : b.bookingStatus === 'cancelled' ? 'danger' : b.bookingStatus === 'confirmed' ? 'info' : 'warning'}">${b.bookingStatus}</span></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-bookings tbody').innerHTML = '<tr><td colspan="4">No bookings found</td></tr>';
                }
            }

            // Wishlist
            const wish = await fetchApi('wishlist');
            if (wish) {
                document.getElementById('wish-total').textContent = wish.totalWishlistPackages;
                document.getElementById('wish-popular').textContent = wish.mostViewedSavedPackage;
                
                if (wish.list && wish.list.length > 0) {
                    document.querySelector('#table-wishlist tbody').innerHTML = wish.list.map(w => `
                        <tr>
                            <td>${formatDate(w.createdAt)}</td>
                            <td>${w.package ? w.package.title : 'Unknown'}</td>
                            <td>${w.package ? w.package.duration : 'N/A'}</td>
                            <td><a href="package-details.html?id=${w.packageId}" style="color:var(--dash-accent);text-decoration:none;">View <i class="fas fa-arrow-right"></i></a></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-wishlist tbody').innerHTML = '<tr><td colspan="4">No items in wishlist</td></tr>';
                }
            }

            // Payments
            const pay = await fetchApi('payments');
            if (pay) {
                document.getElementById('pay-total').textContent = formatCurrency(pay.totalAmountSpent);
                document.getElementById('pay-last').textContent = formatCurrency(pay.lastPaymentAmount);
                document.getElementById('pay-count').textContent = pay.paymentHistoryCount;
                
                if (pay.list && pay.list.length > 0) {
                    document.querySelector('#table-payments tbody').innerHTML = pay.list.map(p => `
                        <tr>
                            <td>${formatDate(p.createdAt)}</td>
                            <td>${p.transactionId || p._id}</td>
                            <td>${formatCurrency(p.amount)}</td>
                            <td><span class="status-badge ${p.paymentStatus === 'successful' ? 'success' : p.paymentStatus === 'failed' ? 'danger' : 'warning'}">${p.paymentStatus}</span></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-payments tbody').innerHTML = '<tr><td colspan="4">No payment history</td></tr>';
                }
            }

            // Reviews
            const rev = await fetchApi('reviews');
            if (rev) {
                document.getElementById('rev-total').textContent = rev.totalReviewsSubmitted;
                document.getElementById('rev-avg').textContent = rev.averageRatingGiven + ' / 5.0';
                
                if (rev.list && rev.list.length > 0) {
                    document.querySelector('#table-reviews tbody').innerHTML = rev.list.map(r => `
                        <tr>
                            <td>${formatDate(r.createdAt)}</td>
                            <td>${'<i class="fas fa-star" style="color:var(--dash-accent)"></i>'.repeat(r.rating)}</td>
                            <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.review}</td>
                            <td><span class="status-badge ${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}">${r.status || 'pending'}</span></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-reviews tbody').innerHTML = '<tr><td colspan="4">No reviews submitted</td></tr>';
                }
            }

            // Contacts
            const contact = await fetchApi('contacts');
            if (contact) {
                document.getElementById('contact-total').textContent = contact.totalInquiriesSubmitted;
                document.getElementById('contact-pending').textContent = contact.pendingResponses;
                document.getElementById('contact-resolved').textContent = contact.resolvedResponses;
                
                if (contact.list && contact.list.length > 0) {
                    document.querySelector('#table-contacts tbody').innerHTML = contact.list.map(c => `
                        <tr>
                            <td>${formatDate(c.createdAt)}</td>
                            <td>${c.subject || 'General Inquiry'}</td>
                            <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.message}</td>
                            <td><span class="status-badge ${c.status === 'resolved' ? 'success' : 'warning'}">${c.status || 'pending'}</span></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-contacts tbody').innerHTML = '<tr><td colspan="4">No inquiries submitted</td></tr>';
                }
            }

            // Notifications
            const notif = await fetchApi('notifications');
            if (notif) {
                document.getElementById('notif-total').textContent = notif.totalNotifications;
                document.getElementById('notif-unread').textContent = notif.unreadNotifications;
                
                if (notif.list && notif.list.length > 0) {
                    document.querySelector('#table-notifications tbody').innerHTML = notif.list.map(n => `
                        <tr style="${!n.read ? 'background-color: rgba(59, 130, 246, 0.05);' : ''}">
                            <td>${formatDate(n.createdAt)}</td>
                            <td><strong>${n.title}</strong><br><span style="font-size:0.85rem">${n.message}</span></td>
                            <td><span class="status-badge ${n.read ? 'success' : 'info'}">${n.read ? 'read' : 'unread'}</span></td>
                        </tr>
                    `).join('');
                } else {
                    document.querySelector('#table-notifications tbody').innerHTML = '<tr><td colspan="3">No notifications</td></tr>';
                }
            }

        } finally {
            loader.style.display = 'none';
        }
    }

    loadDashboardData();
});
