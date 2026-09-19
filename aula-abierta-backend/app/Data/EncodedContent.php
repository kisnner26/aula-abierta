<?php

namespace App\Data;

readonly class EncodedContent
{
    public function __construct(
        public string $bytes,
        public string $mimeType,
        public string $extension,
        public string $mode,
    ) {}
}
