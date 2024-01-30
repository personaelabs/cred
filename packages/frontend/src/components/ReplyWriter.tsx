'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useState } from 'react';
import useWriter from '@/hooks/useWriter';
import { Button } from './ui/button';
import { ActionType } from '@/app/types';
import { toast } from 'sonner';
import { useMediaQuery } from '@/contexts/MediaQueryContext';
import { Input } from './ui/input';
import { MAX_TWEET_CHARS, getTweetIdFromUrl, getTweetUrl } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ReplyWriterModalProps {
  onSubmit: () => void;
  submitting: boolean;
  isOpen: boolean;
  readyToSubmit: boolean;
  setBody: (body: string) => void;
  setReplyTo: (replyTo: string) => void;
  onClose: () => void;
}

const DesktopReplyWriter = (props: ReplyWriterModalProps) => {
  const { onSubmit, submitting, readyToSubmit, setBody, setReplyTo } = props;

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={open => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>Reply</DialogTitle>
        <Input
          className="mb-4"
          placeholder="Reply to (tweet url)"
          onChange={e => setReplyTo(e.target.value)}
        ></Input>
        <Textarea
          autoFocus={false}
          onFocus={() => {}}
          onFocusCapture={() => {}}
          onChange={e => setBody(e.target.value)}
          className="text-[16px]"
          placeholder="Type your reply here..."
          rows={10}
          maxLength={MAX_TWEET_CHARS}
        ></Textarea>
        <div className="flex flex-row justify-between w-full">
          <Button variant="link" className="text-white" onClick={props.onClose}>
            Cancel
          </Button>
          <Button disabled={submitting || !readyToSubmit} onClick={onSubmit}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin"></Loader2>
            ) : (
              <></>
            )}
            Reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MobileReplyWriter = (props: ReplyWriterModalProps) => {
  const { onSubmit, submitting, readyToSubmit, setBody, setReplyTo } = props;
  return (
    <Drawer open={props.isOpen}>
      <DrawerContent className="h-full p-6 gap-4">
        <Input
          className="mb-4"
          placeholder="Reply to (tweet url)"
          onChange={e => setReplyTo(e.target.value)}
        ></Input>
        <Textarea
          autoFocus={false}
          onFocus={() => {}}
          onFocusCapture={() => {}}
          onChange={e => setBody(e.target.value)}
          className="text-[16px]"
          placeholder="Type your reply here..."
          maxLength={MAX_TWEET_CHARS}
        ></Textarea>
        <div className="flex flex-row justify-between w-full">
          <Button variant="link" className="text-white" onClick={props.onClose}>
            Cancel
          </Button>
          <Button disabled={submitting || !readyToSubmit} onClick={onSubmit}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin"></Loader2>
            ) : (
              <></>
            )}
            Reply
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

interface ReplyWriterProps {
  space: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ReplyWriter = (props: ReplyWriterProps) => {
  const [body, setBody] = useState<string>('');
  const { post, submittingPost } = useWriter();
  const { isMobile } = useMediaQuery();
  const [replyTo, setReplyTo] = useState<string>('');

  const handleReplyClick = async () => {
    const replyToId = getTweetIdFromUrl(replyTo);

    if (!replyToId) {
      toast.error('Invalid tweet URL');
      return;
    }

    // Submit reply
    const result = await post({
      text: body,
      replyTo,
      action: ActionType.Post,
    });

    toast('Reply sent!', {
      action: {
        label: 'View',
        onClick: () => {
          window.open(
            getTweetUrl({
              username: result.username,
              tweetId: result.tweetId,
            }),
            '_blank'
          );
        },
      },
    });

    props.onSubmit();
  };

  return isMobile ? (
    <MobileReplyWriter
      onSubmit={handleReplyClick}
      submitting={submittingPost}
      readyToSubmit={body.length > 0 && replyTo.length > 0}
      setBody={setBody}
      isOpen={props.isOpen}
      onClose={props.onClose}
      setReplyTo={setReplyTo}
    ></MobileReplyWriter>
  ) : (
    <DesktopReplyWriter
      onSubmit={handleReplyClick}
      submitting={submittingPost}
      readyToSubmit={body.length > 0 && replyTo.length > 0}
      setBody={setBody}
      isOpen={props.isOpen}
      setReplyTo={setReplyTo}
      onClose={props.onClose}
    ></DesktopReplyWriter>
  );
};

export default ReplyWriter;
