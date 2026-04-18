import { API, UI } from '../api.js';

export default {
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
        const data = await API.get('banks');
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
                    await API.put('banks&id=' + id, body);
                    UI.showToast('Bank updated');
                } else {
                    await API.post('banks', body);
                    UI.showToast('Bank added');
                }
                this.closeModal();
                this.loadBanks();
            } catch (err) {}
        });
    },

async editBank(id) {
        const data = await API.get('banks&id=' + id);
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
                await API.delete('banks&id=' + id);
                UI.showToast('Bank deleted');
                this.loadBanks();
            } catch (err) {}
        }
    }
};
