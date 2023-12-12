import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader } from './ui/card';
import { useRouter } from 'next/router';

const HeaderTabs = () => {
  const router = useRouter();

  return (
    <Tabs defaultValue="my_cred" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="my_cred" onClick={() => router.push('/')}>
          My cred
        </TabsTrigger>
        <TabsTrigger value="my_addresses" onClick={() => router.push('addresses')}>
          My addresses
        </TabsTrigger>
        <TabsTrigger value="settings" onClick={() => router.push('settings')}>
          Settings
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default HeaderTabs;
