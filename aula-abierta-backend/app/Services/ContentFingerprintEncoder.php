<?php

namespace App\Services;

use App\Data\EncodedContent;
use RuntimeException;

class ContentFingerprintEncoder
{
    public function supports(string $mimeType): bool
    {
        return in_array($mimeType, config('content_fingerprint.raster_mime_types', []), true)
            || array_key_exists($mimeType, $this->binaryMimeTypes())
            || $mimeType === 'application/pdf';
    }

    public function encode(string $bytes, string $mimeType, string $metadata, string $pixelTag): EncodedContent
    {
        if (! in_array($mimeType, config('content_fingerprint.raster_mime_types', []), true)) {
            return $this->encodeBinary($bytes, $mimeType, $metadata);
        }

        $image = @imagecreatefromstring($bytes);
        if ($image === false) {
            throw new RuntimeException('The protected image could not be decoded for fingerprinting.');
        }

        try {
            imagealphablending($image, false);
            imagesavealpha($image, true);
            $this->embedPixelSignal($image, $pixelTag);
            $encoded = $this->render($image, $mimeType);
        } finally {
            imagedestroy($image);
        }

        return match ($mimeType) {
            'image/jpeg' => new EncodedContent($this->addJpegComment($encoded, $metadata), $mimeType, 'jpg', 'pixels+metadata'),
            'image/png' => new EncodedContent($this->addPngTextChunk($encoded, $metadata), $mimeType, 'png', 'pixels+metadata'),
            'image/webp' => new EncodedContent($this->addWebpFingerprintChunk($encoded, $metadata), $mimeType, 'webp', 'pixels+metadata'),
            default => $this->encodeBinary($encoded, $mimeType, $metadata),
        };
    }

    private function embedPixelSignal(\GdImage $image, string $pixelTag): void
    {
        $width = imagesx($image);
        $height = imagesy($image);
        if ($width < 32 || $height < 32) {
            return;
        }

        $tagBytes = hex2bin($pixelTag);
        if ($tagBytes === false || strlen($tagBytes) !== 8) {
            throw new RuntimeException('The pixel fingerprint tag is invalid.');
        }

        $bits = [];
        foreach (unpack('C*', $tagBytes) as $byte) {
            for ($bit = 7; $bit >= 0; $bit--) {
                $bits[] = ($byte >> $bit) & 1;
            }
        }

        $blockSize = 8;
        $amplitude = max(1, min(3, (int) config('content_fingerprint.pixel_amplitude', 2)));
        $columns = intdiv($width, $blockSize);
        $rows = intdiv($height, $blockSize);

        for ($blockY = 0; $blockY < $rows; $blockY++) {
            for ($blockX = 0; $blockX < $columns; $blockX++) {
                $bitValue = $bits[(($blockY * $columns) + $blockX) % count($bits)];
                $direction = $bitValue === 1 ? 1 : -1;

                for ($offsetY = 1; $offsetY < $blockSize; $offsetY += 2) {
                    for ($offsetX = 1; $offsetX < $blockSize; $offsetX += 2) {
                        $x = ($blockX * $blockSize) + $offsetX;
                        $y = ($blockY * $blockSize) + $offsetY;
                        $color = imagecolorat($image, $x, $y);
                        $alpha = ($color >> 24) & 0x7F;
                        $red = ($color >> 16) & 0xFF;
                        $green = ($color >> 8) & 0xFF;
                        $blue = $color & 0xFF;
                        $carrier = (($offsetX + $offsetY + $blockX + $blockY) % 4 < 2) ? 1 : -1;
                        $blue = max(0, min(255, $blue + ($direction * $carrier * $amplitude)));
                        imagesetpixel($image, $x, $y, ($alpha << 24) | ($red << 16) | ($green << 8) | $blue);
                    }
                }
            }
        }
    }

    private function render(\GdImage $image, string $mimeType): string
    {
        ob_start();
        $success = match ($mimeType) {
            'image/jpeg' => imagejpeg($image, null, 95),
            'image/png' => imagepng($image, null, 6),
            'image/webp' => imagewebp($image, null, 95),
            default => false,
        };
        $bytes = ob_get_clean();

        if (! $success || $bytes === false) {
            throw new RuntimeException('The fingerprinted image could not be encoded.');
        }

        return $bytes;
    }

    private function encodeBinary(string $bytes, string $mimeType, string $metadata): EncodedContent
    {
        if ($mimeType === 'application/pdf') {
            return new EncodedContent($bytes."\n% CONTENT-FINGERPRINT {$metadata}\n", $mimeType, 'pdf', 'metadata');
        }

        $officeExtensions = $this->binaryMimeTypes();

        if (isset($officeExtensions[$mimeType])) {
            return new EncodedContent($this->addZipComment($bytes, $metadata), $mimeType, $officeExtensions[$mimeType], 'metadata');
        }

        throw new RuntimeException("Protected content type {$mimeType} is not fingerprintable and will not be served.");
    }

