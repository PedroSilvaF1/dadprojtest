<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    private function redirectToStatus(string $status)
    {
        $baseUrl = rtrim(config('app.frontend_url'), '/');
        return redirect()->away($baseUrl . '/verified?status=' . $status);
    }

    public function verify(Request $request, string $id, string $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            return $this->redirectToStatus('invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return $this->redirectToStatus('already');
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return $this->redirectToStatus('success');
    }

    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json(['message' => 'A verification link has been sent.']);
    }
}
