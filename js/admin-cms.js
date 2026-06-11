document.addEventListener('DOMContentLoaded', () => {
    // Basic Auth Check for API calls
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const API_BASE = CONFIG.API_BASE;

    /* =========================================
       PACKAGE MANAGEMENT
    ========================================= */
    const packageFormContainer = document.getElementById('package-form-container');
    const btnAddPackage = document.getElementById('btn-add-package');
    const btnCancelPackage = document.getElementById('btn-cancel-package');
    const packageForm = document.getElementById('package-form');
    const tablePackagesBody = document.querySelector('#table-packages tbody');
    const btnAddDay = document.getElementById('btn-add-day');
    const itineraryContainer = document.getElementById('pkg-itinerary-container');
    
    let currentPackages = [];

    // Show/Hide form
    btnAddPackage.addEventListener('click', () => {
        packageForm.reset();
        document.getElementById('pkg-id').value = '';
        document.getElementById('package-form-title').textContent = 'Add New Package';
        itineraryContainer.innerHTML = '';
        packageFormContainer.style.display = 'block';
        packageForm.scrollIntoView({ behavior: 'smooth' });
    });

    btnCancelPackage.addEventListener('click', () => {
        packageFormContainer.style.display = 'none';
    });

    // Add Itinerary Day
    btnAddDay.addEventListener('click', () => {
        const dayNum = itineraryContainer.children.length + 1;
        const dayHtml = `
            <div class="itinerary-day" style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; position: relative;">
                <button type="button" class="btn-remove-day" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ef4444; cursor: pointer;"><i class="fas fa-trash"></i></button>
                <div class="form-group" style="margin-bottom: 10px;">
                    <label class="form-label" style="font-size: 0.85rem;">Day ${dayNum} Header (e.g. Arrival at Gangtok)</label>
                    <input type="text" class="form-control day-title" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="font-size: 0.85rem;">Day ${dayNum} Details</label>
                    <textarea class="form-control day-desc" rows="3" required></textarea>
                </div>
            </div>
        `;
        itineraryContainer.insertAdjacentHTML('beforeend', dayHtml);
        
        // Add delete listener to the new button
        const newBtn = itineraryContainer.lastElementChild.querySelector('.btn-remove-day');
        newBtn.addEventListener('click', function() {
            this.parentElement.remove();
            updateDayNumbers();
        });
    });

    function updateDayNumbers() {
        const days = itineraryContainer.querySelectorAll('.itinerary-day');
        days.forEach((day, index) => {
            const num = index + 1;
            day.querySelectorAll('.form-label')[0].textContent = `Day ${num} Header`;
            day.querySelectorAll('.form-label')[1].textContent = `Day ${num} Details`;
        });
    }

    // Load Packages
    async function loadPackages() {
        tablePackagesBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        try {
            const res = await fetch(`${API_BASE}/packages`);
            const packages = await res.json();
            currentPackages = packages;
            
            tablePackagesBody.innerHTML = '';
            if (packages.length === 0) {
                tablePackagesBody.innerHTML = '<tr><td colspan="5">No packages found.</td></tr>';
                return;
            }
            
            packages.forEach(pkg => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${pkg.title}</strong></td>
                    <td><span style="text-transform: capitalize;">${pkg.category || 'N/A'}</span></td>
                    <td>${pkg.location || 'N/A'}</td>
                    <td>₹${pkg.price}</td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-edit-pkg" data-id="${pkg.id}" style="margin-right: 5px;"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-sm btn-outline btn-del-pkg" data-id="${pkg.id}" style="color: #ef4444; border-color: #ef4444;"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tablePackagesBody.appendChild(tr);
            });

            // Edit Listeners
            document.querySelectorAll('.btn-edit-pkg').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    editPackage(id);
                });
            });

            // Delete Listeners
            document.querySelectorAll('.btn-del-pkg').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this package?')) {
                        const id = e.currentTarget.getAttribute('data-id');
                        await deletePackage(id);
                    }
                });
            });
            
        } catch (err) {
            console.error('Error loading packages:', err);
            tablePackagesBody.innerHTML = '<tr><td colspan="5">Failed to load.</td></tr>';
        }
    }

    function editPackage(id) {
        const pkg = currentPackages.find(p => p.id === id);
        if (!pkg) return;

        document.getElementById('pkg-id').value = pkg.id;
        document.getElementById('package-form-title').textContent = 'Edit Package';
        
        document.getElementById('pkg-title').value = pkg.title || '';
        document.getElementById('pkg-category').value = pkg.category || 'adventure';
        document.getElementById('pkg-duration').value = pkg.duration || '';
        document.getElementById('pkg-price').value = pkg.price || '';
        document.getElementById('pkg-location').value = pkg.location || '';
        document.getElementById('pkg-image').value = pkg.image || '';
        document.getElementById('pkg-highlights').value = (pkg.highlights || []).join(', ');
        document.getElementById('pkg-gallery').value = (pkg.gallery || []).join(', ');
        document.getElementById('pkg-map').value = pkg.mapIframe || '';
        
        itineraryContainer.innerHTML = '';
        if (pkg.itinerary && pkg.itinerary.length > 0) {
            pkg.itinerary.forEach((item, index) => {
                btnAddDay.click();
                const dayBlock = itineraryContainer.children[index];
                dayBlock.querySelector('.day-title').value = item.title;
                dayBlock.querySelector('.day-desc').value = item.description;
            });
        }
        
        packageFormContainer.style.display = 'block';
        packageFormContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async function deletePackage(id) {
        try {
            const res = await fetch(`${API_BASE}/packages/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Package deleted successfully');
                loadPackages();
            } else {
                alert('Failed to delete package');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting package');
        }
    }

    packageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('pkg-id').value;
        const highlightsStr = document.getElementById('pkg-highlights').value;
        const galleryStr = document.getElementById('pkg-gallery').value;
        
        const highlights = highlightsStr ? highlightsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const gallery = galleryStr ? galleryStr.split(',').map(s => s.trim()).filter(s => s) : [];
        
        const itinerary = [];
        itineraryContainer.querySelectorAll('.itinerary-day').forEach((dayBlock, index) => {
            itinerary.push({
                day: index + 1,
                title: dayBlock.querySelector('.day-title').value.trim(),
                description: dayBlock.querySelector('.day-desc').value.trim()
            });
        });
        
        const pkgData = {
            title: document.getElementById('pkg-title').value.trim(),
            category: document.getElementById('pkg-category').value,
            duration: document.getElementById('pkg-duration').value.trim(),
            price: parseInt(document.getElementById('pkg-price').value),
            location: document.getElementById('pkg-location').value.trim(),
            image: document.getElementById('pkg-image').value.trim(),
            highlights: highlights,
            gallery: gallery,
            mapIframe: document.getElementById('pkg-map').value.trim(),
            itinerary: itinerary
        };
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/packages/${id}` : `${API_BASE}/packages`;
        
        try {
            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(pkgData)
            });
            
            if (res.ok) {
                alert(`Package ${id ? 'updated' : 'created'} successfully!`);
                packageFormContainer.style.display = 'none';
                loadPackages();
            } else {
                alert('Failed to save package');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving package');
        }
    });

    /* =========================================
       DESTINATIONS MANAGEMENT
    ========================================= */
    const destinationFormContainer = document.getElementById('destination-form-container');
    const btnAddDestination = document.getElementById('btn-add-destination');
    const btnCancelDestination = document.getElementById('btn-cancel-destination');
    const destinationForm = document.getElementById('destination-form');
    const tableDestinationsBody = document.querySelector('#table-destinations tbody');
    let currentDestinations = [];

    btnAddDestination.addEventListener('click', () => {
        destinationForm.reset();
        document.getElementById('dest-id').value = '';
        document.getElementById('destination-form-title').textContent = 'Add New Destination';
        destinationFormContainer.style.display = 'block';
        destinationFormContainer.scrollIntoView({ behavior: 'smooth' });
    });

    btnCancelDestination.addEventListener('click', () => {
        destinationFormContainer.style.display = 'none';
    });

    async function loadDestinations() {
        tableDestinationsBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        try {
            const res = await fetch(`${API_BASE}/destinations`);
            const dests = await res.json();
            currentDestinations = dests;
            
            tableDestinationsBody.innerHTML = '';
            if (dests.length === 0) {
                tableDestinationsBody.innerHTML = '<tr><td colspan="5">No destinations found.</td></tr>';
                return;
            }
            
            dests.forEach(dest => {
                const tr = document.createElement('tr');
                const imgSrc = dest.image || '';
                const shortDesc = (dest.description || '').length > 60 ? (dest.description || '').substring(0, 60) + '...' : (dest.description || 'N/A');
                tr.innerHTML = `
                    <td><img src="${imgSrc}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #334155;" onerror="this.src=''; this.alt='No img'; this.style.background='#1e293b'; this.style.display='flex';"></td>
                    <td><strong>${dest.name}</strong></td>
                    <td style="color: #94a3b8; font-size: 0.85rem;">${shortDesc}</td>
                    <td>${dest.bestSeason || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-edit-dest" data-id="${dest.id}" style="margin-right: 5px;"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-sm btn-outline btn-del-dest" data-id="${dest.id}" style="color: #ef4444; border-color: #ef4444;"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tableDestinationsBody.appendChild(tr);
            });

            // Edit Listeners
            document.querySelectorAll('.btn-edit-dest').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    editDestination(id);
                });
            });

            // Delete Listeners
            document.querySelectorAll('.btn-del-dest').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Are you sure you want to delete this destination?')) {
                        const id = e.currentTarget.getAttribute('data-id');
                        try {
                            const res = await fetch(`${API_BASE}/destinations/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            if (res.ok) {
                                alert('Destination deleted successfully');
                                loadDestinations();
                            } else {
                                alert('Failed to delete destination');
                            }
                        } catch (err) { alert('Error deleting'); }
                    }
                });
            });
        } catch (err) {
            console.error('Error loading destinations:', err);
            tableDestinationsBody.innerHTML = '<tr><td colspan="5">Failed to load.</td></tr>';
        }
    }

    function editDestination(id) {
        const dest = currentDestinations.find(d => d.id === id);
        if (!dest) return;

        document.getElementById('dest-id').value = dest.id;
        document.getElementById('destination-form-title').textContent = 'Edit Destination';
        
        document.getElementById('dest-name').value = dest.name || '';
        document.getElementById('dest-description').value = dest.description || '';
        document.getElementById('dest-best-season').value = dest.bestSeason || '';
        document.getElementById('dest-image').value = dest.image || '';
        document.getElementById('dest-attractions').value = (dest.attractions || []).join(', ');
        document.getElementById('dest-gallery').value = (dest.gallery || []).join(', ');
        document.getElementById('dest-body').value = dest.body || '';
        document.getElementById('dest-map').value = dest.mapIframe || '';
        
        destinationFormContainer.style.display = 'block';
        destinationFormContainer.scrollIntoView({ behavior: 'smooth' });
    }

    destinationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('dest-id').value;
        
        const attractionsStr = document.getElementById('dest-attractions').value;
        const galleryStr = document.getElementById('dest-gallery').value;
        const attractions = attractionsStr ? attractionsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const gallery = galleryStr ? galleryStr.split(',').map(s => s.trim()).filter(s => s) : [];

        const data = {
            name: document.getElementById('dest-name').value.trim(),
            description: document.getElementById('dest-description').value.trim(),
            bestSeason: document.getElementById('dest-best-season').value.trim(),
            image: document.getElementById('dest-image').value.trim(),
            attractions: attractions,
            gallery: gallery,
            body: document.getElementById('dest-body').value.trim(),
            mapIframe: document.getElementById('dest-map').value.trim()
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/destinations/${id}` : `${API_BASE}/destinations`;
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                alert(`Destination ${id ? 'updated' : 'created'} successfully!`);
                destinationFormContainer.style.display = 'none';
                loadDestinations();
            } else {
                alert('Failed to save destination');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving destination');
        }
    });



    // Load data initially when sections are clicked
    document.querySelector('[data-target="section-packages"]').addEventListener('click', loadPackages);
    document.querySelector('[data-target="section-destinations"]').addEventListener('click', loadDestinations);
    
    // Auto load if currently active
    if (document.getElementById('section-packages').classList.contains('active')) loadPackages();
    if (document.getElementById('section-destinations').classList.contains('active')) loadDestinations();

});
