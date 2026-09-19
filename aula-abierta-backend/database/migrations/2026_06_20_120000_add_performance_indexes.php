<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SSE polls weeks.updated_at every 3 seconds per connected user
        Schema::table('weeks', function (Blueprint $table) {
            $table->index('updated_at', 'weeks_updated_at_idx');
        });

        // SSE polls grades.id for new grades; submission_id already has unique index
        Schema::table('grades', function (Blueprint $table) {
            $table->index(['id', 'submission_id'], 'grades_id_submission_idx');
        });

        // SSE polls submissions.id for teacher; course_task_id FK already indexed
        Schema::table('submissions', function (Blueprint $table) {
            $table->index('id', 'submissions_id_idx');
        });

        // notifications queried by user_id + id cursor every tick
        // (user_id, read_at, created_at) index already exists — add cursor index
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->index(['user_id', 'id'], 'notifications_user_id_cursor_idx');
        });

        // messages queried by recipient_id + id cursor every tick
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['recipient_id', 'id'], 'messages_recipient_cursor_idx');
        });
    }

    public function down(): void
    {
        Schema::table('weeks', function (Blueprint $table) {
            $table->dropIndex('weeks_updated_at_idx');
        });
        Schema::table('grades', function (Blueprint $table) {
            $table->dropIndex('grades_id_submission_idx');
        });
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex('submissions_id_idx');
        });
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_id_cursor_idx');
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_recipient_cursor_idx');
        });
    }
};
