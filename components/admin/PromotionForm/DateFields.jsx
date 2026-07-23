'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DateFields({ promotionForm, set }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Event Date <span className="text-xs text-gray-400">(IST)</span></Label>
        <Input type="datetime-local" value={promotionForm.eventDate} onChange={e => set({ eventDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Start Date <span className="text-xs text-gray-400">(IST)</span></Label>
        <Input type="datetime-local" value={promotionForm.startDate} onChange={e => set({ startDate: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>End Date <span className="text-xs text-gray-400">(IST)</span></Label>
        <Input type="datetime-local" value={promotionForm.endDate} onChange={e => set({ endDate: e.target.value })} placeholder="No expiry" />
      </div>
    </div>
  );
}
