<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\CoinTransaction;
use App\Models\Game;
use App\Models\MatchModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Fazer decode ao custom field
        $customSettings = $user->custom ?? [];

        // Ter a certeza que os defaults existem se a base de dados tiver vazia
        if (!isset($customSettings['active_skin_back'])) $customSettings['active_skin_back'] = 'red';
        if (!isset($customSettings['active_skin_front'])) $customSettings['active_skin_front'] = 'white';
        if (!isset($customSettings['owned_skins'])) $customSettings['owned_skins'] = ['red'];

        $botId = User::where('email', 'bot@mail.pt')->value('id');
        $totalMatchesQuery = MatchModel::where(function ($query) use ($user) {
            $query->where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id);
        });
        $totalWinsQuery = MatchModel::where('winner_user_id', $user->id);

        if ($botId) {
            $totalMatchesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
            $totalWinsQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }

        $totalMatches = $totalMatchesQuery->count();
        $totalWins = $totalWinsQuery->count();

        $totalGamesQuery = Game::where(function ($query) use ($user) {
            $query->where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id);
        });
        $totalGameWinsQuery = Game::where('winner_user_id', $user->id);
        if ($botId) {
            $totalGamesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
            $totalGameWinsQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $totalGames = $totalGamesQuery->count();
        $totalGameWins = $totalGameWinsQuery->count();

        $totalCapotes = Game::where(function ($query) use ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                    ->whereBetween('player1_points', [91, 119]);
            })->orWhere(function ($q) use ($user) {
                $q->where('player2_user_id', $user->id)
                    ->whereBetween('player2_points', [91, 119]);
            });
        })->count();

        $totalBandeiras = Game::where(function ($query) use ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                    ->where('player1_points', 120);
            })->orWhere(function ($q) use ($user) {
                $q->where('player2_user_id', $user->id)
                    ->where('player2_points', 120);
            });
        })->count();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'nickname' => $user->nickname,
            'email' => $user->email,
            'type' => $user->type,
            'blocked' => $user->blocked,
            'photo_avatar' => $user->photo_avatar_filename ? asset('storage/photos_avatars/'.$user->photo_avatar_filename) : null,
            'coins' => $user->coins_balance,
            'total_matches' => $totalMatches,
            'wins' => $totalWins,
            'total_match_wins' => $totalWins,
            'total_games' => $totalGames,
            'total_game_wins' => $totalGameWins,
            'total_capotes' => $totalCapotes,
            'total_bandeiras' => $totalBandeiras,
            'custom' => $customSettings,
        ]);
    }

    public function getAdmins()
    {
        if (Auth::user()->type !== 'A') {
            abort(403, 'Unauthorized.');
        }

        $admins = User::where('type', 'A')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($admins);
    }

    public function createAdmin(Request $request)
    {
        // Apenas admins podem criar users
        if (Auth::user()->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        // 2. Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:3',
            'nickname' => 'required|string|max:255|unique:users',
            'type' => 'required|in:A',
            'avatar' => 'nullable|image|max:4096'
        ]);

        $user = new User();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->nickname = $validated['nickname'];
        $user->password = Hash::make($validated['password']);
        $user->type = $validated['type'];
        $user->blocked = false;
        $user->coins_balance = 0;

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');

            // gerar um nom único
            $filename = 'avatar_' . time() . '_' . uniqid() . '.' . $file->extension();
            $file->storeAs('photos_avatars', $filename, 'public');
            $user->photo_avatar_filename = $filename;
        }
        $user->save();
        return response()->json([
            'message' => 'Administrator created successfully!',
            'user' => $user
        ], 201);
    }


    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::user();
        $data = $request->validated();

        if ($request->hasFile('avatar')) {

            // Apagar o avatar antigo se existir
            if ($user->photo_avatar_filename) {
                Storage::disk('public')->delete('photos_avatars/'.$user->photo_avatar_filename);
            }

            // Guardar o novo avatar
            $file = $request->file('avatar');
            $filename = 'avatar_'.$user->id.'_'.time().'.'.$file->extension();
            $file->storeAs('photos_avatars', $filename, 'public');
            $data['photo_avatar_filename'] = $filename;
        }
        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
            'photo_avatar' => $user->photo_avatar_filename ? asset('storage/photos_avatars/'.$user->photo_avatar_filename) : null,
        ]);
    }

    /**
     * PUT /users/me/password
     * Dar update Ã password do user
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = Auth::user();

        // Ver a password atual
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    public function purchaseSkin(Request $request) {
        $user = Auth::user();
        $request->validate([
            'skin_id' => 'required|string',
            'cost' => 'required|integer|min:0'
        ]);

        $skinId = $request->skin_id;
        $cost = $request->cost;

        if ($user->coins_balance < $cost) {
            return response()->json(['message' => 'Insufficient coins'], 402);
        }

        $custom = $user->custom ?? [];
        $owned = $custom['owned_skins'] ?? ['red'];

        if (in_array($skinId, $owned)) {
            return response()->json(['message' => 'Skin already owned'], 409);
        }

        $user->coins_balance -= $cost;
        $owned[] = $skinId;
        $custom['owned_skins'] = $owned;
        $user->custom = $custom;
        $user->save();

        CoinTransaction::create([
            'transaction_datetime' => now(),
            'user_id' => $user->id,
            'coin_transaction_type_id' => 7, // SKin Purchase
            'coins' => -$cost,
            'custom' => ['skin_id' => $skinId]
        ]);

        return response()->json([
            'message' => 'Skin purchased successfully',
            'new_balance' => $user->coins_balance,
            'owned_skins' => $owned
        ]);
    }

    public function purchaseAvatar(Request $request) {
        $user = Auth::user();
        $request->validate([
            'avatar_id' => 'required|string',
            'cost' => 'required|integer|min:0'
        ]);

        $avatarId = $request->avatar_id;
        $cost = $request->cost;

        if ($user->coins_balance < $cost) {
            return response()->json(['message' => 'Insufficient coins'], 402);
        }

        $custom = $user->custom ?? [];
        $owned = $custom['owned_avatars'] ?? [];

        if (in_array($avatarId, $owned)) {
            return response()->json(['message' => 'Avatar already owned'], 409);
        }

        $user->coins_balance -= $cost;
        $owned[] = $avatarId;
        $custom['owned_avatars'] = $owned;
        $user->custom = $custom;
        $user->save();

        CoinTransaction::create([
            'transaction_datetime' => now(),
            'user_id' => $user->id,
            'coin_transaction_type_id' => 8, // Avatar Purchase
            'coins' => -$cost,
            'custom' => ['avatar_id' => $avatarId]
        ]);

        return response()->json([
            'message' => 'Avatar purchased successfully',
            'new_balance' => $user->coins_balance,
            'owned_avatars' => $owned
        ]);
    }

    public function updateSkin(Request $request) {
        $user = Auth::user();

        $request->validate([
            'skin_back' => 'required|string',
            'skin_front' => 'required|string',
        ]);

        $custom = $user->custom ?? [];

        $custom['active_skin_back'] = $request->skin_back;
        $custom['active_skin_front'] = $request->skin_front;

        // Verificar se o user tem a skin antes de equipar
        // Se não tiver, devolve erro 403
        $owned = $custom['owned_skins'] ?? ['red'];
        if(!in_array($request->skin_back, $owned)) {
            return response()->json(['message' => 'You don\'t have this skin!'], 403);
        }

        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Skin updated!'
        ]);
    }

    public function updateAvatar(Request $request) {
        $user = Auth::user();

        $request->validate([
            'avatar' => 'nullable|string',
        ]);

        $custom = $user->custom ?? [];
        $avatarId = $request->avatar;

        // Verificar se o user tem a avatar antes de equipar
        // Se não tiver, devolve erro 403

        if ($avatarId) {
            $owned = $custom['owned_avatars'] ?? [];
            if(!in_array($request->avatar, $owned)) {
                return response()->json(['message' => 'You don\'t have this avatar!'], 403);
            }
        }
        $custom['active_avatar'] = $avatarId;
        $user->custom = $custom;
        $user->save();

        return response()->json([
            'message' => 'Avatar updated!'
        ]);
    }

    public function getUsers(Request $request)
    {
        if (Auth::user()->type !== 'A') {
            abort(403);
        }

        $query = User::query();
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('nickname', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }
        $users = $query->orderBy('created_at', 'desc')->paginate(10);
        return response()->json($users);
    }

    public function toggleBlock($id)
    {
        $admin = Auth::user();

        if ($admin->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);

        if ($user->id === $admin->id) {
            return response()->json(['message' => 'You cannot block yourself.'], 403);
        }

        // Toggle do boolean
        $user->blocked = !$user->blocked;
        $user->save();

        $status = $user->blocked ? 'blocked' : 'unblocked';

        return response()->json([
            'message' => "User {$user->nickname} has been {$status}.",
            'blocked' => $user->blocked
        ]);
    }

    public function destroy($id)
    {
        $admin = Auth::user();

        if ($admin->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);

        if ($user->id === $admin->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        // Soft delete
        $user->delete();

        return response()->json([
            'message' => "User {$user->nickname} has been deleted."
        ]);
    }

    public function stats($id)
    {
        $admin = Auth::user();
        if ($admin->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        $user = User::findOrFail($id);
        $botId = User::where('email', 'bot@mail.pt')->value('id');

        $matchesQuery = MatchModel::where(function ($query) use ($user) {
            $query->where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id);
        });
        if ($botId) {
            $matchesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $totalMatches = $matchesQuery->count();

        $matchWinsQuery = MatchModel::where('winner_user_id', $user->id);
        if ($botId) {
            $matchWinsQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $matchWins = $matchWinsQuery->count();

        $totalGamesQuery = Game::where(function ($query) use ($user) {
            $query->where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id);
        });
        if ($botId) {
            $totalGamesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $totalGames = $totalGamesQuery->count();

        $gameWinsQuery = Game::where('winner_user_id', $user->id);
        if ($botId) {
            $gameWinsQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $gameWins = $gameWinsQuery->count();

        $capotesQuery = Game::where(function ($query) use ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                    ->whereBetween('player1_points', [91, 119]);
            })->orWhere(function ($q) use ($user) {
                $q->where('player2_user_id', $user->id)
                    ->whereBetween('player2_points', [91, 119]);
            });
        });
        if ($botId) {
            $capotesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $capotes = $capotesQuery->count();

        $bandeirasQuery = Game::where(function ($query) use ($user) {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                    ->where('player1_points', 120);
            })->orWhere(function ($q) use ($user) {
                $q->where('player2_user_id', $user->id)
                    ->where('player2_points', 120);
            });
        });
        if ($botId) {
            $bandeirasQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $bandeiras = $bandeirasQuery->count();

        $startDate = Carbon::now()->subDays(29)->startOfDay();
        $endDate = Carbon::now()->startOfDay();
        $coinsActivityQuery = CoinTransaction::selectRaw(
            'DATE(transaction_datetime) as date,
            SUM(CASE WHEN coins > 0 THEN coins ELSE 0 END) as coins_in,
            SUM(CASE WHEN coins < 0 THEN -coins ELSE 0 END) as coins_out'
        )
            ->where('user_id', $user->id)
            ->whereDate('transaction_datetime', '>=', $startDate->toDateString())
            ->whereDate('transaction_datetime', '<=', $endDate->toDateString())
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date');

        $coinsActivity = [];
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $dateKey = $cursor->toDateString();
            $row = $coinsActivityQuery->get($dateKey);
            $coinsActivity[] = [
                'date' => $dateKey,
                'coins_in' => (int) ($row->coins_in ?? 0),
                'coins_out' => (int) ($row->coins_out ?? 0),
            ];
            $cursor->addDay();
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'type' => $user->type,
                'blocked' => $user->blocked,
                'created_at' => $user->created_at,
            ],
            'stats' => [
                'total_matches' => $totalMatches,
                'match_wins' => $matchWins,
                'total_games' => $totalGames,
                'game_wins' => $gameWins,
                'capotes' => $capotes,
                'bandeiras' => $bandeiras,
                'coins_activity' => $coinsActivity,
            ]
        ]);
    }

    public function destroySelf(Request $request)
    {
        $user = Auth::user();

        // Validar que a password foi enviada
        $request->validate([
            'password' => 'required|string',
        ]);

        // Verificar se a password está correta
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Incorrect password.'
            ], 403);
        }

        // Remover do campo custom o token
        $custom = $user->custom ?? [];
        if (isset($custom['api_token'])) {
            unset($custom['api_token']);
            $user->custom = $custom;
            $user->save(); // Salvar a alteração do token antes de apagar
        }

        $user->delete();

        return response()->json([
            'message' => 'Your account has been deleted successfully.'
        ]);
    }
}
