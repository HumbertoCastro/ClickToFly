import "@fontsource-variable/fraunces/wght.css";
import "@fontsource-variable/source-sans-3/wght.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DeploymentConfigurationError } from "./components/DeploymentConfigurationError";
import { AppProvider } from "./context/AppContext";
import { isProductionDataConfigurationBlocked } from "./lib/repository";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isProductionDataConfigurationBlocked ? (
      <DeploymentConfigurationError />
    ) : (
      <AppProvider>
        <App />
      </AppProvider>
    )}
  </StrictMode>,
);
