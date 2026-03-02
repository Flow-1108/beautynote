// ============================================================
// BeautyNote — Types TypeScript miroirs du schéma Supabase
// ============================================================
// Ces types reflètent exactement les tables SQL.
// Tous les montants sont en CENTIMES (integer).
// ============================================================

// --- Enum types ---

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export type PaymentMethod = 'card_sumup' | 'cash' | 'free';

export type LoyaltyTxType = 'earned' | 'spent' | 'adjustment';

// --- Row types (lecture) ---

export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;        // format ISO 'YYYY-MM-DD'
  notes: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
};

export type CatalogueService = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  base_price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  client_id: string;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  buffer_ends_at: string;
  status: AppointmentStatus;
  is_home_service: boolean;
  forced_overlap: boolean;
  base_price_cents: number;
  birthday_discount_cents: number;
  loyalty_discount_cents: number;
  loyalty_points_used: number;
  final_price_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LoyaltyTransaction = {
  id: string;
  client_id: string;
  appointment_id: string | null;
  type: LoyaltyTxType;
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  appointment_id: string;
  amount_cents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  sumup_checkout_id: string | null;
  sumup_transaction_id: string | null;
  created_at: string;
  updated_at: string;
};

// --- Insert types (création) ---

export type ClientInsert = Omit<Client, 'id' | 'loyalty_points' | 'created_at' | 'updated_at'> & {
  id?: string;
  loyalty_points?: number;
};

export type CatalogueServiceInsert = Omit<CatalogueService, 'id' | 'is_active' | 'created_at' | 'updated_at'> & {
  id?: string;
  is_active?: boolean;
};

export type AppointmentInsert = Omit<Appointment, 'id' | 'service_id' | 'status' | 'created_at' | 'updated_at'> & {
  id?: string;
  service_id?: string | null;
  status?: AppointmentStatus;
};

export type AppointmentServiceInsert = {
  appointment_id: string;
  service_id: string;
  base_price_cents: number;
  duration_minutes: number;
  buffer_minutes: number;
};

export type AppointmentServiceRow = {
  id: string;
  appointment_id: string;
  service_id: string;
  base_price_cents: number;
  duration_minutes: number;
  buffer_minutes: number;
  created_at: string;
  service?: CatalogueService;
};

export type LoyaltyTransactionInsert = Omit<LoyaltyTransaction, 'id' | 'created_at'> & {
  id?: string;
};

export type PaymentInsert = Omit<Payment, 'id' | 'status' | 'created_at' | 'updated_at'> & {
  id?: string;
  status?: PaymentStatus;
};

// --- Update types (mise à jour partielle) ---

export type ClientUpdate = Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;

export type CatalogueServiceUpdate = Partial<Omit<CatalogueService, 'id' | 'created_at' | 'updated_at'>>;

export type AppointmentUpdate = Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>;

export type PaymentUpdate = Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;

// --- Types enrichis (jointures fréquentes) ---

export type AppointmentWithRelations = Appointment & {
  client: Client;
  service: CatalogueService | null;
  appointment_services?: (AppointmentServiceRow & { service: CatalogueService })[];
};

export type PaymentWithAppointment = Payment & {
  appointment: AppointmentWithRelations;
};

// --- Types horaires & fermetures ---

export type BusinessHours = {
  id: string;
  day_of_week: number;       // 0=Lundi … 6=Dimanche
  is_open: boolean;
  open_time: string;          // 'HH:MM'
  close_time: string;         // 'HH:MM'
  updated_at: string;
};

export type BusinessHoursUpdate = {
  is_open?: boolean;
  open_time?: string;
  close_time?: string;
};

export type ClosureDate = {
  id: string;
  start_date: string;         // 'YYYY-MM-DD'
  end_date: string;            // 'YYYY-MM-DD'
  reason: string;
  created_at: string;
};

export type ClosureDateInsert = Omit<ClosureDate, 'id' | 'created_at'>;

// --- Types tarification dynamique ---

export type PricingBreakdown = {
  base_price_cents: number;
  is_birthday_month: boolean;
  birthday_discount_cents: number;
  loyalty_points_available: number;
  max_loyalty_points_usable: number;
  loyalty_points_used: number;
  loyalty_discount_cents: number;
  final_price_cents: number;
};
