import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCallback, useEffect, useState } from 'react';

interface BotInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BotInstructionModal = (props: BotInstructionModalProps) => {
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);

  const doNotShowAgainClick = useCallback(() => {
    window.localStorage.setItem('doNotShowBotInstruction', 'true');
    setDoNotShowAgain(true);
    props.onClose();
  }, [props]);

  useEffect(() => {
    if (window.localStorage.getItem('doNotShowBotInstruction') === 'true') {
      setDoNotShowAgain(true);
    }
  }, []);

  return (
    <Dialog open={props.isOpen && !doNotShowAgain}>
      <DialogContent>
        <DialogTitle>Creddd added!</DialogTitle>
        <div>
          Tag <b>@credbot</b> on Farcaster to use your creddd.
        </div>
        <div>
          <div>
            <ul className="list-disc list-outside">
              <li>
                Reply to any cast with &ldquo;<b>@credbost boost</b>&ldquo; to
                boost it to <b>@credbot</b>s feed.
              </li>
              <li>
                Reply to any cast with &ldquo;<b>@credbot flex</b>&ldquo; to
                flex your creddd in thread.
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={doNotShowAgainClick}>
            Don&apos;t show this again
          </Button>
          <Button variant="outline" onClick={props.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BotInstructionModal;
