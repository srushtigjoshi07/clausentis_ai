'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface BidderDocumentRow {
  id: string;
  user_id: string;
  tender_id?: string | null;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes?: number | null;
  processing_status?: string | null;
  created_at: string;
  updated_at?: string;
}

export async function getBidderDocuments(category?: string): Promise<BidderDocumentRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('bidder_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('document_type', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching bidder documents:', error);
    return [];
  }

  return ((data || []) as Array<Record<string, unknown>>).map((d) => ({
    id: String(d.id),
    user_id: String(d.user_id),
    tender_id: d.tender_id ? String(d.tender_id) : null,
    document_type: String(d.document_type || 'other'),
    file_name: String(d.original_filename || d.name || 'Document'),
    file_path: String(d.storage_path || d.file_path || ''),
    file_size_bytes: typeof d.file_size === 'number' ? d.file_size : (typeof d.file_size_bytes === 'number' ? d.file_size_bytes : null),
    processing_status: String(d.status || d.processing_status || 'uploaded'),
    created_at: String(d.created_at || ''),
    updated_at: d.updated_at ? String(d.updated_at) : undefined
  }));
}

export async function createBidderDocument(fileData: {
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  tender_id?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertPayload = {
    user_id: user.id,
    name: fileData.file_name,
    document_type: fileData.document_type || 'other',
    storage_path: fileData.file_path,
    original_filename: fileData.file_name,
    file_size: fileData.file_size_bytes,
    status: 'uploaded'
  };

  const { data, error } = await supabase
    .from('bidder_documents')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error inserting bidder document:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to create bidder document record: ${error.message || 'Database error'}`);
  }

  // Create audit event
  try {
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'Document Vault Upload',
      description: `Uploaded company credential "${fileData.file_name}" to Vault`,
      metadata: { file_name: fileData.file_name, category: fileData.document_type }
    });
  } catch (err) {
    console.warn('Audit event failed:', err);
  }

  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return data;
}

export async function deleteBidderDocument(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: doc } = await supabase
    .from('bidder_documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!doc) {
    throw new Error('Document not found');
  }

  // Delete from storage if storage_path or file_path exists
  const pathToRemove = doc.storage_path || doc.file_path;
  if (pathToRemove) {
    await supabase.storage.from('bidder-documents').remove([pathToRemove]);
  }

  // Delete from database
  const { error } = await supabase
    .from('bidder_documents')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting bidder document:', error);
    throw new Error('Failed to delete document.');
  }

  revalidatePath('/documents');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getBidderDocumentSignedUrl(filePath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.storage
    .from('bidder-documents')
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('Error creating signed url:', error);
    return null;
  }

  return data?.signedUrl || null;
}
