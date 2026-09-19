<?php

namespace App\Services;

use App\Data\FingerprintedAccess;
use App\Models\ContentFingerprint;
use App\Models\Material;
use App\Models\User;
use App\Repositories\Contracts\ContentFingerprintRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ContentFingerprintService
{
    public function __construct(
        private readonly ContentFingerprintRepositoryInterface $fingerprints,
        private readonly ContentFingerprintEncoder $encoder,
    ) {}

    public function issue(Material $material, User $user, Request $request): FingerprintedAccess
    {
        if ($material->external_url) {
            if ($material->is_protected) {
                throw ValidationException::withMessages([
                    'material' => ['Protected external content cannot guarantee forensic fingerprinting. Upload it to protected storage first.'],
                ]);
            }

            return new FingerprintedAccess($material->external_url, 0, 'external', $this->version());
        }

        if (! $material->storage_path) {
            throw ValidationException::withMessages(['material' => ['This material does not contain a stored file.']]);
        }

        $disk = Storage::disk(config('filesystems.protected_disk', 'r2'));
        $mimeType = $disk->mimeType($material->storage_path) ?: 'application/octet-stream';
        if (! $this->encoder->supports($mimeType)) {
            throw ValidationException::withMessages([
                'material' => ['This protected content type cannot be fingerprinted and will not be served.'],
            ]);
        }

        $ttl = max(60, (int) config('content_fingerprint.ttl_seconds', 300));
        $expiresAt = now()->addSeconds($ttl);
        $id = (string) Str::uuid();
        $role = $user->getRoleNames()->first() ?? 'unknown';
        $sessionHash = $this->sessionHash($user, $request);
        $canonical = implode('|', [$id, $user->id, $role, $sessionHash, $material->id, now()->toISOString()]);
        $signature = hash_hmac('sha256', $canonical, $this->key());
        $pixelTag = substr(hash_hmac('sha256', 'pixels|'.$canonical, $this->key()), 0, 16);
        $signedPayload = implode('.', [$this->version(), $id, $pixelTag, $signature]);

        $fingerprint = $this->fingerprints->create([
            'id' => $id,
            'material_id' => $material->id,
            'user_id' => $user->id,
            'user_reference' => $user->sis_id ?: (string) $user->id,
            'material_reference' => trim(($material->title ?: 'Material').' #'.$material->id),
            'role' => $role,
            'session_hash' => $sessionHash,
            'pixel_tag' => $pixelTag,
            'payload_hash' => hash('sha256', $signedPayload),
            'signed_payload' => $signedPayload,
            'expires_at' => $expiresAt,
        ]);

        activity()
            ->causedBy($user)
            ->performedOn($material)
            ->withProperties([
                'fingerprint_id' => $fingerprint->id,
                'role' => $role,
                'session_hash' => $sessionHash,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'expires_at' => $expiresAt->toISOString(),
            ])
            ->log('fingerprinted_material_access_issued');

        $url = URL::temporarySignedRoute(
            'materials.fingerprinted-content',
            $expiresAt,
            ['material' => $material->id, 'fingerprint' => $fingerprint->id],
        );

        return new FingerprintedAccess($url, $ttl, 'forensic', $this->version());
    }

    public function stream(Material $material, string $fingerprintId): BinaryFileResponse
    {
        $fingerprint = $this->fingerprints->findActiveForMaterial($fingerprintId, $material);

        if (! $fingerprint->storage_path || ! Storage::disk('local')->exists($fingerprint->storage_path)) {
            $fingerprint = $this->generate($material, $fingerprint);
        }

        $this->fingerprints->markAccessed($fingerprint);
        $fingerprint->loadMissing('user');

        activity()
            ->causedBy($fingerprint->user)
            ->performedOn($material)
            ->withProperties([
                'fingerprint_id' => $fingerprint->id,
                'role' => $fingerprint->role,
                'session_hash' => $fingerprint->session_hash,
                'mime_type' => $fingerprint->mime_type,
            ])
            ->log('fingerprinted_material_rendered');

        return response()->file(Storage::disk('local')->path($fingerprint->storage_path), [
            'Content-Type' => $fingerprint->mime_type ?? 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.basename($fingerprint->storage_path).'"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Fingerprint-Version' => $this->version(),
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function generate(Material $material, ContentFingerprint $fingerprint): ContentFingerprint
    {
        $disk = Storage::disk(config('filesystems.protected_disk', 'r2'));
        $bytes = $disk->get($material->storage_path);
        $mimeType = $disk->mimeType($material->storage_path) ?: 'application/octet-stream';
        $encoded = $this->encoder->encode($bytes, $mimeType, $fingerprint->signed_payload, $fingerprint->pixel_tag);
        $storagePath = 'fingerprints/'.$fingerprint->expires_at->format('Y-m-d').'/'.$fingerprint->id.'.'.$encoded->extension;

        if (! Storage::disk('local')->put($storagePath, $encoded->bytes)) {
            throw new RuntimeException('The fingerprinted material could not be cached securely.');
        }

        return $this->fingerprints->markGenerated($fingerprint, $storagePath, $encoded->mimeType);
    }

    private function sessionHash(User $user, Request $request): string
    {
        $token = $user->currentAccessToken();
        $tokenId = $token && method_exists($token, 'getKey')
            ? (string) $token->getKey()
            : 'transient-token';
        $context = implode('|', [$tokenId, $request->ip(), $request->userAgent()]);

        return hash_hmac('sha256', $context, $this->key());
    }

    private function key(): string
    {
        $key = (string) config('content_fingerprint.key');
        if ($key === '') {
            throw new RuntimeException('CONTENT_FINGERPRINT_KEY or APP_KEY must be configured.');
        }

        return $key;
    }

    private function version(): string
    {
        return (string) config('content_fingerprint.version', 'AAFP1');
    }
}
