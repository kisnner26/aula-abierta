<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('super_admin'), 403);

        $sort = $request->query('sort') === 'asc' ? 'asc' : 'desc';

        $query = Activity::with('causer')
            ->when($request->query('user_id'), fn ($q, $id) => $q->where('causer_id', $id))
            ->when($request->query('entity_type'), fn ($q, $type) => $q->where('subject_type', 'ilike', "%{$type}"))
            ->when($request->query('category'), fn ($q, $name) => $q->where('log_name', $name))
            ->when($request->query('action'), fn ($q, $action) => $q->where('description', 'ilike', "%{$action}%"))
            ->when($request->query('date_from'), fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($request->query('date_to'), fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderBy('created_at', $sort)
            ->orderBy('id', $sort);

        $logs = $query->paginate(min((int) $request->query('per_page', 50), 100));

        return response()->json([
            'data' => AuditLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
