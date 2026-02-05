import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET single billing entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const billingId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null)
  }

  try {
    const { data, error } = await supabase!
      .from('billing')
      .select('*')
      .eq('id', billingId)
      .single()

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json(null)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching billing:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update billing entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const billingId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({ id: billingId, ...body })
  }

  try {
    const body = await request.json()
    let lastEditedBy = body.lastEditedBy || null

    // Resolve user's full name from users table when x-user-id is provided
    const userId = request.headers.get('x-user-id')
    if (userId) {
      try {
        const { data: userData } = await supabase!
          .from('users')
          .select('full_name, username')
          .eq('id', userId)
          .single()
        if (userData && (userData.full_name || userData.username)) {
          lastEditedBy = (userData.full_name || '').trim() || userData.username || lastEditedBy
        }
      } catch {
        // Keep body.lastEditedBy if lookup fails
      }
    }

    const { data, error } = await supabase!
      .from('billing')
      .update({
        date: body.date,
        sales_invoice_number: body.salesInvoiceNumber,
        bs_number: body.bsNumber || null,
        quote_number: body.quoteNumber || null,
        description: body.description,
        address: body.address,
        amount: parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, '')) || 0,
        payment: body.payment || null,
        check_info: body.checkInfo || null,
        check_number: body.checkNumber || null,
        payment_date: body.paymentDate || null,
        status: body.status || 'Not Paid',
        last_edited_by: lastEditedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billingId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating billing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update billing entry' },
      { status: 500 }
    )
  }
}

// DELETE billing entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const billingId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase!
      .from('billing')
      .delete()
      .eq('id', billingId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting billing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete billing entry' },
      { status: 500 }
    )
  }
}
