import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentTypeSettings } from '@/components/settings/AppointmentTypeSettings';
import { PersonaSettings } from '@/components/settings/personas/PersonaSettings';
import { RecoverySettings } from '@/components/settings/RecoverySettings';
import { PromptEditor } from '@/components/settings/PromptEditor';

export default function Settings() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your clinic's recovery behaviour and AI voice agent.
        </p>
      </div>

      <Tabs defaultValue="personas">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="appointment-types">Appointment Types</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="mt-6">
          <PersonaSettings />
        </TabsContent>

        <TabsContent value="appointment-types" className="mt-6">
          <AppointmentTypeSettings />
        </TabsContent>

        <TabsContent value="recovery" className="mt-6">
          <RecoverySettings />
        </TabsContent>

        <TabsContent value="prompt" className="mt-6">
          <PromptEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
