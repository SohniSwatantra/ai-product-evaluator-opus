import { StackHandler } from "@stackframe/stack"; 
import { stackServerApp } from "../../../stack/server"; 
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";

export default function Handler(props: unknown) { 
   return (
     <BackgroundGlow>
       <Navbar />
       <div className="pt-32 min-h-screen">
         <StackHandler fullPage app={stackServerApp} routeProps={props} />
       </div>
     </BackgroundGlow>
   ); 
} 
