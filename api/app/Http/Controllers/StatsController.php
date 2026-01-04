<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\MatchModel;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function public()
    {
        $botId = $this->getBotUserId();
        $startDate = Carbon::now()->subDays(29)->startOfDay();
        $endDate = Carbon::now()->startOfDay();

        $playersQuery = User::where('type', '!=', 'A');
        if ($botId) {
            $playersQuery->where('id', '!=', $botId);
        }
        $totalPlayers = $playersQuery->count();

        $matchesQuery = MatchModel::query();
        if ($botId) {
            $matchesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $totalMatches = $matchesQuery->count();

        $gamesQuery = Game::query();
        if ($botId) {
            $gamesQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $totalGames = $gamesQuery->count();

        $matchActivityQuery = MatchModel::selectRaw('DATE(ended_at) as date, COUNT(*) as matches')
            ->whereNotNull('ended_at')
            ->whereDate('ended_at', '>=', $startDate->toDateString())
            ->whereDate('ended_at', '<=', $endDate->toDateString());
        if ($botId) {
            $matchActivityQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $matchCounts = $matchActivityQuery
            ->groupBy('date')
            ->pluck('matches', 'date')
            ->toArray();

        $gameActivityQuery = Game::selectRaw('DATE(ended_at) as date, COUNT(*) as games')
            ->whereNotNull('ended_at')
            ->whereDate('ended_at', '>=', $startDate->toDateString())
            ->whereDate('ended_at', '<=', $endDate->toDateString());
        if ($botId) {
            $gameActivityQuery->where('player1_user_id', '!=', $botId)
                ->where('player2_user_id', '!=', $botId);
        }
        $gameCounts = $gameActivityQuery
            ->groupBy('date')
            ->pluck('games', 'date')
            ->toArray();

        $activity = [];
        $cursor = $startDate->copy();
        while ($cursor->lte($endDate)) {
            $dateKey = $cursor->toDateString();
            $activity[] = [
                'date' => $dateKey,
                'matches' => (int) ($matchCounts[$dateKey] ?? 0),
                'games' => (int) ($gameCounts[$dateKey] ?? 0),
            ];
            $cursor->addDay();
        }

        return response()->json([
            'totals' => [
                'players' => $totalPlayers,
                'matches' => $totalMatches,
                'games' => $totalGames,
            ],
            'activity' => $activity,
        ]);
    }

    public function adminUsers()
    {
        $admin = Auth::user();
        if (!$admin || $admin->type !== 'A') {
            abort(403, 'Unauthorized action.');
        }

        $metric = request()->query('metric', 'achievements');
        $botId = $this->getBotUserId();
        $limit = 10;

        switch ($metric) {
            case 'coins_out':
                $rows = DB::table('coin_transactions')
                    ->select('coin_transactions.user_id', 'users.nickname', DB::raw('SUM(-coin_transactions.coins) as value'))
                    ->join('users', 'coin_transactions.user_id', '=', 'users.id')
                    ->where('coin_transactions.coins', '<', 0)
                    ->where('users.type', '!=', 'A')
                    ->whereNull('users.deleted_at');
                if ($botId) {
                    $rows->where('users.id', '!=', $botId);
                }
                $rows = $rows->groupBy('coin_transactions.user_id', 'users.nickname')
                    ->orderByDesc('value')
                    ->limit($limit)
                    ->get();
                break;
            case 'achievements':
            default:
                $rows = DB::table('games')
                    ->select('games.player1_user_id as user_id', DB::raw('COUNT(*) as value'))
                    ->whereBetween('games.player1_points', [91, 120]);
                $rows2 = DB::table('games')
                    ->select('games.player2_user_id as user_id', DB::raw('COUNT(*) as value'))
                    ->whereBetween('games.player2_points', [91, 120]);
                if ($botId) {
                    $rows->where('games.player1_user_id', '!=', $botId)
                        ->where('games.player2_user_id', '!=', $botId);
                    $rows2->where('games.player1_user_id', '!=', $botId)
                        ->where('games.player2_user_id', '!=', $botId);
                }
                $rows->groupBy('games.player1_user_id');
                $rows2->groupBy('games.player2_user_id');
                $sub = $rows->unionAll($rows2);
                $rows = DB::query()->fromSub($sub, 'a')
                    ->select('a.user_id', 'users.nickname', DB::raw('SUM(a.value) as value'))
                    ->join('users', 'users.id', '=', 'a.user_id')
                    ->where('users.type', '!=', 'A')
                    ->whereNull('users.deleted_at');
                if ($botId) {
                    $rows->where('users.id', '!=', $botId);
                }
                $rows = $rows->groupBy('a.user_id', 'users.nickname')
                    ->orderByDesc('value')
                    ->limit($limit)
                    ->get();
                break;
        }

        return response()->json([
            'metric' => $metric,
            'users' => $rows,
        ]);
    }

    private function getBotUserId(): ?int
    {
        return User::where('email', 'bot@mail.pt')->value('id');
    }
}
