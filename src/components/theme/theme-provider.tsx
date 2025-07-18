import { ThemeProvider as BaseThemeProvider } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <BaseThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false} // Disable system theme detection
      disableTransitionOnChange
    >
      {children}
    </BaseThemeProvider>
  );
};

export { ThemeProvider };
