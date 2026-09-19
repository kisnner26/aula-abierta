<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProfileNotificationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_authenticated_user_can_read_and_update_profile_preferences(): void
    {
        $user = User::create([
            'sis_id' => 'TEST-PROFILE-1',
            'name' => 'Profile Tester',
            'password' => 'secret-password',
        ]);
        $user->assignRole('student');
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.preferences.theme', 'system');

        $this->patchJson('/api/v1/profile', [
            'name' => 'Updated Profile',
            'preferences' => [
                'theme' => 'dark',
                'keep_signed_in' => false,
                'notification_messages' => true,
                'notification_tasks' => false,
                'notification_grades' => true,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Profile')
            ->assertJsonPath('data.preferences.theme', 'dark')
            ->assertJsonPath('data.preferences.keep_signed_in', false);
    }

    public function test_authenticated_user_can_manage_own_notifications(): void
    {
        $user = User::create([
            'sis_id' => 'TEST-NOTIFY-1',
            'name' => 'Notification Tester',
            'password' => 'secret-password',
        ]);
        $user->assignRole('student');
        $this->actingAs($user, 'sanctum');

        $notification = UserNotification::create([
            'user_id' => $user->id,
            'type' => 'task',
            'title' => 'Task reminder',
            'body' => 'A task is due soon.',
            'action_url' => '/student/calendar',
        ]);

        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.id', $notification->id)
            ->assertJsonPath('data.0.read_at', null);

        $this->postJson("/api/v1/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.id', $notification->id);

        $this->assertNotNull($notification->refresh()->read_at);
    }
}
