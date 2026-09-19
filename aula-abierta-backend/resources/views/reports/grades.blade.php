<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1E1C18; background: #fff; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #1D95FB; padding-bottom: 12px; }
  .brand { font-size: 18px; font-weight: 800; }
  .brand span { color: #1D95FB; }
  .brand span.red { color: #D31A2A; }
  .meta h2 { font-size: 14px; font-weight: 700; color: #1E1C18; }
  .meta p { font-size: 10px; color: #706C64; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1D95FB; color: #fff; text-align: left; padding: 7px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 6px 10px; border-bottom: 1px solid #E8E6E1; vertical-align: top; }
  tr:nth-child(even) td { background: #F4F3F0; }
  .grade-cell { font-weight: 800; font-size: 13px; }
  .grade-ap { color: #166534; }
  .grade-a  { color: #1D95FB; }
  .grade-b  { color: #854d0e; }
  .grade-c  { color: #D31A2A; }
  .footer { margin-top: 24px; font-size: 9px; color: #938F86; text-align: center; }
  .criteria-list { font-size: 9px; color: #706C64; margin-top: 2px; }
  .no-data { text-align: center; color: #938F86; padding: 32px; }
</style>
</head>
<body>

<div class="header">
  <div class="brand">Aula<span class="red">Kid</span> — Aula<span> App</span></div>
  <div class="meta">
    <h2>Grades Report — {{ $classroom->name }}</h2>
    <p>Period: {{ $classroom->academic_period }} &nbsp;|&nbsp; Generated: {{ now()->format('M j, Y H:i') }}</p>
  </div>
</div>

@php
  $students = $classroom->enrollments->where('is_active', true)->pluck('student');
  $allTasks = $classroom->weeks->flatMap(fn($w) => $w->courseTasks);
@endphp

@if($allTasks->isEmpty())
  <p class="no-data">No tasks have been graded yet.</p>
@else
<table>
  <thead>
    <tr>
      <th>Student</th>
      <th>SIS ID</th>
      @foreach($allTasks as $task)
        <th>{{ Str::limit($task->title, 18) }}</th>
      @endforeach
      <th>Average</th>
      <th>Final</th>
    </tr>
  </thead>
  <tbody>
    @foreach($students as $student)
      @php
        $scores = [];
        foreach($allTasks as $task) {
          $sub = $task->submissions->firstWhere('student_id', $student->id);
          $scores[] = $sub?->grade?->numeric_score;
        }
        $graded = array_filter($scores, fn($s) => $s !== null);
        $avg = count($graded) > 0 ? round(array_sum($graded) / count($graded)) : null;
        $letter = match(true) {
          $avg >= 90 => 'A+',
          $avg >= 80 => 'A',
          $avg >= 70 => 'B',
          $avg !== null => 'C',
          default => '—',
        };
        $letterClass = match($letter) { 'A+' => 'grade-ap', 'A' => 'grade-a', 'B' => 'grade-b', 'C' => 'grade-c', default => '' };
      @endphp
      <tr>
        <td>{{ $student->name }}</td>
        <td>{{ $student->sis_id }}</td>
        @foreach($scores as $score)
          @php
            $sl = match(true) { $score >= 90 => 'grade-ap', $score >= 80 => 'grade-a', $score >= 70 => 'grade-b', $score !== null => 'grade-c', default => '' };
          @endphp
          <td class="grade-cell {{ $sl }}">{{ $score !== null ? $score.'%' : '—' }}</td>
        @endforeach
        <td class="grade-cell">{{ $avg !== null ? $avg.'%' : '—' }}</td>
        <td class="grade-cell {{ $letterClass }}">{{ $letter }}</td>
      </tr>
    @endforeach
  </tbody>
</table>

<div style="margin-top:12px; font-size:9px; color:#938F86;">
  Grade scale: A+ (90–100) &nbsp; A (80–89) &nbsp; B (70–79) &nbsp; C (&lt;70, not passed)
</div>
@endif

<div class="footer">
  Aula Abierta &nbsp;|&nbsp; Confidential — For internal use only
</div>
</body>
</html>
