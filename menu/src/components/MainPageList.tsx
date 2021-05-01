import React, { useState } from "react";
import { Collapse, List } from "@material-ui/core";
import { MenuListItem, MenuListItemData } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  DirectionsCar,
  LocalHospital,
  LocationSearching,
} from "@material-ui/icons";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useDialogContext } from "../provider/DialogProvider";
import { fetchNui } from "../utils/fetchNui";
import { useSnackbarContext } from "../provider/SnackbarProvider";
import { txAdminMenuPage, usePage } from "../atoms/page.atom";

export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();

  const { openSnackbar } = useSnackbarContext();

  const [curSelected, setCurSelected] = useState(0);

  const [page, setPage] = usePage();

  const handleArrowDown = () => {
    if (curSelected <= 4) setCurSelected(curSelected + 1);
  };
  const handleArrowUp = () => {
    if (curSelected > 0) setCurSelected(curSelected - 1);
  };

  const handleArrowLeft = () => {
    if (page > txAdminMenuPage.Main) setPage(page - 1);
  };

  const handleArrowRight = () => {
    if (page <= txAdminMenuPage.txAdmin) setPage(page + 1);
  };

  const handleEnter = () => {
    menuListItems[curSelected].onSelect();
  };

  useKeyboardNavigation({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
    onLeftDown: handleArrowLeft,
    onRightDown: handleArrowRight,
    onEnterDown: handleEnter,
  });

  const handleTeleport = () => {
    openDialog({
      description:
        "Provide coordinates in an x, y, z format to go through the wormhole",
      title: "Teleport",
      placeholder: "340, 480, 12",
      onSubmit: (coords: string) => {
        openSnackbar("success", "Sending you into the wormhole!"),
          fetchNui("tpToCoords", coords);
      },
    });
  };

  const handleAnnounceMessage = () => {
    openDialog({
      description: "Send an announcement to all online players",
      title: "Send Announcement",
      placeholder: "Your announcement...",
      onSubmit: (message: string) => {
        // Post up to client with announcement message
        openSnackbar("success", "Sending the announcement");
        fetchNui("announceMessage", message);
      },
    });
  };
  const handleSpawnVehicle = () => {
    openDialog({
      description: "Spawn a vehicle using the model name",
      title: "Spawn Vehicle",
      placeholder: "Adder",
      onSubmit: (modelName: string) => {
        openSnackbar("info", `Trying to spawn ${modelName}`);
        fetchNui("spawnVehicle", modelName).catch((e) => {
          openSnackbar("success", `Vehicle spawned!`);
        });
      },
    });
  };
  const handleFixVehicle = () => {
    fetchNui("fixCurrentVehicle");
    openSnackbar("info", "Vehicle fixed!");
  };
  const handleHealAllPlayers = () => {
    fetchNui("healAllPlayers");
    openSnackbar("info", "Healing all players");
  };

  const menuListItems: MenuListItemData[] = [
    {
      icon: <LocationSearching />,
      primary: "Teleport",
      secondary: "Teleport with context",
      onSelect: handleTeleport,
    },
    {
      icon: <AccessibilityNew />,
      primary: "Player Mode",
      secondary: "Current: NoClip",
      onSelect: () => console.log("Player Mode Clicked"),
    },
    {
      icon: <DirectionsCar />,
      primary: "Spawn Vehicle",
      secondary: "Uses model name",
      onSelect: handleSpawnVehicle,
    },
    {
      icon: <Build />,
      primary: "Fix Vehicle",
      secondary: "Set current vehicle health to 100%",
      onSelect: handleFixVehicle,
    },
    {
      icon: <LocalHospital />,
      primary: "Heal All Players",
      secondary: "Will heal all players to full health",
      onSelect: handleHealAllPlayers,
    },
    {
      icon: <Announcement />,
      primary: "Send Announcement",
      secondary: "Announce a message",
      onSelect: handleAnnounceMessage,
    },
  ];

  return (
    <Collapse in={page === txAdminMenuPage.Main} mountOnEnter unmountOnExit>
      <List>
        {menuListItems.map((item, index) => (
          <MenuListItem
            key={index}
            selected={curSelected === index}
            {...item}
          />
        ))}
      </List>
    </Collapse>
  );
};
