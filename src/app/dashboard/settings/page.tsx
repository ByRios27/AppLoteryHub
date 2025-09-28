'use client';

import { useState, useRef } from 'react';
import { useStateContext } from '@/context/StateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { iconMap } from '@/lib/icon-map';

export default function SettingsPage() {
  const { lotteries, setLotteries } = useStateContext();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleIconChange = (id: string, newIcon: string) => {
    const updatedLotteries = lotteries.map((lottery) =>
      lottery.id === id ? { ...lottery, icon: newIcon } : lottery
    );
    setLotteries(updatedLotteries);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleIconChange(id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  const handleSaveChanges = () => {
    toast({ title: 'Success', description: 'Changes saved successfully!' });
    router.push('/dashboard');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Settings</h1>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lottery Icons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lotteries.map((lottery) => {
                const Icon = lottery.icon.startsWith('data:image')
                  ? null
                  : iconMap[lottery.icon as keyof typeof iconMap] || iconMap.Ticket;

                return (
                  <div key={lottery.id} className="flex items-center justify-between p-3 rounded-lg bg-card-foreground/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-card overflow-hidden">
                        {Icon ? (
                          <Icon className="w-8 h-8 text-primary" />
                        ) : (
                          <img src={lottery.icon} alt={lottery.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-foreground">{lottery.name}</span>
                    </div>
                    <Button onClick={() => triggerFileInput(lottery.id)} variant="outline">
                      Change Icon
                    </Button>
                    <Input
                      type="file"
                      className="hidden"
                      ref={(el) => (fileInputRefs.current[lottery.id] = el)}
                      onChange={(e) => handleFileChange(e, lottery.id)}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveChanges} size="lg">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
