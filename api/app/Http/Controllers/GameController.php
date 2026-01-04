<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\MatchModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    public function index(Request $request, $match_id)
    {
        $user = Auth::user();

        $match = MatchModel::findOrFail($match_id);

        // Permitir acesso se for Admin
        if ($user->type !== 'A' && $match->player1_user_id !== $user->id && $match->player2_user_id !== $user->id) {
            return response()->json(['message' => 'Não tens permissão para ver estes jogos.'], 403);
        }

        // Definir quem é o "User Alvo" para lógica de vitória/derrota nos filtros
        $targetUserId = ($user->type === 'A') ? $match->player1_user_id : $user->id;


        $query = $match->games()
                        ->orderBy('began_at', 'asc');

        $query->when($request->result, function ($q) use ($request, $targetUserId) {
            if ($request->result === 'WIN') {
                $q->where('winner_user_id', $targetUserId);
            }
            elseif ($request->result === 'LOSS') {
                $q->where('winner_user_id', '!=', $targetUserId)
                    ->whereNotNull('winner_user_id');
            }
            elseif ($request->result === 'DRAW') {
                $q->where('is_draw', 1);
            }
        });

        $query->when($request->achievement, function ($q) use ($request, $targetUserId) {
            if ($request->achievement === 'Capote') {
                $q->where(function ($sub) use ($targetUserId) {
                    $sub->where(function ($p1) use ($targetUserId) {
                        $p1->where('player1_user_id', $targetUserId)
                            ->whereBetween('player1_points', [91, 119]);
                    })->orWhere(function ($p2) use ($targetUserId) {
                        $p2->where('player2_user_id', $targetUserId)
                            ->whereBetween('player2_points', [91, 119]);
                    });
                });
            } elseif ($request->achievement === 'Bandeira') {
                $q->where(function ($sub) use ($targetUserId) {
                    $sub->where(function ($p1) use ($targetUserId) {
                        $p1->where('player1_user_id', $targetUserId)
                            ->where('player1_points', 120);
                    })->orWhere(function ($p2) use ($targetUserId) {
                        $p2->where('player2_user_id', $targetUserId)
                            ->where('player2_points', 120);
                    });
                });
            }
        });

        return $query->get();
    }

    public function show($id) {
        $user = Auth::user();
        $game = Game::findOrFail($id);

        // Permitir apenas se o utilizador jogou este jogo ou se for Admin
        if ($user->type !== 'A' && $game->player1_user_id != $user->id && $game->player2_user_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Mandar as tricks do game para o campo tricks do custom
        return response()->json($game);
    }
}
