import { API, UI } from './api.js';
import './auth.js';
import DashboardView from './views/DashboardView.js';
import InventoryView from './views/InventoryView.js';
import ServicesView from './views/ServicesView.js';
import BanksView from './views/BanksView.js';
import TransactionsView from './views/TransactionsView.js';
import CustomersView from './views/CustomersView.js';
import ReportsView from './views/ReportsView.js';

window.app = {
    currentView: 'dashboard',
    
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.remove();
    },

    navigate(view) {
        // Remove active class from all links
        document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        
        // Add active class to corresponding link
        const activeLink = document.querySelector(`.sidebar-nav a[onclick="app.navigate('${view}')"]`);
        if (activeLink) activeLink.classList.add('active');

        this.currentView = view;
        
        const container = document.getElementById('view-container');
        if (!container) return; // Prevent errors on login page
        
        switch (view) {
            case 'dashboard': this.viewDashboard(); break;
            case 'inventory': this.viewInventory(); break;
            case 'services': this.viewServices(); break;
            case 'banks': this.viewBanks(); break;
            case 'transactions': this.viewTransactions(); break;
            case 'history': this.viewHistory(); break; // part of transactions view
            case 'customers': this.viewCustomers(); break;
            case 'reports': this.viewReports(); break;
            default: this.viewDashboard();
        }
    },

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
            case 'dashboard': this.viewDashboard(); break;
            case 'inventory': this.viewInventory(); break;
            case 'services': this.viewServices(); break;
            case 'banks': this.viewBanks(); break;
            case 'customers': this.viewCustomers(); break;
            case 'transactions': this.viewTransactions(); break;
            case 'history': this.viewHistory(); break;
            case 'reports': this.viewReports(); break;
        }

        // Re-initialize icons if view changed
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    ...DashboardView,
    ...InventoryView,
    ...ServicesView,
    ...BanksView,
    ...TransactionsView,
    ...CustomersView,
    ...ReportsView
};

// Initialize if on main app
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('view-container')) {
        app.init();
    }
});
