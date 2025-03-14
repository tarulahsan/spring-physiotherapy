import { supabase } from '../lib/supabase';

const settingsApi = {
  // Get business settings
  getBusinessSettings: async () => {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching business settings:', error);
      throw error;
    }
    return data;
  },

  // Update business settings
  updateBusinessSettings: async (updates) => {
    const { id, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('business_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }
    return data;
  },

  // Get treatments
  getTreatments: async () => {
    const { data, error } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching treatments:', error);
      throw error;
    }
    return data || [];
  },

  // Get discount givers
  getDiscountGivers: async () => {
    const { data, error } = await supabase
      .from('discount_givers')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching discount givers:', error);
      throw error;
    }
    return data || [];
  },

  // Create discount giver
  createDiscountGiver: async (giverData) => {
    const { data, error } = await supabase
      .from('discount_givers')
      .insert([giverData])
      .select()
      .single();

    if (error) {
      console.error('Error creating discount giver:', error);
      throw error;
    }
    return data;
  },

  // Update discount giver
  updateDiscountGiver: async (id, updates) => {
    const { data, error } = await supabase
      .from('discount_givers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount giver:', error);
      throw error;
    }
    return data;
  },

  // Delete discount giver
  deleteDiscountGiver: async (id) => {
    const { error } = await supabase
      .from('discount_givers')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount giver:', error);
      throw error;
    }
  },

  // Upload logo
  uploadLogo: async (file) => {
    try {
      // First, delete any existing logo
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove(['logo.png']);

      if (deleteError && !deleteError.message.includes('Object not found')) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Upload new logo with timestamp to prevent caching
      const timestamp = new Date().getTime();
      const filename = `logo_${timestamp}.png`;

      // Upload new logo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, {
          cacheControl: 'no-cache',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL with cache buster
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      // Get the business settings ID first
      const { data: settingsData, error: settingsError } = await supabase
        .from('business_settings')
        .select('id')
        .single();

      if (settingsError) {
        console.error('Error getting business settings:', settingsError);
        throw settingsError;
      }

      // Update business settings with new logo URL
      if (data?.publicUrl && settingsData?.id) {
        const { error: updateError } = await supabase
          .from('business_settings')
          .update({ logo_url: data.publicUrl })
          .eq('id', settingsData.id);

        if (updateError) {
          console.error('Error updating logo URL:', updateError);
          throw updateError;
        }

        // Clean up old logos except the current one
        const { data: fileList } = await supabase.storage
          .from('avatars')
          .list();
        
        if (fileList) {
          const oldLogos = fileList
            .filter(f => f.name.startsWith('logo_') && f.name !== filename)
            .map(f => f.name);
          
          if (oldLogos.length > 0) {
            await supabase.storage
              .from('avatars')
              .remove(oldLogos);
          }
        }

        return data.publicUrl;
      } else {
        throw new Error('Failed to get public URL for uploaded logo or business settings ID');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  // Get doctors
  getDoctors: async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
    return data || [];
  },

  // Add doctor
  addDoctor: async (doctor) => {
    const { data, error } = await supabase
      .from('doctors')
      .insert([{ ...doctor, status: 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Error adding doctor:', error);
      throw error;
    }
    return data;
  },

  // Update doctor
  updateDoctor: async (id, updates) => {
    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
    return data;
  },

  // Delete doctor
  deleteDoctor: async (id) => {
    const { error } = await supabase
      .from('doctors')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  },

  // Get referrers
  getReferrers: async () => {
    const { data, error } = await supabase
      .from('referrers')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      console.error('Error fetching referrers:', error);
      throw error;
    }
    return data || [];
  },

  // Add referrer
  addReferrer: async (referrer) => {
    const { data, error } = await supabase
      .from('referrers')
      .insert([{ ...referrer, status: 'active' }])
      .select()
      .single();

    if (error) {
      console.error('Error adding referrer:', error);
      throw error;
    }
    return data;
  },

  // Update referrer
  updateReferrer: async (id, updates) => {
    const { data, error } = await supabase
      .from('referrers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating referrer:', error);
      throw error;
    }
    return data;
  },

  // Delete referrer
  deleteReferrer: async (id) => {
    const { error } = await supabase
      .from('referrers')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting referrer:', error);
      throw error;
    }
  }
};

export { settingsApi };
