import { fieldLabel } from '../helper/leadField';
import type { Lead } from '../types/api';
import { Panel } from './Panel';

type LeadAnswersProps = {
  lead: Lead;
};

export const LeadAnswers = ({ lead }: LeadAnswersProps) => {
  const answers = Object.entries(lead.answers);

  return (
    <Panel title="Form answers" bodyClassName={answers.length === 0 ? 'px-4 py-3.5' : 'px-4 py-1'}>
      {answers.length === 0 ? (
        <p className="text-sm text-ink-muted">This lead arrived without any form answers.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <tbody className="divide-y divide-line">
            {answers.map(([field, value]) => (
              <tr key={field}>
                <th
                  scope="row"
                  className="w-2/5 py-2.5 pr-4 text-left align-top text-xs font-medium text-ink-muted"
                >
                  {fieldLabel(field)}
                </th>
                <td className="py-2.5 align-top wrap-anywhere">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
};
