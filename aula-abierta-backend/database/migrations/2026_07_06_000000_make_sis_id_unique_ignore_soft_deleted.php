<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// A full unique index on sis_id blocks re-creating a user after soft deletion.
// Replace it with a partial unique index that only covers live rows.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_sis_id_unique');
        });

        DB::statement('CREATE UNIQUE INDEX users_sis_id_unique ON users (sis_id) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX users_sis_id_unique');

        Schema::table('users', function (Blueprint $table) {
            $table->unique('sis_id');
        });
    }
};
