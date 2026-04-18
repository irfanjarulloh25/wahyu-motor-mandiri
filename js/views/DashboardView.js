import { API, UI } from '../api.js';

export default {
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
            const data = await API.get('dashboard');
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
            const txnData = await API.get('transactions');
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
            const spareparts = await API.get('spareparts');
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
    }
};
