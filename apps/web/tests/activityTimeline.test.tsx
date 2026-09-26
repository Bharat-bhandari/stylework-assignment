import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityTimeline } from '../src/components/ActivityTimeline';
import type { LeadActivity } from '../src/types/api';

const activities: LeadActivity[] = [
  {
    id: 'a3',
    leadId: 'lead-1',
    type: 'STATUS_CHANGED',
    actor: 'dashboard',
    fromStatus: 'NEW',
    toStatus: 'CONTACTED',
    changes: { note: 'Called and left a voicemail' },
    createdAt: '2026-09-26T10:30:00.000Z',
  },
  {
    id: 'a2',
    leadId: 'lead-1',
    type: 'LEAD_UPDATED',
    actor: 'meta-webhook',
    fromStatus: null,
    toStatus: null,
    changes: { phone: { from: '+919812345678', to: '+919800000000' } },
    createdAt: '2026-09-26T09:15:00.000Z',
  },
  {
    id: 'a1',
    leadId: 'lead-1',
    type: 'LEAD_CREATED',
    actor: 'meta-webhook',
    fromStatus: null,
    toStatus: null,
    changes: null,
    createdAt: '2026-09-26T09:00:00.000Z',
  },
];

describe('ActivityTimeline', () => {
  it('renders every activity type with its label and actor', () => {
    render(<ActivityTimeline activities={activities} />);

    expect(screen.getByText('Lead created')).toBeInTheDocument();
    expect(screen.getByText('Lead details updated')).toBeInTheDocument();
    expect(screen.getByText('Status changed')).toBeInTheDocument();

    expect(screen.getAllByText('by Meta webhook')).toHaveLength(2);
    expect(screen.getByText('by Dashboard')).toBeInTheDocument();
  });

  it('shows from and to badges plus the note for a status change', () => {
    render(<ActivityTimeline activities={activities} />);

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Called and left a voicemail')).toBeInTheDocument();
  });

  it('shows the field diff for an updated lead', () => {
    render(<ActivityTimeline activities={activities} />);

    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('+919812345678')).toBeInTheDocument();
    expect(screen.getByText('+919800000000')).toBeInTheDocument();
  });

  it('expands an answers object diff into the answers that actually changed', () => {
    render(
      <ActivityTimeline
        activities={[
          {
            id: 'a4',
            leadId: 'lead-1',
            type: 'LEAD_UPDATED',
            actor: 'meta-webhook',
            fromStatus: null,
            toStatus: null,
            changes: {
              answers: {
                from: { city: 'Bengaluru', team_size: '6-15' },
                to: { city: 'Pune', team_size: '6-15' },
              },
            },
            createdAt: '2026-09-26T09:15:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    expect(screen.getByText('Pune')).toBeInTheDocument();
    expect(screen.queryByText('Team size')).not.toBeInTheDocument();
  });

  it('renders one list item per activity', () => {
    render(<ActivityTimeline activities={activities} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
