<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('family_students', function (Blueprint $table) {
            $table->foreignId('family_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('relationship', 50)->default('parent');
            $table->timestamps();
            $table->primary(['family_user_id', 'student_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_students');
    }
};
