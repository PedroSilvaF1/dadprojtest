<?php

namespace App\Http\Controllers;

use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class CoinPurchaseController extends Controller
{
    public function purchase(Request $request) {
        $user = Auth::user();

        // Validar a quantidade de moedas a comprar
        $request->validate([
            'type' => 'required|string|in:MBWAY,PAYPAL,IBAN,VISA,MB',
            'reference' => 'required|string',
            'value' => 'required|integer|min:1'
        ]);

        $type = $request->type;
        $reference = $request->reference;
        $euros = $request->value;

        // validar a referência conforme o tipo
        $this->validatePaymentReference($type, $reference);

        // Comunicar com a API do professor
        $response = Http::post('https://dad-payments-api.vercel.app/api/debit', [
            'type' => $type,
            'reference' => $reference,
            'value' => (float) $euros
        ]);

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Payment rejected by gateway',
                'details' => $response->json()
            ], $response->status());
        }

        try {
            $result = DB::transaction(function () use ($request, $euros, $type, $reference, $user) {

                // Converter 1 euro = 10 coins
                $coinsEarned = $euros * 10;

                $transactionType = CoinTransactionType::where('name', 'Coin purchase')->first();

                if (!$transactionType) {
                    throw new \Exception("Transaction type 'Coin purchase' not found.");
                }

                // Criar uma entrada na tabela coin_transctions
                $transaction = new CoinTransaction();
                $transaction->user_id = $user->id;
                $transaction->coin_transaction_type_id = $transactionType->id;
                $transaction->transaction_datetime = now();
                $transaction->coins = $coinsEarned;

                // match_id e game_id ficam a null pois é uma compra direta
                $transaction->save();

                // Criar a CoinPurchase
                $purchase = new CoinPurchase();
                $purchase->user_id = $user->id;
                $purchase->coin_transaction_id = $transaction->id;
                $purchase->purchase_datetime = now();
                $purchase->euros = $euros;
                $purchase->payment_type = $type;
                $purchase->payment_reference = $reference;
                $purchase->save();

                $user->coins_balance += $coinsEarned;
                $user->save();

                return [
                    'coins' => $coinsEarned,
                    'new_total_balance' => $user->coins_balance,
                    'transaction_id' => $transaction->id
                ];
            });

            return response()->json([
                'message' => "Successfully purchased {$euros} euros worth of coins.",
                'new_balance' => $result['new_total_balance'],
                'transaction_id' => $result['transaction_id']
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error recording purchase locally',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function validatePaymentReference($type, $reference) {

        $isValid = false;

        switch ($type) {
            case 'MBWAY':
                // 9 digitos a começar por 9
                $isValid = preg_match('/^9\d{8}$/', $reference);
                break;
            case 'PAYPAL':
                // Apenas email válido
                $isValid = filter_var($reference, FILTER_VALIDATE_EMAIL);
                break;
            case 'IBAN':
                // 2 letras + 23 digitos
                $isValid = preg_match('/^[A-Z]{2}\d{23}$/', $reference);
                break;
            case 'MB':
                // 5 digitos + '-' + 9 digitos
                $isValid = preg_match('/^\d{5}-\d{9}$/', $reference);
                break;
            case 'VISA':
                // 16 digitos a começar por 4
                $isValid = preg_match('/^4\d{15}$/', $reference);
                break;
        }

        if (!$isValid) {
            throw ValidationException::withMessages([
                'reference' => "Invalid reference format for type {$type}"
            ]);
        }
    }
}
