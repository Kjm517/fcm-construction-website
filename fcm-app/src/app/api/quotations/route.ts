import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET all quotations
export async function GET() {
  if (!isSupabaseConfigured()) {
    // Return empty array instead of error to allow localStorage fallback
    return NextResponse.json([])
  }

  try {
    const { data, error } = await supabase!
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error fetching quotations:', error)
    // Return empty array on error to allow localStorage fallback
    return NextResponse.json([])
  }
}

// POST create new quotation
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return the created data to allow localStorage fallback
    const body = await request.json()
      return NextResponse.json({
        id: `temp-${Date.now()}`,
        quotation_number: body.quotationNumber,
        date: body.date,
        valid_until: body.validUntil,
        client_name: body.clientName,
        job_description: body.jobDescription,
        client_contact: body.clientContact || null,
        installation_address: body.installationAddress,
        attention: body.attention || null,
        total_due: body.totalDue,
        terms: body.terms || null,
        items: body.items || null,
        created_by: body.createdBy || null,
        created_at: new Date().toISOString(),
      }, { status: 201 })
  }

  try {
    const body = await request.json()
    
    const { data, error } = await supabase!
      .from('quotations')
      .insert([
        {
          quotation_number: body.quotationNumber,
          date: body.date,
          valid_until: body.validUntil,
          client_name: body.clientName,
          job_description: body.jobDescription,
          client_contact: body.clientContact || null,
          installation_address: body.installationAddress,
          attention: body.attention || null,
          total_due: body.totalDue,
          terms: body.terms || null,
          items: body.items || null,
          created_by: body.createdBy || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create quotation' },
      { status: 500 }
    )
  }
}

