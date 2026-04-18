<?php
// Controllers/Spareparts.php - Controller Inventaris Suku Cadang
// Penjelasan: Mengendalikan semua rute yang berkaitan dengan stok dan pendataan suku cadang bengkel.

class Spareparts extends Controller {

    public function index() {
        $method = $_SERVER['REQUEST_METHOD'];
        $model = $this->model('SparepartModel');
        $id = $_GET['id'] ?? null;

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->sendResponse($model->getSparepartById($id));
                } else {
                    $this->sendResponse($model->getAllActiveSpareparts());
                }
                break;

            case 'POST':
                $data = $this->getJsonInput();
                $newId = $model->createSparepart($data);
                $this->sendResponse(['message' => 'Suku cadang ditambahkan', 'id' => $newId], 201);
                break;

            case 'PUT':
                if (!$id) $this->sendResponse(['error' => 'ID wajib disertakan'], 400);
                $data = $this->getJsonInput();
                $model->updateSparepart($id, $data);
                $this->sendResponse(['message' => 'Suku cadang diperbarui']);
                break;

            case 'DELETE':
                if (!$id) $this->sendResponse(['error' => 'ID wajib disertakan'], 400);
                $model->softDeleteSparepart($id);
                // Hanya ditandai tidak aktif agar invoice lama tetap bisa membaca nama barangnya
                $this->sendResponse(['message' => 'Suku cadang dihapus (Soft delete)']);
                break;

            default:
                $this->sendResponse(['error' => 'Method tidak diizinkan'], 405);
                break;
        }
    }
}
