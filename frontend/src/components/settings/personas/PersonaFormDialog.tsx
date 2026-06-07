import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppointmentTypes } from '@/hooks/useAppointments';
import { PromptPreview } from './PromptPreview';
import type { Persona, CreatePersonaPayload, PersonalityTrait } from '@/types';

const ALL_TRAITS: PersonalityTrait[] = [
  'warm', 'professional', 'empathetic', 'energetic', 'calm', 'friendly', 'direct',
];

const EMPTY_FORM: CreatePersonaPayload = {
  name: '',
  role: '',
  personality: [],
  objective: '',
  dos: [''],
  donts: [''],
  closingStyle: '',
  assignedTypeIds: [],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPersona?: Persona | null;
  onSave: (data: CreatePersonaPayload) => void;
  isSaving: boolean;
}

export function PersonaFormDialog({ open, onOpenChange, editingPersona, onSave, isSaving }: Props) {
  const [form, setForm] = useState<CreatePersonaPayload>(EMPTY_FORM);
  const { data: typesData } = useAppointmentTypes();
  const types = typesData?.data ?? [];

  useEffect(() => {
    if (editingPersona) {
      setForm({
        name: editingPersona.name,
        role: editingPersona.role,
        personality: editingPersona.personality,
        objective: editingPersona.objective,
        dos: editingPersona.dos.length > 0 ? editingPersona.dos : [''],
        donts: editingPersona.donts.length > 0 ? editingPersona.donts : [''],
        closingStyle: editingPersona.closingStyle,
        assignedTypeIds: editingPersona.assignedTypeIds,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingPersona, open]);

  function set<K extends keyof CreatePersonaPayload>(key: K, value: CreatePersonaPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTrait(trait: PersonalityTrait) {
    setForm((f) => ({
      ...f,
      personality: f.personality.includes(trait)
        ? f.personality.filter((t) => t !== trait)
        : f.personality.length < 5
          ? [...f.personality, trait]
          : f.personality,
    }));
  }

  function updateListItem(key: 'dos' | 'donts', index: number, value: string) {
    setForm((f) => {
      const updated = [...f[key]];
      updated[index] = value;
      return { ...f, [key]: updated };
    });
  }

  function addListItem(key: 'dos' | 'donts') {
    setForm((f) => ({ ...f, [key]: [...f[key], ''] }));
  }

  function removeListItem(key: 'dos' | 'donts', index: number) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
  }

  function toggleType(typeId: string) {
    setForm((f) => ({
      ...f,
      assignedTypeIds: f.assignedTypeIds.includes(typeId)
        ? f.assignedTypeIds.filter((id) => id !== typeId)
        : [...f.assignedTypeIds, typeId],
    }));
  }

  function handleSubmit() {
    const payload: CreatePersonaPayload = {
      ...form,
      dos: form.dos.filter(Boolean),
      donts: form.donts.filter(Boolean),
    };
    onSave(payload);
  }

  const isValid = form.name.trim() && form.role.trim() && form.personality.length > 0 &&
    form.objective.trim() && form.closingStyle.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingPersona ? 'Edit Persona' : 'New Persona'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5 py-2">

            {/* Name + Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="persona-name">Agent Name</Label>
                <Input
                  id="persona-name"
                  placeholder="Maya"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  maxLength={40}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="persona-role">Role</Label>
                <Input
                  id="persona-role"
                  placeholder="patient care coordinator"
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            {/* Personality */}
            <div className="space-y-1.5">
              <Label>Personality Traits <span className="text-muted-foreground font-normal">(pick 1–5)</span></Label>
              <div className="flex flex-wrap gap-2">
                {ALL_TRAITS.map((trait) => {
                  const selected = form.personality.includes(trait);
                  return (
                    <Button
                      key={trait}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTrait(trait)}
                      className="capitalize"
                    >
                      {trait}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <Label htmlFor="persona-objective">Call Objective</Label>
              <Textarea
                id="persona-objective"
                rows={2}
                placeholder="Warmly offer the patient a newly available appointment slot…"
                value={form.objective}
                onChange={(e) => set('objective', e.target.value)}
                maxLength={300}
              />
            </div>

            {/* Dos */}
            <div className="space-y-1.5">
              <Label>Always Do</Label>
              {form.dos.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Rule ${i + 1}`}
                    value={item}
                    onChange={(e) => updateListItem('dos', i, e.target.value)}
                    maxLength={120}
                  />
                  {form.dos.length > 1 && (
                    <Button type="button" variant="ghost" size="icon"
                      onClick={() => removeListItem('dos', i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.dos.length < 8 && (
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('dos')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add rule
                </Button>
              )}
            </div>

            {/* Don'ts */}
            <div className="space-y-1.5">
              <Label>Never Do</Label>
              {form.donts.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Rule ${i + 1}`}
                    value={item}
                    onChange={(e) => updateListItem('donts', i, e.target.value)}
                    maxLength={120}
                  />
                  {form.donts.length > 1 && (
                    <Button type="button" variant="ghost" size="icon"
                      onClick={() => removeListItem('donts', i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.donts.length < 8 && (
                <Button type="button" variant="outline" size="sm" onClick={() => addListItem('donts')}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add rule
                </Button>
              )}
            </div>

            {/* Closing Style */}
            <div className="space-y-1.5">
              <Label htmlFor="persona-closing">Closing Style</Label>
              <Textarea
                id="persona-closing"
                rows={2}
                placeholder="Thank the patient sincerely, confirm the details, and wish them a great day."
                value={form.closingStyle}
                onChange={(e) => set('closingStyle', e.target.value)}
                maxLength={200}
              />
            </div>

            {/* Appointment type assignment */}
            {types.length > 0 && (
              <div className="space-y-1.5">
                <Label>
                  Assigned Appointment Types{' '}
                  <span className="text-muted-foreground font-normal">(empty = all types)</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => {
                    const checked = form.assignedTypeIds.includes(t.id);
                    return (
                      <Button
                        key={t.id}
                        type="button"
                        variant={checked ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleType(t.id)}
                      >
                        {t.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live prompt preview */}
            <PromptPreview formState={form} />

          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving ? 'Saving…' : editingPersona ? 'Save changes' : 'Create persona'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
