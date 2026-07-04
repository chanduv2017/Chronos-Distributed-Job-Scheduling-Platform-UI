import { Toaster as SonnerToaster } from "sonner";

const Toaster = () => (
  <SonnerToaster
    theme="dark"
    position="top-right"
    toastOptions={{
      classNames: {
        toast: "bg-card border-border shadow-lg",
        title: "text-foreground",
        description: "text-muted-foreground",
        actionButton: "bg-primary text-primary-foreground",
        cancelButton: "bg-muted text-muted-foreground",
      },
    }}
  />
);

export { Toaster };
