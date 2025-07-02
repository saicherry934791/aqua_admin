import { registerSheet } from 'react-native-actions-sheet';
import DateRangeSheet from "./lib/components/sheets/DateRangeSheet";
import SelectSheet from "./lib/components/sheets/SelectSheet";
import AgentAssignmentSheet from "./lib/components/sheets/AgentAssignmentSheet";
import ScheduleTimeSheet from "./lib/components/sheets/ScheduleTimeSheet";

registerSheet('select-sheet', SelectSheet);
registerSheet('date-range-sheet', DateRangeSheet);
registerSheet('agent-assignment-sheet', AgentAssignmentSheet);
registerSheet('schedule-time-sheet', ScheduleTimeSheet);

declare module 'react-native-actions-sheet' {
  interface Sheets {
    'select-sheet': { /* Define props if any */ };
    'date-range-sheet': {
      onDateRangeSelect: (startDate: Date, endDate: Date) => void;
    };
    'agent-assignment-sheet': {
      serviceRequestId: string;
      currentAgentId?: string;
      currentAgentName?: string;
      onAgentAssigned: (agent: { id: string; name: string; phone: string }) => void;
    };
    'schedule-time-sheet': {
      serviceRequestId: string;
      currentScheduledDate?: string;
      onScheduleUpdated: (scheduledDate: string | null) => void;
    };
  }
}