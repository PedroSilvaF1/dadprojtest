<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasPushSubscriptions, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        "name",
        "email",
        "password",
        "type",
        "nickname",
        "blocked",
        "photo_avatar_filename",
        "coins_balance",
        "custom"
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token'
    ];

    protected $appends = ['avatar_url'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'blocked' => 'boolean',
            'custom' => 'array', // permite manipular custom como array
        ];
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->photo_avatar_filename) {
            // Gera o URL completo (http://localhost:8000/storage/...)
            return asset('storage/photos_avatars/' . $this->photo_avatar_filename);
        }
        // Se não tiver foto, retorna null (o frontend trata do default)
        return null;
    }

    public function wonMatches()
    {
        return $this->hasMany(MatchModel::class, 'winner_user_id');
    }

    public function matchesAsPlayer1()
    {
        return $this->hasMany(MatchModel::class, 'player1_user_id');
    }

    public function matchesAsPlayer2()
    {
        return $this->hasMany(MatchModel::class, 'player2_user_id');
    }

    public function gamesAsPlayer1()
    {
        return $this->hasMany(Game::class, 'player1_user_id');
    }

    public function gamesAsPlayer2()
    {
        return $this->hasMany(Game::class, 'player2_user_id');
    }
}
