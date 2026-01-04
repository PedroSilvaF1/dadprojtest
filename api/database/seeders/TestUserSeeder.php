<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!User::where('email', 'test@mail.pt')->exists()) {
            User::create([
                'name' => 'Test User',
                'nickname' => 'BiscaTester',
                'email' => 'test@mail.pt',
                'password' => Hash::make('123'),
                'type' => 'P',
                'coins_balance' => 9000,
                'blocked' => 0,
            ]);
        }
    }
}
