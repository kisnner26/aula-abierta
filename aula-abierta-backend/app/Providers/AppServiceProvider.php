<?php

namespace App\Providers;

use App\Repositories\Contracts\ContentFingerprintRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\ProfileRepositoryInterface;
use App\Repositories\EloquentContentFingerprintRepository;
use App\Repositories\EloquentNotificationRepository;
use App\Repositories\EloquentProfileRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ContentFingerprintRepositoryInterface::class, EloquentContentFingerprintRepository::class);
        $this->app->bind(NotificationRepositoryInterface::class, EloquentNotificationRepository::class);
        $this->app->bind(ProfileRepositoryInterface::class, EloquentProfileRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
