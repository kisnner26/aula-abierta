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
  .meta h2 { font-size: 14px; font-weight: 700; }
  .meta p { font-size: 10px; color: #706C64; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { background: #1D95FB; color: #fff; text-align: left; padding: 7px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 6px 10px; border-bottom: 1px solid #E8E6E1; }
  tr:nth-child(even) td { background: #F4F3F0; }
  .present  { color: #166534; font-weight: 700; }
  .absent   { color: #D31A2A; font-weight: 700; }
  .pct      { font-weight: 800; }
  .footer   { margin-top: 24px; font-size: 9px; color: #938F86; text-align: center; }
  .no-data  { text-align: center; color: #938F86; padding: 32px; }
</style>
</head>
<body>

<div class="header">
  <div class="brand">Aula<span class="red">Kid</span> — Aula<span> App</span></div>
  <div class="meta">
    <h2>Attendance Report — {{ $classroom->name }}</h2>
    <p>Period: {{ $classroom->academic_period }} &nbsp;|&nbsp; Generated: {{ now()->format('M j, Y H:i') }}</p>
  </div>
</div>

@php
  $students = $classroom->enrollments->where('is_active', true)->pluck('student');
  $dates    = $classroom->attendances->pluck('date')->unique()->sort()->values();
@endphp

@if($dates->isEmpty())
  <p class="no-data">No attendance records yet.</p>
@else
<table>
  <thead>
    <tr>
      <th>Student</th>
      <th>SIS ID</th>
      @foreach($dates as $date)
        <th>{{ \Carbon\Carbon::parse($date)->format('M j') }}</th>
      @endforeach
      <th>Present</th>
      <th>%</th>
    </tr>
  </thead>
  <tbody>
    @foreach($students as $student)
      @php
        $studentAttendance = $classroom->attendances->where('student_id', $student->id);
        $presentCount = $studentAttendance->where('present', true)->count();
        $total        = $dates->count();
        $pct          = $total > 0 ? round(($presentCount / $total) * 100) : 0;
      @endphp
      <tr>
        <td>{{ $student->name }}</td>
        <td>{{ $student->sis_id }}</td>
        @foreach($dates as $date)
          @php
            $record  = $studentAttendance->firstWhere('date', $date);
            $present = $record?->present;
          @endphp
          <td>
            @if($present === null)
              <span style="color:#938F86">—</span>
            @elseif($present)
              <span class="present">P</span>
            @else
              <span class="absent">A</span>
            @endif
          </td>
        @endforeach
        <td>{{ $presentCount }}/{{ $total }}</td>
        <td class="pct" style="color: {{ $pct >= 80 ? '#166534' : ($pct >= 60 ? '#854d0e' : '#D31A2A') }}">{{ $pct }}%</td>
      </tr>
    @endforeach
  </tbody>
</table>

<div style="margin-top:12px; font-size:9px; color:#938F86;">
  P = Present &nbsp; A = Absent &nbsp; — = Not recorded
</div>
@endif

<div class="footer">
  Aula Abierta &nbsp;|&nbsp; Confidential — For internal use only
</div>
</body>
</html>
