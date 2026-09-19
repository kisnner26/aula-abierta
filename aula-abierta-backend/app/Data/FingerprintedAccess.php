<?php

namespace App\Data;

readonly class FingerprintedAccess
{
    public function __construct(
        public string $url,
        public int $expiresIn,
        public string $mode,
        public string $version,
    ) {}
}
