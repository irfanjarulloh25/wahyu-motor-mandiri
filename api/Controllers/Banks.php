<?php
// Controllers/Banks.php - Konrol Manajemen Bank
// Penjelasan: Controller ini memproses aksi CRUD (Create, Read, Update, Delete) terkait data rekening bank.

class Banks extends Controller {

    // Method default dipanggil saat `api/index.php?url=banks` diakses tanpa aksi
    public function index() {
        $method = $_SERVER['REQUEST_METHOD'];
        $model = $this->model('BankModel');
        $id = $_GET['id'] ?? null;

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->sendResponse($model->getBankById($id));
                } else {
                    $this->sendResponse($model->getAllBanks());
                }
                break;

            case 'POST':
                $data = $this->getJsonInput();
                if (empty($data['bank_name']) || empty($data['account_number'])) {
                    $this->sendResponse(['error' => 'Nama bank dan nomor rekening wajib diisi'], 400);
                }
                $newId = $model->createBank($data);
                $this->sendResponse(['message' => 'Bank berhasil ditambahkan', 'id' => $newId], 201);
                break;

            case 'PUT':
                if (!$id) $this->sendResponse(['error' => 'ID diwajibkan'], 400);
                $data = $this->getJsonInput();
                $model->updateBank($id, $data);
                $this->sendResponse(['message' => 'Data bank berhasil diubah']);
                break;

            case 'DELETE':
                if (!$id) $this->sendResponse(['error' => 'ID diwajibkan'], 400);
                $model->deleteBank($id);
                $this->sendResponse(['message' => 'Bank berhasil dihapus']);
                break;

            default:
                $this->sendResponse(['error' => 'Metode HTTP tidak diizinkan'], 405);
                break;
        }
    }
}
