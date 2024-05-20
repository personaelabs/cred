'use client';
import { Switch } from '@/components/ui/switch';
import { useHeaderOptions } from '@/contexts/HeaderContext';
import { useEffect } from 'react';

const NotificationSettingsPage = () => {
  const { setOptions } = useHeaderOptions();

  useEffect(() => {
    setOptions({
      title: 'Notifications',
      showBackButton: true,
    });
  }, [setOptions]);

  return (
    <div className="fle flex-col w-full h-full justify-center items-center">
      <div className="flex flex-row items-center gap-x-2">
        <Switch></Switch>
        <div>Enable notification</div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
