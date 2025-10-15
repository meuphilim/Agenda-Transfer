import { createClient } from '@supabase/supabase-js';
import process from 'process';

const activateUser = async () => {
    const userEmail = process.argv[2];

    if (!userEmail) {
        console.error('Usage: node activate_user.mjs <email>');
        process.exit(1);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or Service Key is not set in environment variables.');
        process.exit(1);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // 1. Find the user by email to get their ID
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw new Error(`Error listing users: ${listError.message}`);

        const user = users.find(u => u.email === userEmail);
        if (!user) throw new Error(`User with email ${userEmail} not found.`);

        const userId = user.id;
        console.log(`Found user ID: ${userId}`);

        // 2. Update the user's profile to active
        const { data: updatedProfile, error: updateError } = await adminClient
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw new Error(`Error activating user: ${updateError.message}`);

        console.log(`Successfully activated user: ${updatedProfile.id}, Status: ${updatedProfile.status}`);

    } catch (error) {
        console.error('Activation script failed:', error.message);
        process.exit(1);
    }
};

activateUser();