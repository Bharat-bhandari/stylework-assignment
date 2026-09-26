import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { simulateLead } from '../api/dev.api';
import { describeError } from '../helper/apiError';
import { useHealthQuery } from '../hooks/health.query';
import { leadKeys } from '../hooks/lead.query';
import { useToast } from '../hooks/toast.context';
import { Button } from './Button';
import { LogoMark, PlusIcon } from './icons';

export const AppHeader = () => {
  const health = useHealthQuery();
  const queryClient = useQueryClient();
  const pushToast = useToast();

  const simulate = useMutation({
    mutationFn: simulateLead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all });
      pushToast({
        tone: 'success',
        title: 'Simulated lead sent to the webhook',
        detail: 'It appears in the list once the webhook event has been processed.',
      });
    },
    onError: (error) => {
      pushToast({
        tone: 'error',
        title: 'Could not simulate a lead',
        detail: describeError(error),
      });
    },
  });

  return (
    <header className="on-ink sticky top-0 z-40 bg-ink text-ink-invert">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Link to="/leads" className="flex items-center gap-2.5 rounded-sm">
          <LogoMark />
          <span className="text-md font-semibold tracking-[-0.011em]">Lead Intake</span>
        </Link>
        <span className="hidden border-l border-white/15 pl-3 text-xs text-ink-invert-muted sm:inline">
          Meta Lead Ads
        </span>

        <div className="ml-auto flex items-center gap-2">
          {health.data?.demoTools === true ? (
            <Button
              variant="invert"
              size="sm"
              icon={<PlusIcon className="size-3.5" />}
              loading={simulate.isPending}
              onClick={() => simulate.mutate()}
            >
              Simulate Meta lead
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
