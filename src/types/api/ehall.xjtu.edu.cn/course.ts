export interface Course {
  name: string;
  courseId: string;
  teachers: string;
  location: string;
  day: number;
  sectionStart: number;
  sectionEnd: number;
  weeks: string;
}

export interface CourseSchedule {
  week: number;
  day: number;
  sectionStart: number;
  sectionEnd: number;
  location: string;
}