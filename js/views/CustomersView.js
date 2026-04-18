import { API, UI } from '../api.js';

export default {
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
            const data = await API.get('customers');
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
                await API.delete('customers&id=' + id);
                UI.showToast('Data pelanggan dihapus');
                this.loadCustomers();
            } catch (err) {
                // Error handled by API.request (Swal alert)
            }
        }
    }
};
