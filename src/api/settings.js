import { supabase } from '../lib/supabase';

export const settingsApi = {
  // Business Settings
  async getBusinessSettings() {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateBusinessSettings(settings) {
    const { data: existingSettings } = await supabase
      .from('business_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from('business_settings')
      .upsert({
        ...settings,
        id: existingSettings?.id || undefined
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Doctors
  async getDoctors() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async addDoctor(doctor) {
    const { data, error } = await supabase
      .from('doctors')
      .insert([doctor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDoctor(id, updates) {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDoctor(id) {
    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Discount Givers
  async getDiscountGivers() {
    const { data, error } = await supabase
      .from('discount_givers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async addDiscountGiver(discountGiver) {
    const { data, error } = await supabase
      .from('discount_givers')
      .insert([discountGiver])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDiscountGiver(id, updates) {
    const { data, error } = await supabase
      .from('discount_givers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDiscountGiver(id) {
    const { error } = await supabase
      .from('discount_givers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Therapy Types
  async getTherapyTypes() {
    const { data, error } = await supabase
      .from('therapy_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  async addTherapyType(therapyType) {
    const { data, error } = await supabase
      .from('therapy_types')
      .insert([therapyType])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTherapyType(id, updates) {
    const { data, error } = await supabase
      .from('therapy_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTherapyType(id) {
    const { error } = await supabase
      .from('therapy_types')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Referrers
  async getReferrers() {
    try {
      console.log('Fetching referrers...');
      const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching referrers:', error);
        throw error;
      }
      console.log('Fetched referrers:', data);
      return data;
    } catch (error) {
      console.error('Error in getReferrers:', error);
      throw error;
    }
  },

  async addReferrer(referrer) {
    try {
      console.log('Adding referrer:', referrer);
      const { data, error } = await supabase
        .from('referrers')
        .insert([{
          name: referrer.name,
          contact: referrer.contact || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding referrer:', error);
        throw error;
      }
      console.log('Added referrer:', data);
      return data;
    } catch (error) {
      console.error('Error in addReferrer:', error);
      throw error;
    }
  },

  async updateReferrer(id, updates) {
    try {
      console.log('Updating referrer:', id, updates);
      const { data, error } = await supabase
        .from('referrers')
        .update({
          name: updates.name,
          contact: updates.contact || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating referrer:', error);
        throw error;
      }
      console.log('Updated referrer:', data);
      return data;
    } catch (error) {
      console.error('Error in updateReferrer:', error);
      throw error;
    }
  },

  async deleteReferrer(id) {
    try {
      console.log('Deleting referrer:', id);
      const { error } = await supabase
        .from('referrers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting referrer:', error);
        throw error;
      }
      console.log('Deleted referrer:', id);
    } catch (error) {
      console.error('Error in deleteReferrer:', error);
      throw error;
    }
  }
};
