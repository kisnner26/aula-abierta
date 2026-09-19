<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Fallback for php artisan serve which doesn't follow the public/storage symlink.
// In production (Nginx/Apache), static files are served directly without hitting this route.
Route::get('/storage/{path}', function (string $path) {
    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }
    return response()->file(
        Storage::disk('public')->path($path),
        ['Cache-Control' => 'public, max-age=3600'],
    );
})->where('path', '.*');
