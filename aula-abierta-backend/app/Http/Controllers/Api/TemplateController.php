<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Template\UploadTemplateCoverRequest;
use App\Http\Requests\Template\UploadTemplateMaterialRequest;
use App\Http\Resources\ClassroomResource;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use App\Models\TemplateWeek;
use App\Services\ClassroomService;
use App\Services\PrivateStorageService;
use App\Services\TemplateMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function __construct(
        private readonly ClassroomService $classroomService,
        private readonly TemplateMediaService $media,
        private readonly PrivateStorageService $storage,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Template::class);
        $templates = Template::with('level.program')->withCount(['classrooms', 'weeks'])->latest()->get();

        return response()->json(['data' => TemplateResource::collection($templates)]);
    }

    public function show(Template $template): JsonResponse
    {
        $this->authorize('view', $template);

        return response()->json(['data' => new TemplateResource($template->load([
            'level.program',
            'weeks.materials',
            'weeks.courseTasks.rubric.criteria',
        ])->loadCount(['classrooms', 'weeks']))]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Template::class);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
        ]);
        $template = Template::create([...$data, 'created_by' => $request->user()->id]);

        return response()->json(['data' => new TemplateResource($template->load('level.program')->loadCount(['classrooms', 'weeks']))], 201);
    }

    public function storeWeek(Request $request, Template $template): JsonResponse
    {
        $this->authorize('update', $template);

        $data = $request->validate([
            'number' => ['required', 'integer', 'min:1', 'max:52'],
            'title' => ['required', 'string', 'max:200'],
            'vocabulary' => ['nullable', 'string'],
            'materials' => ['array'],
            'materials.*.title' => ['required_with:materials', 'string', 'max:200'],
            'materials.*.type' => ['required_with:materials', 'string', 'in:slide,link,vocabulary,audio,document'],
            'materials.*.is_protected' => ['boolean'],
            'materials.*.external_url' => ['nullable', 'url'],
            'tasks' => ['array'],
            'tasks.*.title' => ['required_with:tasks', 'string', 'max:200'],
            'tasks.*.description' => ['required_with:tasks', 'string'],
            'tasks.*.deadline_offset_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $week = $template->weeks()->create([
            'number' => $data['number'],
            'title' => $data['title'],
            'vocabulary' => $data['vocabulary'] ?? null,
        ]);

        foreach ($data['materials'] ?? [] as $material) {
            $isProtected = $material['is_protected'] ?? true;

            $week->materials()->create([
                'title' => $material['title'],
                'type' => $material['type'],
                'is_protected' => $isProtected,
                'external_url' => $isProtected ? null : ($material['external_url'] ?? null),
            ]);
        }

        foreach ($data['tasks'] ?? [] as $taskData) {
            $task = $week->courseTasks()->create([
                'title' => $taskData['title'],
                'description' => $taskData['description'],
                'deadline_offset_days' => $taskData['deadline_offset_days'] ?? (7 * $week->number),
                'is_open' => true,
            ]);

            $rubric = $task->rubric()->create(['title' => 'Learning Rubric']);
            $rubric->criteria()->createMany([
                ['name' => 'Vocabulary', 'description' => 'Uses the target words clearly.', 'max_score' => 10, 'order' => 1],
                ['name' => 'Accuracy', 'description' => 'Completes the task with correct language.', 'max_score' => 10, 'order' => 2],
                ['name' => 'Creativity', 'description' => 'Shows original thinking and effort.', 'max_score' => 10, 'order' => 3],
            ]);
        }

        activity()->causedBy($request->user())->performedOn($template)->withProperties([
            'template_week_id' => $week->id,
            'week_number' => $week->number,
        ])->log('template_week_created');

        return response()->json(['data' => new TemplateResource($template->fresh()->load([
            'level.program',
            'weeks.materials',
            'weeks.courseTasks.rubric.criteria',
        ])->loadCount(['classrooms', 'weeks']))], 201);
    }

    public function updateWeek(Request $request, TemplateWeek $templateWeek): JsonResponse
    {
        $template = $templateWeek->template;
        $this->authorize('update', $template);

        $data = $request->validate([
            'number' => ['sometimes', 'integer', 'min:1', 'max:52'],
            'title' => ['sometimes', 'string', 'max:200'],
            'vocabulary' => ['nullable', 'string'],
        ]);

        $templateWeek->update($data);

        return response()->json(['data' => new TemplateResource($template->fresh()->load([
            'level.program',
            'weeks.materials',
            'weeks.courseTasks.rubric.criteria',
        ])->loadCount(['classrooms', 'weeks']))]);
    }

    public function freeze(Template $template): JsonResponse
    {
        $this->authorize('freeze', $template);
        $template->update(['is_frozen' => ! $template->is_frozen]);

        return response()->json(['data' => new TemplateResource($template->fresh())]);
    }

    public function destroy(Request $request, Template $template): JsonResponse
    {
        $this->authorize('delete', $template);

        // classrooms.template_id is restrictOnDelete — block instead of failing at the DB.
        if ($template->classrooms()->exists()) {
            return response()->json([
                'message' => 'This template is used by one or more classrooms and cannot be deleted. Remove or reassign those classrooms first.',
            ], 422);
        }

        // Best-effort cleanup of private files; the template content rows cascade-delete.
        $disk = $this->storage->disk();
        $paths = $template->weeks()->with('materials')->get()
            ->flatMap(fn ($week) => $week->materials->pluck('storage_path'))
            ->filter()
            ->all();
        if ($template->cover_image_path) {
            $paths[] = $template->cover_image_path;
        }
        foreach ($paths as $path) {
            try {
                $disk->delete($path);
            } catch (\Throwable) {
                // ignore missing files
            }
        }

        $title = $template->title;
        $template->delete();

        activity()->causedBy($request->user())->withProperties(['template_title' => $title])->log('template_deleted');

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function clone(Request $request, Template $template): JsonResponse
    {
        $this->authorize('clone', $template);
        $data = $request->validate([
            'classroom_name' => ['required', 'string', 'max:200'],
            'academic_period' => ['required', 'string', 'max:20'],
            'trainer_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);
        $classroom = $this->classroomService->cloneFromTemplate($template, $data);

        return response()->json(['data' => new ClassroomResource($classroom)], 201);
    }

    public function uploadCover(UploadTemplateCoverRequest $request, Template $template): JsonResponse
    {
        $this->authorize('update', $template);
        $template = $this->media->storeCover($template, $request->file('cover'));

        activity()->causedBy($request->user())->performedOn($template)->log('template_cover_uploaded');

        return response()->json(['data' => new TemplateResource($template->load('level.program')->loadCount(['classrooms', 'weeks']))]);
    }

    public function uploadMaterial(UploadTemplateMaterialRequest $request, TemplateWeek $templateWeek): JsonResponse
    {
        $template = $templateWeek->template;
        $this->authorize('update', $template);
        abort_if($template->is_frozen, 422, 'Unfreeze the template before uploading materials.');

        $material = $this->media->storeMaterial($templateWeek, $request->validated(), $request->file('file'));
        activity()->causedBy($request->user())->performedOn($template)->withProperties([
            'template_week_id' => $templateWeek->id,
            'template_material_id' => $material->id,
        ])->log('template_material_uploaded');

        return response()->json(['data' => new TemplateResource($template->fresh()->load([
            'level.program', 'weeks.materials', 'weeks.courseTasks.rubric.criteria',
        ])->loadCount(['classrooms', 'weeks']))], 201);
    }
}
