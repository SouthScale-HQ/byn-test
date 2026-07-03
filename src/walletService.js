import { supabase } from './supabase.js'

const WEEKLY_TOPUP = 1000

// Get or create a wallet for a user in a specific competition
export async function getOrCreateWallet(userId, competitionKey) {
  const { data: comp, error: compError } = await supabase
    .from('competitions')
    .select('id')
    .eq('key', competitionKey)
    .maybeSingle()

  if (compError || !comp) {
    console.error('Competition not found:', competitionKey)
    return null
  }

  const { data: existing } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('competition_id', comp.id)
    .maybeSingle()

  if (existing) return existing

  const { data: newWallet, error: insertError } = await supabase
    .from('wallets')
    .insert({ user_id: userId, competition_id: comp.id, balance: 0 })
    .select()
    .single()

  if (insertError) {
    console.error('Error creating wallet:', insertError)
    return null
  }

  return newWallet
}

// Load all wallets for a user
export async function loadAllWallets(userId) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*, competitions(key, name)')
    .eq('user_id', userId)

  if (error) {
    console.error('Error loading wallets:', error)
    return []
  }

  return data
}

// Update wallet balance
export async function updateWalletBalance(userId, competitionKey, newBalance) {
  const { data: comp } = await supabase
    .from('competitions')
    .select('id')
    .eq('key', competitionKey)
    .single()

  if (!comp) return null

  const { data, error } = await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('competition_id', comp.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating wallet:', error)
    return null
  }

  return data
}

// Apply weekly topup to a wallet at round start
export async function applyWeeklyTopup(userId, competitionKey) {
  const wallet = await getOrCreateWallet(userId, competitionKey)
  if (!wallet) return null

  const newBalance = wallet.balance + WEEKLY_TOPUP
  return updateWalletBalance(userId, competitionKey, newBalance)
}

// Apply ad boost to a wallet
export async function applyAdBoost(userId, competitionKey, amount = 50) {
  const wallet = await getOrCreateWallet(userId, competitionKey)
  if (!wallet) return null

  const newBalance = wallet.balance + amount
  return updateWalletBalance(userId, competitionKey, newBalance)
}
