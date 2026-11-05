export type Role = "faculty" | "office_admin";

export interface Me {
  id: string;
  role: Role;
  display_name: string;
  faculty_id: string | null;
}

export type Overview =
  | { role: "faculty"; assigned_classes: number; sessions_recorded: number }
  | {
      role: "office_admin";
      active_students: number;
      students_below_75_attendance: number;
      students_to_review: number;
      outstanding_dues: string;
      open_mentor_tasks: number;
    };

export interface Page<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface Batch {
  id: string;
  programme_id: string;
  academic_year_id: string;
  year_of_study: number;
  section: string;
  is_active: boolean;
}

export interface StudentRow {
  id: string;
  roll_number: string;
  full_name: string;
  batch_id: string;
  year_of_study: number;
  status: string;
}

export interface StudentDetail extends StudentRow {
  attendance_pct: string | null;
  internals_score: string | null;
  internals_max: string | null;
  fees?: { total: string; paid: string; outstanding: string } | null;
}

export interface Programme { id: string; code: string; name: string; duration_years: number; is_active: boolean }
export interface AcademicYear { id: string; label: string; starts_on: string; ends_on: string; is_active: boolean }
export interface Subject { id: string; programme_id: string; code: string; name: string; credits: number; is_active: boolean }
export interface Faculty { id: string; full_name: string; employee_code: string; email: string; is_active: boolean }
export interface Assignment { id: string; faculty_id: string; subject_id: string; batch_id: string }
