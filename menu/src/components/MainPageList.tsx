import React, { useEffect, useMemo, useState } from "react";
import { Box, List, makeStyles, Theme } from "@material-ui/core";
import { MenuListItem, MenuListItemMulti } from "./MenuListItem";
import {
  AccessibilityNew,
  Announcement,
  Build,
  DirectionsCar,
  ExpandMore,
  Gavel,
  LocalHospital,
  LocationSearching,
  Restore,
} from "@material-ui/icons";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { useDialogContext } from "../provider/DialogProvider";
import { fetchNui } from "../utils/fetchNui";
import { useKeyboardNavContext } from "../provider/KeyboardNavProvider";
import { useTranslate } from "react-polyglot";
import { useSnackbar } from "notistack";
import { usePlayerMode } from "../state/playermode.state";
import { useSetTabState } from "../state/tab.state";

const useStyles = makeStyles((theme: Theme) => ({
  list: {
    maxHeight: 388,
    overflow: "auto",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  icon: {
    color: theme.palette.text.secondary,
  },
}));

export const MainPageList: React.FC = () => {
  const { openDialog } = useDialogContext();
  const { setDisabledKeyNav } = useKeyboardNavContext();
  const [curSelected, setCurSelected] = useState(0);
  const t = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const [playerMode, setPlayerMode] = usePlayerMode();
  const useSetTabDisable = useSetTabState();
  const classes = useStyles();

  // the directions are inverted
  const handleArrowDown = () => {
    const next = curSelected + 1;
    setCurSelected(next >= menuListItems.length ? 0 : next);
  };

  const handleArrowUp = () => {
    const next = curSelected - 1;
    setCurSelected(next < 0 ? menuListItems.length - 1 : next);
  };

  useEffect(() => {
    setDisabledKeyNav(false);
    return () => setDisabledKeyNav(true);
  }, [setDisabledKeyNav]);

  useKeyboardNavigation({
    onDownDown: handleArrowDown,
    onUpDown: handleArrowUp,
    disableOnFocused: true,
  });

  const handleTeleport = () => {
    openDialog({
      description: t("nui_menu.page_main.teleport.dialog_desc"),
      title: t("nui_menu.page_main.teleport.dialog_title"),
      placeholder: "340, 480, 12",
      onSubmit: (coords: string) => {
        const [x, y, z] = coords
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.match(/^-?\d{1,4}(?:\.\d{1,9})?$/))
          .map((s) => +s);

        if ([x, y, z].every((n) => typeof n === "number")) {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_success"), {
            variant: "success",
          });
          fetchNui("tpToCoords", { x, y, z });
        } else {
          enqueueSnackbar(t("nui_menu.page_main.teleport.dialog_error"), {
            variant: "error",
          });
        }
      },
    });
  };

  const handleTeleportBack = () => {
    fetchNui("tpBack");
    enqueueSnackbar("Teleporting back", { variant: "info" });
  };

  const handleAnnounceMessage = () => {
    openDialog({
      description: t("nui_menu.page_main.send_announce.dialog_desc"),
      title: t("nui_menu.page_main.send_announce.dialog_title"),
      placeholder: "Your announcement...",
      isMultiline: true,
      onSubmit: (message: string) => {
        // Post up to client with announcement message
        enqueueSnackbar(t("nui_menu.page_main.send_announce.dialog_success"), {
          variant: "success",
        });
        fetchNui("sendAnnouncement", { message });
      },
    });
  };

  const handleSpawnVehicle = () => {
    openDialog({
      description: t("nui_menu.page_main.spawn_veh.dialog_desc"),
      title: t("nui_menu.page_main.spawn_veh.dialog_title"),
      placeholder: "Adder",
      onSubmit: (modelName: string) => {
        enqueueSnackbar(
          t("nui_menu.page_main.spawn_veh.dialog_info", { modelName }),
          { variant: "info" }
        );
        fetchNui("spawnVehicle", { model: modelName }).then(({ e }) => {
          e
            ? enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_error", { modelName }),
                { variant: "error" }
              )
            : enqueueSnackbar(
                t("nui_menu.page_main.spawn_veh.dialog_success"),
                { variant: "success" }
              );
        });
      },
    });
  };

  const handleFixVehicle = () => {
    fetchNui("fixVehicle").then(({ e }) => {
      if (e) {
        return enqueueSnackbar(
          t("nui_menu.page_main.fix_vehicle.dialog_error"),
          {
            variant: "error",
          }
        );
      }

      enqueueSnackbar(t("nui_menu.page_main.fix_vehicle.dialog_success"), {
        variant: "info",
      });
    });
  };

  const handleHealAllPlayers = () => {
    fetchNui("healAllPlayers");
    enqueueSnackbar(t("nui_menu.page_main.heal_all.dialog_success"), {
      variant: "info",
    });
  };

  const handleSpawnWeapon = () => {
    openDialog({
      title: "Spawn Weapon",
      placeholder: "WEAPON_ASSAULTRIFLE",
      description: "Spawn a weapon using its model name.",
      onSubmit: (inputValue) => {
        fetchNui("spawnWeapon", inputValue);
      },
    });
  };

  const menuListItems = useMemo(
    () => [
      {
        icon: <AccessibilityNew />,
        primary: t("nui_menu.page_main.player_mode.list_primary"),
        secondary: t("nui_menu.page_main.player_mode.list_secondary", {
          no_clip: "NoClip",
        }),
        showCurrentPrefix: true,
        isMultiAction: true,
        initialValue: playerMode,
        actions: [
          {
            label: "None",
            value: "none",
            onSelect: () => {
              setPlayerMode("none");
              fetchNui("playerModeChanged", "none");
            },
          },
          {
            label: "NoClip",
            value: "noclip",
            onSelect: () => {
              setPlayerMode("noclip");
              fetchNui("playerModeChanged", "noclip");
            },
          },
          {
            label: "God Mode",
            value: "godmode",
            onSelect: () => {
              setPlayerMode("godmode");
              fetchNui("playerModeChanged", "godmode");
            },
          },
        ],
      },
      {
        icon: <LocationSearching />,
        primary: t("nui_menu.page_main.teleport.list_primary"),
        secondary: t("nui_menu.page_main.teleport.list_secondary"),
        onSelect: handleTeleport,
      },
      {
        icon: <Restore />,
        primary: "Go Back",
        secondary: "Teleport to your last location",
        onSelect: handleTeleportBack,
      },
      {
        icon: <DirectionsCar />,
        primary: t("nui_menu.page_main.spawn_veh.list_primary"),
        secondary: t("nui_menu.page_main.spawn_veh.list_secondary"),
        onSelect: handleSpawnVehicle,
      },
      {
        icon: <Build />,
        primary: t("nui_menu.page_main.fix_vehicle.list_primary"),
        secondary: t("nui_menu.page_main.fix_vehicle.list_secondary"),
        onSelect: handleFixVehicle,
      },
      {
        icon: <LocalHospital />,
        primary: t("nui_menu.page_main.heal_all.list_primary"),
        secondary: t("nui_menu.page_main.heal_all.list_secondary"),
        onSelect: handleHealAllPlayers,
      },
      {
        icon: <Announcement />,
        primary: t("nui_menu.page_main.send_announce.list_primary"),
        secondary: t("nui_menu.page_main.send_announce.list_secondary"),
        onSelect: handleAnnounceMessage,
      },
      {
        icon: <Gavel />,
        primary: "Spawn Weapon",
        secondary: "Add a weapon to yourself",
        onSelect: handleSpawnWeapon,
      },
    ],
    []
  );

  // If we are on a ListItemMulti we disable tab navigation using arrow keys
  useEffect(() => {
    if (menuListItems[curSelected].isMultiAction) useSetTabDisable(true);
    else useSetTabDisable(false);
  }, [curSelected, menuListItems]);

  return (
    <Box>
      <List className={classes.list}>
        {menuListItems.map((item, index) =>
          item.isMultiAction ? (
            // @ts-ignore
            <MenuListItemMulti
              key={index}
              selected={curSelected === index}
              {...item}
            />
          ) : (
            // @ts-ignore
            <MenuListItem
              key={index}
              selected={curSelected === index}
              {...item}
            />
          )
        )}
      </List>
      <Box className={classes.icon} display="flex" justifyContent="center">
        <ExpandMore />
      </Box>
    </Box>
  );
};
