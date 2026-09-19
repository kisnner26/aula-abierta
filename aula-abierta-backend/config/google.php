<?php

return [
    'calendar_id' => env('GOOGLE_CALENDAR_ID', 'primary'),
    'service_account_json' => env('GOOGLE_SERVICE_ACCOUNT_JSON'),
    'timezone' => env('GOOGLE_CALENDAR_TIMEZONE', 'America/Example City'),
    'session_duration_minutes' => (int) env('GOOGLE_MEET_DURATION_MINUTES', 60),
];
