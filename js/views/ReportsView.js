import { API, UI } from '../api.js';

export default {
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
            const data = await API.get(`reports&filter=${filter}`);
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
