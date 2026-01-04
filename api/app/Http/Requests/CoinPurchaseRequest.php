<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CoinPurchaseRequest extends FormRequest
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
        $rules = [
            'purchase_datetime' => ['required', 'date'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'coin_transaction_id' => ['required', 'integer', 'exists:coin_transactions,id'],
            'euros' => ['required', 'numeric', 'min:0.01'],
            'payment_type' => ['required', 'string', 'in:MBWAY,IBAN,MB,VISA,PAYPAL'],
            'custom' => ['nullable', 'array'],
        ];

        $paymentType = $this->input('payment_type');
        $referenceRules = ['required'];

        switch ($paymentType) {
            case 'MBWAY':
                $referenceRules[] = 'regex:/^9\d{8}$/';
                break;
            case 'IBAN':
                $referenceRules[] = 'regex:/^[A-Z]{2}\d{23}$/';
                break;
            case 'VISA':
                $referenceRules[] = 'regex:/^4\d{15}$/';
                break;
            case 'PAYPAL':
                $referenceRules[] = 'email';
                break;
            case 'MB':
                $referenceRules[] = 'regex:/^\d{5}-\d{9}$/';
                break;
            default:
                $referenceRules[] = 'string';
                break;
        }

        $rules['payment_reference'] = $referenceRules;
        return $rules;
    }

    public function messages(): array
    {
        return [
            'payment_reference.regex' => 'The payment reference format is invalid for the selected payment type.',
            'payment_type.in' => 'The selected payment type is invalid.'
        ];
    }
}
