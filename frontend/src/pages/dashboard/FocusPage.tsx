import { PomodoroTimer } from '@/components/exam/PomodoroTimer';
import { DashboardLayout } from '@/layouts/DashboardLayout';

export default function FocusPage() {
  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#221D17] dark:text-[#C6B19B] mb-2">Focus Session</h1>
          <p className="text-sm text-muted-foreground">
            Use the Pomodoro technique to maintain high cognitive focus.
          </p>
        </div>
        <PomodoroTimer />
      </div>
    </DashboardLayout>
  );
}


