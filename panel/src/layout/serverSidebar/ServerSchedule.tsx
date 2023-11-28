import { Button } from '@/components/ui/button';
import { useGlobalStatus } from '@/hooks/status';
import { cn, msToDuration } from '@/lib/utils';
import { PenLineIcon, PlayCircleIcon, PlusCircleIcon, XCircleIcon } from 'lucide-react';


export default function ServerSchedule() {
    const globalStatus = useGlobalStatus();
    if (!globalStatus) {
        return <div>
            <h2 className="mb-1 text-lg font-semibold tracking-tight">
                Next Restart:
            </h2>
            <span className='font-light text-muted-foreground italic'>loading...</span>
        </div>
    }

    const { scheduler } = globalStatus;
    let nextScheduledText = 'nothing scheduled';
    let nextScheduledClasses = 'text-muted-foreground italic';
    let disableAddEditBtn = false;
    let showCancelBtn = false;
    let showEnableBtn = false;
    const hasScheduledRestart = typeof scheduler.nextRelativeMs === 'number';
    if (hasScheduledRestart) {
        const tempFlag = (scheduler.nextIsTemp) ? '(temp)' : '';
        const relativeTime = msToDuration(scheduler.nextRelativeMs, { units: ['h', 'm'] });
        const isLessThanMinute = scheduler.nextRelativeMs < 60_000;
        if (isLessThanMinute) {
            disableAddEditBtn = true;
            nextScheduledText = `right now ${tempFlag}`;
        } else {
            nextScheduledText = `in ${relativeTime} ${tempFlag}`;
        }

        if (scheduler.nextSkip) {
            nextScheduledClasses = 'text-muted-foreground';
            if (!isLessThanMinute) {
                showEnableBtn = true;
            }
        } else {
            nextScheduledClasses = 'text-warning';
            if (!isLessThanMinute) {
                showCancelBtn = true;
            }
        }
    }

    const handleEdit = () => {
        alert('FIXME: Edit');
    }
    const handleAddSchedule = () => {
        alert('FIXME: Add Schedule');
    }
    const handleCancel = () => {
        alert('FIXME: Cancel');
    }
    const handleEnable = () => {
        alert('FIXME: Enable');
    }

    return <div>
        <h2 className="mb-1 text-lg font-semibold tracking-tight">
            Next Restart:
        </h2>
        <span className={cn('font-light', nextScheduledClasses)}>{nextScheduledText}</span>
        <div className='flex flex-row justify-between gap-2 mt-2 flex-wrap'>
            {hasScheduledRestart ? (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    disabled={disableAddEditBtn}
                    onClick={handleEdit}
                >
                    <PenLineIcon className='h-4 w-4 mr-1' /> Edit
                </Button>
            ) : (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    disabled={disableAddEditBtn}
                    onClick={handleAddSchedule}
                >
                    <PlusCircleIcon className='h-4 w-4 mr-1' /> Schedule Restart
                </Button>
            )}
            {showCancelBtn && (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border shadow'
                    onClick={handleCancel}
                >
                    <XCircleIcon className='h-4 w-4 mr-1' /> Cancel
                </Button>
            )}
            {showEnableBtn && (
                <Button
                    size='xs'
                    variant='ghost'
                    className='flex-grow bg-muted border'
                    onClick={handleEnable}
                >
                    <PlayCircleIcon className='h-4 w-4 mr-1' /> Enable
                </Button>
            )}
        </div>
    </div>
}
