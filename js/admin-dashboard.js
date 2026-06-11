document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const token = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));

    if (!token || !adminUser || adminUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('admin-name-display').textContent = adminUser.name || 'Admin';

    // 2. Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
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
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update title
            pageTitle.textContent = link.textContent.trim();
            
            // Show target section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            // Mobile sidebar close logic (if added later)
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
        
        // Show toggle button on mobile
        if (window.innerWidth < 992) {
            mobileToggle.style.display = 'block';
        }
    }

    // 4. Data Fetching
    const API_BASE = CONFIG.API_BASE + '/admin';
    const loader = document.getElementById('loader');
    
    // Helper to format currency
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
                localStorage.removeItem('adminToken');
                window.location.href = 'index.html';
            }
            return await res.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // --- Modal Logic ---
    function showModal(title, fields) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = fields.map(f => `
            <div class="detail-row">
                <div class="detail-label">${f.label}</div>
                <div class="detail-value">${f.value}</div>
            </div>
        `).join('');
        document.getElementById('details-modal').style.display = 'flex';
    }

    function hideModal() {
        document.getElementById('details-modal').style.display = 'none';
    }

    // Close modal on clicking X or overlay
    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('details-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });

    // Store items globally for modal lookups
    window._modalItems = {};

    function storeForModal(type, list) {
        if (!list) return;
        window._modalItems[type] = {};
        list.forEach((item, i) => {
            window._modalItems[type][i] = item;
        });
    }

    function viewItem(type, index) {
        const item = window._modalItems[type]?.[index];
        if (!item) return;

        let fields = [];

        switch(type) {
            case 'users':
                fields = [
                    { label: 'Name', value: item.name || 'N/A' },
                    { label: 'Email', value: item.email || 'N/A' },
                    { label: 'Phone', value: item.phone || 'Not provided' },
                    { label: 'Status', value: `<span class="status-badge ${item.status === 'active' || !item.status ? 'success' : item.status === 'blocked' ? 'danger' : 'warning'}">${item.status || 'active'}</span>` },
                    { label: 'Role', value: item.role || 'user' },
                    { label: 'Joined', value: formatDate(item.createdAt) },
                    { label: 'Last Updated', value: formatDate(item.updatedAt) },
                    { label: 'User ID', value: item._id || 'N/A' },
                ];
                showModal('👤 User Details', fields);
                break;

            case 'bookings':
                fields = [
                    { label: 'Booking ID', value: item._id || 'N/A' },
                    { label: 'User', value: item.userName || item.userId || 'Unknown' },
                    { label: 'Email', value: item.userEmail || 'N/A' },
                    { label: 'Phone', value: item.userPhone || item.phone || 'N/A' },
                    { label: 'Package', value: item.packageTitle || item.packageId || 'Custom' },
                    { label: 'Travel Date', value: formatDate(item.travelDate) },
                    { label: 'Travelers', value: `Adults: ${item.adults || item.numberOfTravelers || 'N/A'}, Children: ${item.children || 0}` },
                    { label: 'Amount', value: formatCurrency(item.totalAmount) },
                    { label: 'Status', value: `<span class="status-badge ${item.bookingStatus === 'completed' ? 'success' : item.bookingStatus === 'cancelled' ? 'danger' : item.bookingStatus === 'confirmed' ? 'info' : 'warning'}">${item.bookingStatus}</span>` },
                    { label: 'Special Requests', value: item.specialRequests || item.notes || 'None' },
                    { label: 'Booked On', value: formatDate(item.createdAt) },
                ];
                showModal('✈️ Booking Details', fields);
                break;

            case 'contacts':
                fields = [
                    { label: 'Name', value: item.name || 'N/A' },
                    { label: 'Email', value: item.email || 'N/A' },
                    { label: 'Phone', value: item.phone || 'Not provided' },
                    { label: 'Subject', value: item.subject || 'General Inquiry' },
                    { label: 'Message', value: `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; line-height:1.6; white-space:pre-wrap;">${item.message || 'No message content'}</div>` },
                    { label: 'Status', value: `<span class="status-badge ${item.status === 'resolved' ? 'success' : 'warning'}">${item.status || 'pending'}</span>` },
                    { label: 'Read', value: item.read === false ? '<span style="color:var(--dash-danger);">Unread</span>' : '<span style="color:var(--dash-success);">Read</span>' },
                    { label: 'Submitted On', value: formatDate(item.createdAt) },
                ];
                showModal('✉️ Contact Message', fields);
                break;

            case 'packages':
                fields = [
                    { label: 'Title', value: item.title || 'N/A' },
                    { label: 'Location', value: item.location || 'N/A' },
                    { label: 'Price', value: formatCurrency(item.price) },
                    { label: 'Duration', value: item.duration || 'N/A' },
                    { label: 'Description', value: `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; line-height:1.6;">${item.description || 'No description'}</div>` },
                    { label: 'Status', value: `<span class="status-badge ${item.status === 'active' ? 'success' : 'warning'}">${item.status || 'active'}</span>` },
                    { label: 'Max Group Size', value: item.maxGroupSize || 'N/A' },
                    { label: 'Difficulty', value: item.difficulty || 'N/A' },
                    { label: 'Added On', value: formatDate(item.createdAt) },
                    { label: 'Package ID', value: item._id || 'N/A' },
                ];
                showModal('📦 Package Details', fields);
                break;

            case 'wishlists':
                fields = [
                    { label: 'User ID', value: item.userId || 'Unknown' },
                    { label: 'Package ID', value: item.packageId || 'Unknown' },
                    { label: 'Added On', value: formatDate(item.createdAt) },
                    { label: 'Wishlist ID', value: item._id || 'N/A' },
                ];
                showModal('❤️ Wishlist Entry', fields);
                break;

            case 'payments':
                fields = [
                    { label: 'Transaction ID', value: item.transactionId || item._id || 'N/A' },
                    { label: 'User ID', value: item.userId || 'Unknown' },
                    { label: 'Amount', value: formatCurrency(item.amount) },
                    { label: 'Status', value: `<span class="status-badge ${item.paymentStatus === 'successful' ? 'success' : item.paymentStatus === 'failed' ? 'danger' : 'warning'}">${item.paymentStatus}</span>` },
                    { label: 'Method', value: item.paymentMethod || item.method || 'N/A' },
                    { label: 'Gateway', value: item.gateway || 'N/A' },
                    { label: 'Booking ID', value: item.bookingId || 'N/A' },
                    { label: 'Date', value: formatDate(item.createdAt) },
                ];
                showModal('💳 Payment Details', fields);
                break;

            case 'reviews':
                fields = [
                    { label: 'User', value: item.userName || item.userId || 'Unknown' },
                    { label: 'Rating', value: '<i class="fas fa-star" style="color:var(--dash-accent)"></i>'.repeat(item.rating) + ` (${item.rating}/5)` },
                    { label: 'Review', value: `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; line-height:1.6; white-space:pre-wrap;">${item.review || 'No review text'}</div>` },
                    { label: 'Package', value: item.packageTitle || item.packageId || 'N/A' },
                    { label: 'Status', value: `<span class="status-badge ${item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}">${item.status || 'pending'}</span>` },
                    { label: 'Submitted On', value: formatDate(item.createdAt) },
                ];
                showModal('⭐ Review Details', fields);
                break;

            case 'gallery':
                fields = [
                    { label: 'Title', value: item.title || 'N/A' },
                    { label: 'Category', value: item.category || item.album || 'Uncategorized' },
                    { label: 'Views', value: item.views || 0 },
                    { label: 'Image URL', value: item.imageUrl ? `<a href="${item.imageUrl}" target="_blank" style="color:var(--dash-info);">View Image ↗</a>` : 'N/A' },
                    { label: 'Added On', value: formatDate(item.createdAt) },
                ];
                showModal('🖼️ Gallery Item', fields);
                break;
        }
    }

    // Make viewItem globally accessible
    window.viewItem = viewItem;

    // --- Render Tables ---
    function renderUsersTable(list, title = "All Users") {
        const titleEl = document.getElementById('title-users');
        if (titleEl) titleEl.textContent = title;
        storeForModal('users', list);
        if (list && list.length > 0) {
            document.querySelector('#table-users tbody').innerHTML = list.map((u, i) => `
                <tr>
                    <td>${formatDate(u.createdAt)}</td>
                    <td>${u.name || 'N/A'}</td>
                    <td>${u.email}</td>
                    <td><span class="status-badge ${u.status === 'active' || !u.status ? 'success' : u.status === 'blocked' ? 'danger' : 'warning'}">${u.status || 'active'}</span></td>
                    <td><button class="action-btn" onclick="viewItem('users',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-users tbody').innerHTML = '<tr><td colspan="5">No users found</td></tr>';
        }
    }

    // --- Status Update Logic ---
    window.updateStatus = async function(type, id, newStatus) {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE}/${type}/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (res.ok) {
                loadDashboardData();
            } else {
                const data = await res.json();
                alert('Error updating status: ' + data.message);
            }
        } catch(err) {
            console.error(err);
            alert('Network error updating status');
        }
    };

    function renderBookingsTable(list, title = "All Bookings") {
        const titleEl = document.getElementById('title-bookings');
        if (titleEl) titleEl.textContent = title;
        storeForModal('bookings', list);
        if (list && list.length > 0) {
            document.querySelector('#table-bookings tbody').innerHTML = list.map((b, i) => `
                <tr>
                    <td>${formatDate(b.createdAt)}</td>
                    <td>${b.userId || 'Unknown'}</td>
                    <td>${b.packageId || 'Custom'}</td>
                    <td>${formatCurrency(b.totalAmount)}</td>
                    <td>
                        <select onchange="updateStatus('bookings', '${b._id}', this.value)" class="status-badge ${b.bookingStatus === 'completed' ? 'success' : b.bookingStatus === 'cancelled' ? 'danger' : b.bookingStatus === 'confirmed' ? 'info' : 'warning'}" style="background-color: transparent; border: 1px solid var(--color-border); cursor: pointer; padding: 4px 8px; border-radius: 6px;">
                            <option value="pending" ${b.bookingStatus === 'pending' ? 'selected' : ''} style="color: black;">PENDING</option>
                            <option value="confirmed" ${b.bookingStatus === 'confirmed' ? 'selected' : ''} style="color: black;">CONFIRMED</option>
                            <option value="completed" ${b.bookingStatus === 'completed' ? 'selected' : ''} style="color: black;">COMPLETED</option>
                            <option value="cancelled" ${b.bookingStatus === 'cancelled' ? 'selected' : ''} style="color: black;">CANCELLED</option>
                        </select>
                    </td>
                    <td><button class="action-btn" onclick="viewItem('bookings',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-bookings tbody').innerHTML = '<tr><td colspan="6">No bookings found</td></tr>';
        }
    }

    function renderContactsTable(list, title = "All Messages") {
        const titleEl = document.getElementById('title-contacts');
        if (titleEl) titleEl.textContent = title;
        storeForModal('contacts', list);
        if (list && list.length > 0) {
            document.querySelector('#table-contacts tbody').innerHTML = list.map((c, i) => `
                <tr style="${c.read === false ? 'background-color: rgba(59, 130, 246, 0.05);' : ''}">
                    <td>${formatDate(c.createdAt)}</td>
                    <td>${c.name}</td>
                    <td>${c.email}</td>
                    <td>${c.subject || 'General Inquiry'}</td>
                    <td>
                        <select onchange="updateStatus('contacts', '${c._id}', this.value)" class="status-badge ${c.status === 'resolved' ? 'success' : 'warning'}" style="background-color: transparent; border: 1px solid var(--color-border); cursor: pointer; padding: 4px 8px; border-radius: 6px;">
                            <option value="pending" ${c.status === 'pending' || !c.status ? 'selected' : ''} style="color: black;">PENDING</option>
                            <option value="resolved" ${c.status === 'resolved' ? 'selected' : ''} style="color: black;">RESOLVED</option>
                        </select>
                    </td>
                    <td><button class="action-btn" onclick="viewItem('contacts',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-contacts tbody').innerHTML = '<tr><td colspan="6">No messages found</td></tr>';
        }
    }

    function renderPackagesTable(list, title = "All Packages") {
        const titleEl = document.getElementById('title-packages');
        if (titleEl) titleEl.textContent = title;
        storeForModal('packages', list);
        if (list && list.length > 0) {
            document.querySelector('#table-packages tbody').innerHTML = list.map((p, i) => `
                <tr>
                    <td>${formatDate(p.createdAt)}</td>
                    <td>${p.title}</td>
                    <td>${p.location || 'N/A'}</td>
                    <td>${formatCurrency(p.price)}</td>
                    <td><span class="status-badge ${p.status === 'active' ? 'success' : 'warning'}">${p.status || 'active'}</span></td>
                    <td><button class="action-btn" onclick="viewItem('packages',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-packages tbody').innerHTML = '<tr><td colspan="6">No packages found</td></tr>';
        }
    }

    // Destinations table is managed by admin-cms.js loadDestinations()
    // No renderDestinationsTable here to avoid overwriting the CMS table

    function renderWishlistsTable(list, title = "All Wishlists") {
        const titleEl = document.getElementById('title-wishlists');
        if (titleEl) titleEl.textContent = title;
        storeForModal('wishlists', list);
        if (list && list.length > 0) {
            document.querySelector('#table-wishlists tbody').innerHTML = list.map((w, i) => `
                <tr>
                    <td>${formatDate(w.createdAt)}</td>
                    <td>${w.userId || 'Unknown'}</td>
                    <td>${w.packageId || 'Unknown'}</td>
                    <td><button class="action-btn" onclick="viewItem('wishlists',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-wishlists tbody').innerHTML = '<tr><td colspan="4">No wishlist data found</td></tr>';
        }
    }

    function renderPaymentsTable(list, title = "All Payments") {
        const titleEl = document.getElementById('title-payments');
        if (titleEl) titleEl.textContent = title;
        storeForModal('payments', list);
        if (list && list.length > 0) {
            document.querySelector('#table-payments tbody').innerHTML = list.map((p, i) => `
                <tr>
                    <td>${formatDate(p.createdAt)}</td>
                    <td>${p.transactionId || p._id}</td>
                    <td>${p.userId || 'Unknown'}</td>
                    <td>${formatCurrency(p.amount)}</td>
                    <td><span class="status-badge ${p.paymentStatus === 'successful' ? 'success' : p.paymentStatus === 'failed' ? 'danger' : 'warning'}">${p.paymentStatus}</span></td>
                    <td><button class="action-btn" onclick="viewItem('payments',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-payments tbody').innerHTML = '<tr><td colspan="6">No payment data found</td></tr>';
        }
    }

    function renderReviewsTable(list, title = "All Reviews") {
        const titleEl = document.getElementById('title-reviews');
        if (titleEl) titleEl.textContent = title;
        storeForModal('reviews', list);
        if (list && list.length > 0) {
            document.querySelector('#table-reviews tbody').innerHTML = list.map((r, i) => `
                <tr>
                    <td>${formatDate(r.createdAt)}</td>
                    <td>${r.userId || 'Unknown'}</td>
                    <td>${'<i class="fas fa-star" style="color:var(--dash-accent)"></i>'.repeat(r.rating)}</td>
                    <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.review}</td>
                    <td><span class="status-badge ${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}">${r.status || 'pending'}</span></td>
                    <td><button class="action-btn" onclick="viewItem('reviews',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-reviews tbody').innerHTML = '<tr><td colspan="6">No reviews found</td></tr>';
        }
    }

    function renderGalleryTable(list) {
        storeForModal('gallery', list);
        if (list && list.length > 0) {
            document.querySelector('#table-gallery tbody').innerHTML = list.map((g, i) => `
                <tr>
                    <td>${formatDate(g.createdAt)}</td>
                    <td>${g.title}</td>
                    <td>${g.category || g.album || 'Uncategorized'}</td>
                    <td>${g.views || 0}</td>
                    <td><button class="action-btn" onclick="viewItem('gallery',${i})"><i class="fas fa-eye"></i> View</button></td>
                </tr>
            `).join('');
        } else {
            document.querySelector('#table-gallery tbody').innerHTML = '<tr><td colspan="4">No gallery items found</td></tr>';
        }
    }


    // --- Filter Logic ---
    function setupFilters() {
        // Find all clickable stats and attach listeners
        document.querySelectorAll('.dash-list-item').forEach(item => {
            const labelEl = item.querySelector('.dash-list-label');
            if (!labelEl) return;
            const label = labelEl.textContent.trim();
            
            // Apply clickable style
            item.classList.add('clickable-stat');
            
            item.addEventListener('click', () => {
                applyFilter(item, label);
            });
        });

        // Setup clear buttons
        const clearBtns = ['users', 'bookings', 'contacts', 'packages', 'wishlists', 'payments', 'reviews'];
        clearBtns.forEach(id => {
            const btn = document.getElementById(`clear-filter-${id}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    clearFilter(id);
                });
            }
        });
    }

    function applyFilter(item, label) {
        // Highlight active filter
        document.querySelectorAll('.clickable-stat').forEach(el => el.classList.remove('active-filter'));
        item.classList.add('active-filter');

        const state = window.dashboardData;
        
        // Define filter logic
        if (label.includes('User')) {
            const btn = document.getElementById('clear-filter-users');
            if (btn) btn.style.display = 'inline-block';
            let list = state.users?.list || [];
            
            if (label === 'Active Users') list = list.filter(u => !u.status || u.status === 'active');
            else if (label === 'Blocked Users') list = list.filter(u => u.status === 'blocked');
            else if (label === 'Inactive Users') list = list.filter(u => u.status === 'inactive');
            
            renderUsersTable(list, `Filtered: ${label}`);
            // Switch tab to users if on overview
            document.querySelector('[data-target="section-users"]')?.click();
        }
        else if (label.includes('Booking') || label.includes('Trip')) {
            const btn = document.getElementById('clear-filter-bookings');
            if (btn) btn.style.display = 'inline-block';
            let list = state.bookings?.list || [];
            
            if (label === 'Pending Bookings') list = list.filter(b => b.bookingStatus === 'pending');
            else if (label === 'Confirmed Bookings') list = list.filter(b => b.bookingStatus === 'confirmed');
            else if (label === 'Completed Bookings') list = list.filter(b => b.bookingStatus === 'completed');
            else if (label === 'Cancelled Bookings') list = list.filter(b => b.bookingStatus === 'cancelled');
            
            renderBookingsTable(list, `Filtered: ${label}`);
            document.querySelector('[data-target="section-bookings"]')?.click();
        }
        else if (label.includes('Message') || label.includes('Submission')) {
            const btn = document.getElementById('clear-filter-contacts');
            if (btn) btn.style.display = 'inline-block';
            let list = state.contacts?.list || [];
            
            if (label === 'Resolved Messages') list = list.filter(c => c.status === 'resolved');
            else if (label === 'Pending Messages') list = list.filter(c => c.status !== 'resolved');
            else if (label === 'Unread Messages') list = list.filter(c => c.read === false);
            
            renderContactsTable(list, `Filtered: ${label}`);
            document.querySelector('[data-target="section-contacts"]')?.click();
        }
        else if (label.includes('Package') && document.getElementById('table-packages')) {
            const btn = document.getElementById('clear-filter-packages');
            if (btn) btn.style.display = 'inline-block';
            let list = state.packages?.list || [];
            
            if (label === 'Active Packages') list = list.filter(p => !p.status || p.status === 'active');
            else if (label === 'Inactive Packages') list = list.filter(p => p.status === 'inactive');
            
            renderPackagesTable(list, `Filtered: ${label}`);
            document.querySelector('[data-target="section-packages"]')?.click();
        }
        else if (label.includes('Payment') || label.includes('Revenue')) {
            const btn = document.getElementById('clear-filter-payments');
            if (btn) btn.style.display = 'inline-block';
            let list = state.payments?.list || [];
            
            if (label === 'Successful Payments') list = list.filter(p => p.paymentStatus === 'successful');
            else if (label === 'Failed Payments') list = list.filter(p => p.paymentStatus === 'failed');
            else if (label === 'Pending Payments') list = list.filter(p => p.paymentStatus === 'pending');
            
            renderPaymentsTable(list, `Filtered: ${label}`);
            document.querySelector('[data-target="section-payments"]')?.click();
        }
        else if (label.includes('Review') && !label.includes('Total Reviews')) { // Total reviews is in overview too
            const btn = document.getElementById('clear-filter-reviews');
            if (btn) btn.style.display = 'inline-block';
            let list = state.reviews?.list || [];
            
            if (label === '5-Star Reviews') list = list.filter(r => r.rating === 5);
            else if (label === '4-Star Reviews') list = list.filter(r => r.rating === 4);
            else if (label === 'Pending Reviews') list = list.filter(r => !r.status || r.status === 'pending');
            else if (label === 'Approved Reviews') list = list.filter(r => r.status === 'approved');
            else if (label === 'Rejected Reviews') list = list.filter(r => r.status === 'rejected');
            
            renderReviewsTable(list, `Filtered: ${label}`);
            document.querySelector('[data-target="section-reviews"]')?.click();
        }
    }

    function clearFilter(type) {
        document.querySelectorAll('.clickable-stat').forEach(el => el.classList.remove('active-filter'));
        const btn = document.getElementById(`clear-filter-${type}`);
        if (btn) btn.style.display = 'none';
        
        const state = window.dashboardData;
        if (type === 'users') renderUsersTable(state.users?.list || []);
        if (type === 'bookings') renderBookingsTable(state.bookings?.list || []);
        if (type === 'contacts') renderContactsTable(state.contacts?.list || []);
        if (type === 'packages') renderPackagesTable(state.packages?.list || []);
        if (type === 'payments') renderPaymentsTable(state.payments?.list || []);
        if (type === 'reviews') renderReviewsTable(state.reviews?.list || []);
        if (type === 'wishlists') renderWishlistsTable(state.wishlists?.list || []);
    }

    async function loadDashboardData() {
        document.getElementById('section-overview').classList.add('active');
        
        try {
            const [dash, users, bookings, contacts, pkgs, dests, wish, pay, rev, gal, sys] = await Promise.all([
                fetchApi('dashboard'), fetchApi('users'), fetchApi('bookings'),
                fetchApi('contacts'), fetchApi('packages'), fetchApi('destinations'),
                fetchApi('wishlists'), fetchApi('payments'), fetchApi('reviews'),
                fetchApi('gallery'), fetchApi('system')
            ]);

            // Save to state
            window.dashboardData = { dash, users, bookings, contacts, packages: pkgs, destinations: dests, wishlists: wish, payments: pay, reviews: rev, gallery: gal, system: sys };

            // --- Render Overview Stats ---
            if (dash) {
                document.getElementById('card-total-users').textContent = dash.totalUsers;
                document.getElementById('card-total-bookings').textContent = dash.totalBookings;
                document.getElementById('card-total-revenue').textContent = formatCurrency(dash.totalRevenue);
                document.getElementById('card-total-packages').textContent = dash.totalPackages;
                document.getElementById('card-total-destinations').textContent = dash.totalDestinations;
                document.getElementById('card-total-reviews').textContent = dash.totalReviews;
                document.getElementById('card-total-contacts').textContent = dash.totalContactForms;
                document.getElementById('card-total-wishlists').textContent = dash.totalWishlistEntries;
                document.getElementById('card-pending-bookings').textContent = dash.pendingBookings;
                document.getElementById('card-pending-reviews').textContent = dash.pendingReviews;
                document.getElementById('card-unread-messages').textContent = dash.unreadMessages;
            }

            // --- Render Detailed Stats & Tables ---
            if (users) {
                document.getElementById('user-total').textContent = users.totalRegistered;
                document.getElementById('user-today').textContent = users.newToday;
                document.getElementById('user-week').textContent = users.newThisWeek;
                document.getElementById('user-month').textContent = users.newThisMonth;
                document.getElementById('user-active').textContent = users.activeUsers;
                document.getElementById('user-inactive').textContent = users.inactiveUsers;
                document.getElementById('user-blocked').textContent = users.blockedUsers;
                renderUsersTable(users.list);
            }

            if (bookings) {
                document.getElementById('book-total').textContent = bookings.totalBookings;
                document.getElementById('book-today').textContent = bookings.bookingsToday;
                document.getElementById('book-week').textContent = bookings.bookingsThisWeek;
                document.getElementById('book-month').textContent = bookings.bookingsThisMonth;
                document.getElementById('book-pending').textContent = bookings.pendingBookings;
                document.getElementById('book-confirmed').textContent = bookings.confirmedBookings;
                document.getElementById('book-completed').textContent = bookings.completedBookings;
                document.getElementById('book-cancelled').textContent = bookings.cancelledBookings;
                document.getElementById('book-upcoming').textContent = bookings.upcomingTrips;
                document.getElementById('book-past').textContent = bookings.pastTrips;
                renderBookingsTable(bookings.list);
            }

            if (contacts) {
                document.getElementById('contact-total').textContent = contacts.totalSubmissions;
                document.getElementById('contact-today').textContent = contacts.messagesToday;
                document.getElementById('contact-week').textContent = contacts.messagesThisWeek;
                document.getElementById('contact-month').textContent = contacts.messagesThisMonth;
                document.getElementById('contact-resolved').textContent = contacts.resolvedMessages;
                document.getElementById('contact-pending').textContent = contacts.pendingMessages;
                document.getElementById('contact-unread').textContent = contacts.unreadMessages;
                renderContactsTable(contacts.list);
            }

            if (pkgs) {
                document.getElementById('pkg-total').textContent = pkgs.totalPackages;
                document.getElementById('pkg-active').textContent = pkgs.activePackages;
                document.getElementById('pkg-inactive').textContent = pkgs.inactivePackages;
                document.getElementById('pkg-most-viewed').textContent = pkgs.mostViewedPackage;
                document.getElementById('pkg-most-booked').textContent = pkgs.mostBookedPackage;
                document.getElementById('pkg-least-booked').textContent = pkgs.leastBookedPackage;
                document.getElementById('pkg-most-wishlisted').textContent = pkgs.mostWishlistedPackage;
                document.getElementById('pkg-least-wishlisted').textContent = pkgs.leastWishlistedPackage;
                renderPackagesTable(pkgs.list);
            }

            if (dests) {
                const destMostPopEl = document.getElementById('dest-most-popular');
                const destLeastPopEl = document.getElementById('dest-least-popular');
                if (destMostPopEl) destMostPopEl.textContent = dests.mostPopularDestination;
                if (destLeastPopEl) destLeastPopEl.textContent = dests.leastPopularDestination;
            }

            if (wish) {
                document.getElementById('wish-total').textContent = wish.totalWishlistEntries;
                document.getElementById('wish-most-pkg').textContent = pkgs ? pkgs.mostWishlistedPackage : wish.mostWishlistedPackage;
                document.getElementById('wish-top-user').textContent = wish.userWithHighestWishlistCount;
                document.getElementById('wish-trend').textContent = wish.wishlistGrowthTrend;
                renderWishlistsTable(wish.list);
            }

            if (pay) {
                document.getElementById('pay-total-rev').textContent = formatCurrency(pay.totalRevenue);
                document.getElementById('pay-today').textContent = formatCurrency(pay.revenueToday);
                document.getElementById('pay-week').textContent = formatCurrency(pay.revenueThisWeek);
                document.getElementById('pay-month').textContent = formatCurrency(pay.revenueThisMonth);
                document.getElementById('pay-success').textContent = pay.successfulPayments;
                document.getElementById('pay-failed').textContent = pay.failedPayments;
                document.getElementById('pay-pending').textContent = pay.pendingPayments;
                document.getElementById('pay-avg').textContent = formatCurrency(pay.averageBookingValue);
                renderPaymentsTable(pay.list);
            }

            if (rev) {
                document.getElementById('rev-total').textContent = rev.totalReviews;
                document.getElementById('rev-avg').textContent = rev.averageRating + ' / 5.0';
                document.getElementById('rev-5star').textContent = rev.fiveStarReviews;
                document.getElementById('rev-4star').textContent = rev.fourStarReviews;
                document.getElementById('rev-pending').textContent = rev.pendingReviews;
                document.getElementById('rev-approved').textContent = rev.approvedReviews;
                document.getElementById('rev-rejected').textContent = rev.rejectedReviews;
                renderReviewsTable(rev.list);
            }

            if (gal) {
                document.getElementById('gal-total').textContent = gal.totalImages;
                document.getElementById('gal-albums').textContent = gal.totalAlbums;
                document.getElementById('gal-most-viewed').textContent = gal.mostViewedGalleryImage;
                renderGalleryTable(gal.list);
            }

            if (sys) {
                document.getElementById('sys-records').textContent = sys.totalDatabaseRecords;
                document.getElementById('sys-collections').textContent = sys.totalCollections;
                document.getElementById('sys-last-login').textContent = new Date(sys.lastAdminLogin).toLocaleString();
                document.getElementById('sys-plat-act').textContent = sys.recentPlatformActivities;
                document.getElementById('sys-user-act').textContent = sys.recentUserActivities;
            }

            // Finally, setup the interactive filters
            setupFilters();

        } finally {
            loader.style.display = 'none';
        }
    }

    loadDashboardData();
});

