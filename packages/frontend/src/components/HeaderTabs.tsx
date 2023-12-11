import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader } from './ui/card';
import { useRouter } from 'next/router';

const HeaderTabs = () => {
  const router = useRouter();

  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account" onClick={() => router.push('/')}>
          My cred
        </TabsTrigger>
        <TabsTrigger value="password" onClick={() => router.push('addresses')}>
          My addresses
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account"></TabsContent>
      <TabsContent value="password"></TabsContent>
    </Tabs>
  );
};

export default HeaderTabs;
