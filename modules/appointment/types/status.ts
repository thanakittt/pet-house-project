export type AppointmentStatus = 
  // 1. Booking
  | "PENDING_DEPOSIT" 
  | "PENDING_APPROVAL" 
  | "CONFIRMED" 
  // 2. Operation
  | "CHECKED_IN" 
  | "IN_PROGRESS" 
  | "READY_FOR_PICKUP" 
  // 3. Finished
  | "COMPLETED" 
  | "CANCELLED" 
  | "NO_SHOW";