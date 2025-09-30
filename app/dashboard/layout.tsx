import { ReactNode } from "react";
import Header from "@/components/ui/header";
import { StateContextProvider } from "@/context/StateContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <StateContextProvider>
      <Header />
      <main>{children}</main>
    </StateContextProvider>
  );
}
