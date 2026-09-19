<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function __construct(private readonly UserImportService $importService) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'super_admin']), 403);

        $users = User::query()
            ->when($request->query('role'), fn ($q, $role) => $q->role($role))
            ->when($request->query('search'), fn ($q, $term) => $q->where(fn ($sub) => $sub
                ->where('name', 'ilike', "%{$term}%")
                ->orWhere('sis_id', 'ilike', "%{$term}%")))
            ->latest()
            ->paginate(50);

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'sis_id' => ['required', 'string', Rule::unique('users', 'sis_id')->withoutTrashed()],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in($this->assignableRoles($request->user()))],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'sis_id' => $data['sis_id'],
            'password' => Hash::make($data['password']),
        ]);
        $user->assignRole($data['role']);

        activity('users')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties(['sis_id' => $user->sis_id, 'role' => $data['role'], 'ip' => $request->ip()])
            ->log('user_created');

        return response()->json(['data' => new UserResource($user)], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'sis_id' => ['sometimes', 'string', Rule::unique('users', 'sis_id')->ignore($user->id)->withoutTrashed()],
            'password' => ['sometimes', 'string', 'min:8'],
            'role' => ['sometimes', 'string', Rule::in($this->assignableRoles($request->user()))],
        ]);

        if (isset($data['role']) && $request->user()->is($user) && ! $user->hasRole($data['role'])) {
            throw ValidationException::withMessages(['role' => ['You cannot change your own role.']]);
        }

        $user->fill(array_intersect_key($data, array_flip(['name', 'sis_id'])));

        if (isset($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        $changes = array_intersect_key($data, array_flip(['name', 'sis_id', 'role']));
        if (isset($data['password'])) {
            $changes['password_changed'] = true;
        }

        activity('users')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties($changes + ['ip' => $request->ip()])
            ->log('user_updated');

        return response()->json(['data' => new UserResource($user)]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        // Soft delete keeps the row; revoke tokens so active sessions die immediately.
        $user->tokens()->delete();
        $user->delete();

        activity('users')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties(['sis_id' => $user->sis_id, 'name' => $user->name, 'ip' => $request->ip()])
            ->log('user_deleted');

        return response()->json(null, 204);
    }

    public function bulkImport(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'super_admin']), 403);

        $request->validate(['file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120']]);
        $result = $this->importService->import($request->file('file'), $request->user());

        activity('users')
            ->causedBy($request->user())
            ->withProperties([
                'file' => $request->file('file')->getClientOriginalName(),
                'created' => $result['created'],
                'errors' => count($result['errors']),
                'ip' => $request->ip(),
            ])
            ->log('users_imported');

        return response()->json(['data' => $result]);
    }

    // Which roles the actor is allowed to hand out; only super_admin grants privileged roles.
    private function assignableRoles(User $actor): array
    {
        return $actor->hasRole('super_admin')
            ? ['student', 'teacher', 'family', 'admin', 'super_admin']
            : ['student', 'teacher', 'family'];
    }
}
