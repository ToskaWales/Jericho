import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Persona } from '@/types';

interface Props {
  persona: Persona;
  onActivate: (id: string) => void;
  onEdit: (persona: Persona) => void;
  onDelete: (persona: Persona) => void;
  isActivating: boolean;
}

const VISIBLE_TRAITS = 3;

export function PersonaCard({ persona, onActivate, onEdit, onDelete, isActivating }: Props) {
  const traits = persona.personality;
  const visibleTraits = traits.slice(0, VISIBLE_TRAITS);
  const extraCount = traits.length - VISIBLE_TRAITS;

  return (
    <div className="flex items-start justify-between rounded-lg border bg-card p-4 gap-4">
      {/* Left: info */}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{persona.name}</span>
          <span className="text-muted-foreground text-sm">— {persona.role}</span>
          {persona.isActive && (
            <Badge variant="success" className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
              Active
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {visibleTraits.map((trait) => (
            <Badge key={trait} variant="secondary" className="capitalize text-xs">
              {trait}
            </Badge>
          ))}
          {extraCount > 0 && (
            <Badge variant="outline" className="text-xs">+{extraCount} more</Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {persona.stats.totalCalls > 0 ? (
            <>
              Acceptance rate:{' '}
              <span className="font-medium text-foreground">
                {persona.stats.acceptanceRate.toFixed(1)}%
              </span>
              {' '}({persona.stats.totalCalls} call{persona.stats.totalCalls !== 1 ? 's' : ''})
            </>
          ) : (
            <Skeleton className="h-3 w-32 inline-block align-middle" />
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!persona.isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onActivate(persona.id)}
            disabled={isActivating}
          >
            Set Active
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(persona)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={persona.isActive}
              onClick={() => !persona.isActive && onDelete(persona)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
