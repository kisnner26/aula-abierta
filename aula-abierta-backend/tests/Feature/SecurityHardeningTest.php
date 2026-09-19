<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use DatabaseTransactions;

    private function makeUser(string $sisId, string $role): User
    {
        $user = User::create([
            'sis_id' => $sisId,
            'name' => "Security Tester {$role}",
            'password' => 'secret-password',
        ]);
        $user->assignRole($role);

        return $user;
    }

    public function test_student_cannot_bulk_import_users(): void
    {
        $this->actingAs($this->makeUser('SEC-ST-1', 'student'), 'sanctum');

        $file = UploadedFile::fake()->createWithContent(
            'users.csv',
            "name,sis_id,role,password\nEve,SEC-EVIL-1,super_admin,password123\n",
        );

        $this->postJson('/api/v1/users/bulk-import', ['file' => $file])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', ['sis_id' => 'SEC-EVIL-1']);
    }

    public function test_admin_cannot_import_privileged_roles(): void
    {
        $this->actingAs($this->makeUser('SEC-AD-1', 'admin'), 'sanctum');

        $file = UploadedFile::fake()->createWithContent(
            'users.csv',
            "name,sis_id,role,password\n".
            "Eve,SEC-EVIL-2,super_admin,password123\n".
            "Mallory,SEC-EVIL-3,admin,password123\n".
            "Alice,SEC-OK-1,student,password123\n",
        );

        $response = $this->postJson('/api/v1/users/bulk-import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $this->assertCount(2, $response->json('data.errors'));
        $this->assertDatabaseMissing('users', ['sis_id' => 'SEC-EVIL-2']);
        $this->assertDatabaseMissing('users', ['sis_id' => 'SEC-EVIL-3']);
        $this->assertDatabaseHas('users', ['sis_id' => 'SEC-OK-1']);
    }

    public function test_super_admin_can_import_privileged_roles(): void
    {
        $this->actingAs($this->makeUser('SEC-SA-1', 'super_admin'), 'sanctum');

        $file = UploadedFile::fake()->createWithContent(
            'users.csv',
            "name,sis_id,role,password\nCarol,SEC-OK-2,admin,password123\n",
        );

        $this->postJson('/api/v1/users/bulk-import', ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.created', 1);

        $this->assertDatabaseHas('users', ['sis_id' => 'SEC-OK-2']);
    }

    public function test_metrics_endpoints_require_proper_roles(): void
    {
        $student = $this->makeUser('SEC-ST-2', 'student');
        $admin = $this->makeUser('SEC-AD-2', 'admin');
        $superAdmin = $this->makeUser('SEC-SA-2', 'super_admin');

        $this->actingAs($student, 'sanctum');
        $this->getJson('/api/v1/coordinator/metrics')->assertForbidden();
        $this->getJson('/api/v1/admin/metrics')->assertForbidden();

        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/v1/coordinator/metrics')->assertOk();
        $this->getJson('/api/v1/admin/metrics')->assertForbidden();

        $this->actingAs($superAdmin, 'sanctum');
        $this->getJson('/api/v1/coordinator/metrics')->assertOk();
        $this->getJson('/api/v1/admin/metrics')->assertOk();
    }

    public function test_expired_refresh_token_is_rejected_and_revoked(): void
    {
        $user = $this->makeUser('SEC-RT-1', 'student');
        $expired = $user->createToken('refresh', ['refresh'], now()->subMinute());

        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $expired->plainTextToken])
            ->assertStatus(422)
            ->assertJsonValidationErrors('refresh_token');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $expired->accessToken->id,
        ]);
    }

    public function test_valid_refresh_token_still_works(): void
    {
        $user = $this->makeUser('SEC-RT-2', 'student');
        $valid = $user->createToken('refresh', ['refresh'], now()->addDays(30));

        $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $valid->plainTextToken])
            ->assertOk()
            ->assertJsonStructure(['data' => ['access_token', 'refresh_token']]);
    }
}
