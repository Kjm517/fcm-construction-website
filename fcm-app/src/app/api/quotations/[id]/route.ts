import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Next.js 15+ (Promise) and older versions
  const resolvedParams = params instanceof Promise ? await params : params
  const quotationId = resolvedParams.id

  console.log('=== QUOTATION API CALL ===')
  console.log('Quotation ID:', quotationId)
  console.log('Supabase configured:', isSupabaseConfigured())

  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, returning null for quotation:', quotationId)
    return NextResponse.json(null)
  }

  try {
    console.log('Querying Supabase for quotation:', quotationId)
    
    const { data, error } = await supabase!
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

    console.log('Supabase query result:', { data: data ? 'FOUND' : 'NULL', error: error ? error.message : 'NONE' })

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Check if it's a "not found" error
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        console.log('Quotation not found in database (PGRST116)')
        return NextResponse.json(null)
      }
      
      // For other errors, return error details for debugging
      console.log('Supabase error (not PGRST116), returning error details')
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    if (!data) {
      console.log('No data returned from database (data is null)')
      return NextResponse.json(null)
    }

    console.log('✅ Quotation found in database:', {
      id: data.id,
      quotation_number: data.quotation_number,
      client_name: data.client_name
    })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Unexpected error fetching quotation:', error)
    return NextResponse.json(
      { error: error.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

// PUT update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const quotationId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    // Return the updated data to allow localStorage fallback
    const body = await request.json()
    return NextResponse.json({ id: quotationId, ...body })
  }

  try {
    const body = await request.json()
    
    const { data, error } = await supabase!
      .from('quotations')
      .update({
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
        last_edited_by: body.lastEditedBy || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quotationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update quotation' },
      { status: 500 }
    )
  }
}

// DELETE quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const quotationId = resolvedParams.id

  if (!isSupabaseConfigured()) {
    // Return success to allow localStorage fallback
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase!
      .from('quotations')
      .delete()
      .eq('id', quotationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete quotation' },
      { status: 500 }
    )
  }
}

