<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class TokenAuth
{
    public function handle(Request $request, Closure $next)
    {
        $auth = $request->header('Authorization');
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message'=>'Unauthorized'], 401);
        }

        $token = substr($auth, 7);
        $hashedToken = hash('sha256', $token);
        // Debug
        // $user = User::whereJsonContains('custom->api_token', $hashedToken)->first();

        $user = User::whereRaw("JSON_EXTRACT(custom, '$.api_token') = ?", [$hashedToken])
            ->first();

        if (!$user) {
            return response()->json(['message'=>'Unauthorized'], 401);
        }

        auth()->login($user);
        return $next($request);
    }
}

