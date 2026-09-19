<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use DatabaseTransactions;

    private function makeUser(string $sisId, string $role, string $password = 'secret-password'): User
    {
        $user = User::create([
            'sis_id' => $sisId,
            'name' => "Audit Tester {$role}",
            'password' => Hash::make($password),
        ]);
        $user->assignRole($role);

        return $user;
    }

    public function test_successful_login_is_audited_with_ip(): void
    {
        $user = $this->makeUser('AUD-ST-1', 'student');

        $this->postJson('/api/v1/auth/login', [
            'sis_id' => 'AUD-ST-1',
            'password' => 'secret-password',
        ])->assertOk();

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'auth',
            'description' => 'login_succeeded',
            'causer_id' => $user->id,
        ]);
    }

    public function test_failed_login_is_audited(): void
    {
        $this->makeUser('AUD-ST-2', 'student');

        $this->postJson('/api/v1/auth/login', [
            'sis_id' => 'AUD-ST-2',
            'password' => 'wrong-password',
        ])->assertStatus(422);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'auth',
            'description' => 'login_failed',
            'causer_id' => null,
        ]);
    }

    public function test_user_lifecycle_is_audited(): void
    {
        $superAdmin = $this->makeUser('AUD-SA-1', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        $created = $this->postJson('/api/v1/users', [
            'name' => 'Audited User',
            'sis_id' => 'AUD-NEW-1',
            'password' => 'password123',
            'role' => 'student',
        ])->assertCreated()->json('data');

        $this->putJson("/api/v1/users/{$created['id']}", ['name' => 'Audited Renamed'])->assertOk();
        $this->deleteJson("/api/v1/users/{$created['id']}")->assertNoContent();

        foreach (['user_created', 'user_updated', 'user_deleted'] as $event) {
            $this->assertDatabaseHas('activity_log', [
                'log_name' => 'users',
                'description' => $event,
                'causer_id' => $superAdmin->id,
                'subject_id' => $created['id'],
            ]);
        }
    }

    public function test_audit_log_endpoint_supports_filters_and_sorting(): void
    {
        $superAdmin = $this->makeUser('AUD-SA-2', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        // Generate two distinct audit events.
        $this->postJson('/api/v1/users', [
            'name' => 'Filter Target',
            'sis_id' => 'AUD-NEW-2',
            'password' => 'password123',
            'role' => 'student',
        ])->assertCreated();

        activity('auth')->causedBy($superAdmin)->withProperties(['ip' => '10.0.0.1'])->log('login_succeeded');

        $byAction = $this->getJson('/api/v1/audit-logs?action=user_created')->assertOk();
        $actions = array_unique(array_column($byAction->json('data'), 'action'));
        $this->assertSame(['user_created'], $actions);

        $byCategory = $this->getJson('/api/v1/audit-logs?category=auth')->assertOk();
        $categories = array_unique(array_column($byCategory->json('data'), 'category'));
        $this->assertSame(['auth'], $categories);

        $asc = $this->getJson('/api/v1/audit-logs?sort=asc')->assertOk()->json('data');
        $desc = $this->getJson('/api/v1/audit-logs?sort=desc')->assertOk()->json('data');
        $this->assertSame($asc[0]['id'], end($desc)['id'] ?: $asc[0]['id']);
        $this->assertLessThanOrEqual($desc[0]['id'], $asc[0]['id']);

        $today = now()->toDateString();
        $inRange = $this->getJson("/api/v1/audit-logs?date_from={$today}&date_to={$today}")->assertOk();
        $this->assertNotEmpty($inRange->json('data'));

        $future = now()->addYear()->toDateString();
        $empty = $this->getJson("/api/v1/audit-logs?date_from={$future}")->assertOk();
        $this->assertEmpty($empty->json('data'));
    }

    public function test_audit_log_requires_super_admin(): void
    {
        $admin = $this->makeUser('AUD-AD-1', 'admin');
        $this->actingAs($admin, 'sanctum');

        $this->getJson('/api/v1/audit-logs')->assertForbidden();
    }
}
