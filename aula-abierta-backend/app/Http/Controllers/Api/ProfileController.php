<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profileService) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()->load('teacherProfile')),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource(
                $this->profileService->update($request->user(), $request->validated()),
            ),
        ]);
    }

    public function updateAvatar(UpdateAvatarRequest $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource(
                $this->profileService->updateAvatar($request->user(), $request->file('avatar')),
            ),
        ]);
    }

    public function removeAvatar(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($this->profileService->removeAvatar($request->user())),
        ]);
    }
}
