import {PlayerData, VehicleStatus} from "../hooks/usePlayerListListener";

export function mockPlayerData(players = 500) {
  const randomUsernames = [
    "taso",
    "tabarra",
    "hype",
    "chip",
    "goat",
    "siege",
    "wowjesus",
    "noodles",
    "plok",
    "kiwi",
    "monke",
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
    const randomUsername =
      randomUsernames[Math.floor(Math.random() * randomUsernames.length)];
    const randomStatusIdx = Math.floor(Math.random() * 5);
    const randomStatus = statuses[randomStatusIdx];
    const isAdmin = Math.floor(Math.random() * 5) === 1

    playerData.push({
      admin: isAdmin,
      id: i + 1,
      dist: randomDist,
      health: 100,
      name: randomUsername,
      vType: randomStatus,
    });
  }

  console.log(playerData);

  return playerData;
}