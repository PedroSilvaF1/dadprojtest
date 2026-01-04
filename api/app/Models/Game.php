<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'is_draw',
        'winner_user_id',
        'loser_user_id',
        'match_id',
        'status',
        'began_at',
        'ended_at',
        'total_time',
        'player1_points',
        'player2_points',
        'custom',
    ];

    protected $casts = [
        'is_draw' => 'boolean',
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'custom' => 'array',
    ];

    protected $appends = ['tricks'];

    public function getTricksAttribute()
    {
        return $this->custom['tricks'] ?? [];
    }

    // Relações simplificadas
    public function match() {
        return $this->belongsTo(MatchModel::class, 'match_id');
    }

    public function winner() {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function loser() {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    public function gamesAsPlayer1()
    {
        return $this->belongsTo(MatchModel::class, 'player1_user_id');
    }

    public function gamesAsPlayer2()
    {
        return $this->belongsTo(MatchModel::class, 'player2_user_id');
    }
}
