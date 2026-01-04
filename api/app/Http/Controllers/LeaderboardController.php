<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\MatchModel;

class LeaderboardController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type', 'match_wins');
        $botId = $this->getBotUserId();

        $query = User::query()->where('type', '!=', 'A');
        if ($botId) {
            $query->where('id', '!=', $botId);
        }

        switch ($type) {
            case 'match_wins':
                $query->withCount([
                    'matchesAsPlayer1 as p1_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player2_user_id', '!=', $botId);
                        }
                    },
                    'matchesAsPlayer2 as p2_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId);
                        }
                    }
                ])
                    ->withMax(['wonMatches as last_win_at' => function($q) use ($botId) {
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId)
                                ->where('player2_user_id', '!=', $botId);
                        }
                    }], 'ended_at')
                    ->orderByRaw('(p1_wins + p2_wins) DESC')
                    ->orderBy('last_win_at', 'asc')
                    ->orderBy('id', 'asc');
                break;

            case 'game_wins':
                $query->withCount([
                    'gamesAsPlayer1 as p1_game_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player2_user_id', '!=', $botId);
                        }
                    },
                    'gamesAsPlayer2 as p2_game_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId);
                        }
                    }
                ])
                    ->orderByRaw('(p1_game_wins + p2_game_wins) DESC')
                    ->orderBy('id', 'asc');
                break;

            default:
                $type = 'match_wins';
                $query->withCount([
                    'matchesAsPlayer1 as p1_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player2_user_id', '!=', $botId);
                        }
                    },
                    'matchesAsPlayer2 as p2_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId);
                        }
                    }
                ])
                    ->withMax(['wonMatches as last_win_at' => function($q) use ($botId) {
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId)
                                ->where('player2_user_id', '!=', $botId);
                        }
                    }], 'ended_at')
                    ->orderByRaw('(p1_wins + p2_wins) DESC')
                    ->orderBy('last_win_at', 'asc')
                    ->orderBy('id', 'asc');
                break;
        }

        $paginator = $query->paginate(10);

        $paginator->getCollection()->transform(function ($user) use ($type) {
            if ($type === 'match_wins') {
                $user->score = ($user->p1_wins ?? 0) + ($user->p2_wins ?? 0);
            } elseif ($type === 'game_wins') {
                $user->score = ($user->p1_game_wins ?? 0) + ($user->p2_game_wins ?? 0);
            }
            return $user;
        });

        return response()->json($paginator);
    }

    public function myRank(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['rank' => '-']);
        }

        $type = $request->query('type', 'match_wins');
        $rank = '-';
        $botId = $this->getBotUserId();
        if ($botId) {
            $user = User::where('id', $user->id)
                ->where('id', '!=', $botId)
                ->first();
            if (!$user) {
                return response()->json(['rank' => '-']);
            }
        }

        switch ($type) {
            case 'match_wins':
                $myWinsQuery = MatchModel::where('winner_user_id', $user->id);
                $myLastWinQuery = MatchModel::where('winner_user_id', $user->id);
                if ($botId) {
                    $myWinsQuery->where('player1_user_id', '!=', $botId)
                        ->where('player2_user_id', '!=', $botId);
                    $myLastWinQuery->where('player1_user_id', '!=', $botId)
                        ->where('player2_user_id', '!=', $botId);
                }
                $myWins = $myWinsQuery->count();
                $myLastWin = $myLastWinQuery->max('ended_at');

                $query = User::withCount([
                    'matchesAsPlayer1 as p1_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player2_user_id', '!=', $botId);
                        }
                    },
                    'matchesAsPlayer2 as p2_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId);
                        }
                    }
                ]);
                if ($botId) {
                    $query->where('id', '!=', $botId);
                }
                $query->withMax(['wonMatches as last_win_at' => function($q) use ($botId) {
                    if ($botId) {
                        $q->where('player1_user_id', '!=', $botId)
                            ->where('player2_user_id', '!=', $botId);
                    }
                }], 'ended_at');

                $allUsers = $query->get();

                $countBetter = $allUsers->filter(function ($other) use ($myWins, $myLastWin, $user) {
                    $otherWins = ($other->p1_wins ?? 0) + ($other->p2_wins ?? 0);
                    $otherLastWin = $other->last_win_at;

                    if ($otherWins > $myWins) return true;
                    if ($otherWins == $myWins) {
                        if ($myWins == 0) return $other->id < $user->id;
                        if ($otherLastWin < $myLastWin && $otherLastWin != null) return true;
                        if ($otherLastWin == $myLastWin) return $other->id < $user->id;
                    }
                    return false;
                })->count();

                $rank = $countBetter + 1;
                break;

            case 'game_wins':
                $myGameWinsQuery = DB::table('games')->where('winner_user_id', $user->id);
                if ($botId) {
                    $myGameWinsQuery->where('player1_user_id', '!=', $botId)
                        ->where('player2_user_id', '!=', $botId);
                }
                $myGameWins = $myGameWinsQuery->count();

                $query = User::withCount([
                    'gamesAsPlayer1 as p1_game_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player2_user_id', '!=', $botId);
                        }
                    },
                    'gamesAsPlayer2 as p2_game_wins' => function ($q) use ($botId) {
                        $q->whereColumn('winner_user_id', 'users.id');
                        if ($botId) {
                            $q->where('player1_user_id', '!=', $botId);
                        }
                    }
                ]);
                if ($botId) {
                    $query->where('id', '!=', $botId);
                }

                $allUsers = $query->get();

                $countBetter = $allUsers->filter(function ($other) use ($myGameWins, $user) {
                    $otherWins = ($other->p1_game_wins ?? 0) + ($other->p2_game_wins ?? 0);

                    if ($otherWins > $myGameWins) return true;
                    if ($otherWins == $myGameWins) return $other->id < $user->id;
                    return false;
                })->count();

                $rank = $countBetter + 1;
                break;
        }

        return response()->json(['rank' => $rank]);
    }

    private function getBotUserId(): ?int
    {
        return User::where('email', 'bot@mail.pt')->value('id');
    }
}
