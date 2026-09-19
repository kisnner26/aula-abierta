<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SuperAdminUserManagementTest extends TestCase
{
    use DatabaseTransactions;

    private function makeUser(string $sisId, string $role): User
    {
        $user = User::create([
            'sis_id' => $sisId,
            'name' => "Mgmt Tester {$role}",
            'password' => 'secret-password',
        ]);
        $user->assignRole($role);

        return $user;
    }

    public function test_user_list_without_role_filter_returns_users(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-1', 'super_admin');
        $this->makeUser('MGMT-ST-1', 'student');
        $this->actingAs($superAdmin, 'sanctum');

        $response = $this->getJson('/api/v1/users')->assertOk();

        $this->assertGreaterThanOrEqual(2, $response->json('meta.total'));
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_user_list_can_filter_by_role_and_search(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-2', 'super_admin');
        $this->makeUser('MGMT-TE-1', 'teacher');
        $this->actingAs($superAdmin, 'sanctum');

        $byRole = $this->getJson('/api/v1/users?role=teacher')->assertOk();
        $roles = array_unique(array_column($byRole->json('data'), 'role'));
        $this->assertSame(['teacher'], $roles);

        $bySearch = $this->getJson('/api/v1/users?search=MGMT-TE-1')->assertOk();
        $this->assertSame('MGMT-TE-1', $bySearch->json('data.0.sis_id'));
    }

    public function test_super_admin_can_create_update_and_delete_users(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-3', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        $created = $this->postJson('/api/v1/users', [
            'name' => 'New Trainer',
            'sis_id' => 'MGMT-NEW-1',
            'password' => 'password123',
            'role' => 'teacher',
        ])->assertCreated()->json('data');

        $this->putJson("/api/v1/users/{$created['id']}", [
            'name' => 'Renamed Trainer',
            'role' => 'admin',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed Trainer')
            ->assertJsonPath('data.role', 'admin');

        $this->deleteJson("/api/v1/users/{$created['id']}")->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $created['id']]);
    }

    public function test_sis_id_can_be_reused_after_soft_delete(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-4', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        $student = $this->makeUser('MGMT-REUSE-1', 'student');
        $this->deleteJson("/api/v1/users/{$student->id}")->assertNoContent();

        $this->postJson('/api/v1/users', [
            'name' => 'Reborn Student',
            'sis_id' => 'MGMT-REUSE-1',
            'password' => 'password123',
            'role' => 'student',
        ])->assertCreated();
    }

    public function test_admin_cannot_create_or_manage_privileged_users(): void
    {
        $admin = $this->makeUser('MGMT-AD-1', 'admin');
        $superAdmin = $this->makeUser('MGMT-SA-5', 'super_admin');
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/users', [
            'name' => 'Sneaky Admin',
            'sis_id' => 'MGMT-EVIL-1',
            'password' => 'password123',
            'role' => 'super_admin',
        ])->assertStatus(422)->assertJsonValidationErrors('role');

        $this->putJson("/api/v1/users/{$superAdmin->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->deleteJson("/api/v1/users/{$superAdmin->id}")->assertForbidden();
    }

    public function test_users_cannot_delete_themselves_or_change_own_role(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-6', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        $this->deleteJson("/api/v1/users/{$superAdmin->id}")->assertForbidden();

        $this->putJson("/api/v1/users/{$superAdmin->id}", ['role' => 'student'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_family_role_can_be_assigned(): void
    {
        $superAdmin = $this->makeUser('MGMT-SA-7', 'super_admin');
        $this->actingAs($superAdmin, 'sanctum');

        $this->postJson('/api/v1/users', [
            'name' => 'Parent Account',
            'sis_id' => 'MGMT-FAM-1',
            'password' => 'password123',
            'role' => 'family',
        ])->assertCreated()->assertJsonPath('data.role', 'family');
    }

    public function test_student_cannot_manage_users(): void
    {
        $student = $this->makeUser('MGMT-ST-2', 'student');
        $other = $this->makeUser('MGMT-ST-3', 'student');
        $this->actingAs($student, 'sanctum');

        $this->getJson('/api/v1/users')->assertForbidden();
        $this->postJson('/api/v1/users', [
            'name' => 'X',
            'sis_id' => 'MGMT-X-1',
            'password' => 'password123',
            'role' => 'student',
        ])->assertForbidden();
        $this->putJson("/api/v1/users/{$other->id}", ['name' => 'X'])->assertForbidden();
        $this->deleteJson("/api/v1/users/{$other->id}")->assertForbidden();
    }
}
