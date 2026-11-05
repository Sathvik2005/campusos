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
