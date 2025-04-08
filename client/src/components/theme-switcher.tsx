import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Predefined themes with primary colors and styles
const themes = [
  { primary: "#0ea5e9", variant: "professional", appearance: "light", name: "Blue Professional" },
  { primary: "#10b981", variant: "professional", appearance: "light", name: "Green Professional" },
  { primary: "#6366f1", variant: "vibrant", appearance: "light", name: "Indigo Vibrant" },
  { primary: "#ec4899", variant: "vibrant", appearance: "light", name: "Pink Vibrant" },
  { primary: "#f59e0b", variant: "tint", appearance: "light", name: "Amber Tint" },
  { primary: "#0ea5e9", variant: "professional", appearance: "dark", name: "Blue Professional Dark" },
  { primary: "#10b981", variant: "professional", appearance: "dark", name: "Green Professional Dark" },
  { primary: "#6366f1", variant: "vibrant", appearance: "dark", name: "Indigo Vibrant Dark" },
  { primary: "#ec4899", variant: "vibrant", appearance: "dark", name: "Pink Vibrant Dark" },
  { primary: "#f59e0b", variant: "tint", appearance: "dark", name: "Amber Tint Dark" },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);

  useEffect(() => {
    // Get current theme if it exists
    const storedTheme = localStorage.getItem("user-theme");
    if (storedTheme) {
      setCurrentTheme(JSON.parse(storedTheme).name);
    }
  }, []);

  const applyTheme = (theme: typeof themes[0]) => {
    fetch("/api/theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(theme),
    })
      .then(() => {
        localStorage.setItem("user-theme", JSON.stringify(theme));
        setCurrentTheme(theme.name);
        
        // Update theme JSON in the DOM without requiring a refresh
        const themeObject = {
          primary: theme.primary,
          variant: theme.variant,
          appearance: theme.appearance,
          radius: 0.5, // Default radius
        };
        
        // Find and update <script id="shadcn-theme"> content
        const themeScript = document.getElementById("shadcn-theme");
        if (themeScript) {
          themeScript.textContent = JSON.stringify(themeObject);
          
          const root = document.documentElement;
          root.className = theme.appearance === 'dark' ? 'dark' : '';
          root.style.setProperty('--primary', theme.primary);
          
          // Dispatch theme change event
          window.dispatchEvent(new CustomEvent("theme-update"));
        }
        
        toast({
          title: "Theme changed",
          description: `Applied ${theme.name} theme`,
        });
      })
      .catch(() => {
        // Fallback for static environments or when API isn't available
        const themeObject = {
          primary: theme.primary,
          variant: theme.variant,
          appearance: theme.appearance,
          radius: 0.5,
        };
        
        localStorage.setItem("user-theme", JSON.stringify(theme));
        setCurrentTheme(theme.name);
        
        // Update theme directly in localStorage
        localStorage.setItem("shadcn-theme", JSON.stringify(themeObject));
        
        // Refresh page to apply theme
        window.location.reload();
      });
  };

  const randomTheme = () => {
    const randomIndex = Math.floor(Math.random() * themes.length);
    applyTheme(themes[randomIndex]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative text-white")}
        >
          <Palette className="h-5 w-5" />
          {currentTheme && (
            <span className="sr-only">Current theme: {currentTheme}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Theme</h4>
            <p className="text-sm text-muted-foreground">
              Select a theme or try a random one
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <Button
                key={theme.name}
                variant="outline"
                className="justify-start"
                onClick={() => applyTheme(theme)}
                style={{ 
                  borderColor: theme.primary,
                  backgroundColor: theme.appearance === "dark" ? "#1a1a1a" : "#ffffff",
                  color: theme.appearance === "dark" ? "#ffffff" : "#000000",
                }}
              >
                <div 
                  className="mr-2 h-4 w-4 rounded-full" 
                  style={{ backgroundColor: theme.primary }}
                />
                <span className="text-xs">{theme.name.split(" ")[0]}</span>
              </Button>
            ))}
            <Button
              variant="outline"
              className="justify-start"
              onClick={randomTheme}
            >
              <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
              <span className="text-xs">Random</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}