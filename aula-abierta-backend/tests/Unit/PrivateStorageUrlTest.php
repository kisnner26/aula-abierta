<?php

namespace Tests\Unit;

use App\Services\PrivateStorageService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PrivateStorageUrlTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'filesystems.protected_disk' => 'r2',
            'filesystems.disks.r2' => [
                'driver' => 's3',
                'key' => 'development-key',
                'secret' => 'development-secret',
                'region' => 'us-east-1',
                'bucket' => 'aula-abierta',
                'endpoint' => 'http://minio:9000',
                'use_path_style_endpoint' => true,
            ],
        ]);
        Storage::forgetDisk('r2');
    }

    public function test_browser_urls_use_the_public_endpoint_without_changing_the_storage_endpoint(): void
    {
        config(['filesystems.disks.r2.public_endpoint' => 'http://127.0.0.1:19000']);

        $storage = app(PrivateStorageService::class);
        $url = $storage->temporaryUrl('covers/lesson.png');

        $this->assertStringStartsWith('http://127.0.0.1:19000/aula-abierta/covers/lesson.png?', $url);
        parse_str(parse_url($url, PHP_URL_QUERY), $query);
        $this->assertNotEmpty($query['X-Amz-Signature']);
        $this->assertSame('300', $query['X-Amz-Expires']);
        $this->assertStringStartsWith('http://minio:9000/', $storage->disk()->url('covers/lesson.png'));
    }

    public function test_without_a_public_endpoint_urls_keep_the_existing_s3_endpoint(): void
    {
        $url = app(PrivateStorageService::class)->temporaryUrl('evidence/submission.pdf');

        $this->assertStringStartsWith('http://minio:9000/aula-abierta/evidence/submission.pdf?', $url);
    }
}
