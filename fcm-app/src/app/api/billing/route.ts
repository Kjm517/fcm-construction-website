import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET all billing entries
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase!
      .from('billing')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching billing:', error)
    return NextResponse.json([])
  }
}

// POST create new billing entry
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const body = await request.json()
    return NextResponse.json({
      id: `temp-${Date.now()}`,
      date: body.date,
      sales_invoice_number: body.salesInvoiceNumber,
      bs_number: body.bsNumber || null,
      quote_number: body.quoteNumber || null,
      description: body.description,
      address: body.address,
      amount: body.amount || 0,
      payment: body.payment || null,
      check_info: body.checkInfo || null,
      check_number: body.checkNumber || null,
      payment_date: body.paymentDate || null,
      status: body.status || 'Not Paid',
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase!
      .from('billing')
      .insert([
        {
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
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating billing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create billing entry' },
      { status: 500 }
    )
  }
}
