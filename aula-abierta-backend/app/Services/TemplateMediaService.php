<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateMaterial;
use App\Models\TemplateWeek;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class TemplateMediaService
{
    public function __construct(private readonly PrivateStorageService $storage) {}

    public function storeCover(Template $template, UploadedFile $file): Template
    {
        return DB::transaction(function () use ($template, $file) {
            if ($template->cover_image_path) {
                $this->storage->disk()->delete($template->cover_image_path);
            }

            $path = $file->store("templates/{$template->id}/cover", [
                'disk' => $this->storage->diskName(),
                'visibility' => 'private',
            ]);
            $template->update(['cover_image_path' => $path, 'cover_image_mime' => $file->getMimeType()]);

            return $template->fresh();
        });
    }

    public function storeMaterial(TemplateWeek $week, array $data, UploadedFile $file): TemplateMaterial
    {
        $path = $file->store("templates/{$week->template_id}/week-{$week->number}", [
            'disk' => $this->storage->diskName(),
            'visibility' => 'private',
        ]);

        return $week->materials()->create([
            'title' => $data['title'],
            'type' => $data['type'],
            'is_protected' => $data['is_protected'] ?? true,
            'storage_path' => $path,
        ]);
    }
}