    /**
     * @return array<string, string>
     */
    private function binaryMimeTypes(): array
    {
        return [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
        ];
    }

    public function metadataFingerprintId(string $bytes): ?string
    {
        return preg_match('/AAFP1\.([0-9a-f-]{36})\.[0-9a-f]{16}\.[0-9a-f]{64}/i', $bytes, $matches) === 1
            ? strtolower($matches[1])
            : null;
    }

    public function detectionScore(string $bytes, string $pixelTag): float
    {
        $image = @imagecreatefromstring($bytes);
        if ($image === false) {
            return 0.0;
        }

        try {
            $width = imagesx($image);
            $height = imagesy($image);
            if ($width < 32 || $height < 32) {
                return 0.0;
            }

            $tagBytes = hex2bin($pixelTag);
            if ($tagBytes === false || strlen($tagBytes) !== 8) {
                return 0.0;
            }

            $bits = [];
            foreach (unpack('C*', $tagBytes) as $byte) {
                for ($bit = 7; $bit >= 0; $bit--) {
                    $bits[] = ($byte >> $bit) & 1;
                }
            }

            $blockSize = 8;
            $columns = intdiv($width, $blockSize);
            $rows = intdiv($height, $blockSize);
            $correlation = 0;
            $samples = 0;

            for ($blockY = 0; $blockY < $rows; $blockY++) {
                for ($blockX = 0; $blockX < $columns; $blockX++) {
                    $direction = $bits[(($blockY * $columns) + $blockX) % count($bits)] === 1 ? 1 : -1;
                    for ($offsetY = 1; $offsetY < $blockSize; $offsetY += 2) {
                        for ($offsetX = 1; $offsetX < $blockSize; $offsetX += 2) {
                            $color = imagecolorat($image, ($blockX * $blockSize) + $offsetX, ($blockY * $blockSize) + $offsetY);
                            $blue = $color & 0xFF;
                            $carrier = (($offsetX + $offsetY + $blockX + $blockY) % 4 < 2) ? 1 : -1;
                            $correlation += $blue * $direction * $carrier;
                            $samples++;
                        }
                    }
                }
            }

            return $samples > 0 ? $correlation / $samples : 0.0;
        } finally {
            imagedestroy($image);
        }
    }

    private function addZipComment(string $bytes, string $metadata): string
    {
        $eocd = strrpos($bytes, "PK\x05\x06");
        if ($eocd === false || strlen($bytes) < $eocd + 22) {
            throw new RuntimeException('The Office document fingerprint metadata could not be inserted.');
        }

        $commentLength = unpack('v', substr($bytes, $eocd + 20, 2))[1];
        $commentStart = $eocd + 22;
        $existingComment = substr($bytes, $commentStart, $commentLength);
        $comment = $existingComment."ContentFingerprint={$metadata}";
        if (strlen($comment) > 65535) {
            throw new RuntimeException('The Office document fingerprint metadata is too large.');
        }

        return substr($bytes, 0, $eocd + 20).pack('v', strlen($comment)).$comment;
    }

    private function addJpegComment(string $bytes, string $metadata): string
    {
        $comment = 'ContentFingerprint='.$metadata;
        if (! str_starts_with($bytes, "\xFF\xD8") || strlen($comment) > 65530) {
            throw new RuntimeException('The JPEG fingerprint metadata could not be inserted.');
        }

        return substr($bytes, 0, 2)."\xFF\xFE".pack('n', strlen($comment) + 2).$comment.substr($bytes, 2);
    }

    private function addPngTextChunk(string $bytes, string $metadata): string
    {
        $data = "ContentFingerprint\0".$metadata;
        $type = 'tEXt';
        $chunk = pack('N', strlen($data)).$type.$data.pack('N', hexdec(hash('crc32b', $type.$data)));
        $iendPosition = strrpos($bytes, 'IEND');
        if ($iendPosition === false || $iendPosition < 4) {
            throw new RuntimeException('The PNG fingerprint metadata could not be inserted.');
        }

        $chunkStart = $iendPosition - 4;

        return substr($bytes, 0, $chunkStart).$chunk.substr($bytes, $chunkStart);
    }

    private function addWebpFingerprintChunk(string $bytes, string $metadata): string
    {
        if (! str_starts_with($bytes, 'RIFF') || substr($bytes, 8, 4) !== 'WEBP') {
            throw new RuntimeException('The WebP fingerprint metadata could not be inserted.');
        }

        $padding = strlen($metadata) % 2 === 1 ? "\0" : '';
        $chunk = 'LKFP'.pack('V', strlen($metadata)).$metadata.$padding;
        $newSize = (strlen($bytes) - 8) + strlen($chunk);

        return substr($bytes, 0, 4).pack('V', $newSize).substr($bytes, 8).$chunk;
    }
}
