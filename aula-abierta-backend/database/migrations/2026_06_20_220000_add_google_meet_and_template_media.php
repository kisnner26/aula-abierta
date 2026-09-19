<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('weeks', function (Blueprint $table) {
            $table->string('session_provider', 30)->default('google_meet')->after('meet_link');
            $table->string('google_event_id')->nullable()->after('session_provider');
            $table->text('google_calendar_url')->nullable()->after('google_event_id');
            $table->index(['classroom_id', 'session_scheduled_at'], 'weeks_classroom_session_idx');
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->string('cover_image_path')->nullable()->after('title');
            $table->string('cover_image_mime', 100)->nullable()->after('cover_image_path');
        });
    }

    public function down(): void
    {
        Schema::table('weeks', function (Blueprint $table) {
            $table->dropIndex('weeks_classroom_session_idx');
            $table->dropColumn(['session_provider', 'google_event_id', 'google_calendar_url']);
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['cover_image_path', 'cover_image_mime']);
        });
    }
};
