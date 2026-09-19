<?php

namespace Tests\Feature;

use App\Models\Classroom;
use App\Models\ContentFingerprint;
use App\Models\Level;
use App\Models\Material;
use App\Models\Program;
use App\Models\Template;
use App\Models\User;
use App\Models\Week;
use App\Services\ContentFingerprintEncoder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ContentFingerprintAccessTest extends TestCase
{
    use DatabaseTransactions;

    public function test_protected_stored_material_is_served_with_forensic_fingerprint_and_audit_lookup(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD is required for image fingerprinting.');
        }

        Storage::fake('r2');
        Storage::fake('local');
        Role::findOrCreate('super_admin', 'web');

        $superAdmin = User::create([
            'sis_id' => 'SA-FP-0001',
            'name' => 'Fingerprint Admin',
            'password' => 'secret-password',
        ]);
        $superAdmin->assignRole('super_admin');

        $material = $this->createProtectedMaterial('materials/week-1/mission.png');
        Storage::disk('r2')->put($material->storage_path, $this->pngFixture());

        $this->actingAs($superAdmin, 'sanctum');

        $access = $this->getJson("/api/v1/materials/{$material->id}/signed-url")
            ->assertOk()
            ->assertJsonPath('data.fingerprint_mode', 'forensic')
            ->json('data');

        $fingerprint = ContentFingerprint::query()
            ->where('user_reference', 'SA-FP-0001')
            ->firstOrFail();
        $this->assertSame('SA-FP-0001', $fingerprint->user_reference);
        $this->assertSame('super_admin', $fingerprint->role);
        $this->assertSame('Mission Poster #'.$material->id, $fingerprint->material_reference);

        $response = $this->get($this->pathWithQuery($access['url']));
        $response->assertOk();
        $response->assertHeader('X-Content-Fingerprint-Version', 'AAFP1');

        $fingerprint->refresh();
        $encoder = app(ContentFingerprintEncoder::class);
        $this->assertSame(
            $fingerprint->id,
            $encoder->metadataFingerprintId(Storage::disk('local')->get($fingerprint->storage_path)),
        );

        $this->getJson("/api/v1/admin/content-fingerprints/{$fingerprint->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $fingerprint->id)
            ->assertJsonPath('data.user_reference', 'SA-FP-0001')
            ->assertJsonPath('data.role', 'super_admin');
    }

    public function test_trainer_cannot_request_protected_material_access(): void
    {
        Storage::fake('r2');
        Role::findOrCreate('teacher', 'web');

        $trainer = User::create([
            'sis_id' => 'TR-FP-0001',
            'name' => 'Fingerprint Trainer',
            'password' => 'secret-password',
        ]);
        $trainer->assignRole('teacher');

        $material = $this->createProtectedMaterial('materials/week-1/trainer-blocked.png');
        Storage::disk('r2')->put($material->storage_path, $this->pngFixture());

        $this->actingAs($trainer, 'sanctum');

        $this->getJson("/api/v1/materials/{$material->id}/signed-url")
            ->assertForbidden();
    }

    private function createProtectedMaterial(string $storagePath): Material
    {
        $coordinator = User::create([
            'sis_id' => 'CO-FP-0001',
            'name' => 'Fingerprint Coordinator',
            'password' => 'secret-password',
        ]);
        $program = Program::create(['name' => 'BEFK', 'code' => 'BEFK-FP']);
        $level = Level::create(['program_id' => $program->id, 'name' => 'Level 1', 'order' => 1]);
        $template = Template::create([
            'level_id' => $level->id,
            'created_by' => $coordinator->id,
            'title' => 'Level 1 Template',
            'is_frozen' => true,
        ]);
        $classroom = Classroom::create([
            'template_id' => $template->id,
            'level_id' => $level->id,
            'trainer_id' => $coordinator->id,
            'name' => 'BEFK Level 1',
            'academic_period' => '2026',
        ]);
        $week = Week::create(['classroom_id' => $classroom->id, 'number' => 1, 'title' => 'Week 1']);

        return Material::create([
            'week_id' => $week->id,
            'title' => 'Mission Poster',
            'type' => 'image',
            'is_protected' => true,
            'storage_path' => $storagePath,
        ]);
    }

    private function pathWithQuery(string $url): string
    {
        $path = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);

        return $path.($query ? '?'.$query : '');
    }

    private function pngFixture(): string
    {
        $image = imagecreatetruecolor(128, 128);
        $background = imagecolorallocate($image, 250, 246, 231);
        $blue = imagecolorallocate($image, 29, 149, 251);
        $red = imagecolorallocate($image, 211, 26, 42);
        imagefilledrectangle($image, 0, 0, 127, 127, $background);
        imagefilledellipse($image, 64, 64, 72, 72, $red);
        imagefilledrectangle($image, 18, 18, 110, 26, $blue);

        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        imagedestroy($image);

        $this->assertIsString($bytes);

        return $bytes;
    }
}
