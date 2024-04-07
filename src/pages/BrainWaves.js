import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { useSync } from "../hooks/useSync";
import { notion, useNotion } from "../services/notion";
import { Nav } from "../components/Nav";

// Brainwaves Shape: 
// {
//   label: 'powerByBand',
//   data: {
//     alpha: [
//       0.4326838933650053,
//       0.7011913998347046,
//       1.3717684682104212,
//       0.4043711439234614,
//       0.4276277910286375,
//       0.7343967679911133,
//       0.4643529443786634,
//       0.5012185195340365
//     ],
//     beta: [
//       1.0473270376446968,
//       0.6565360935142369,
//       0.9905849734272257,
//       0.4167252084581245,
//       0.5812834985846604,
//       0.9092642713573444,
//       0.9963075404421067,
//       1.0495665446734443
//     ],
//     delta: [
//       0.46131690566460004,
//       1.0030278320362798,
//       0.8563781797682917,
//       0.2911634678359473,
//       0.5829804845703581,
//       0.6714666592936025,
//       0.37730719195446316,
//       1.0851178080710937
//     ],
//     gamma: [
//       0.22648773160183822,
//       0.2171827127990081,
//       0.2626969784220435,
//       0.16349594919353772,
//       0.17327387900192714,
//       0.18990085940799623,
//       0.22908540295491436,
//       0.2537584109981627
//     ],
//     theta: [
//       0.6434504807739541,
//       0.936240328507981,
//       0.8679595766147628,
//       0.23662065697316603,
//       0.6048174207817718,
//       0.816112075629094,
//       0.3367745804938397,
//       1.1043745310136739
//     ]
//   }
// }

export function BrainWaves() {
  const { user } = useNotion();
  const [getBrainWaves, setBrainWaves] = useSync({});
  const [getBrainWaveDeltas, setBrainWaveDeltas] = useSync({});
  const [getBrainWaveBaselineSamples, setBrainWaveBaselineSamples] = useSync([]);
  const [getBrainWaveBaselineAvg, setBrainWaveBaselineAvg] = useSync({});

  const baselineSamples = 32;

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = notion.brainwaves("powerByBand").subscribe((brainwaves) => {
      const prevBrainWaves = getBrainWaves();
      setBrainWaves(brainwaves.data);
      if (Object.keys(prevBrainWaves).length === 0) {
        return;
      }
      setBrainWaveDeltas(
        Object.keys(brainwaves.data).reduce((acc, key) => {
          acc[key] = brainwaves.data[key].map((wave, i) => {
            return (wave - prevBrainWaves[key][i]) / prevBrainWaves[key][i];
          });
          return acc;
        }, {})
      );
      if (getBrainWaveBaselineSamples().length < baselineSamples) {
        console.log("Adding to baseline samples");
        setBrainWaveBaselineSamples([...getBrainWaveBaselineSamples(), brainwaves.data]);
      } else if (Object.keys(getBrainWaveBaselineAvg()).length === 0) {
        console.log("Calculating baseline avg");
        // const one = Object.keys(brainwaves.data).reduce((acc, band) => {
        //   // acc[band] = [0.1, 0.1, etc]
        //   if (acc[band] === undefined) {
        //     acc[band] = brainwaves.data[band];
        //   } else {
        //     acc[band] = acc[band].map((wave, i) => wave + brainwaves.data[band][i]);
        //   }
        //   return acc;
        // }, {});
        const sum = getBrainWaveBaselineSamples().reduce((sum_acc, sample) => {
          Object.keys(sample).forEach((band) => {
            if (sum_acc[band] === undefined) {
              // Clone the array to avoid direct reference
              sum_acc[band] = [...sample[band]];
            } else {
              sum_acc[band] = sum_acc[band].map((wave, i) => wave + sample[band][i]);
            }
          });
          return sum_acc;
        }, {});

        const baselineSampleCount = getBrainWaveBaselineSamples().length;
        const avg = Object.keys(sum).reduce((avg_acc, band) => {
          // Divide by the correct number of samples
          avg_acc[band] = sum[band].map((wave) => wave / baselineSampleCount);
          return avg_acc;
        }, {});
        // console.log(sum);
        // console.log(brainwaves.data);
        console.log(avg);
        setBrainWaveBaselineAvg(avg);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <main className="main-container bg-gray-200 p-4">
      {/* {user ? <Nav /> : null} */}
      <div className="brain-waves bg-white rounded-lg p-4 shadow-md flex flex-wrap">
        <h2 className="text-2xl font-bold mb-4 w-full">Brain Waves</h2>
        {Object.keys(getBrainWaveBaselineAvg()).map((band) => (
          <div key={band} className="mb-2 w-full md:w-1/2 lg:w-1/3">
            <span className="font-bold">{band}:</span>
            {getBrainWaveBaselineAvg()[band].map((waveChange, i) => (
              <div key={i} className="bg-gray-200 rounded-full p-2 w-96">
                <div className={`bg-blue-500 rounded-full h-4`}
                  style={{
                    width: `${50 - waveChange * 5}%`
                  }}></div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <button
        className="bg-blue-500 rounded-full p-2"
        onClick={() => {
          setBrainWaveBaselineSamples([]);
          setBrainWaveBaselineAvg({});
        }}
      >
        Reset Baseline
      </button>
    </main>
  );
}
