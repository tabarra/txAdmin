import { PlayerData, VehicleStatus } from "../hooks/usePlayerListListener";
import { arrayRandom } from "./miscUtils";

export function mockPlayerData(players = 500) {
  const randomUsernames = [
    'Lion',
    'Tiger',
    'Horse',
    'Donkey',
    'Dog',
    'Cat',
    'Pig',
  ];

  const playerData: PlayerData[] = [];
  const statuses: VehicleStatus[] = [
    VehicleStatus.Biking,
    VehicleStatus.Boat,
    VehicleStatus.Unknown,
    VehicleStatus.Flying,
    VehicleStatus.Walking,
  ];

  for (let i = 0; i < players; i++) {
    const randomDist = Math.random() * 5000;
    const randomUsername = arrayRandom(randomUsernames);
    const randomStatusIdx = Math.floor(Math.random() * 5);
    const randomStatus = statuses[randomStatusIdx];
    const isAdmin = Math.floor(Math.random() * 5) === 1

    playerData.push({
      admin: isAdmin,
      id: i + 1,
      dist: randomDist,
      health: Math.floor(Math.random() * 100),
      // health: -1,
      name: randomUsername,
      vType: randomStatus,
    });
  }

  console.log(playerData);

  return playerData;
}
