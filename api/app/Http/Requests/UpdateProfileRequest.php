<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'name'     => 'sometimes|string|max:255',
            'nickname' => 'sometimes|string|max:255|unique:users,nickname,' . auth()->id(),
            'email'    => 'sometimes|email|unique:users,email,' . auth()->id(),
            'avatar' => 'nullable|image|max:2048|mimes:jpg,jpeg,png'
        ];
    }
}
