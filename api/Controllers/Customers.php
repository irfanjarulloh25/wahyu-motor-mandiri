<?php
// Controllers/Customers.php - Controller Manajemen Pelanggan
// Penjelasan: Menangani proses pengolahan data pelanggan dari frontend SPA.

class Customers extends Controller {

    public function index() {
        $method = $_SERVER['REQUEST_METHOD'];
        $model = $this->model('CustomerModel');
        $id = $_GET['id'] ?? null;

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->sendResponse($model->getCustomerById($id));
                } else {
                    $this->sendResponse($model->getAllCustomers());
                }
                break;

            case 'DELETE':
                if (!$id) $this->sendResponse(['error' => 'ID wajib diserahkan'], 400);
                
                try {
                    // Cek dependensi transaksi sebelum hapus agar pesan error lebih bermakna (ramah UX)
                    if ($model->checkTransactionExists($id)) {
                        $this->sendResponse(['error' => 'Tidak dapat menghapus pelanggan yang sudah memiliki riwayat transaksi.'], 400);
                    }

                    $model->deleteCustomer($id);
                    $this->sendResponse(['message' => 'Data pelanggan berhasil dihapus']);
                } catch (Exception $e) {
                    $this->sendResponse(['error' => 'Gagal menghapus pelanggan: ' . $e->getMessage()], 500);
                }
                break;

            default:
                $this->sendResponse(['error' => 'Method HTTP tidak didukung'], 405);
                break;
        }
    }
}
