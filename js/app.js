// js/app.js - Main Application Controller
const app = {
    currentView: 'dashboard',

    init() {
        this.bindEvents();
        this.renderView('dashboard');
        this.checkStockAlerts();
    },

    bindEvents() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.renderView(view);
                
                // Active link UI
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    async renderView(view) {
        this.currentView = view;
        const container = document.getElementById('view-container');
        this.checkStockAlerts(); // Re-check on view change
        
        switch(view) {
            case 'dashboard':
                this.viewDashboard();
                break;
            case 'inventory':
                this.viewInventory();
                break;
            case 'services':
                this.viewServices();
                break;
            case 'banks':
                this.viewBanks();
                break;
            case 'customers':
                this.viewCustomers();
                break;
            case 'transactions':
                this.viewTransactions();
                break;
            case 'history':
                this.viewHistory();
                break;
            case 'reports':
                this.viewReports();
                break;
        }

        // Re-initialize icons if view changed
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    // --- VIEW LOGIC ---

    async viewDashboard() {
        const dashboardHtml = `
            <div class="grid-stats" id="dashboard-stats">
                <div class="stat-card"><label>Total Suku Cadang</label><div class="stat-value" id="val-spareparts">...</div></div>
                <div class="stat-card"><label>Total Jasa Service</label><div class="stat-value" id="val-services">...</div></div>
                <div class="stat-card"><label>Pendapatan Hari Ini</label><div class="stat-value" id="val-revenue">...</div></div>
                <div class="stat-card"><label>Transaksi Hari Ini</label><div class="stat-value" id="val-txn">...</div></div>
            </div>
            <div class="grid-layout" style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
                <div class="glass-card" style="max-width: none; padding: 1.5rem;">
                    <h2 style="margin-bottom: 1rem;">Transaksi Terbaru</h2>
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Total</th></tr></thead>
                            <tbody id="recent-transactions-list"></tbody>
                        </table>
                    </div>
                </div>
                <div class="glass-card" style="max-width: none; padding: 1.5rem;">
                    <h2 style="margin-bottom: 1rem;">Stok Menipis</h2>
                    <div id="low-stock-list"></div>
                </div>
            </div>
        `;
        document.getElementById('view-container').innerHTML = dashboardHtml;
        
        try {
            const data = await API.get('dashboard.php');
            document.getElementById('val-spareparts').textContent = data.stats.total_spareparts;
            document.getElementById('val-services').textContent = data.stats.total_services;
            document.getElementById('val-revenue').textContent = 'Rp ' + data.stats.revenue_today.toLocaleString('id-ID');
            document.getElementById('val-txn').textContent = data.stats.transactions_today;
            
            // Low stock
            const lowStockList = document.getElementById('low-stock-list');
            lowStockList.innerHTML = data.low_stock.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span>${item.name}</span>
                    <span style="color: ${item.stock === 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-weight: 700;">${item.stock === 0 ? 'HABIS' : item.stock + ' tersisa'}</span>
                </div>
            `).join('') || 'Tidak ada stok menipis';

            // Recent Transactions
            const txnData = await API.get('transactions.php');
            const recentList = document.getElementById('recent-transactions-list');
            recentList.innerHTML = txnData.slice(0, 5).map(t => `
                <tr>
                    <td>${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                    <td>${t.customer_name} (${t.license_plate})</td>
                    <td>Rp ${parseFloat(t.total_amount).toLocaleString('id-ID')}</td>
                </tr>
            `).join('');

        } catch (e) {}
    },

    async checkStockAlerts() {
        try {
            const spareparts = await API.get('spareparts.php');
            const zeroStock = spareparts.filter(s => parseInt(s.stock) === 0);
            const badge = document.getElementById('stock-badge');
            
            if (badge) {
                if (zeroStock.length > 0) {
                    badge.textContent = zeroStock.length;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (e) {
            console.error("Stock alert check failed", e);
        }
    },

    async viewInventory() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h1>Inventaris Suku Cadang</h1>
                <div style="display: flex; gap: 1rem;">
                    <input type="text" placeholder="Cari suku cadang..." onkeyup="app.filterInventory(this.value)" style="width: 250px; background: rgba(255,255,255,0.05);">
                    <button class="btn btn-primary" style="width: auto;" onclick="app.showSparepartModal()">Tambah Suku Cadang</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nama</th><th>Rak</th><th>Stok</th><th>Harga Beli</th><th>Harga Jual</th><th>Aksi</th></tr></thead>
                    <tbody id="inventory-list"></tbody>
                </table>
            </div>
        `;
        this.loadInventory();
    },

    async loadInventory() {
        let data = await API.get('spareparts.php');
        
        // Sorting: Stok 0 paling atas
        data.sort((a, b) => {
            if (parseInt(a.stock) === 0 && parseInt(b.stock) !== 0) return -1;
            if (parseInt(a.stock) !== 0 && parseInt(b.stock) === 0) return 1;
            return a.name.localeCompare(b.name);
        });

        const list = document.getElementById('inventory-list');
        list.innerHTML = data.map(item => `
            <tr style="${item.stock == 0 ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
                <td>${item.name}</td>
                <td><span style="background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 0.3rem; font-size: 0.8rem;">${item.rack_position || '-'}</span></td>
                <td style="color: ${item.stock == 0 ? 'var(--danger)' : (item.stock < 5 ? 'orange' : 'white')}; font-weight: ${item.stock == 0 ? '700' : '400'}">
                    ${item.stock == 0 ? 'HABIS' : item.stock}
                </td>
                <td>Rp ${parseFloat(item.purchase_price).toLocaleString('id-ID')}</td>
                <td>Rp ${parseFloat(item.selling_price).toLocaleString('id-ID')}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn" onclick="app.editSparepart(${item.id})" style="background: var(--primary); width: auto; padding: 0.25rem 0.75rem;">Ubah</button>
                        <button class="btn" onclick="app.deleteSparepart(${item.id})" style="background: var(--danger); width: auto; padding: 0.25rem 0.75rem;">Hapus</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    async filterInventory(val) {
        const query = val.toLowerCase();
        const rows = document.querySelectorAll('#inventory-list tr');
        rows.forEach(row => {
            const text = row.cells[0].textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    showSparepartModal(data = null) {
        const title = data ? 'Ubah Suku Cadang' : 'Tambah Suku Cadang Baru';
        const modalHtml = `
            <div id="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="glass-card" style="max-width: 500px;">
                    <h2>${title}</h2>
                    <form id="sparepart-form" style="margin-top: 1.5rem;">
                        <input type="hidden" name="id" value="${data ? data.id : ''}">
                        <div class="form-group"><label>Nama Barang</label><input type="text" name="name" value="${data ? data.name : ''}" required></div>
                        <div class="form-group"><label>Posisi Rak</label><input type="text" name="rack_position" value="${data ? (data.rack_position || '') : ''}" placeholder="Contoh: A-1"></div>
                        <div class="form-group"><label>Stok</label><input type="number" name="stock" value="${data ? data.stock : ''}" required></div>
                        <div class="form-group"><label>Harga Beli</label><input type="number" name="purchase_price" value="${data ? data.purchase_price : ''}" required></div>
                        <div class="form-group"><label>Harga Jual</label><input type="number" name="selling_price" value="${data ? data.selling_price : ''}" required></div>
                        <div style="display: flex; gap: 1rem;">
                            <button type="button" class="btn" style="background: transparent; border: 1px solid var(--glass-border);" onclick="app.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('sparepart-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData);
            const id = body.id;
            
            try {
                if (id) {
                    await API.put('spareparts.php?id=' + id, body);
                    UI.showToast('Sparepart updated');
                } else {
                    await API.post('spareparts.php', body);
                    UI.showToast('Sparepart added');
                }
                this.closeModal();
                this.loadInventory();
            } catch (err) {}
        });
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.remove();
    },

    async editSparepart(id) {
        const data = await API.get('spareparts.php?id=' + id);
        this.showSparepartModal(data);
    },

    async deleteSparepart(id) {
        const result = await Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await API.delete('spareparts.php?id=' + id);
                UI.showToast('Sparepart deleted');
                this.loadInventory();
            } catch (err) {}
        }
    },

    // --- SERVICES VIEW ---
    async viewServices() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h1>Daftar Jasa Service</h1>
                <div style="display: flex; gap: 1rem;">
                    <input type="text" placeholder="Cari jasa..." onkeyup="app.filterServices(this.value)" style="width: 250px; background: rgba(255,255,255,0.05);">
                    <button class="btn btn-primary" style="width: auto;" onclick="app.showServiceModal()">Tambah Jasa</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nama Jasa</th><th>Harga</th><th>Aksi</th></tr></thead>
                    <tbody id="services-list"></tbody>
                </table>
            </div>
        `;
        this.loadServices();
    },

    async filterServices(val) {
        const query = val.toLowerCase();
        const rows = document.querySelectorAll('#services-list tr');
        rows.forEach(row => {
            const text = row.cells[0].textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    async loadServices() {
        const data = await API.get('services.php');
        const list = document.getElementById('services-list');
        list.innerHTML = data.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>Rp ${parseFloat(item.price).toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn" onclick="app.editService(${item.id})" style="background: var(--primary); width: auto; padding: 0.25rem 0.75rem;">Ubah</button>
                    <button class="btn" onclick="app.deleteService(${item.id})" style="background: var(--danger); width: auto; padding: 0.25rem 0.75rem;">Hapus</button>
                </td>
            </tr>
        `).join('');
    },

    showServiceModal(data = null) {
        const title = data ? 'Edit Service' : 'Add New Service';
        const modalHtml = `
            <div id="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="glass-card" style="max-width: 500px;">
                    <h2>${title}</h2>
                    <form id="service-form" style="margin-top: 1.5rem;">
                        <input type="hidden" name="id" value="${data ? data.id : ''}">
                        <div class="form-group"><label>Service Name</label><input type="text" name="name" value="${data ? data.name : ''}" required></div>
                        <div class="form-group"><label>Price</label><input type="number" name="price" value="${data ? data.price : ''}" required></div>
                        <div style="display: flex; gap: 1rem;">
                            <button type="button" class="btn" style="background: transparent; border: 1px solid var(--glass-border);" onclick="app.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('service-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData);
            const id = body.id;
            
            try {
                if (id) {
                    await API.put('services.php?id=' + id, body);
                    UI.showToast('Service updated');
                } else {
                    await API.post('services.php', body);
                    UI.showToast('Service added');
                }
                this.closeModal();
                this.loadServices();
            } catch (err) {}
        });
    },

    async editService(id) {
        const data = await API.get('services.php?id=' + id);
        this.showServiceModal(data);
    },

    async deleteService(id) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Delete this service?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await API.delete('services.php?id=' + id);
                UI.showToast('Service deleted');
                this.loadServices();
            } catch (err) {}
        }
    },

    // --- BANKS VIEW ---
    async viewBanks() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h1>Manajemen Bank</h1>
                <button class="btn btn-primary" style="width: auto;" onclick="app.showBankModal()">Tambah Bank</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nama Bank</th><th>No. Rekening</th><th>Atas Nama</th><th>Aksi</th></tr></thead>
                    <tbody id="banks-list"></tbody>
                </table>
            </div>
        `;
        this.loadBanks();
    },

    async loadBanks() {
        const data = await API.get('banks.php');
        const list = document.getElementById('banks-list');
        list.innerHTML = data.map(item => `
            <tr>
                <td>${item.bank_name}</td>
                <td>${item.account_number}</td>
                <td>${item.account_holder || '-'}</td>
                <td>
                    <button class="btn" onclick="app.editBank(${item.id})" style="background: var(--primary); width: auto; padding: 0.25rem 0.75rem;">Ubah</button>
                    <button class="btn" onclick="app.deleteBank(${item.id})" style="background: var(--danger); width: auto; padding: 0.25rem 0.75rem;">Hapus</button>
                </td>
            </tr>
        `).join('');
    },

    showBankModal(data = null) {
        const title = data ? 'Ubah Bank' : 'Tambah Bank Baru';
        const modalHtml = `
            <div id="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="glass-card" style="max-width: 500px;">
                    <h2>${title}</h2>
                    <form id="bank-form" style="margin-top: 1.5rem;">
                        <input type="hidden" name="id" value="${data ? data.id : ''}">
                        <div class="form-group"><label>Nama Bank</label><input type="text" name="bank_name" value="${data ? data.bank_name : ''}" placeholder="Contoh: BCA, Mandiri" required></div>
                        <div class="form-group"><label>Nomor Rekening</label><input type="text" name="account_number" value="${data ? data.account_number : ''}" required></div>
                        <div class="form-group"><label>Atas Nama</label><input type="text" name="account_holder" value="${data ? data.account_holder : ''}"></div>
                        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                            <button type="button" class="btn" style="background: transparent; border: 1px solid var(--glass-border);" onclick="app.closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('bank-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const body = Object.fromEntries(formData);
            const id = body.id;
            
            try {
                if (id) {
                    await API.put('banks.php?id=' + id, body);
                    UI.showToast('Bank updated');
                } else {
                    await API.post('banks.php', body);
                    UI.showToast('Bank added');
                }
                this.closeModal();
                this.loadBanks();
            } catch (err) {}
        });
    },

    async editBank(id) {
        const data = await API.get('banks.php?id=' + id);
        this.showBankModal(data);
    },

    async deleteBank(id) {
        const result = await Swal.fire({
            title: 'Hapus Bank?',
            text: "Data bank akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus!',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await API.delete('banks.php?id=' + id);
                UI.showToast('Bank deleted');
                this.loadBanks();
            } catch (err) {}
        }
    },

    // --- TRANSACTIONS VIEW (NEW TRANSACTION) ---
    async viewTransactions() {
        // Complex view for adding transaction
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div class="glass-card" style="max-width: none;">
                <h1>Transaksi Baru</h1>
                <form id="txn-form" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; margin-top: 1.5rem;">
                    <!-- KIRI: Info Pelanggan -->
                    <div>
                        <div class="form-group"><label>Nama Pelanggan</label><input type="text" id="txn-customer" required></div>
                        <div class="form-group"><label>Plat Nomor</label><input type="text" id="txn-plate" required></div>
                        <div class="form-group"><label>Metode Pembayaran</label>
                            <select id="txn-payment" onchange="app.toggleBankSelect(this.value)">
                                <option value="Tunai">Tunai</option>
                                <option value="Transfer">Transfer</option>
                            </select>
                        </div>
                        <div id="bank-select-container" class="form-group" style="display: none;">
                            <label>Pilih Bank</label>
                            <select id="txn-bank"></select>
                        </div>
                        <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.05); border-radius: 1rem; border: 1px solid var(--glass-border);">
                            <h3 style="color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Total Bayar</h3>
                            <div id="txn-total" style="font-size: 2.5rem; font-weight: 800; color: var(--success); margin-top: 0.5rem;">Rp 0</div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="margin-top: 1.5rem; height: 3.5rem; font-size: 1.1rem; font-weight: 700;">PROSES TRANSAKSI</button>
                    </div>
                    
                    <!-- KANAN: Barang & Jasa -->
                    <div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                            <!-- Pilih Suku Cadang -->
                            <div>
                                <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary);">Suku Cadang</h2>
                                <div class="form-group">
                                    <input type="text" placeholder="Cari suku cadang..." onkeyup="app.filterSelectOptions('sel-sparepart', this.value)" style="margin-bottom: 1rem; background: rgba(255,255,255,0.05);">
                                    <div id="sel-sparepart" style="max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border: 1px solid var(--glass-border);"></div>
                                </div>
                                <h3 style="font-size: 1rem; margin: 1.5rem 0 0.5rem 0;">Item Terpilih</h3>
                                <ul id="txn-items-list" style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem;"></ul>
                            </div>
                            <!-- Pilih Jasa -->
                            <div>
                                <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--primary);">Jasa Service</h2>
                                <div class="form-group">
                                    <input type="text" placeholder="Cari jasa..." onkeyup="app.filterSelectOptions('sel-service', this.value)" style="margin-bottom: 1rem; background: rgba(255,255,255,0.05);">
                                    <div id="sel-service" style="max-height: 300px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 0.5rem; border: 1px solid var(--glass-border);"></div>
                                </div>
                                <h3 style="font-size: 1rem; margin: 1.5rem 0 0.5rem 0;">Jasa Terpilih</h3>
                                <ul id="txn-services-list" style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem;"></ul>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        // Load selects
        const [spareparts, services, banks] = await Promise.all([
            API.get('spareparts.php'),
            API.get('services.php'),
            API.get('banks.php')
        ]);

        this.allSpareparts = spareparts;
        this.renderSelectOptions('sel-sparepart', spareparts, 'sparepart');
        
        this.allServices = services;
        this.renderSelectOptions('sel-service', services, 'service');

        document.getElementById('txn-bank').innerHTML = banks.map(b => `<option value="${b.id}">${b.bank_name} - ${b.account_number} (${b.account_holder})</option>`).join('');

        this.cart = { spareparts: [], services: [] };
        const form = document.getElementById('txn-form');
        if (form) {
            form.onsubmit = (e) => this.processTransaction(e);
        }
    },

    toggleBankSelect(method) {
        document.getElementById('bank-select-container').style.display = method === 'Transfer' ? 'block' : 'none';
    },

    renderSelectOptions(elementId, items, type) {
        const container = document.getElementById(elementId);
        if (items.length === 0) {
            container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Tidak ada hasil</div>`;
            return;
        }

        container.innerHTML = items.map(item => {
            if (type === 'sparepart') {
                const isOut = parseInt(item.stock) === 0;
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--glass-border); ${isOut ? 'opacity: 0.5;' : ''}">
                        <div>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">
                                Rp ${parseFloat(item.selling_price).toLocaleString('id-ID')} | Stok: ${item.stock}
                            </div>
                        </div>
                        <button type="button" class="btn" onclick="app.addItem('sparepart', ${item.id})" style="width: auto; padding: 0.4rem; background: var(--primary); color: white; display: flex;" ${isOut ? 'disabled' : ''}>
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `;
            } else {
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--glass-border);">
                        <div>
                            <div style="font-weight: 600;">${item.name}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Rp ${parseFloat(item.price).toLocaleString('id-ID')}</div>
                        </div>
                        <button type="button" class="btn" onclick="app.addItem('service', ${item.id})" style="width: auto; padding: 0.4rem; background: var(--primary); color: white; display: flex;">
                            <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `;
            }
        }).join('');
        
        if (window.lucide) lucide.createIcons();
    },

    filterSelectOptions(elementId, query) {
        const type = elementId === 'sel-sparepart' ? 'sparepart' : 'service';
        const allItems = type === 'sparepart' ? this.allSpareparts : this.allServices;
        const filtered = allItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
        this.renderSelectOptions(elementId, filtered, type);
    },

    addItem(type, id) {
        if (type === 'sparepart') {
            const item = this.allSpareparts.find(i => i.id == id);
            const stock = parseInt(item.stock);
            
            const existing = this.cart.spareparts.find(i => i.id == id);
            if (existing) {
                if (existing.quantity >= stock) {
                    UI.showToast('Mencapai batas stok tersedia', 'danger');
                    return;
                }
                existing.quantity++;
            } else {
                this.cart.spareparts.push({ id: item.id, name: item.name, price: item.selling_price, quantity: 1, stock: stock });
            }
        } else {
            const item = this.allServices.find(i => i.id == id);
            if (!this.cart.services.find(i => i.id == id)) {
                this.cart.services.push({ id: item.id, name: item.name, price: item.price });
            }
        }
        this.renderCart();
    },

    removeFromCart(type, id) {
        if (type === 'sparepart') {
            const idx = this.cart.spareparts.findIndex(i => i.id == id);
            if (idx > -1) {
                if (this.cart.spareparts[idx].quantity > 1) {
                    this.cart.spareparts[idx].quantity--;
                } else {
                    this.cart.spareparts.splice(idx, 1);
                }
            }
        } else {
            const idx = this.cart.services.findIndex(i => i.id == id);
            if (idx > -1) this.cart.services.splice(idx, 1);
        }
        this.renderCart();
    },

    renderCart() {
        const itemList = document.getElementById('txn-items-list');
        const serviceList = document.getElementById('txn-services-list');
        let total = 0;

        itemList.innerHTML = this.cart.spareparts.map((item) => {
            const rowTotal = item.price * item.quantity;
            total += rowTotal;
            return `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 0.4rem;">
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${item.name} (x${item.quantity})</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Rp ${rowTotal.toLocaleString('id-ID')}</div>
                    </div>
                    <button type="button" onclick="app.removeFromCart('sparepart', ${item.id})" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0.2rem;">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </li>
            `;
        }).join('') || '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">Belum ada barang</div>';

        serviceList.innerHTML = this.cart.services.map((item) => {
            total += parseFloat(item.price);
            return `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 0.4rem;">
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Rp ${parseFloat(item.price).toLocaleString('id-ID')}</div>
                    </div>
                    <button type="button" onclick="app.removeFromCart('service', ${item.id})" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0.2rem;">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </li>
            `;
        }).join('') || '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">Belum ada jasa</div>';

        document.getElementById('txn-total').textContent = 'Rp ' + total.toLocaleString('id-ID');
        if (window.lucide) lucide.createIcons();
    },

    async processTransaction(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        const customer_name = document.getElementById('txn-customer').value;
        const license_plate = document.getElementById('txn-plate').value;
        const payment_method = document.getElementById('txn-payment').value;
        const bank_id = payment_method === 'Transfer' ? document.getElementById('txn-bank').value : null;
        
        const total_amount = this.cart.spareparts.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
                           this.cart.services.reduce((sum, item) => sum + parseFloat(item.price), 0);

        if (total_amount === 0) {
            UI.showToast('Tambahkan minimal satu barang atau jasa', 'danger');
            return;
        }

        // Disable button & show loading
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> MEMPROSES...';
        if (window.lucide) lucide.createIcons();

        const data = {
            customer_name,
            license_plate,
            payment_method,
            bank_id,
            total_amount,
            spareparts: this.cart.spareparts,
            services: this.cart.services
        };

        try {
            const response = await API.post('transactions.php', data);
            const result = await Swal.fire({
                icon: 'success',
                title: 'Transaksi Berhasil!',
                text: 'Pesanan telah diproses. Apakah ingin mencetak resi?',
                background: '#1e293b',
                color: '#f8fafc',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Cetak Resi',
                cancelButtonText: 'Tutup'
            });

            if (result.isConfirmed) {
                this.printTransaction(response.id);
            }
            this.viewHistory();
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
            if (window.lucide) lucide.createIcons();
        }
    },

    async printTransaction(id) {
        // Simple trick to trigger print: show details modal then window.print()
        await this.viewTransactionDetails(id);
        setTimeout(() => {
            window.print();
        }, 500);
    },

    // --- CUSTOMERS VIEW ---
    async viewCustomers() {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h1>Data Pelanggan</h1>
                <div style="display: flex; gap: 1rem;">
                    <input type="text" placeholder="Cari pelanggan..." onkeyup="app.filterCustomers(this.value)" style="width: 250px; background: rgba(255,255,255,0.05);">
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nama Pelanggan</th><th>Plat Nomor</th><th>Aksi</th></tr></thead>
                    <tbody id="customers-list"></tbody>
                </table>
            </div>
        `;
        this.loadCustomers();
    },

    async loadCustomers() {
        try {
            const data = await API.get('customers.php');
            const list = document.getElementById('customers-list');
            
            if (data.length === 0) {
                list.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pelanggan</td></tr>';
                return;
            }

            list.innerHTML = data.map(item => `
                <tr>
                    <td><div style="font-weight: 600;">${item.name}</div></td>
                    <td>${item.license_plate}</td>
                    <td>
                        <button class="btn" onclick="app.deleteCustomer(${item.id})" style="background: var(--danger); width: auto; padding: 0.25rem 0.75rem;">Hapus</button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {}
    },

    async filterCustomers(val) {
        const query = val.toLowerCase();
        const rows = document.querySelectorAll('#customers-list tr');
        rows.forEach(row => {
            if (row.cells.length < 2) return;
            const text = row.cells[0].textContent.toLowerCase() + ' ' + row.cells[1].textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    async deleteCustomer(id) {
        const result = await Swal.fire({
            title: 'Hapus Pelanggan?',
            text: "Data pelanggan akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4f46e5',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await API.delete('customers.php?id=' + id);
                UI.showToast('Data pelanggan dihapus');
                this.loadCustomers();
            } catch (err) {
                // Error handled by API.request (Swal alert)
            }
        }
    },

    // --- RIWAYAT VIEW ---
    async viewHistory(filter = 'all') {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h1>Riwayat Transaksi</h1>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="text" placeholder="Cari..." onkeyup="app.filterHistory(this.value)" style="width: 200px; background: rgba(255,255,255,0.05);">
                    <button class="btn btn-primary" style="width: auto; background: var(--success);" onclick="app.exportHistoryToPDF()"><i data-lucide="file-text"></i> Export PDF</button>
                </div>
            </div>
            
            <div class="filter-btn-group" style="margin-bottom: 1.5rem;">
                <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="app.viewHistory('all')">Semua</button>
                <button class="filter-btn ${filter === 'weekly' ? 'active' : ''}" onclick="app.viewHistory('weekly')">Minggu Ini</button>
                <button class="filter-btn ${filter === 'monthly' ? 'active' : ''}" onclick="app.viewHistory('monthly')">Bulan Ini</button>
                <button class="filter-btn ${filter === 'yearly' ? 'active' : ''}" onclick="app.viewHistory('yearly')">Tahun Ini</button>
            </div>

            <div class="table-container">
                <table id="history-table">
                    <thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Kendaraan</th><th>Ringkasan Barang</th><th>Total</th><th>Aksi</th></tr></thead>
                    <tbody id="history-list"></tbody>
                </table>
            </div>
        `;
        this.loadHistory(filter);
    },

    async loadHistory(filter) {
        const data = await API.get(`transactions.php?filter=${filter}`);
        const list = document.getElementById('history-list');
        const exportBtn = document.querySelector('button[onclick="app.exportHistoryToPDF()"]');
        
        if (exportBtn) {
            exportBtn.disabled = data.length === 0;
            exportBtn.style.opacity = data.length === 0 ? '0.5' : '1';
            exportBtn.style.cursor = data.length === 0 ? 'not-allowed' : 'pointer';
        }

        if (data.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada riwayat transaksi</td></tr>';
            return;
        }
        
        const historyHtml = await Promise.all(data.map(async (t) => {
            const details = await API.get('transactions.php?id=' + t.id);
            const itemsSummary = [
                ...details.spareparts.map(i => i.name + ` (${i.quantity})`),
                ...details.services.map(s => s.name)
            ].join(', ');

            return `
                <tr>
                    <td>${new Date(t.transaction_date).toLocaleDateString('id-ID')}</td>
                    <td><div style="font-weight: 600;">${t.customer_name}</div></td>
                    <td>${t.license_plate}</td>
                    <td><div style="font-size: 0.85rem; color: var(--text-muted); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsSummary}">${itemsSummary}</div></td>
                    <td style="font-weight: 600; color: var(--success);">Rp ${parseFloat(t.total_amount).toLocaleString('id-ID')}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn" style="background: var(--primary); width: auto; padding: 0.25rem 0.5rem;" onclick="app.viewTransactionDetails(${t.id})" title="Detail"><i data-lucide="eye"></i></button>
                            <button class="btn" style="background: var(--danger); width: auto; padding: 0.25rem 0.5rem;" onclick="app.deleteTransaction(${t.id})" title="Hapus"><i data-lucide="trash-2"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }));

        list.innerHTML = historyHtml.join('');
        lucide.createIcons();
    },

    async exportHistoryToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('Laporan Riwayat Transaksi', 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 28);
        
        const table = document.getElementById('history-table');
        const rows = [];
        
        // Get rows that are currently visible
        const tableRows = table.querySelectorAll('tbody tr');
        tableRows.forEach(row => {
            if (row.style.display !== 'none') {
                const cells = row.querySelectorAll('td');
                rows.push([
                    cells[0].innerText, // Date
                    cells[1].innerText, // Customer
                    cells[2].innerText, // Vehicle
                    cells[3].innerText, // Summary
                    cells[4].innerText  // Total
                ]);
            }
        });

        doc.autoTable({
            head: [['Tanggal', 'Pelanggan', 'Kendaraan', 'Ringkasan Items', 'Total']],
            body: rows,
            startY: 35,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`riwayat-transaksi-${new Date().getTime()}.pdf`);
    },

    async deleteTransaction(id) {
        const result = await Swal.fire({
            title: 'Hapus Transaksi?',
            text: "Stok barang akan dikembalikan otomatis ke inventaris.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4f46e5',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            background: '#1e293b',
            color: '#f8fafc'
        });

        if (result.isConfirmed) {
            try {
                await API.delete(`transactions.php?id=${id}`);
                UI.showToast('Transaksi dihapus & stok dikembalikan');
                this.viewHistory();
            } catch (e) {}
        }
    },

    async filterHistory(val) {
        const query = val.toLowerCase();
        const rows = document.querySelectorAll('#history-list tr');
        rows.forEach(row => {
            const text = row.cells[1].textContent.toLowerCase() + ' ' + row.cells[2].textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    async viewTransactionDetails(id) {
        const t = await API.get('transactions.php?id=' + id);
        const modalHtml = `
            <div id="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;">
                <div class="glass-card" style="max-width: 600px; width: 90%; position: relative;">
                    <button class="btn" onclick="app.closeModal()" style="position: absolute; right: 1rem; top: 1rem; width: auto; background: none; font-size: 1.5rem;">&times;</button>
                    <h2>Nota Penjualan #${t.id}</h2>
                    <div style="margin: 1.5rem 0; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
                        <p><strong>Tanggal:</strong> ${new Date(t.transaction_date).toLocaleString('id-ID')}</p>
                        <p><strong>Pelanggan:</strong> ${t.customer_name}</p>
                        <p><strong>Kendaraan:</strong> ${t.license_plate}</p>
                        <p><strong>Pembayaran:</strong> ${t.payment_method}</p>
                    </div>
                    <h3>Daftar Barang & Jasa</h3>
                    <div class="table-container" style="margin: 1rem 0;">
                        <table>
                            <thead><tr><th>Nama</th><th>Jumlah</th><th>Harga</th></tr></thead>
                            <tbody>
                                ${t.spareparts.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>Rp ${parseFloat(i.price_at_transaction).toLocaleString('id-ID')}</td></tr>`).join('')}
                                ${t.services.map(s => `<tr><td>${s.name}</td><td>-</td><td>Rp ${parseFloat(s.price_at_transaction).toLocaleString('id-ID')}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="text-align: right; margin-top: 1rem; font-size: 1.25rem; font-weight: 700; color: var(--success);">
                        Total: Rp ${parseFloat(t.total_amount).toLocaleString('id-ID')}
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button class="btn" style="background: transparent; border: 1px solid var(--glass-border);" onclick="app.closeModal()">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    // --- REPORTS VIEW ---
    async viewReports(filter = 'day') {
        const container = document.getElementById('view-container');
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h1>Laporan Laba Rugi</h1>
            </div>

            <div class="filter-btn-group">
                <button class="filter-btn ${filter === 'day' ? 'active' : ''}" onclick="app.viewReports('day')">Hari Ini</button>
                <button class="filter-btn ${filter === 'month' ? 'active' : ''}" onclick="app.viewReports('month')">Bulan Ini</button>
                <button class="filter-btn ${filter === 'year' ? 'active' : ''}" onclick="app.viewReports('year')">Tahun Ini</button>
            </div>

            <div id="report-content">
                <div style="text-align: center; padding: 3rem;">Memuat laporan...</div>
            </div>
        `;

        try {
            const data = await API.get(`reports.php?filter=${filter}`);
            const stats = data.stats;
            
            document.getElementById('report-content').innerHTML = `
                <div style="margin-bottom: 1rem; font-weight: 600; color: var(--text-muted);">${data.period_label}</div>
                <div class="grid-stats">
                    <div class="stat-card">
                        <label>Total Omzet (Penjualan)</label>
                        <div class="stat-value" style="color: var(--primary);">Rp ${stats.total_revenue.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="stat-card">
                        <label>Total Modal Barang (HPP)</label>
                        <div class="stat-value" style="color: #f59e0b;">Rp ${stats.total_cost.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="stat-card">
                        <label>Laba Bersih</label>
                        <div class="stat-value" style="color: var(--success);">Rp ${stats.net_profit.toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <div class="glass-card" style="max-width: none; margin-top: 2rem;">
                    <h3>Rincian Keuntungan</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem;">
                        <div style="padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 1rem;">
                            <h4 style="color: var(--text-muted); margin-bottom: 0.5rem;">Laba Penjualan Barang</h4>
                            <div style="font-size: 1.5rem; font-weight: 700;">Rp ${stats.sparepart_profit.toLocaleString('id-ID')}</div>
                            <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-muted);">Hasil dari (Harga Jual - Harga Beli) x Jumlah</p>
                        </div>
                        <div style="padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 1rem;">
                            <h4 style="color: var(--text-muted); margin-bottom: 0.5rem;">Laba Jasa Service</h4>
                            <div style="font-size: 1.5rem; font-weight: 700;">Rp ${stats.service_revenue.toLocaleString('id-ID')}</div>
                            <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-muted);">Total biaya jasa yang diterima</p>
                        </div>
                    </div>
                </div>
            `;

        } catch (e) {
            document.getElementById('report-content').innerHTML = `<div style="color: var(--danger);">Gagal memuat laporan.</div>`;
        }
    }
};
