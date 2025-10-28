export interface ClassroomStatus {
  classroom: string;
  time: number;
  status: 'available' | 'occupied';
}