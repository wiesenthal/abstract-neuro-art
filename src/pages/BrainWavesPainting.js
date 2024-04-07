import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { useSync } from "../hooks/useSync";
import { notion, useNotion } from "../services/notion";
import BrainWaveDots from "./BrainWaveDots";


// Brainwaves Shape: 
// {
//   label: 'powerByBand',
// data: {
//   alpha: [
//     0.4326838933650053,
//     0.7011913998347046,
//     1.3717684682104212,
//     0.4043711439234614,
//     0.4276277910286375,
//     0.7343967679911133,
//     0.4643529443786634,
//     0.5012185195340365
//   ],
//   beta: [
//     1.0473270376446968,
//     0.6565360935142369,
//     0.9905849734272257,
//     0.4167252084581245,
//     0.5812834985846604,
//     0.9092642713573444,
//     0.9963075404421067,
//     1.0495665446734443
//   ],
//   delta: [
//     0.46131690566460004,
//     1.0030278320362798,
//     0.8563781797682917,
//     0.2911634678359473,
//     0.5829804845703581,
//     0.6714666592936025,
//     0.37730719195446316,
//     1.0851178080710937
//   ],
//   gamma: [
//     0.22648773160183822,
//     0.2171827127990081,
//     0.2626969784220435,
//     0.16349594919353772,
//     0.17327387900192714,
//     0.18990085940799623,
//     0.22908540295491436,
//     0.2537584109981627
//   ],
//   theta: [
//     0.6434504807739541,
//     0.936240328507981,
//     0.8679595766147628,
//     0.23662065697316603,
//     0.6048174207817718,
//     0.816112075629094,
//     0.3367745804938397,
//     1.1043745310136739
//   ]
// }
// }

const bands = ["alpha", "beta", "delta", "gamma", "theta"];
const channel_names = ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"];
const positions = {
  "CP3": [-1, 1],
  "C3": [-1, -1],
  "F5": [-1, -1],
  "PO3": [-1, 1],
  "PO4": [1, 1],
  "F6": [1, -1],
  "C4": [1, -1],
  "CP4": [1, 1]
}

const bandColors = {
  delta: "rgb(226,12,151)",
  theta: "rgb(29,181,208)",
  alpha: "rgb(97,35,127)",
  beta: "rgb(4,138,129)",
  gamma: "rgb(104,99,220)",
};

const initialPlacements = {
  delta: [250, 250],
  theta: [750, 250],
  alpha: [500, 500],
  gamma: [750, 750],
  beta: [250, 750]
}

const calculatePositionVector = (channel_deltas) => {
  // normalize channel deltas
  const min = Math.min(...channel_deltas);
  const max = Math.max(...channel_deltas);
  const normalized = channel_deltas.map(delta => (delta - min) / (max - min));

  const positionXVector = normalized.reduce((acc, delta, i) => acc + delta * positions[channel_names[i]][0], 0);
  const positionYVector = normalized.reduce((acc, delta, i) => acc + delta * positions[channel_names[i]][1], 0);
  return [positionXVector, positionYVector];
}
const MIN_SIZE = 5;
const MAX_SIZE = 70;

const initializeDots = () => {
  return bands.map(band => ({
    label: band,
    positionX: initialPlacements[band][0],
    positionY: initialPlacements[band][1],
    size: (MIN_SIZE + MAX_SIZE) / 2,
    colorString: bandColors[band]
  }));
}

