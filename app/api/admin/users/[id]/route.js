import { getCollection } from '@/lib/mongodb';
import { json, preflight } from '@/lib/api/cors';
import { requireAdmin } from '@/lib/auth/admin/guard';
import { hashPassword } from '@/lib/auth/admin/password';

export const OPTIONS = preflight;

// Only these fields may be updated via the API (prevents mass-assignment such
// as a client sneaking in role escalation or arbitrary field writes).
const UPDATABLE = ['name', 'role', 'bio', 'avatar', 'isActive', 'isVerified', 'permissions', 'email'];

export async function PUT(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const body = await request.json();
    const usersCollection = await getCollection('users');

    const updateData = { updatedAt: new Date() };
    for (const key of UPDATABLE) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    if (updateData.email) updateData.email = String(updateData.email).toLowerCase();
    if (updateData.role) updateData.role = String(updateData.role).trim().toLowerCase();
    // Password, if provided, is hashed — never stored in plaintext.
    if (body.password) updateData.password = hashPassword(body.password);

    const result = await usersCollection.updateOne({ id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return json({ error: 'User not found' }, { status: 404, request });
    }

    return json({ success: true }, { request });
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error);
    return json({ error: 'Failed to update user' }, { status: 500, request });
  }
}

export async function DELETE(request, { params }) {
  try {
    const gate = await requireAdmin(request, ['admin']);
    if (!gate.ok) return gate.response;

    const { id } = await params;
    const usersCollection = await getCollection('users');
    await usersCollection.deleteOne({ id });
    return json({ success: true }, { request });
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error);
    return json({ error: 'Failed to delete user' }, { status: 500, request });
  }
}
