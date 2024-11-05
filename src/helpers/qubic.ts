import { SEED_KEY } from "../constant/qubic";

export const generateSeed = () => {
  const characters = SEED_KEY;
  const charSize = characters.length;
  let seed = "";
  for (let i = 0; i < 55; i++) {
    seed += characters[Math.floor(Math.random() * charSize)];
  }
  return seed;
};
