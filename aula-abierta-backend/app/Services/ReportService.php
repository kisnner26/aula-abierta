<?php

namespace App\Services;

use App\Models\Classroom;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class ReportService
{
    public function gradesPdf(Classroom $classroom): Response
    {
        $classroom->load([
            'enrollments.student',
            'weeks.courseTasks.submissions.grade',
            'weeks.courseTasks.submissions.student',
        ]);

        $pdf = Pdf::loadView('reports.grades', compact('classroom'))
            ->setPaper('a4', 'landscape');

        return $pdf->download("grades-{$classroom->id}.pdf");
    }

    public function attendancePdf(Classroom $classroom): Response
    {
        $classroom->load(['attendances.student', 'enrollments.student']);

        $pdf = Pdf::loadView('reports.attendance', compact('classroom'))
            ->setPaper('a4', 'portrait');

        return $pdf->download("attendance-{$classroom->id}.pdf");
    }
}
