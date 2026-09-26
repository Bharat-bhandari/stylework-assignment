import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeadStatusControl } from '../src/components/LeadStatusControl';

describe('LeadStatusControl', () => {
  it('offers only the transitions the API allows', () => {
    render(
      <LeadStatusControl
        status="CONTACTED"
        allowedNextStatuses={['QUALIFIED', 'LOST']}
        onApply={vi.fn()}
        pending={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Mark qualified' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark lost' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark converted' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark contacted' })).not.toBeInTheDocument();
  });

  it('locks a terminal lead instead of offering transitions', () => {
    render(
      <LeadStatusControl
        status="CONVERTED"
        allowedNextStatuses={[]}
        onApply={vi.fn()}
        pending={false}
      />,
    );

    expect(screen.getByText(/final status/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('confirms a terminal transition before applying it', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <LeadStatusControl
        status="QUALIFIED"
        allowedNextStatuses={['CONVERTED', 'LOST']}
        onApply={onApply}
        pending={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Mark converted' }));

    expect(screen.getByText(/converted is final/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/note/i), 'Signed the annual plan');
    await user.click(screen.getByRole('button', { name: 'Yes, mark as Converted' }));

    expect(onApply).toHaveBeenCalledWith('CONVERTED', 'Signed the annual plan');
  });

  it('applies a non-terminal transition without a note', async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <LeadStatusControl
        status="NEW"
        allowedNextStatuses={['CONTACTED', 'LOST']}
        onApply={onApply}
        pending={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Mark contacted' }));
    await user.click(screen.getByRole('button', { name: 'Mark as Contacted' }));

    expect(onApply).toHaveBeenCalledWith('CONTACTED', undefined);
  });
});
