<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $fields = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || ! Hash::check($fields['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (! $user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email not verified'], 403);
        }

        $token = Str::random(60);
        $user->custom = array_merge($user->custom ?? [], [
            'api_token' => hash('sha256', $token)
        ]);
        $user->save();

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function register(RegisterRequest $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'required|string|max:20|unique:users,nickname',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:3',
            'avatar' => 'nullable|image|max:2048'
        ]);

        $photoFilename = null;
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('photos_avatars', 'public');
            $photoFilename = basename($path);
        }

        $user = User::create([
            'name' => $fields['name'],
            'nickname' => $fields['nickname'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'photo_avatar_filename' => $photoFilename,
            'coins_balance' => 10,
            'type' => 'P',
        ]);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'User registered successfully. Please verify your email.',
        ], 201);
    }

    public function checkUnique(Request $request)
    {
        $request->validate([
            'field' => 'required|in:email,nickname',
            'value' => 'required|string'
        ]);

        $exists = User::where($request->field, $request->value)->exists();

        return response()->json([
            'is_unique' => !$exists
        ]);
    }

    public function me(Request $request)
    {
        $user = auth()->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    public function logout(Request $request)
    {
        $user = auth()->user();
        if ($user) {
            $custom = $user->custom;
            unset($custom['api_token']);
            $user->custom = $custom;
            $user->save();
        }
        return response()->json(['message' => 'Logged out']);
    }
}
