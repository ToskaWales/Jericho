import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personasApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { toast } from '@/components/ui/use-toast';
import type { Persona, CreatePersonaPayload } from '@/types';

export function usePersonas() {
  return useQuery({
    queryKey: queryKeys.personas.all,
    queryFn: () => personasApi.list().then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useCreatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonaPayload) => personasApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast({ title: 'Persona created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create persona', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePersonaPayload> }) =>
      personasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast({ title: 'Persona updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update persona', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeletePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personasApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personas.all });
      toast({ title: 'Persona deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to delete persona', description: err.message, variant: 'destructive' });
    },
  });
}

export function useActivatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personasApi.activate(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.personas.all });
      const previous = qc.getQueryData<Persona[]>(queryKeys.personas.all);
      qc.setQueryData<Persona[]>(queryKeys.personas.all, (old) =>
        old?.map((p) => ({ ...p, isActive: p.id === id })) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.personas.all, ctx.previous);
      toast({ title: 'Failed to activate persona', variant: 'destructive' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.personas.all });
    },
  });
}
