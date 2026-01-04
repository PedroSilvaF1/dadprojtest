<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchModel extends Model
{
    use HasFactory;

    protected $table = 'matches';
    public $timestamps = false;

    protected $fillable = [
        'type',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'status',
        'stake',
        'began_at',
        'ended_at',
        'total_time',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'custom',
    ];

    protected $casts = [
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'custom' => 'array',
    ];

    // Relações
    public function games() {
        return $this->hasMany(Game::class, 'match_id');
    }

    public function winner() {
        return $this->belongsTo(User::class, 'winner_user_id');
    }

    public function loser() {
        return $this->belongsTo(User::class, 'loser_user_id');
    }

    public function player1()
    {
        // "Esta partida pertence a um User (identificado pela coluna player1_user_id)"
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    // Relação para obter os dados do Jogador 2
    public function player2()
    {
        // "Esta partida pertence a um User (identificado pela coluna player2_user_id)"
        return $this->belongsTo(User::class, 'player2_user_id');
    }
}
