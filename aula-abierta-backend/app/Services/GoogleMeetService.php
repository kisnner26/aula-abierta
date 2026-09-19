<?php

namespace App\Services;

use App\Models\Classroom;
use App\Models\Week;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class GoogleMeetService
{
    public function schedule(Classroom $classroom, Week $week, string $startsAt): array
    {
        $credentials = $this->credentials();
        $accessToken = $this->accessToken($credentials);
        $start = now()->parse($startsAt)->setTimezone(config('google.timezone'));
        $end = $start->copy()->addMinutes(config('google.session_duration_minutes'));
        $requestId = "aula-abierta-{$classroom->id}-week-{$week->number}-".now()->timestamp;

        $payload = [
            'summary' => "Aula Abierta · {$classroom->name} · Week {$week->number}",
            'description' => $week->title,
            'start' => ['dateTime' => $start->toIso8601String(), 'timeZone' => config('google.timezone')],
            'end' => ['dateTime' => $end->toIso8601String(), 'timeZone' => config('google.timezone')],
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => $requestId,
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                ],
            ],
        ];

        $calendarId = rawurlencode((string) config('google.calendar_id'));
        $response = Http::withToken($accessToken)
            ->acceptJson()
            ->timeout(12)
            ->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events?conferenceDataVersion=1", $payload);

        if ($response->failed()) {
            throw ValidationException::withMessages([
                'session_scheduled_at' => ['Google Calendar could not create the class. Verify the service account and shared calendar.'],
            ]);
        }

        $event = $response->json();

        return [
            'meet_link' => $event['hangoutLink'] ?? null,
            'google_event_id' => $event['id'] ?? null,
            'google_calendar_url' => $event['htmlLink'] ?? null,
        ];
    }

    private function credentials(): array
    {
        $value = config('google.service_account_json');
        $json = is_string($value) && is_file($value) ? file_get_contents($value) : $value;
        $credentials = is_string($json) ? json_decode($json, true) : null;

        if (! is_array($credentials) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
            throw ValidationException::withMessages([
                'session_scheduled_at' => ['Google Meet is not configured yet. Add the service account credentials on the server.'],
            ]);
        }

        return $credentials;
    }

    private function accessToken(array $credentials): string
    {
        $cacheKey = 'google-meet-token:'.sha1($credentials['client_email']);

        return Cache::remember($cacheKey, now()->addMinutes(50), function () use ($credentials) {
            $now = time();
            $header = $this->base64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims = $this->base64Url(json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/calendar.events',
                'aud' => $credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ]));
            $unsigned = "{$header}.{$claims}";
            openssl_sign($unsigned, $signature, $credentials['private_key'], OPENSSL_ALGO_SHA256);
            $assertion = "{$unsigned}.{$this->base64Url($signature)}";

            $response = Http::asForm()->timeout(10)->post(
                $credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token',
                ['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $assertion],
            );

            if ($response->failed() || ! $response->json('access_token')) {
                throw ValidationException::withMessages(['session_scheduled_at' => ['Google authentication failed.']]);
            }

            return (string) $response->json('access_token');
        });
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
