import type { CreatePersonaPayload } from '@/types';
import { buildPersonaPromptClient } from './buildPersonaPromptClient';

interface Props {
  formState: Partial<CreatePersonaPayload>;
}

export function PromptPreview({ formState }: Props) {
  const preview = buildPersonaPromptClient(formState);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Generated Prompt Preview
      </p>
      <textarea
        readOnly
        value={preview}
        rows={10}
        className="w-full resize-none rounded-md border border-input bg-muted px-3 py-2 text-xs font-mono leading-relaxed text-foreground focus:outline-none"
      />
      <p className="text-xs text-muted-foreground">
        Preview is approximate — the saved prompt may differ slightly.
      </p>
    </div>
  );
}
