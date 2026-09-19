<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'active', 'ended'])->default('pending');
            $table->unsignedBigInteger('current_question_id')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            $table->index(['classroom_id', 'status'], 'quiz_sessions_classroom_status_idx');
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_session_id')->constrained()->cascadeOnDelete();
            $table->text('question_text');
            $table->json('options'); // exactly 4 strings
            $table->unsignedTinyInteger('correct_index'); // 0–3
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamp('revealed_at')->nullable();
            $table->timestamps();
            $table->index(['quiz_session_id', 'position'], 'quiz_questions_session_pos_idx');
        });

        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quiz_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('answer_index');
            $table->boolean('is_correct')->default(false);
            $table->timestamp('answered_at');
            $table->timestamps();
            $table->unique(['quiz_question_id', 'student_id'], 'quiz_answers_unique');
            $table->index(['quiz_session_id', 'id'], 'quiz_answers_session_cursor_idx');
        });

        Schema::table('quiz_sessions', function (Blueprint $table) {
            $table->foreign('current_question_id')
                ->references('id')->on('quiz_questions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_sessions', function (Blueprint $table) {
            $table->dropForeign(['current_question_id']);
        });
        Schema::dropIfExists('quiz_answers');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quiz_sessions');
    }
};
