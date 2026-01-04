<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CoinTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'transaction_datetime' => ['required', 'date'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'match_id' => ['nullable', 'integer', 'exists:matches,id'],
            'game_id' => ['nullable', 'integer', 'exists:games,id'],
            'coin_transaction_type_id' => ['required', 'integer', 'exists:coin_transaction_types,id'],
            'coins' => ['required', 'integer', 'not_in:0'],
            'custom' => ['nullable', 'array'],
        ];
    }
}
