import React, { useEffect } from "react";
import { Router, navigate } from "@reach/router";

import { ProvideNotion } from "./services/notion";
import { Devices } from "./pages/Devices";
import { Loading } from "./components/Loading";
import { Login } from "./pages/Login";
import { Logout } from "./pages/Logout";
import { Calm } from "./pages/Calm";
import { SignalQuality } from "./pages/SignalQuality";

import { useNotion } from "./services/notion";
import { BrainWaves } from "./pages/BrainWaves";
import { BrainWavesPainting } from "./pages/BrainWavesPainting";

export function App() {
  return (
    <ProvideNotion>
      <Routes />
    </ProvideNotion>
  );
}

function Routes() {
  const { user, loadingUser } = useNotion();

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate("/login");
    }
  }, [user, loadingUser]);

  if (loadingUser) {
    return <Loading />;
  }

  return (
    <Router>
      <BrainWaves path="/brain-waves" />
      <BrainWavesPainting path="/" />
      <Calm path="/calm" />
      <SignalQuality path="/signal-quality" />
      <Devices path="/devices" />
      <Login path="/login" />
      <Logout path="/logout" />
    </Router>
  );
}
