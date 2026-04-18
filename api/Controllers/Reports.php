<?php
// Controllers/Reports.php - Controller Tampilan Laporan
// Penjelasan: Menerima query get parameter filter dan menginfokannya kepada ReportModel.

class Reports extends Controller {
    public function index() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->sendResponse(['error' => 'Method tidak diizinkan'], 405);
        }

        $filter = $_GET['filter'] ?? 'day';

        try {
            $model = $this->model('ReportModel');
            $this->sendResponse($model->generateReport($filter));
        } catch (Exception $e) {
            $this->sendResponse(['error' => 'Gagal membuat laporan: ' . $e->getMessage()], 500);
        }
    }
}
