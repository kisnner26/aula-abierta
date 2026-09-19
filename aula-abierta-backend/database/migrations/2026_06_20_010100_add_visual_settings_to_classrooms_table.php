<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->string('theme_primary_color', 7)->default('#D31A2A')->after('is_active');
            $table->string('theme_accent_color', 7)->default('#1D95FB')->after('theme_primary_color');
            $table->string('hero_background')->default('mascot-studio')->after('theme_accent_color');
            $table->string('welcome_message', 180)->nullable()->after('hero_background');
        });
    }

    public function down(): void
    {
        Schema::table('classrooms', function (Blueprint $table) {
            $table->dropColumn([
                'theme_primary_color',
                'theme_accent_color',
                'hero_background',
                'welcome_message',
            ]);
        });
    }
};
