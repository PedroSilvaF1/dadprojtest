<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use App\Models\Game;
use App\Models\MatchModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\GlobalLeaderboardChanged;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $mode = $request->query('mode', 'matches');
        $direction = ($request->sort && strtoupper($request->sort) === 'ASC') ? 'asc' : 'desc';

        // Standalone Games
        if ($mode === 'standalone') {

            $query = Game::query()
                ->where(function ($q) {
                    $q->whereNull('match_id')
                      ->orWhereHas('match', function ($m) {
                          $m->where('custom->format', 'single');
                      });
                })
                ->where(function ($q) use ($user) {
                    $q->where('player1_user_id', $user->id)
                        ->orWhere('player2_user_id', $user->id);
                });

            $query->when($request->date_from, function ($q) use ($request) {
                return $q->whereDate('began_at', '>=', $request->date_from);
            });

            $query->when($request->date_to, function ($q) use ($request) {
                return $q->whereDate('began_at', '<=', $request->date_to);
            });

            if ($request->result && $request->result !== 'ALL') {
                if ($request->result === 'WIN') {
                    $query->where('winner_user_id', $user->id);
                } elseif ($request->result === 'LOSS') {
                    $query->where('winner_user_id', '!=', $user->id)
                        ->whereNotNull('winner_user_id');
                } elseif ($request->result === 'DRAW') {
                    $query->where('is_draw', 1);
                }
            }

            if ($request->achievement && $request->achievement !== 'ALL') {
                if ($request->achievement === 'Capote') {
                    $query->where(function ($sub) use ($user) {
                        $sub->where(function ($p1) use ($user) {
                            $p1->where('player1_user_id', $user->id)
                                ->whereBetween('player1_points', [91, 119]);
                        })->orWhere(function ($p2) use ($user) {
                            $p2->where('player2_user_id', $user->id)
                                ->whereBetween('player2_points', [91, 119]);
                        });
                    });
                } elseif ($request->achievement === 'Bandeira') {
                    $query->where(function ($sub) use ($user) {
                        $sub->where(function ($p1) use ($user) {
                            $p1->where('player1_user_id', $user->id)
                                ->where('player1_points', 120);
                        })->orWhere(function ($p2) use ($user) {
                            $p2->where('player2_user_id', $user->id)
                                ->where('player2_points', 120);
                        });
                    });
                }
            }

            return $query
                ->orderBy('began_at', $direction)
                ->paginate(5);
        }

        // Matcehs
        $query = MatchModel::query()
            ->where(function ($q) {
                $q->whereNull('custom')
                  ->orWhere('custom->format', '!=', 'single');
            });

        $query->where(function ($q) use ($user) {
            $q->where('player1_user_id', $user->id)
                ->orWhere('player2_user_id', $user->id);
        });

        $query->when($request->date_from, function ($q) use ($request) {
            return $q->whereDate('began_at', '>=', $request->date_from);
        });

        $query->when($request->date_to, function ($q) use ($request) {
            return $q->whereDate('began_at', '<=', $request->date_to);
        });

        if (($request->result && $request->result !== 'ALL') || ($request->achievement && $request->achievement !== 'ALL')) {

            $query->whereHas('games', function ($g) use ($request, $user) {

                if ($request->result && $request->result !== 'ALL') {
                    if ($request->result === 'WIN') {
                        $g->where('winner_user_id', $user->id);
                    } elseif ($request->result === 'LOSS') {
                        $g->where('winner_user_id', '!=', $user->id)
                            ->whereNotNull('winner_user_id');
                    } elseif ($request->result === 'DRAW') {
                        $g->where('is_draw', 1);
                    }
                }

                if ($request->achievement && $request->achievement !== 'ALL') {
                    if ($request->achievement === 'Capote') {
                        $g->where(function ($sub) use ($user) {
                            $sub->where(function ($p1) use ($user) {
                                $p1->where('player1_user_id', $user->id)
                                    ->whereBetween('player1_points', [91, 119]);
                            })->orWhere(function ($p2) use ($user) {
                                $p2->where('player2_user_id', $user->id)
                                    ->whereBetween('player2_points', [91, 119]);
                            });
                        });
                    } elseif ($request->achievement === 'Bandeira') {
                        $g->where(function ($sub) use ($user) {
                            $sub->where(function ($p1) use ($user) {
                                $p1->where('player1_user_id', $user->id)
                                    ->where('player1_points', 120);
                            })->orWhere(function ($p2) use ($user) {
                                $p2->where('player2_user_id', $user->id)
                                    ->where('player2_points', 120);
                            });
                        });
                    }
                }
            });
        }

        return $query->with(['player1', 'player2'])
            ->withCount([
                'games as my_wins' => function ($q) use ($user) {
                    $q->where('winner_user_id', $user->id);
                },
                'games as opponent_wins' => function ($q) use ($user) {
                    $q->where('winner_user_id', '!=', $user->id)
                        ->whereNotNull('winner_user_id');
                }
            ])
            ->orderBy('began_at', $direction)
            ->paginate(5);
    }

    public function store(Request $request) {
        $user = Auth::user();

        $validated = $request->validate([
            'type' => 'required|string',
            'stake' => 'integer|min:0',
            'opponent_id' => 'nullable|integer|exists:users,id', 
        ]);

        return DB::transaction(function () use ($user, $validated) {

            $player2Id = null;

            if (isset($validated['opponent_id'])) {
            // Se veio um ID, é JOGO ONLINE (PvP)
            $player2Id = $validated['opponent_id'];
            
            // (Opcional) Impedir jogar contra si mesmo
            if ($player2Id == $user->id) {
                return response()->json(['message' => 'Cannot play against yourself'], 400);
            }
        }else { //se nao tiver id é contra o bot
            $botUser = User::where('email', 'bot@mail.pt')->first();
            $player2Id = $botUser->id;
        }

           //$botUser = User::where('email', 'bot@mail.pt')->first();

            // Check se tem coins suficientes
            // Definir o stake (Default 2)
            $stake = $validated['stake'] ?? 2;

            // if ($user->coins_balance < $stake) {
            //     return response()->json(['message' => 'Insufficient coins to start match.'], 402);
            // }

            // Criar a Match
            $match = new MatchModel();
            $match->type = $validated['type'];
            $match->player1_user_id = $user->id;
            //$match->player2_user_id = $botUser->id;
            $match->player2_user_id = $player2Id; 
            $match->status = 'Playing';
            $match->stake = $stake;
            $match->began_at = now();

            $match->player1_marks = 0;
            $match->player2_marks = 0;
            $match->player1_points = 0;
            $match->player2_points = 0;
            $match->save();

            // Deduzir o stake
            $user->coins_balance -= $stake;
            $user->save();

            // registar a transação
            CoinTransaction::create([
                'transaction_datetime' => now(),
                'user_id' => $user->id,
                'match_id' => $match->id,
                'coin_transaction_type_id' => 4, // Match stake
                'coins' => -$stake, // Negativo
            ]);

            // Não processamos jogos aqui porque qualquer match começa sempre sem jogos
            return response()->json([
                'message' => 'Match started',
                'id' => $match->id,
                'new_balance' => $user->coins_balance
            ], 201);
        });
    }

    public function update(Request $request, $id) {
        $user = Auth::user();
        $match = MatchModel::findOrFail($id);

        if ($match->player1_user_id !== $user->id && $match->player2_user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

//        if ($match->status === 'Ended') {
//            return response()->json(['message' => 'Match already finished'], 409);
//        }

        $validated = $request->validate([
            'player1_marks' => 'required|integer',
            'player2_marks' => 'required|integer',
            'player1_points_total' => 'required|integer',
            'player2_points_total' => 'required|integer',
            'total_time' => 'numeric',
            'games' => 'array', // Removed 'required'
            'games.*.player1_points' => 'integer',
            'games.*.player2_points' => 'integer',
            'games.*.tricks' => 'array',
            'custom' => 'array',
        ]);

        return DB::transaction(function () use ($user, $match, $validated) {
            $botUser = User::where('email', 'bot@mail.pt')->first();
            $now = now();
            $gamesList = $validated['games'] ?? [];
            $player1Id = $match->player1_user_id;
            $player2Id = $match->player2_user_id;
            $isBotMatch = $botUser && ($player1Id == $botUser->id || $player2Id == $botUser->id);
            $opponentId = ($user->id == $player1Id) ? $player2Id : $player1Id;
            $match->custom = $validated['custom'] ?? $match->custom;
            $isSingle = ($match->custom['format'] ?? null) === 'single';

            /* Cenário 1: Abandonar o jogo / desistir */
            if (empty($gamesList)) {
                $match->status = 'Interrupted';
                $match->ended_at = $now;
                $match->total_time = $validated['total_time'] ?? 0;

                if ($isBotMatch && $botUser) {
                    $match->winner_user_id = $botUser->id;
                    $match->loser_user_id = $user->id;
                } else {
                    $match->winner_user_id = $opponentId;
                    $match->loser_user_id = $user->id;
                }

                $match->player1_marks = $validated['player1_marks'];
                $match->player2_marks = $validated['player2_marks'];
                $match->player1_points = 0;
                $match->player2_points = 0;

                $match->save();

                return response()->json([
                    'message' => 'Match interrupted (Forfeit)',
                    'new_balance' => $user->coins_balance
                ], 200);
            }

            /* Cenário 2: Match foi jogado do inicio ao fim*/

            // descobrir quem era o líder antes de salvar
            $oldLeader = $this->getCurrentLeader();

            $p1Marks = $validated['player1_marks'];
            $p2Marks = $validated['player2_marks'];
            $isWin = $p1Marks > $p2Marks;
            $isDraw = $p1Marks === $p2Marks;

            $match->status = 'Ended';
            $match->ended_at = $now;
            $match->total_time = $validated['total_time'];
            $match->player1_marks = $p1Marks;
            $match->player2_marks = $p2Marks;
            $match->player1_points = $validated['player1_points_total'];
            $match->player2_points = $validated['player2_points_total'];
            if ($isDraw) {
                $match->winner_user_id = null;
                $match->loser_user_id = null;
            } else if ($isWin) {
                $match->winner_user_id = $player1Id;
                $match->loser_user_id = $player2Id;
            } else {
                $match->winner_user_id = $player2Id;
                $match->loser_user_id = $player1Id;
            }
            $match->save();

            // Salvar os jogos
            foreach ($gamesList as $gameData) {
                $p1 = $gameData['player1_points'];
                $p2 = $gameData['player2_points'];

                $gameWinner = ($p1 > $p2) ? $player1Id : (($p2 > $p1) ? $player2Id : null);
                $gameLoser = ($p1 > $p2) ? $player2Id : (($p2 > $p1) ? $player1Id : null);

                $game = new Game();
                if (!$isSingle) {
                    $game->match_id = $match->id;
                }
                $game->type = $match->type;
                $game->player1_user_id = $player1Id;
                $game->player2_user_id = $player2Id;
                $game->winner_user_id = $gameWinner;
                $game->loser_user_id = $gameLoser;
                $game->is_draw = ($p1 == $p2);
                $game->status = 'Ended';
                $game->player1_points = $p1;
                $game->player2_points = $p2;
                $game->began_at = $now;
                $game->ended_at = $now;
                $game->custom = ['tricks' => $gameData['tricks'] ?? []];
                $game->save();
            }

            // Lógica de pagamento das moedas
            if ($isBotMatch && $isWin && $botUser) {
                $rewardAmount = 0;

                $p1PointsTotal = $validated['player1_points_total'];

                if ($p1PointsTotal >= 91 && $p1PointsTotal <= 119) {
                    $rewardAmount = 4; // Capote
                } else if ($p1PointsTotal == 120) {
                    $rewardAmount = 6; // Bandeira
                } else {
                    $rewardAmount = 3; // Vitória simples
                }

                $user->coins_balance += $rewardAmount;
                $user->save();

                // registar a transação
                CoinTransaction::create([
                    'transaction_datetime' => now(),
                    'user_id' => $user->id,
                    'match_id' => $match->id,
                    'coin_transaction_type_id' => 6, // Match payout
                    'coins' => $rewardAmount, // Positivo
                ]);
            }

            // descobrir quem é o líder depois de salvar
            $newLeader = $this->getCurrentLeader();

            // se o líder mudou e o novo líder é o vencedor, notificar todos os utilizadores
            if ($newLeader && $oldLeader && $newLeader->id !== $oldLeader->id) {
                if ($newLeader->id === $user->id) {
                    $users = User::all();
                    Notification::send($users, new GlobalLeaderboardChanged($newLeader));
                }
            }

            return response()->json([
                'message' => 'Match finalized',
                'new_balance' => $user->coins_balance
            ], 200);
        });
    }

    private function getCurrentLeader()
    {
        return User::withCount([
            'matchesAsPlayer1 as p1_wins' => function ($q) {
                $q->whereColumn('winner_user_id', 'users.id');
            },
            'matchesAsPlayer2 as p2_wins' => function ($q) {
                $q->whereColumn('winner_user_id', 'users.id');
            }
        ])
            ->withMax(['wonMatches as last_win_at' => function($q) {
            }], 'ended_at')
            ->orderByRaw('(p1_wins + p2_wins) DESC')
            ->orderBy('last_win_at', 'asc')
            ->orderBy('id', 'asc')
            ->first();
    }
}
