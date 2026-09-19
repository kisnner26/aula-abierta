<?php

namespace Database\Seeders;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::firstOrCreate(
            ['sis_id' => 'SA-0001'],
            ['name' => 'Super Admin', 'password' => Hash::make($this->seedPassword('AULA_SEED_SUPER_ADMIN_PASSWORD'))],
        );
        $superAdmin->assignRole('super_admin');

        $coordinator = User::firstOrCreate(
            ['sis_id' => 'CO-0001'],
            ['name' => 'Academic Coordinator', 'password' => Hash::make($this->seedPassword('AULA_SEED_COORDINATOR_PASSWORD'))],
        );
        $coordinator->assignRole('admin');

        $trainer1 = User::firstOrCreate(
            ['sis_id' => 'TR-0001'],
            ['name' => 'Teacher Demo', 'password' => Hash::make($this->seedPassword('AULA_SEED_TRAINER_PASSWORD'))],
        );
        $trainer1->assignRole('teacher');
        TeacherProfile::firstOrCreate(
            ['user_id' => $trainer1->id],
            ['has_signed_nda' => true],
        );

        $trainer2 = User::firstOrCreate(
            ['sis_id' => 'TR-0002'],
            ['name' => 'Teacher Example', 'password' => Hash::make($this->seedPassword('AULA_SEED_TRAINER_PASSWORD'))],
        );
        $trainer2->assignRole('teacher');
        TeacherProfile::firstOrCreate(
            ['user_id' => $trainer2->id],
            ['has_signed_nda' => false],
        );

        $students = [
            ['sis_id' => 'ST-0001', 'name' => 'Student One'],
            ['sis_id' => 'ST-0002', 'name' => 'Student Two'],
            ['sis_id' => 'ST-0003', 'name' => 'Student Three'],
            ['sis_id' => 'ST-0004', 'name' => 'Student Four'],
        ];

        foreach ($students as $s) {
            $user = User::firstOrCreate(
                ['sis_id' => $s['sis_id']],
                ['name' => $s['name'], 'password' => Hash::make($this->seedPassword('AULA_SEED_STUDENT_PASSWORD'))],
            );
            if ($user->name !== $s['name']) {
                $user->update(['name' => $s['name']]);
            }
            $user->assignRole('student');
        }
    }

    private function seedPassword(string $key): string
    {
        return env($key) ?: Str::password(24);
    }
}
