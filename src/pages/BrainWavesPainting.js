import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { useSync } from "../hooks/useSync";
import { notion, useNotion } from "../services/notion";
import BrainWaveDot from "./BrainWaveDot";


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

export function BrainWavesPainting() {
  const { user } = useNotion();
  const [getBrainWaves, setBrainWaves] = useSync({});
  const [getBrainWaveDeltas, setBrainWaveDeltas] = useSync({});
  const [getBrainWaveBaselineSamples, setBrainWaveBaselineSamples] = useSync([]);
  const [getBrainWaveBaselineAvg, setBrainWaveBaselineAvg] = useSync({});
  const [getDotPositionX, setDotPositionX] = useSync(500);
  const [getDotPositionY, setDotPositionY] = useSync(500);
  const [getDotSize, setDotSize] = useSync(5);
  const [getDotColorR, setDotColorR] = useSync(255);
  const [getDotColorG, setDotColorG] = useSync(0);
  const [getDotColorB, setDotColorB] = useSync(255);

  const baselineSamples = 16;

  const calculateDeltaFromBaseline = () => {
    return Object.keys(getBrainWaveBaselineAvg()).reduce((acc, band) => {
      acc[band] = getBrainWaveBaselineAvg()[band].map((wave, i) => wave - getBrainWaves()[band][i]);
      return acc;
    }, {});
  };

  const avgBand = (waves) => {
    return waves.reduce((acc, wave) => acc + wave, 0) / waves.length;
  };

  const doesHaveAvg = () => {
    return Object.keys(getBrainWaveBaselineAvg()).length > 0;
  };

  const updateDot = () => {
    const avg = Object.keys(calculateDeltaFromBaseline()).reduce((acc, band) => {
      acc[band] = avgBand(calculateDeltaFromBaseline()[band]);
      return acc;
    }, {});
    const allBandAvg = Object.values(avg).reduce((acc, wave) => acc + wave, 0) / Object.keys(avg).length;
    setDotPositionX(prevX => {
      const newX = prevX + (avg.alpha * 0.5);
      if (newX < 0) {
        return 1000 + newX;
      } else if (newX > 1000) {
        return newX - 1000;
      }
      return newX;
    });
    setDotPositionY(prevY => {
      const newY = prevY + (avg.beta * 0.5);
      if (newY < 0) {
        return 1000 + newY;
      } else if (newY > 1000) {
        return newY - 1000;
      }
      return newY;
    });
    setDotSize(prevSize => {
      // average all bands
      const newSize = prevSize + allBandAvg;
      if (newSize < 0) {
        return 1;
      } else if (newSize > 10) {
        return 10;
      }
      return newSize;
    });
    setDotColorR(prevR => {
      const newR = prevR + avg.theta;
      if (newR < 0) {
        return 255 + newR;
      } else if (newR > 255) {
        return newR - 255;
      }
      return newR;
    });
    setDotColorG(prevG => {
      const newG = prevG + avg.delta;
      if (newG < 0) {
        return 255 + newG;
      } else if (newG > 255) {
        return newG - 255;
      }
      return newG;
    });
    setDotColorB(prevB => {
      const newB = prevB + avg.gamma;
      if (newB < 0) {
        return 255 + newB;
      } else if (newB > 255) {
        return newB - 255;
      }
      return newB;
    });
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
      if (getBrainWaveBaselineSamples().length < baselineSamples) {
        console.log("Adding to baseline samples");
        setBrainWaveBaselineSamples([...getBrainWaveBaselineSamples(), brainwaves.data]);
      // } else if (Object.keys(getBrainWaveBaselineAvg()).length === 0) {
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
        console.log(avg);
        setBrainWaveBaselineAvg(avg);
        setBrainWaveBaselineSamples(prevSamples => prevSamples.slice(1));
      } if (Object.keys(getBrainWaveBaselineAvg()).length === 5) {
        updateDot();
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
          <BrainWaveDot
            positionX={getDotPositionX()}
            positionY={getDotPositionY()}
            size={getDotSize()}
            colorR={getDotColorR()}
            colorG={getDotColorG()}
            colorB={getDotColorB()}
          />
        ) : (
          <div className="flex flex-col items-center justify-center border rounded-lg p-2 m-2 w-2/3">
            <span className="text-center mb-2">Capturing Baseline...</span>
            <div className="bg-white rounded-full p-2 w-full">
              <div className={`bg-blue-500 rounded-full h-4`}
                style={{
                  width: `${getBrainWaveBaselineSamples().length / baselineSamples * 100}%`
                }}></div>
            </div>
          </div>
        )
      }
      {
        doesHaveAvg() &&
        <button
          className=" bg-blue-200 rounded-full p-2 hover:bg-blue-400 hover:text-white w-64"
          onClick={() => {
            setBrainWaveBaselineSamples([]);
            setBrainWaveBaselineAvg({});
          }}
        >
          Reset Baseline
        </button>}
    </main>
  );
}
