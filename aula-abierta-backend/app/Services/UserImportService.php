<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Facades\Excel;

class UserImportService
{
    private const ALLOWED_ROLES = ['student', 'teacher', 'family', 'admin', 'super_admin'];

    // Roles an 'admin' (coordinator) may import; only super_admin can import privileged roles.
    private const NON_PRIVILEGED_ROLES = ['student', 'teacher', 'family'];

    public function import(UploadedFile $file, User $actor): array
    {
        $allowedRoles = $actor->hasRole('super_admin')
            ? self::ALLOWED_ROLES
            : self::NON_PRIVILEGED_ROLES;

        // WithHeadingRow keys each data row by its column header;
        // HeadingRowImport (used previously) returned only the header row, so no user was ever imported.
        $rows = Excel::toArray(new class implements WithHeadingRow {}, $file)[0] ?? [];

        $created = 0;
        $errors = [];

        foreach ($rows as $i => $row) {
            $line = $i + 2;

            $name = trim($row['name'] ?? '');
            $sisId = trim($row['sis_id'] ?? '');
            $role = trim($row['role'] ?? '');
            $password = trim($row['password'] ?? '');

            if (! $name || ! $sisId || ! $role || ! $password) {
                $errors[] = "Row {$line}: missing required fields.";

                continue;
            }

            if (! in_array($role, $allowedRoles, true)) {
                $errors[] = "Row {$line}: invalid role '{$role}'.";

                continue;
            }

            if (User::where('sis_id', $sisId)->exists()) {
                $errors[] = "Row {$line}: SIS ID '{$sisId}' already exists.";

                continue;
            }

            $user = User::create([
                'name' => $name,
                'sis_id' => $sisId,
                'password' => Hash::make($password),
            ]);

            $user->assignRole($role);
            $created++;
        }

        return compact('created', 'errors');
    }
}
