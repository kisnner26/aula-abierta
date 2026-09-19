<?php

return [
    'version' => 'AAFP1',
    'key' => env('CONTENT_FINGERPRINT_KEY') ?: env('APP_KEY'),
    'ttl_seconds' => (int) env('CONTENT_FINGERPRINT_TTL', 300),
    'pixel_amplitude' => (int) env('CONTENT_FINGERPRINT_PIXEL_AMPLITUDE', 2),
    'raster_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/webp',
    ],
];
