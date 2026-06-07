import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonaCard } from './PersonaCard';
import { PersonaFormDialog } from './PersonaFormDialog';
import {
  usePersonas,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
  useActivatePersona,
} from '@/hooks/usePersonas';
import { toast } from '@/components/ui/use-toast';
import type { Persona, CreatePersonaPayload } from '@/types';

export function PersonaSettings() {
  const { data: personas, isLoading } = usePersonas();
  const createMutation = useCreatePersona();
  const updateMutation = useUpdatePersona();
  const deleteMutation = useDeletePersona();
  const activateMutation = useActivatePersona();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  function openCreate() {
    setEditingPersona(null);
    setDialogOpen(true);
  }

  function openEdit(persona: Persona) {
    setEditingPersona(persona);
    setDialogOpen(true);
  }

  function handleDelete(persona: Persona) {
    if (!confirm(`Delete persona "${persona.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(persona.id);
  }

  function handleSave(data: CreatePersonaPayload) {
    if (editingPersona) {
      updateMutation.mutate(
        { id: editingPersona.id, data },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">AI Voice Personas</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create named agents with distinct personalities. The active persona handles all outbound calls.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> New persona
        </Button>
      </div>

      {personas && personas.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          No personas yet. Create your first one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {personas?.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onActivate={(id) => activateMutation.mutate(id)}
              onEdit={openEdit}
              onDelete={handleDelete}
              isActivating={activateMutation.isPending}
            />
          ))}
        </div>
      )}

      <PersonaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPersona={editingPersona}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
