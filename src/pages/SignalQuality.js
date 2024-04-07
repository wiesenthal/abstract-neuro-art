import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { notion, useNotion } from "../services/notion";
import { Nav } from "../components/Nav";

export function SignalQuality() {
  const { user } = useNotion();
  const [signalQualities, setSignalQualities] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = notion.signalQuality().subscribe((quality) => {
      for (const key of Object.keys(quality)) {
        setSignalQualities(
          prevState => ({
            ...prevState,
            [key]: quality[key].status
          })
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <main className="main-container bg-gray-200 p-4">
      {user ? <Nav /> : null}
      <div className="signal-quality bg-white rounded-lg p-4 shadow-md">
        <h2 className="text-2xl font-bold mb-4">Signal Quality</h2>
        {Object.keys(signalQualities).map((key) => (
          <div key={key} className="mb-2">
            <span className="font-bold">{key}:</span> {signalQualities[key]}
          </div>
        ))}
      </div>
    </main>
  );
}
