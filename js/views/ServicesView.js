import { API, UI } from '../api.js';

export default {
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
        const data = await API.get('services');
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
                    await API.put('services&id=' + id, body);
                    UI.showToast('Service updated');
                } else {
                    await API.post('services', body);
                    UI.showToast('Service added');
                }
                this.closeModal();
                this.loadServices();
            } catch (err) {}
        });
    },

async editService(id) {
        const data = await API.get('services&id=' + id);
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
                await API.delete('services&id=' + id);
                UI.showToast('Service deleted');
                this.loadServices();
            } catch (err) {}
        }
    }
};
