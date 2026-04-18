import { API, UI } from '../api.js';

export default {
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
        let data = await API.get('spareparts');
        
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
                    await API.put('spareparts&id=' + id, body);
                    UI.showToast('Sparepart updated');
                } else {
                    await API.post('spareparts', body);
                    UI.showToast('Sparepart added');
                }
                this.closeModal();
                this.loadInventory();
            } catch (err) {}
        });
    },

async editSparepart(id) {
        const data = await API.get('spareparts&id=' + id);
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
                await API.delete('spareparts&id=' + id);
                UI.showToast('Sparepart deleted');
                this.loadInventory();
            } catch (err) {}
        }
    }
};
