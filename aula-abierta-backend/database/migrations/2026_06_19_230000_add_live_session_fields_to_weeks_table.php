<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weeks', function (Blueprint $table) {
            $table->string('meet_link')->nullable()->after('vocabulary');
            $table->string('jitsi_room_id')->nullable()->after('meet_link');
            $table->timestamp('session_scheduled_at')->nullable()->after('jitsi_room_id');
            $table->boolean('session_is_live')->default(false)->after('session_scheduled_at');
            $table->text('session_password')->nullable()->after('session_is_live');
        });
    }

    public function down(): void
    {
        Schema::table('weeks', function (Blueprint $table) {
            $table->dropColumn([
                'meet_link',
                'jitsi_room_id',
                'session_scheduled_at',
                'session_is_live',
                'session_password',
            ]);
        });
    }
};
