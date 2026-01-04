<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CoinTransactionController extends Controller
{
    public function undo(Request $request, $id) {
        $user = Auth::user();

        if (!$user || $user->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Verificar se tem saldo suficiente
        if ($user->coins_balance < 2) {
            return response()->json([
                'message' => 'Insufficient coins to perform undo.',
                'current_balance' => $user->coins_balance
            ], 400);
        }

        // Debitar o custo do Undo
        $user->decrement('coins_balance', 2);

        return response()->json([
            'message' => 'Undo transaction successful',
            'coins_balance' => $user->refresh()->coins_balance
        ], 200);
    }

    public function getUserTransactions(Request $request) {
        $user = Auth::user();

        $transactions = CoinTransaction::where('user_id', $user->id)
            ->orderBy('transaction_datetime', 'desc')
            ->paginate(10);

        $transactions = CoinTransaction::select('coin_transactions.*', 'coin_transaction_types.name as type_name')
            ->join('coin_transaction_types', 'coin_transactions.coin_transaction_type_id', '=', 'coin_transaction_types.id')
            ->where('user_id', $user->id)
            ->orderBy('transaction_datetime', 'desc')
            ->paginate(10);

        return response()->json($transactions);
    }

    public function getTransactionsById(Request $request, $id) {
        $admin = Auth::user();

        if ($admin->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        $transactions = CoinTransaction::select('coin_transactions.*', 'coin_transaction_types.name as type_name')
            ->join('coin_transaction_types', 'coin_transactions.coin_transaction_type_id', '=', 'coin_transaction_types.id')
            ->where('user_id', $id)
            ->orderBy('transaction_datetime', 'desc')
            ->paginate(10);

        return response()->json($transactions);
    }
}
