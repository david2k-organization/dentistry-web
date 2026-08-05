export type AppointmentStatus =
  | "SCHEDULED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "CANCELLED"
  | "COMPLETED";

export type AppointmentRelations = {
  patient: { fullName: string };
  doctor: { fullName: string };
  service: { name: string; code: string };
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  appointmentAt: string; // ISO 8601
  duration: number; // phút
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
} & AppointmentRelations;

export type CreateAppointmentInput = {
  patientId: string;
  doctorId: string;
  serviceId: string;
  appointmentAt: string; // ISO 8601
  duration: number;
  notes?: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: AppointmentStatus;
};
