'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function AnswerQuestionDialog({ open, onOpenChange, question, answerText, setAnswerText, onSubmit, submitting }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Answer Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase">Question</Label>
            <p className="text-sm">{question?.question}</p>
          </div>
          <div className="space-y-2">
            <Label>Your Answer</Label>
            <Textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Write the answer readers will see..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!answerText.trim() || submitting}>
            {submitting ? 'Publishing…' : 'Publish Answer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