export function BrainWavesPainting() {
  const { user } = useNotion();
  const [getBrainWaves, setBrainWaves] = useSync({});
  const [getBrainWaveDeltas, setBrainWaveDeltas] = useSync({});
  const [getBrainWaveBaselineSamples, setBrainWaveBaselineSamples] = useSync([]);
  const [getBrainWaveBaselineAvg, setBrainWaveBaselineAvg] = useSync({});
  const [getSpeedMultiplier, setSpeedMultiplier] = useSync(50);
  const [getBaselineSamples, setBaselineSamples] = useSync(12);
  const [getDots, setDots] = useSync(initializeDots());

  const calculateDeltaFromBaseline = () => {
    return Object.keys(getBrainWaveBaselineAvg()).reduce((acc, band) => {
      acc[band] = getBrainWaveBaselineAvg()[band].map((wave, i) => (wave - getBrainWaves()[band][i]) / wave);
      return acc;
    }, {});
  };

  const avgBand = (waves) => {
    return waves.reduce((acc, wave) => acc + wave, 0) / waves.length;
  };

  const doesHaveAvg = () => {
    return Object.keys(getBrainWaveBaselineAvg()).length > 0;
  };

  const updateDots = () => {
    const delta = calculateDeltaFromBaseline();

    const avgs = Object.keys(delta).map(band => avgBand(delta[band]));
    const minAvg = Math.min(...avgs);
    const maxAvg = Math.max(...avgs);

    setDots(prevDots => prevDots.map(dot => {
      const averageDelta = avgBand(delta[dot.label]);
      let deviation = (averageDelta - minAvg) / (maxAvg - minAvg);
      deviation = (deviation - 0.5) * 0.1;
      let newSize = dot.size * (1 + deviation);
      if (newSize < MIN_SIZE) {
        newSize = MIN_SIZE;
      } else if (newSize > MAX_SIZE) {
        newSize = MAX_SIZE;
      }
      const [positionXVector, positionYVector] = calculatePositionVector(delta[dot.label]);


      let newPositionX = dot.positionX + positionXVector * getSpeedMultiplier();
      let newPositionY = dot.positionY + positionYVector * getSpeedMultiplier();
      if (newPositionX < 0) {
        newPositionX = 1000 - newPositionX;
      } else if (newPositionX > 1000) {
        newPositionX = newPositionX - 1000;
      }
      if (newPositionY < 0) {
        newPositionY = 1000 - newPositionY;
      } else if (newPositionY > 1000) {
        newPositionY = newPositionY - 1000;
      }

      return {
        ...dot,
        positionX: newPositionX,
        positionY: newPositionY,
        size: newSize
      };
    }));
  };

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
      if (getBrainWaveBaselineSamples().length < getBaselineSamples()) {
        setBrainWaveBaselineSamples([...getBrainWaveBaselineSamples(), brainwaves.data]);
      } else {
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
        setBrainWaveBaselineAvg(avg);
        setBrainWaveBaselineSamples(prevSamples => prevSamples.slice(1));
      } if (Object.keys(getBrainWaveBaselineAvg()).length === 5) {
        updateDots();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <main className="main-container bg-gray-200 p-4 flex flex-col">
      {
        doesHaveAvg() ? (
          <>
            <BrainWaveDots getDots={getDots} />
            <button
              className=" bg-blue-200 rounded-full p-2 hover:bg-blue-400 hover:text-white w-64"
              onClick={() => {
                setBrainWaveBaselineSamples([]);
                setBrainWaveBaselineAvg({});
                setDots(initializeDots());
              }}
            >
              Reset
            </button>
            <div className="flex flex-col items-center mt-4 w-96">
              <h2 className="text-lg font-semibold">Speed Multiplier</h2>
              <input
                className="w-full"
                type="range"
                min="0.5"
                max="100"
                step="0.1"
                value={getSpeedMultiplier()}
                onChange={e => setSpeedMultiplier(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-center mt-4 w-96">
              <h2 className="text-lg font-semibold">Trailing Samples to Delta from</h2>
              <input
                className="w-full"
                type="range"
                min="1"
                max="32"
                step="1"
                value={getBaselineSamples()}
                onChange={e => setBaselineSamples(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center border rounded-lg p-2 m-2 w-2/3">
            <span className="text-center mb-2">Capturing Baseline...</span>
            <div className="bg-white rounded-full p-2 w-full">
              <div className={`bg-blue-500 rounded-full h-4`}
                style={{
                  width: `${getBrainWaveBaselineSamples().length / getBaselineSamples() * 100}%`
                }}></div>
            </div>
          </div>
        )
      }
    </main>
  );
}
