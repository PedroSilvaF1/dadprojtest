<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CoinTransactionType extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = [
        'name',
        'type',
        'deleted_at',
        'custom'
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
        'custom' => 'array',
    ];
}
