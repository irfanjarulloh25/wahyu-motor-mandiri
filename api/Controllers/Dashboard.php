<?php
// Controllers/Dashboard.php - Controller Tampilan Utama
// Penjelasan: Hanya memiliki metode GET (index) yang berfungsi memanggil model Dashboard lalu langsung memberikan JSON ke view.

class Dashboard extends Controller {
    public function index() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(['error' => 'Method tidak diizinkan'], 405);
        }

        try {
            $model = $this->model('DashboardModel');
            $this->sendResponse($model->getDashboardStats());
        } catch (Exception $e) {
            $this->sendResponse(['error' => 'Gagal mengambil data dashboard: ' . $e->getMessage()], 500);
        }
    }
}
