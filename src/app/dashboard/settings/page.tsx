"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud, PlusCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { lotteries as initialLotteries, type Lottery } from "@/lib/data";
import { Ticket } from "lucide-react";

const newLotterySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  drawTimes: z.string().min(1, "At least one draw time is required"),
});

const newUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


export default function SettingsPage() {
  const { toast } = useToast();
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      toast({
        title: "File Uploaded (Simulated)",
        description: `${file.name} has been uploaded. Logo replacement is not implemented.`,
      });
    }
  };
  
  const newLotteryForm = useForm<z.infer<typeof newLotterySchema>>({
    resolver: zodResolver(newLotterySchema),
    defaultValues: { name: "", drawTimes: "" },
  });

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { username: "", password: "" },
  });
  
  const onNewLotterySubmit = (values: z.infer<typeof newLotterySchema>) => {
     const newLottery: Lottery = {
       id: values.name.toLowerCase().replace(/\s/g, '-'),
       name: values.name,
       Icon: Ticket, // Using a default icon for new lotteries
       drawTimes: values.drawTimes.split(',').map(t => t.trim()),
     };

     // In a real app, this would be an API call to a database.
     // Here we simulate by updating client-side state.
     // To make this "permanent" for the demo, we'd need to write to `src/lib/data.ts`
     // which is beyond the scope of this simulation.
     setLotteries([...lotteries, newLottery]);

     toast({
        title: "New Lottery Added (Simulated)",
        description: `Lottery '${values.name}' with draws at ${values.drawTimes} has been created.`,
      });
      newLotteryForm.reset();
  }
  
  const onNewUserSubmit = (values: z.infer<typeof newUserSchema>) => {
     toast({
        title: "New User Added (Simulated)",
        description: `User '${values.username}' has been created.`,
      });
      newUserForm.reset();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">App Customization</CardTitle>
            <CardDescription>
              Modify the look and feel of your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label className="font-medium">App Logo</label>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Input
                        id="logo-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                      />
                      <Button variant="outline" asChild className="pointer-events-none w-full">
                        <div>
                         <UploadCloud className="mr-2" />
                         <span>Upload Logo</span>
                        </div>
                      </Button>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground">Upload a new logo. Recommended size: 128x128px.</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Lottery Management</CardTitle>
            <CardDescription>
              Add new lotteries. Existing lotteries are shown below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newLotteryForm}>
                <form onSubmit={newLotteryForm.handleSubmit(onNewLotterySubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                            control={newLotteryForm.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lottery Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., Sunset Millions" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={newLotteryForm.control}
                            name="drawTimes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Draw Times (comma-separated)</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., 10:00 AM, 04:00 PM" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="md:pt-8">
                             <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2" />
                                Add Lottery
                             </Button>
                        </div>
                    </div>
                </form>
            </Form>
             <div className="mt-6">
                <h3 className="text-lg font-medium">Current Lotteries</h3>
                 <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                    {lotteries.map(l => <li key={l.id}>{l.name} ({l.drawTimes.join(', ')})</li>)}
                 </ul>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">User Management</CardTitle>
            <CardDescription>
              Add new users to the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newUserForm}>
                <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                            control={newUserForm.control}
                            name="username"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., user01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={newUserForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="md:pt-8">
                             <Button type="submit" className="w-full">
                                <UserPlus className="mr-2" />
                                Add User
                             </Button>
                        </div>
                    </div>
                </form>
            </Form>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
