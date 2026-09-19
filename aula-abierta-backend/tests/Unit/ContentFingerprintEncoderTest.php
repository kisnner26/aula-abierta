<?php

namespace Tests\Unit;

use App\Services\ContentFingerprintEncoder;
use Tests\TestCase;

class ContentFingerprintEncoderTest extends TestCase
{
    public function test_it_embeds_metadata_and_pixel_signal_in_png_images(): void
    {
        if (! function_exists('imagecreatetruecolor')) {
            $this->markTestSkipped('GD is required for image fingerprinting.');
        }

        $encoder = app(ContentFingerprintEncoder::class);
        $fingerprintId = '11111111-2222-3333-4444-555555555555';
        $pixelTag = 'a1b2c3d4e5f60718';
        $metadata = 'AAFP1.'.$fingerprintId.'.'.$pixelTag.'.'.str_repeat('a', 64);

        $encoded = $encoder->encode($this->pngFixture(), 'image/png', $metadata, $pixelTag);

        $this->assertSame('image/png', $encoded->mimeType);
        $this->assertSame('png', $encoded->extension);
        $this->assertSame('pixels+metadata', $encoded->mode);
        $this->assertSame($fingerprintId, $encoder->metadataFingerprintId($encoded->bytes));
        $this->assertGreaterThan(
            $encoder->detectionScore($encoded->bytes, '0011223344556677') + 0.5,
            $encoder->detectionScore($encoded->bytes, $pixelTag),
        );
    }

    public function test_it_embeds_metadata_in_pdf_exports(): void
    {
        $encoder = app(ContentFingerprintEncoder::class);
        $metadata = 'AAFP1.11111111-2222-3333-4444-555555555555.a1b2c3d4e5f60718.'.str_repeat('b', 64);

        $encoded = $encoder->encode("%PDF-1.4\n% test\n", 'application/pdf', $metadata, 'a1b2c3d4e5f60718');

        $this->assertSame('application/pdf', $encoded->mimeType);
        $this->assertSame('metadata', $encoded->mode);
        $this->assertStringContainsString('CONTENT-FINGERPRINT '.$metadata, $encoded->bytes);
    }

    private function pngFixture(): string
    {
        $image = imagecreatetruecolor(96, 96);
        $background = imagecolorallocate($image, 120, 140, 180);
        imagefilledrectangle($image, 0, 0, 95, 95, $background);

        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        imagedestroy($image);

        $this->assertIsString($bytes);

        return $bytes;
    }
}
