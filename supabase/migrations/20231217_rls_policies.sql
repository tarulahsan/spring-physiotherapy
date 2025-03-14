-- Enable RLS for all tables
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_givers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
-- Business Settings
CREATE POLICY "Allow authenticated access to business_settings"
ON public.business_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Patients
CREATE POLICY "Allow authenticated access to patients"
ON public.patients
FOR ALL USING (auth.role() = 'authenticated');

-- Therapy Sessions
CREATE POLICY "Allow authenticated access to therapy_sessions"
ON public.therapy_sessions
FOR ALL USING (auth.role() = 'authenticated');

-- Doctors
CREATE POLICY "Allow authenticated access to doctors"
ON public.doctors
FOR ALL USING (auth.role() = 'authenticated');

-- Therapy Types
CREATE POLICY "Allow authenticated access to therapy_types"
ON public.therapy_types
FOR ALL USING (auth.role() = 'authenticated');

-- Invoices
CREATE POLICY "Allow authenticated access to invoices"
ON public.invoices
FOR ALL USING (auth.role() = 'authenticated');

-- Discount Givers
CREATE POLICY "Allow authenticated access to discount_givers"
ON public.discount_givers
FOR ALL USING (auth.role() = 'authenticated');

-- Invoice Items
CREATE POLICY "Allow authenticated access to invoice_items"
ON public.invoice_items
FOR ALL USING (auth.role() = 'authenticated');

-- Payments
CREATE POLICY "Allow authenticated access to payments"
ON public.payments
FOR ALL USING (auth.role() = 'authenticated');
