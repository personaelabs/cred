import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [selectedCred, setSelectedCred] = useState<string[]>([]);

  return (
    <div className="align-center mt-8 flex w-[500px] flex-col">
      <div className="flex w-full flex-col space-y-4">
        <Image
          src="/dummy-avatar.svg"
          width={40}
          height={40}
          alt="Dummy Avatar"
          objectFit="contain"
        ></Image>
        <div>
          <Textarea placeholder="Enter your message here"></Textarea>
        </div>
        <div className="flex w-full justify-between">
          <Select
            onValueChange={(cred) => {
              setSelectedCred((prev) => [...prev, cred]);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Attach cred" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cred</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button>Publish in X</Button>
        </div>
      </div>
    </div>
  );
}
