'use client';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { useState } from 'react';
import useWriter from '@/hooks/useWriter';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { ActionType } from '@/app/types';
import { toast } from 'sonner';
import { MAX_TWEET_CHARS, getTweetUrl } from '@/lib/utils';
import { useMediaQuery } from '@/contexts/MediaQueryContext';

interface PostWriterModalProps {
  onSubmit: () => void;
  submitting: boolean;
  isOpen: boolean;
  readyToSubmit: boolean;
  body: string;
  setBody: (body: string) => void;
  onClose: () => void;
}

const DesktopPostWriter = (props: PostWriterModalProps) => {
  const { onSubmit, submitting, readyToSubmit, body, setBody } = props;
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
        <>
          <DialogTitle>Create a post</DialogTitle>
          <Textarea
            onFocus={e => {
              e.preventDefault();
            }}
            onChange={e => setBody(e.target.value)}
            className="text-[16px] h-full z-10"
            placeholder="Type your message here"
            rows={10}
            maxLength={MAX_TWEET_CHARS}
          ></Textarea>
          {body.length >= MAX_TWEET_CHARS ? (
            <div className="text-red-600 text-right">
              Reached character limit ({MAX_TWEET_CHARS})
            </div>
          ) : (
            <></>
          )}
          <div className="flex flex-row justify-between w-full">
            <Button
              variant="link"
              onClick={props.onClose}
              className="text-[white]"
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !readyToSubmit}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"></Loader2>
              ) : (
                <></>
              )}
              Post
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
};

const MobilePostWriter = (props: PostWriterModalProps) => {
  const { onSubmit, submitting, readyToSubmit, body, setBody } = props;
  return (
    <Drawer open={props.isOpen} closeThreshold={1}>
      <DrawerContent className="h-full p-6 gap-4 pointer-events-none">
        <>
          <div className="flex flex-row justify-between w-full">
            <Button
              variant="link"
              onClick={props.onClose}
              className="text-[white]"
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={submitting || !readyToSubmit}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin"></Loader2>
              ) : (
                <></>
              )}
              Post
            </Button>
          </div>
          <Textarea
            onFocus={e => {
              e.preventDefault();
            }}
            onChange={e => setBody(e.target.value)}
            className="text-[16px] h-full z-10"
            placeholder="Type your message here"
            maxLength={MAX_TWEET_CHARS}
          ></Textarea>
          {body.length >= MAX_TWEET_CHARS ? (
            <div className="text-red-600 text-right">
              Reached character limit ({MAX_TWEET_CHARS})
            </div>
          ) : (
            <></>
          )}
        </>
      </DrawerContent>
    </Drawer>
  );
};

interface PostWriterProps {
  space: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const PostWriter = (props: PostWriterProps) => {
  const [body, setBody] = useState<string>('');
  const { post, submittingPost } = useWriter();
  const { isMobile } = useMediaQuery();

  const handleSubmitClick = async () => {
    // Submit post
    const result = await post({
      text: body,
      action: ActionType.Post,
    });

    toast('Tweet sent!', {
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

    props.onClose();
    props.onSubmit();
  };

  return isMobile ? (
    <MobilePostWriter
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSubmit={handleSubmitClick}
      submitting={submittingPost}
      readyToSubmit={body.length > 0}
      body={body}
      setBody={setBody}
    ></MobilePostWriter>
  ) : (
    <DesktopPostWriter
      isOpen={props.isOpen}
      onClose={props.onClose}
      onSubmit={handleSubmitClick}
      submitting={submittingPost}
      readyToSubmit={body.length > 0}
      body={body}
      setBody={setBody}
    ></DesktopPostWriter>
  );
};

export default PostWriter;
