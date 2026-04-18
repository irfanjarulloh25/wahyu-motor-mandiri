<?php
// Controllers/Services.php - Controller Daftar Layanan/Jasa
// Penjelasan: Mengatur pendaftaran, pembaruan, dan soft-delete jasa service.

class Services extends Controller {

    public function index() {
        $method = $_SERVER['REQUEST_METHOD'];
        $model = $this->model('ServiceModel');
        $id = $_GET['id'] ?? null;

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->sendResponse($model->getServiceById($id));
                } else {
                    $this->sendResponse($model->getAllActiveServices());
                }
                break;

            case 'POST':
                $data = $this->getJsonInput();
                $newId = $model->createService($data);
                $this->sendResponse(['message' => 'Layanan jasa ditambahkan', 'id' => $newId], 201);
                break;

            case 'PUT':
                if (!$id) $this->sendResponse(['error' => 'ID wajib disertakan'], 400);
                $data = $this->getJsonInput();
                $model->updateService($id, $data);
                $this->sendResponse(['message' => 'Layanan diperbarui']);
                break;

            case 'DELETE':
                if (!$id) $this->sendResponse(['error' => 'ID wajib disertakan'], 400);
                $model->softDeleteService($id);
                $this->sendResponse(['message' => 'Layanan dihapus secara kondisional (Soft Delete)']);
                break;

            default:
                $this->sendResponse(['error' => 'Method tidak didukung'], 405);
                break;
        }
    }
}
