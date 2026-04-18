<?php
// Controllers/Transactions.php - Controller Transaksi Kasir
// Penjelasan: Mewadahi rute utama dalam aplikasi berupa pemrosesan transaksi baru atau pembatalan.

class Transactions extends Controller {

    public function index() {
        $method = $_SERVER['REQUEST_METHOD'];
        $model = $this->model('TransactionModel');
        $id = $_GET['id'] ?? null;
        $filter = $_GET['filter'] ?? 'all';

        switch ($method) {
            case 'GET':
                if ($id) {
                    $transaction = $model->getTransactionById($id);
                    if (!$transaction) {
                        $this->sendResponse(['error' => 'Transaksi tidak ditemukan'], 404);
                    }
                    $this->sendResponse($transaction);
                } else {
                    $this->sendResponse($model->getAllTransactions($filter));
                }
                break;

            case 'POST':
                $data = $this->getJsonInput();
                try {
                    $transaction_id = $model->processTransaction($data);
                    $this->sendResponse(['message' => 'Transaksi berhasil dibuat', 'id' => $transaction_id], 201);
                } catch (Exception $e) {
                    $this->sendResponse(['error' => 'Gagal memproses transaksi: ' . $e->getMessage()], 500);
                }
                break;

            case 'DELETE':
                if (!$id) $this->sendResponse(['error' => 'ID wajib disertakan'], 400);
                
                try {
                    $model->revertAndDeleteTransaction($id);
                    $this->sendResponse(['message' => 'Transaksi telah dihapus dan seluruh stok dipulihkan.']);
                } catch (Exception $e) {
                    $this->sendResponse(['error' => 'Gagal menghapus riwayat transaksi: ' . $e->getMessage()], 500);
                }
                break;

            default:
                $this->sendResponse(['error' => 'Method tidak diizinkan'], 405);
                break;
        }
    }
}
