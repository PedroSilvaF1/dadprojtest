<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\CoinTransactionController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\GameController;
use Illuminate\Http\Request;
use App\Http\Controllers\EmailVerificationController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/users/check-unique', [AuthController::class, 'checkUnique']);

Route::get('/leaderboard', [LeaderboardController::class, 'index']);
Route::get('/stats/public', [StatsController::class, 'public']);

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:5,1'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
    ->middleware(['throttle:5,1']);

Route::middleware('auth.token')->group(function () {
    Route::get('/users/me', [UserController::class, 'index']);
    Route::post('/users/me', [UserController::class, 'updateProfile']);
    Route::get('/users', [UserController::class, 'getUsers']);
    Route::get('/users/admins', [UserController::class, 'getAdmins']);
    Route::get('/users/{id}/stats', [UserController::class, 'stats']);
    Route::post('/users', [UserController::class, 'createAdmin']);
    Route::delete('/users/me', [UserController::class, 'destroySelf']);
    Route::patch('/users/me/password', [UserController::class, 'updatePassword']);
    Route::get('/users/me/transactions', [CoinTransactionController::class, 'getUserTransactions']);
    Route::get('/users/{id}/transactions', [CoinTransactionController::class, 'getTransactionsById']);

    Route::patch('/users/{id}/block', [UserController::class, 'toggleBlock']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/{id}/games', [GameController::class, 'index']);

    // Lógica do guardar as matches no game
    Route::post('/matches', [MatchController::class, 'store']);
    Route::put('/matches/{id}', [MatchController::class, 'update']);

    Route::get('/games/{id}', [GameController::class, 'show']);
    Route::get('/leaderboard/my-rank', [LeaderboardController::class, 'myRank']);
    Route::get('/stats/admin/users', [StatsController::class, 'adminUsers']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::patch('/coins/{id}/undo', [CoinTransactionController::class, 'undo']);

    // Lógica das skins e avatars
    Route::patch('/users/me/skin', [UserController::class, 'updateSkin']);
    Route::post('/shop/buy/skin', [UserController::class, 'purchaseSkin']);
    Route::patch('/users/me/avatar', [UserController::class, 'updateAvatar']);
    Route::post('/shop/buy/avatar', [UserController::class, 'purchaseAvatar']);

    // Lógica das compras de moedas
    Route::post('/debit', [CoinPurchaseController::class, 'purchase']);

    // notificações
    Route::post('/notifications/subscribe', function (Request $request) {
        $request->validate([
            'endpoint' => 'required',
            'keys.auth' => 'required',
            'keys.p256dh' => 'required',
        ]);

        $request->user()->updatePushSubscription(
            $request->endpoint,
            $request->keys['p256dh'],
            $request->keys['auth']
        );

        return response()->json(['success' => true]);
    });

    // Rota de Teste para disparar notificação
    Route::post('/notifications/test', function (Request $request) {
        $fakeLeader = $request->user();
        // Buscar todos os utilizadores da base de dados
        $allUsers = \App\Models\User::all();
        // Usar a Facade para enviar para a lista completa
        \Illuminate\Support\Facades\Notification::send($allUsers, new \App\Notifications\GlobalLeaderboardChanged($fakeLeader));

        return response()->json(['message' => 'Notificação enviada para TODOS os utilizadores!']);
    });
});
