<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClassroomResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\WeekResource;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Template;
use App\Services\ClassroomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassroomController extends Controller
{
    public function __construct(private readonly ClassroomService $classroomService) {}

    // Coordinator / Admin: all classrooms
    public function index(): JsonResponse
    {
        $classrooms = Classroom::with('level.program')->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->latest()
            ->get();

        return response()->json(['data' => ClassroomResource::collection($classrooms)]);
    }

    public function show(Classroom $classroom): JsonResponse
    {
        $classroom->load('level.program')->loadCount(['enrollments' => fn ($q) => $q->where('is_active', true)]);

        return response()->json(['data' => new ClassroomResource($classroom)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'template_id' => ['required', 'integer', 'exists:templates,id'],
            'name' => ['required', 'string', 'max:200'],
            'academic_period' => ['required', 'string', 'max:20'],
            'trainer_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $template = Template::findOrFail($data['template_id']);
        $classroom = $this->classroomService->cloneFromTemplate($template, [
            'classroom_name' => $data['name'],
            'academic_period' => $data['academic_period'],
            'trainer_id' => $data['trainer_id'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return response()->json(['data' => new ClassroomResource($classroom)], 201);
    }

    public function update(Request $request, Classroom $classroom): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'academic_period' => ['sometimes', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
        ]);

        $classroom->update($data);

        return response()->json(['data' => new ClassroomResource($classroom->fresh())]);
    }

    public function updateTheme(Request $request, Classroom $classroom): JsonResponse
    {
        $user = $request->user();
        $canCustomize = $user->hasAnyRole(['admin', 'super_admin'])
            || ($user->hasRole('teacher') && $classroom->trainer_id === $user->id);

        abort_unless($canCustomize, 403, 'You cannot personalize this classroom.');

        $data = $request->validate([
            'theme_primary_color' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'theme_accent_color' => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'hero_background' => ['sometimes', 'string', 'in:mascot-studio,reading-cove,coding-lab,science-wall,sky-classroom'],
            'welcome_message' => ['nullable', 'string', 'max:180'],
        ]);

        $classroom->update($data);

        activity()->causedBy($user)->performedOn($classroom)->withProperties([
            'theme_primary_color' => $classroom->theme_primary_color,
            'theme_accent_color' => $classroom->theme_accent_color,
            'hero_background' => $classroom->hero_background,
        ])->log('classroom_theme_updated');

        return response()->json(['data' => new ClassroomResource($classroom->fresh('level.program'))]);
    }

    public function assignTrainer(Request $request, Classroom $classroom): JsonResponse
    {
        $request->validate(['trainer_id' => ['required', 'integer', 'exists:users,id']]);

        $classroom = $this->classroomService->assignTrainer($classroom, $request->trainer_id);

        return response()->json(['data' => new ClassroomResource($classroom)]);
    }

    public function weeks(Classroom $classroom): JsonResponse
    {
        $this->authorizeClassroomAccess($classroom);

        $weeks = $classroom->weeks()->with(['materials', 'courseTasks.rubric.criteria'])->get();

        return response()->json(['data' => WeekResource::collection($weeks)]);
    }

    public function students(Classroom $classroom): JsonResponse
    {
        $this->authorizeClassroomAccess($classroom);

        $students = $classroom->enrollments()
            ->where('is_active', true)
            ->with('student')
            ->get()
            ->pluck('student');

        return response()->json(['data' => UserResource::collection($students)]);
    }

    public function attendance(Classroom $classroom): JsonResponse
    {
        $this->authorizeClassroomAccess($classroom);

        $attendance = Attendance::where('classroom_id', $classroom->id)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json(['data' => $attendance]);
    }

    // Student-scoped
    public function myClassrooms(Request $request): JsonResponse
    {
        $classrooms = Classroom::whereHas('enrollments', fn ($q) => $q->where('student_id', $request->user()->id)->where('is_active', true)
        )
            ->with('level.program')
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->where('is_active', true)
            ->get();

        return response()->json(['data' => ClassroomResource::collection($classrooms)]);
    }

    public function myClassroom(Request $request, int $id): JsonResponse
    {
        $classroom = Classroom::whereHas('enrollments', fn ($q) => $q->where('student_id', $request->user()->id)->where('is_active', true)
        )
            ->with('level.program')
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->findOrFail($id);

        return response()->json(['data' => new ClassroomResource($classroom)]);
    }

    public function myWeeks(Request $request, int $id): JsonResponse
    {
        $classroom = Classroom::whereHas('enrollments', fn ($q) => $q->where('student_id', $request->user()->id)->where('is_active', true)
        )->findOrFail($id);

        $weeks = $classroom->weeks()->with([
            'materials',
            'courseTasks.rubric.criteria',
            'courseTasks' => fn ($q) => $q->with(['submissions' => fn ($s) => $s->where('student_id', $request->user()->id)->with(['grade.criterionScores', 'evidenceFiles']),
            ]),
        ])->get();

        return response()->json(['data' => WeekResource::collection($weeks)]);
    }

    // Trainer-scoped
    public function trainerClassrooms(Request $request): JsonResponse
    {
        $classrooms = Classroom::where('trainer_id', $request->user()->id)
            ->with('level.program')
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->get();

        return response()->json(['data' => ClassroomResource::collection($classrooms)]);
    }

    public function trainerClassroom(Request $request, int $id): JsonResponse
    {
        $classroom = Classroom::where('trainer_id', $request->user()->id)
            ->with('level.program')
            ->withCount(['enrollments' => fn ($q) => $q->where('is_active', true)])
            ->findOrFail($id);

        return response()->json(['data' => new ClassroomResource($classroom)]);
    }

    private function authorizeClassroomAccess(Classroom $classroom): void
    {
        $user = request()->user();

        if ($user->hasRole('teacher') && $classroom->trainer_id !== $user->id) {
            abort(403, 'You do not have access to this classroom.');
        }
    }
}
