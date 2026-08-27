import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import MainRouters from "./routers/MainRouters";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalNotification from "./components/GlobalNotification";
import NotificationInitializer from "./components/Notification/NotificationInitializer";
import GlobalApiErrorModal from "./components/shared/GlobalApiErrorModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Do not retry on authorization / authentication errors (401, 403)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Stop after 3 failed attempts
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000), // 1s, 2s, 4s max backoff
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000, // 2 minutes default stale time
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    },
  },
});

import { theme } from "./theme";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <AuthProvider>
              <GlobalNotification />
              <NotificationInitializer />
              <GlobalApiErrorModal />
              <MainRouters />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
