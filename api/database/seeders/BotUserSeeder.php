<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BotUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'bot@mail.pt'],
            [
                'name' => 'Bot',
                'nickname' => 'Bot',
                'password' => Hash::make('bot123'),
                'type' => 'P',
                'blocked' => 0,
                'coins_balance' => 0,
            ]
        );
    }
}
