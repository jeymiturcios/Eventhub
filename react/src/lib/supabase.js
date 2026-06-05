import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hathtchxxewchkeqztsk.supabase.co'
const supabaseKey = 'sb_publishable_dMnLes9J0pm15ktK570BCw_RH56nkX0'

export const supabase = createClient(supabaseUrl, supabaseKey)
